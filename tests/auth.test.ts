import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { createHash } from "node:crypto";

process.env.AUTH_SECRET = "segredo-de-teste";
process.env.NEXT_PUBLIC_APP_URL = "https://app.orcah.test";
// nenhum teste pode falar com o Resend de verdade
delete process.env.RESEND_API_KEY;

import { authenticateLogin, LOGIN_INVALID_MESSAGE, LOGIN_LIMITED_MESSAGE } from "../src/lib/auth-login";
import {
  generateResetToken,
  hashResetToken,
  normalizeEmail,
  PASSWORD_RESET_TTL_MINUTES,
  resetTokenStatus,
} from "../src/lib/auth-security";
import { hashPassword, MIN_PASSWORD_LENGTH, passwordIsValid, verifyPassword } from "../src/lib/password";
import {
  confirmPasswordReset,
  GENERIC_RESET_MESSAGE,
  getResetTokenStatus,
  requestPasswordReset,
  type AuthDb,
} from "../src/lib/password-reset";
import { passwordResetEmailContent } from "../src/lib/resend";
import { sessionIsCurrent } from "../src/lib/session-token";

// ---------- banco em memória com o pedaço do Prisma que o fluxo usa ----------

type Row = Record<string, unknown>;

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, cond]) => {
    if (key === "OR") return (cond as Row[]).some((w) => matches(row, w));
    const value = row[key];
    if (cond === null) return value === null || value === undefined;
    if (cond instanceof Date) return value instanceof Date && value.getTime() === cond.getTime();
    if (cond && typeof cond === "object") {
      const c = cond as { gte?: Date; gt?: Date; lt?: Date; not?: unknown };
      const t = value instanceof Date ? value.getTime() : NaN;
      if (c.gte && !(t >= c.gte.getTime())) return false;
      if (c.gt && !(t > c.gt.getTime())) return false;
      if (c.lt && !(t < c.lt.getTime())) return false;
      if ("not" in c && c.not === null && (value === null || value === undefined)) return false;
      return true;
    }
    return value === cond;
  });
}

function table() {
  const rows: Row[] = [];
  let seq = 0;
  return {
    rows,
    async count({ where }: { where?: Row }) {
      return rows.filter((r) => matches(r, where)).length;
    },
    async create({ data }: { data: Row }) {
      const row = { id: ++seq, createdAt: new Date(), usedAt: null, ...data };
      rows.push(row);
      return row;
    },
    async deleteMany({ where }: { where?: Row }) {
      const keep = rows.filter((r) => !matches(r, where));
      const count = rows.length - keep.length;
      rows.splice(0, rows.length, ...keep);
      return { count };
    },
    async findUnique({ where }: { where: Row }) {
      return rows.find((r) => matches(r, where)) ?? null;
    },
    async updateMany({ where, data }: { where?: Row; data: Row }) {
      const hit = rows.filter((r) => matches(r, where));
      hit.forEach((r) => Object.assign(r, data));
      return { count: hit.length };
    },
    async update({ where, data }: { where: Row; data: Row }) {
      const row = rows.find((r) => matches(r, where));
      if (!row) throw new Error("registro não encontrado");
      return Object.assign(row, data);
    },
  };
}

function fakeDb() {
  const db = {
    authAttempt: table(),
    passwordResetToken: table(),
    user: table(),
    async $transaction<T>(fn: (tx: unknown) => Promise<T>) {
      return fn(db);
    },
  };
  return db;
}

type FakeDb = ReturnType<typeof fakeDb>;
const asDb = (db: FakeDb) => db as unknown as AuthDb;
const headers = (ip = "200.1.2.3") => new Headers({ "x-forwarded-for": ip });
const T0 = new Date("2026-09-25T12:00:00Z");
const minutes = (n: number) => new Date(T0.getTime() + n * 60 * 1000);

let db: FakeDb;
let sent: { email: string; link: string }[];
const sendEmail = async (input: { email: string; link: string }) => {
  sent.push(input);
};
const configured = () => true;

async function addUser(email: string, password: string) {
  return db.user.create({ data: { email, passwordHash: await hashPassword(password), passwordChangedAt: null } });
}

function tokenFromLink(link: string) {
  return new URL(link).searchParams.get("token") ?? "";
}

beforeEach(() => {
  db = fakeDb();
  sent = [];
});

// ---------- regras básicas ----------

describe("e-mail e senha", () => {
  it("normaliza e-mail (espaços e maiúsculas)", () => {
    assert.equal(normalizeEmail("  Maria.Souza@Gmail.COM "), "maria.souza@gmail.com");
  });

  it("exige senha mínima de 8 caracteres", () => {
    assert.equal(MIN_PASSWORD_LENGTH, 8);
    assert.equal(passwordIsValid("1234567"), false);
    assert.equal(passwordIsValid("12345678"), true);
  });
});

