import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { createHash } from "node:crypto";

process.env.AUTH_SECRET = "segredo-de-teste";
process.env.NEXT_PUBLIC_APP_URL = "https://app.orcah.test";
delete process.env.RESEND_API_KEY;

import { isAdmin } from "../src/lib/admin";
import { authenticateLogin, EMAIL_NOT_VERIFIED_MESSAGE, LOGIN_INVALID_MESSAGE } from "../src/lib/auth-login";
import { EMAIL_VERIFICATION_TTL_MINUTES, emailIsValid, normalizeEmail } from "../src/lib/auth-security";
import { confirmEmailToken, maskEmail, requestVerificationResend, VERIFY_GENERIC_MESSAGE } from "../src/lib/email-verification";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { confirmPasswordReset, requestPasswordReset, type AuthDb } from "../src/lib/password-reset";
import { PASSWORD_POLICY_MESSAGE, passwordChecks, passwordIsStrong } from "../src/lib/password-rules";
import { registerUser, type RegisterDb } from "../src/lib/registration";
import { verificationEmailContent } from "../src/lib/resend";
import { table, withTransaction } from "./helpers/fake-db";

const T0 = new Date("2026-09-27T12:00:00Z");
const minutes = (n: number) => new Date(T0.getTime() + n * 60 * 1000);
const headers = (ip = "200.1.2.3") => new Headers({ "x-forwarded-for": ip });
const STRONG = "Pintura123!";

let db: ReturnType<typeof makeDb>;
let sent: { email: string; link: string }[];
const sendEmail = async (input: { email: string; link: string }) => {
  sent.push(input);
};
const configured = () => true;

function makeDb() {
  return withTransaction({
    authAttempt: table(),
    passwordResetToken: table({ usedAt: null }),
    emailVerificationToken: table({ usedAt: null }),
    user: table({ role: "USER", emailVerifiedAt: null, passwordChangedAt: null }),
  });
}
const asRegisterDb = () => db as unknown as RegisterDb;
const asAuthDb = () => db as unknown as AuthDb;
const tokenFrom = (link: string) => new URL(link).searchParams.get("token") ?? "";

function register(body: Record<string, unknown>, now = T0, ip = "200.1.2.3") {
  return registerUser({ body, headers: headers(ip), sendEmail, emailConfigured: configured, now, db: asRegisterDb() });
}

beforeEach(() => {
  db = makeDb();
  sent = [];
});

describe("senha forte (mesma regra no navegador e no servidor)", () => {
  it("aceita Pintura123! e recusa as fracas", () => {
    assert.equal(passwordIsStrong("Pintura123!"), true);
    for (const weak of ["12345678", "pintura123", "PINTURA123", "Pinturaaaa", "Pint1!", "pintura123!", "PINTURA123!", "Pinturaaa!", "Pintura123", ""]) {
      assert.equal(passwordIsStrong(weak), false, weak);
    }
  });

  it("checklist marca item por item", () => {
    const byKey = Object.fromEntries(passwordChecks("abc1").map((check) => [check.key, check.ok]));
    assert.deepEqual(byKey, { length: false, upper: false, lower: true, number: true, symbol: false });
    assert.ok(passwordChecks(STRONG).every((check) => check.ok));
  });
});

describe("e-mail", () => {
  it("normaliza e valida formato", () => {
    assert.equal(normalizeEmail("  BATATA@TESTE.COM "), "batata@teste.com");
    for (const ok of ["batata@teste.com", "joao.silva+obra@gmail.com", "ana@empresa.com.br"]) assert.equal(emailIsValid(ok), true, ok);
    for (const bad of ["a@b", "sem-arroba.com", "x@dominio", "ze@@x.com", "ze@x..com", ".ze@x.com", "ze @x.com", "ze@x.c"]) {
      assert.equal(emailIsValid(bad), false, bad);
    }
  });

  it("mascara o endereço na tela", () => {
    assert.equal(maskEmail("joao@gmail.com"), "jo***@gmail.com");
  });
});