// ---------- login ----------

describe("login", () => {
  it("aceita e-mail e senha corretos (e-mail sem diferenciar maiúsculas)", async () => {
    const user = await addUser("ze@teste.com", "senha-forte-1");
    const result = await authenticateLogin({ email: " ZE@teste.com", password: "senha-forte-1", headers: headers(), db: asDb(db), now: T0 });
    assert.deepEqual(result, { ok: true, user: { id: user.id, hasCompany: false } });
  });

  it("recusa senha incorreta com mensagem genérica", async () => {
    await addUser("ze@teste.com", "senha-forte-1");
    const result = await authenticateLogin({ email: "ze@teste.com", password: "errada123", headers: headers(), db: asDb(db), now: T0 });
    assert.deepEqual(result, { ok: false, status: 401, error: LOGIN_INVALID_MESSAGE });
    assert.equal(LOGIN_INVALID_MESSAGE, "E-mail ou senha incorretos.");
  });

  it("usuário inexistente recebe exatamente a mesma resposta", async () => {
    const result = await authenticateLogin({ email: "ninguem@teste.com", password: "qualquer123", headers: headers(), db: asDb(db), now: T0 });
    assert.deepEqual(result, { ok: false, status: 401, error: LOGIN_INVALID_MESSAGE });
  });

  it("bloqueia após 5 tentativas erradas em 10 minutos e libera depois", async () => {
    await addUser("ze@teste.com", "senha-forte-1");
    for (let i = 0; i < 5; i++) {
      const r = await authenticateLogin({ email: "ze@teste.com", password: "errada123", headers: headers(), db: asDb(db), now: minutes(i) });
      assert.equal(r.ok, false);
    }
    const blocked = await authenticateLogin({ email: "ze@teste.com", password: "senha-forte-1", headers: headers(), db: asDb(db), now: minutes(5) });
    assert.deepEqual(blocked, { ok: false, status: 429, error: LOGIN_LIMITED_MESSAGE });

    // não é permanente: passada a janela, a senha certa volta a funcionar
    const later = await authenticateLogin({ email: "ze@teste.com", password: "senha-forte-1", headers: headers(), db: asDb(db), now: minutes(15) });
    assert.equal(later.ok, true);
  });

  it("não guarda IP puro nas tentativas", async () => {
    await authenticateLogin({ email: "x@teste.com", password: "errada123", headers: headers("10.0.0.1"), db: asDb(db), now: T0 });
    const row = db.authAttempt.rows[0];
    assert.equal(typeof row.requestIpHash, "string");
    assert.notEqual(row.requestIpHash, "10.0.0.1");
    assert.equal((row.requestIpHash as string).length, 64);
  });
});

// ---------- token ----------

describe("token de recuperação", () => {
  it("é aleatório e o hash é SHA-256 em hex", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    assert.notEqual(a, b);
    assert.ok(a.length >= 43);
    assert.equal(hashResetToken(a), createHash("sha256").update(a).digest("hex"));
    assert.match(hashResetToken(a), /^[0-9a-f]{64}$/);
  });

  it("classifica válido, expirado, usado e inexistente", () => {
    const hash = hashResetToken("abc");
    const base = { tokenHash: hash, expiresAt: minutes(15), usedAt: null };
    assert.equal(resetTokenStatus(base, hash, T0), "valid");
    assert.equal(resetTokenStatus(base, hash, minutes(15)), "expired");
    assert.equal(resetTokenStatus({ ...base, usedAt: T0 }, hash, T0), "used");
    assert.equal(resetTokenStatus(null, hash, T0), "invalid");
  });
});

// ---------- pedido de recuperação ----------

describe("pedido de recuperação", () => {
  it("gera token, salva só o hash, expira em 15 minutos e manda o link", async () => {
    const user = await addUser("ze@teste.com", "senha-forte-1");
    const result = await requestPasswordReset({ email: "Ze@Teste.com", headers: headers(), sendEmail, emailConfigured: configured, db: asDb(db), now: T0 });

    assert.deepEqual(result, { ok: true, message: GENERIC_RESET_MESSAGE });
    assert.equal(sent.length, 1);
    assert.equal(sent[0].email, "ze@teste.com");
    assert.ok(sent[0].link.startsWith("https://app.orcah.test/redefinir-senha?token="));

    const token = tokenFromLink(sent[0].link);
    const [stored] = db.passwordResetToken.rows;
    assert.equal(stored.userId, user.id);
    assert.equal(stored.tokenHash, hashResetToken(token));
    assert.ok(!JSON.stringify(db.passwordResetToken.rows).includes(token), "token puro não pode ir para o banco");
    assert.equal((stored.expiresAt as Date).getTime() - T0.getTime(), PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
    assert.equal(PASSWORD_RESET_TTL_MINUTES, 15);
  });

  it("anti-enumeração: e-mail sem conta recebe a mesma resposta e nada é enviado", async () => {
    await addUser("ze@teste.com", "senha-forte-1");
    const existing = await requestPasswordReset({ email: "ze@teste.com", headers: headers("1.1.1.1"), sendEmail, emailConfigured: configured, db: asDb(db), now: T0 });
    const missing = await requestPasswordReset({ email: "ninguem@teste.com", headers: headers("2.2.2.2"), sendEmail, emailConfigured: configured, db: asDb(db), now: T0 });
    assert.deepEqual(missing, existing);
    assert.equal(sent.length, 1);
    assert.equal(db.passwordResetToken.rows.length, 1);
    assert.equal(GENERIC_RESET_MESSAGE, "Se existir uma conta com esse endereço, você receberá um link para redefinir sua senha.");
  });

  it("falha no envio não revela nada e não deixa token órfão", async () => {
    await addUser("ze@teste.com", "senha-forte-1");
    const failing = async () => {
      throw new Error("Resend recusou o envio (validation_error)");
    };
    const originalError = console.error;
    console.error = () => undefined;
    try {
      const result = await requestPasswordReset({ email: "ze@teste.com", headers: headers(), sendEmail: failing, emailConfigured: configured, db: asDb(db), now: T0 });
      assert.deepEqual(result, { ok: true, message: GENERIC_RESET_MESSAGE });
    } finally {
      console.error = originalError;
    }
    assert.equal(db.passwordResetToken.rows.length, 0);
  });

  it("sem Resend configurado responde igual para qualquer e-mail", async () => {
    await addUser("ze@teste.com", "senha-forte-1");
    const originalError = console.error;
    console.error = () => undefined;
    try {
      const a = await requestPasswordReset({ email: "ze@teste.com", headers: headers(), sendEmail, emailConfigured: () => false, db: asDb(db), now: T0 });
      const b = await requestPasswordReset({ email: "ninguem@teste.com", headers: headers(), sendEmail, emailConfigured: () => false, db: asDb(db), now: T0 });
      assert.deepEqual(a, b);
      assert.equal(a.ok, false);
    } finally {
      console.error = originalError;
    }
    assert.equal(sent.length, 0);
  });

  it("limita a 3 pedidos por e-mail em 10 minutos (sem flood no Resend)", async () => {
    await addUser("ze@teste.com", "senha-forte-1");
    for (let i = 0; i < 3; i++) {
      const r = await requestPasswordReset({ email: "ze@teste.com", headers: headers(), sendEmail, emailConfigured: configured, db: asDb(db), now: minutes(i) });
      assert.equal(r.ok, true);
    }
    const fourth = await requestPasswordReset({ email: "ze@teste.com", headers: headers(), sendEmail, emailConfigured: configured, db: asDb(db), now: minutes(3) });
    assert.equal(fourth.ok, false);
    assert.equal(fourth.ok === false && fourth.status, 429);
    assert.equal(sent.length, 3);

    const later = await requestPasswordReset({ email: "ze@teste.com", headers: headers(), sendEmail, emailConfigured: configured, db: asDb(db), now: minutes(12) });
    assert.equal(later.ok, true);
  });

  it("recusa e-mail inválido", async () => {
    const r = await requestPasswordReset({ email: "nao-e-email", headers: headers(), sendEmail, emailConfigured: configured, db: asDb(db), now: T0 });
    assert.equal(r.ok, false);
  });
});

// ---------- redefinição ----------

describe("redefinição de senha", () => {
  async function linkFor(email: string, now = T0) {
    await requestPasswordReset({ email, headers: headers(), sendEmail, emailConfigured: configured, db: asDb(db), now });
    return tokenFromLink(sent[sent.length - 1].link);
  }

  it("troca a senha: a antiga falha e a nova funciona", async () => {
    const user = await addUser("ze@teste.com", "senha-antiga-1");
    const token = await linkFor("ze@teste.com");

    assert.equal(await getResetTokenStatus(token, minutes(1), asDb(db)), "valid");
    const result = await confirmPasswordReset({ token, password: "senha-nova-22", now: minutes(1), db: asDb(db) });
    assert.deepEqual(result, { ok: true });

    const stored = db.user.rows.find((u) => u.id === user.id)!;
    assert.equal(await verifyPassword("senha-antiga-1", stored.passwordHash as string), false);
    assert.equal(await verifyPassword("senha-nova-22", stored.passwordHash as string), true);
    assert.equal((db.passwordResetToken.rows[0].usedAt as Date).getTime(), minutes(1).getTime());

    const oldLogin = await authenticateLogin({ email: "ze@teste.com", password: "senha-antiga-1", headers: headers(), db: asDb(db), now: minutes(2) });
    const newLogin = await authenticateLogin({ email: "ze@teste.com", password: "senha-nova-22", headers: headers(), db: asDb(db), now: minutes(2) });
    assert.equal(oldLogin.ok, false);
    assert.equal(newLogin.ok, true);
  });

  it("derruba sessões emitidas antes da troca", async () => {
    await addUser("ze@teste.com", "senha-antiga-1");
    const token = await linkFor("ze@teste.com");
    await confirmPasswordReset({ token, password: "senha-nova-22", now: minutes(1), db: asDb(db) });
    const changedAt = db.user.rows[0].passwordChangedAt as Date;

    const oldSessionIat = Math.floor(T0.getTime() / 1000);
    const newSessionIat = Math.floor(minutes(2).getTime() / 1000);
    assert.equal(sessionIsCurrent(oldSessionIat, changedAt), false);
    assert.equal(sessionIsCurrent(newSessionIat, changedAt), true);
    // quem nunca trocou a senha não perde a sessão
    assert.equal(sessionIsCurrent(oldSessionIat, null), true);
  });

  it("token usado não funciona de novo", async () => {
    await addUser("ze@teste.com", "senha-antiga-1");
    const token = await linkFor("ze@teste.com");
    await confirmPasswordReset({ token, password: "senha-nova-22", now: minutes(1), db: asDb(db) });
    const again = await confirmPasswordReset({ token, password: "outra-senha-3", now: minutes(2), db: asDb(db) });
    assert.equal(again.ok, false);
    assert.equal(again.ok === false && again.reason, "used");
    assert.equal(await getResetTokenStatus(token, minutes(2), asDb(db)), "used");
  });

  it("token expirado é rejeitado", async () => {
    await addUser("ze@teste.com", "senha-antiga-1");
    const token = await linkFor("ze@teste.com");
    const late = await confirmPasswordReset({ token, password: "senha-nova-22", now: minutes(16), db: asDb(db) });
    assert.equal(late.ok === false && late.reason, "expired");
    const stored = db.user.rows[0];
    assert.equal(await verifyPassword("senha-antiga-1", stored.passwordHash as string), true);
  });

  it("token inexistente ou vazio é rejeitado", async () => {
    const missing = await confirmPasswordReset({ token: "nao-existe", password: "senha-nova-22", now: T0, db: asDb(db) });
    const empty = await confirmPasswordReset({ token: "", password: "senha-nova-22", now: T0, db: asDb(db) });
    assert.equal(missing.ok === false && missing.reason, "invalid");
    assert.equal(empty.ok === false && empty.reason, "invalid");
    assert.equal(await getResetTokenStatus("", T0, asDb(db)), "invalid");
  });

  it("senha nova curta é recusada e o token continua válido", async () => {
    await addUser("ze@teste.com", "senha-antiga-1");
    const token = await linkFor("ze@teste.com");
    const weak = await confirmPasswordReset({ token, password: "curta", now: minutes(1), db: asDb(db) });
    assert.equal(weak.ok === false && weak.reason, "weak_password");
    assert.equal(await getResetTokenStatus(token, minutes(1), asDb(db)), "valid");
  });

  it("usar um link invalida os outros links pendentes do mesmo usuário", async () => {
    await addUser("ze@teste.com", "senha-antiga-1");
    const first = await linkFor("ze@teste.com", T0);
    const second = await linkFor("ze@teste.com", minutes(1));
    await confirmPasswordReset({ token: second, password: "senha-nova-22", now: minutes(2), db: asDb(db) });
    assert.equal(await getResetTokenStatus(first, minutes(2), asDb(db)), "used");
  });
});

// ---------- e-mail ----------

describe("e-mail de recuperação", () => {
  it("tem assunto, botão com o link e aviso de 15 minutos", () => {
    const link = "https://app.orcah.test/redefinir-senha?token=abc";
    const { subject, text, html } = passwordResetEmailContent(link);
    assert.equal(subject, "Redefina sua senha do Orçah");
    assert.ok(text.includes(link));
    assert.ok(html.includes(`href="${link}"`));
    assert.ok(html.includes("Criar nova senha"));
    assert.ok(text.includes("Este link expira em 15 minutos."));
    assert.ok(text.includes("Se você não solicitou isso, ignore este e-mail."));
  });
});