describe("cadastro", () => {
  it("cria conta pendente, sempre USER, sem sessão, e manda o link de 30 minutos", async () => {
    const result = await register({ name: "João", email: " JOAO@Gmail.com ", password: STRONG });
    assert.deepEqual(result, { ok: true, next: "/verificar-email", emailSent: true });
    const [user] = db.user.rows;
    assert.equal(user.email, "joao@gmail.com");
    assert.equal(user.role, "USER");
    assert.equal(user.emailVerifiedAt, null);
    assert.notEqual(user.passwordHash, STRONG);
    assert.equal(await verifyPassword(STRONG, user.passwordHash as string), true);

    assert.equal(sent.length, 1);
    assert.ok(sent[0].link.startsWith("https://app.orcah.test/verificar-email?token="));
    const token = tokenFrom(sent[0].link);
    const [stored] = db.emailVerificationToken.rows;
    assert.equal(stored.tokenHash, createHash("sha256").update(token).digest("hex"));
    assert.ok(!JSON.stringify(db.emailVerificationToken.rows).includes(token), "token puro não vai para o banco");
    assert.equal((stored.expiresAt as Date).getTime() - T0.getTime(), EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000);
  });

  it("recusa e-mail inválido e cada tipo de senha fraca", async () => {
    assert.deepEqual(await register({ name: "João", email: "joao@", password: STRONG }), { ok: false, status: 400, error: "E-mail inválido." });
    for (const weak of ["Pint1!", "pintura123!", "PINTURA123!", "Pinturaaa!", "Pintura123"]) {
      const result = await register({ name: "João", email: "joao@gmail.com", password: weak });
      assert.deepEqual(result, { ok: false, status: 400, error: PASSWORD_POLICY_MESSAGE }, weak);
    }
    assert.equal(db.user.rows.length, 0);
  });

  it("cadastro comum nunca vira ADMIN, nem mandando role no corpo, nem com e-mail de admin", async () => {
    await register({ name: "Intruso", email: "schimitadriel100@gmail.com", password: STRONG, role: "ADMIN", emailVerifiedAt: T0 });
    const [user] = db.user.rows;
    assert.equal(user.role, "USER");
    assert.equal(user.emailVerifiedAt, null);
    assert.equal(isAdmin(user as { role: string }), false);
  });

  it("e-mail já confirmado não cria outra conta", async () => {
    await db.user.create({ data: { email: "ze@teste.com", passwordHash: "x", emailVerifiedAt: T0 } });
    const result = await register({ name: "Zé", email: "ze@teste.com", password: STRONG });
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.status, 409);
  });

  it("conta pendente: novo cadastro não troca a senha, só reenvia o link", async () => {
    await register({ name: "Dono", email: "ze@teste.com", password: STRONG });
    const originalHash = db.user.rows[0].passwordHash;
    const again = await register({ name: "Outro", email: "ze@teste.com", password: "Outra123!" }, minutes(1));
    assert.equal(again.ok, true);
    assert.equal(db.user.rows.length, 1);
    assert.equal(db.user.rows[0].passwordHash, originalHash);
    assert.equal(db.user.rows[0].name, "Dono");
    assert.equal(sent.length, 2);
  });

  it("sem Resend configurado a conta é criada e a tela oferece reenviar", async () => {
    const original = console.error;
    console.error = () => undefined;
    try {
      const result = await registerUser({ body: { name: "João", email: "joao@gmail.com", password: STRONG }, headers: headers(), sendEmail, emailConfigured: () => false, now: T0, db: asRegisterDb() });
      assert.deepEqual(result, { ok: true, next: "/verificar-email", emailSent: false });
    } finally {
      console.error = original;
    }
    assert.equal(db.user.rows.length, 1);
    assert.equal(sent.length, 0);
  });
});

describe("verificação de e-mail", () => {
  async function pendingToken(email = "joao@gmail.com") {
    await register({ name: "João", email, password: STRONG });
    return tokenFrom(sent[sent.length - 1].link);
  }

  it("token válido confirma a conta (uso único)", async () => {
    const token = await pendingToken();
    const result = await confirmEmailToken({ token, now: minutes(5), db: asRegisterDb() });
    assert.deepEqual(result, { ok: true, userId: db.user.rows[0].id });
    assert.equal((db.user.rows[0].emailVerifiedAt as Date).getTime(), minutes(5).getTime());

    const again = await confirmEmailToken({ token, now: minutes(6), db: asRegisterDb() });
    assert.equal(again.ok === false && again.reason, "used");
  });

  it("token expirado, inexistente ou vazio é recusado", async () => {
    const token = await pendingToken();
    const late = await confirmEmailToken({ token, now: minutes(31), db: asRegisterDb() });
    assert.equal(late.ok === false && late.reason, "expired");
    assert.equal(db.user.rows[0].emailVerifiedAt, null);
    const missing = await confirmEmailToken({ token: "nao-existe", now: T0, db: asRegisterDb() });
    const empty = await confirmEmailToken({ token: "", now: T0, db: asRegisterDb() });
    assert.equal(missing.ok === false && missing.reason, "invalid");
    assert.equal(empty.ok === false && empty.reason, "invalid");
  });

  it("confirmar um link invalida os outros pendentes", async () => {
    const first = await pendingToken();
    await requestVerificationResend({ email: "joao@gmail.com", headers: headers(), sendEmail, emailConfigured: configured, now: minutes(1), db: asRegisterDb() });
    const second = tokenFrom(sent[sent.length - 1].link);
    await confirmEmailToken({ token: second, now: minutes(2), db: asRegisterDb() });
    const old = await confirmEmailToken({ token: first, now: minutes(3), db: asRegisterDb() });
    assert.equal(old.ok, false);
  });

  it("e-mail de confirmação tem assunto, botão e aviso de 30 minutos", () => {
    const link = "https://app.orcah.test/verificar-email?token=abc";
    const { subject, text, html } = verificationEmailContent(link);
    assert.equal(subject, "Confirme seu e-mail no Orçah");
    assert.ok(html.includes(`href="${link}"`) && html.includes("Confirmar meu e-mail"));
    assert.ok(text.includes("Este link expira em 30 minutos."));
    assert.ok(text.includes("Se você não criou esta conta, ignore esta mensagem."));
  });
});

describe("reenvio da confirmação", () => {
  it("resposta igual com ou sem conta, e só envia para conta pendente", async () => {
    await register({ name: "João", email: "joao@gmail.com", password: STRONG });
    await db.user.create({ data: { email: "ja@verificado.com", passwordHash: "x", emailVerifiedAt: T0 } });
    const before = sent.length;
    const pending = await requestVerificationResend({ email: "joao@gmail.com", headers: headers("1.1.1.1"), sendEmail, emailConfigured: configured, now: minutes(1), db: asRegisterDb() });
    const missing = await requestVerificationResend({ email: "ninguem@x.com", headers: headers("2.2.2.2"), sendEmail, emailConfigured: configured, now: minutes(1), db: asRegisterDb() });
    const verified = await requestVerificationResend({ email: "ja@verificado.com", headers: headers("3.3.3.3"), sendEmail, emailConfigured: configured, now: minutes(1), db: asRegisterDb() });
    assert.deepEqual(pending, { ok: true, message: VERIFY_GENERIC_MESSAGE });
    assert.deepEqual(missing, pending);
    assert.deepEqual(verified, pending);
    assert.equal(sent.length, before + 1);
  });

  it("limita 3 envios por e-mail em 10 minutos", async () => {
    await register({ name: "João", email: "joao@gmail.com", password: STRONG });
    for (let i = 1; i <= 3; i++) {
      const r = await requestVerificationResend({ email: "joao@gmail.com", headers: headers(), sendEmail, emailConfigured: configured, now: minutes(i), db: asRegisterDb() });
      assert.equal(r.ok, true);
    }
    const blocked = await requestVerificationResend({ email: "joao@gmail.com", headers: headers(), sendEmail, emailConfigured: configured, now: minutes(4), db: asRegisterDb() });
    assert.equal(blocked.ok === false && blocked.status, 429);
    const later = await requestVerificationResend({ email: "joao@gmail.com", headers: headers(), sendEmail, emailConfigured: configured, now: minutes(15), db: asRegisterDb() });
    assert.equal(later.ok, true);
  });
});

describe("login com verificação", () => {
  it("conta não confirmada não entra (só avisa quem acertou a senha)", async () => {
    await register({ name: "João", email: "joao@gmail.com", password: STRONG });
    const wrong = await authenticateLogin({ email: "joao@gmail.com", password: "Errada123!", headers: headers(), db: asAuthDb(), now: minutes(1) });
    assert.deepEqual(wrong, { ok: false, status: 401, error: LOGIN_INVALID_MESSAGE });
    const pending = await authenticateLogin({ email: "joao@gmail.com", password: STRONG, headers: headers(), db: asAuthDb(), now: minutes(1) });
    assert.deepEqual(pending, { ok: false, status: 403, code: "email_not_verified", error: EMAIL_NOT_VERIFIED_MESSAGE });
  });

  it("depois de confirmar, entra", async () => {
    await register({ name: "João", email: "joao@gmail.com", password: STRONG });
    await confirmEmailToken({ token: tokenFrom(sent[0].link), now: minutes(1), db: asRegisterDb() });
    const ok = await authenticateLogin({ email: "JOAO@gmail.com", password: STRONG, headers: headers(), db: asAuthDb(), now: minutes(2) });
    assert.equal(ok.ok, true);
  });
});

describe("recuperação com a política forte", () => {
  it("nova senha fraca é recusada; forte troca e confirma o e-mail de quem ainda não tinha confirmado", async () => {
    await db.user.create({ data: { email: "ze@teste.com", passwordHash: await hashPassword("Antiga123!") } });
    await requestPasswordReset({ email: "ze@teste.com", headers: headers(), sendEmail, emailConfigured: configured, now: T0, db: asAuthDb() });
    const token = tokenFrom(sent[0].link);

    const weak = await confirmPasswordReset({ token, password: "fraca123", now: minutes(1), db: asAuthDb() });
    assert.deepEqual(weak, { ok: false, status: 400, reason: "weak_password", error: PASSWORD_POLICY_MESSAGE });

    const ok = await confirmPasswordReset({ token, password: "Nova1234!", now: minutes(1), db: asAuthDb() });
    assert.deepEqual(ok, { ok: true });
    const user = db.user.rows[0];
    assert.equal(await verifyPassword("Antiga123!", user.passwordHash as string), false);
    assert.equal(await verifyPassword("Nova1234!", user.passwordHash as string), true);
    assert.equal((user.emailVerifiedAt as Date).getTime(), minutes(1).getTime());
  });
});

describe("admin por role", () => {
  it("só role ADMIN é admin; e-mail de admin sem role não ganha nada", () => {
    assert.equal(isAdmin({ role: "ADMIN" }), true);
    assert.equal(isAdmin({ role: "USER" }), false);
    assert.equal(isAdmin({ role: "USER", email: "schimitadriel100@gmail.com" } as { role: string }), false);
    assert.equal(isAdmin({ role: "USER", company: { slug: "cesar-turmina" } } as { role: string }), false);
    assert.equal(isAdmin(null), false);
    assert.equal(isAdmin({}), false);
  });
});
