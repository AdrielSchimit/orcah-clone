import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth-security";
import { verifyPassword } from "@/lib/password";
import { loginRateIsLimited, recordFailedLogin, type AuthDb } from "@/lib/password-reset";

export const LOGIN_INVALID_MESSAGE = "E-mail, telefone ou senha incorretos.";
export const EMAIL_NOT_VERIFIED_MESSAGE = "Confirme seu e-mail para continuar.";
export const LOGIN_LIMITED_MESSAGE = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";

// hash bcrypt de uma senha aleatória: usuário inexistente também paga o custo do bcrypt,
// então o tempo de resposta não revela se o e-mail tem conta
const DUMMY_PASSWORD_HASH = "$2b$10$SKFCoF9y6kXTnSLfTjwIb.fQ5qxNV1gBKAaeSG7CovI05JjvkUX/2";

export type LoginResult =
  | { ok: true; user: { id: number; hasCompany: boolean } }
  | { ok: false; status: 401 | 429; error: string }
  | { ok: false; status: 403; code: "email_not_verified"; error: string };

export async function authenticateLogin({
  email: rawEmail,
  password,
  headers,
  now = new Date(),
  db = prisma,
}: {
  email: string;
  password: string;
  headers: Headers;
  now?: Date;
  db?: AuthDb;
}): Promise<LoginResult> {
  const identifier = normalizeEmail(rawEmail);
  const digits = /^[+\d\s().-]+$/.test(identifier) ? identifier.replace(/\D/g, "") : "";
  const phone = digits.startsWith("55") && [12, 13].includes(digits.length) ? digits.slice(2) : digits;
  const email = identifier.includes("@") ? identifier : phone ? "phone:" + phone : identifier;

  if (await loginRateIsLimited(email, headers, db, now)) {
    return { ok: false, status: 429, error: LOGIN_LIMITED_MESSAGE };
  }

  const select = { id: true, email: true, passwordHash: true, emailVerifiedAt: true, company: { select: { id: true } } };
  let user = identifier.includes("@") ? await db.user.findUnique({ where: { email: identifier }, select }) : null;
  if (!identifier.includes("@") && /^[0-9]{10,11}$/.test(phone)) {
    const matches = await db.user.findMany({ where: { phone }, select, take: 2 });
    // Telefones compartilhados não identificam uma conta com segurança: nesse caso, use o e-mail.
    if (matches.length === 1) user = matches[0];
  }
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !passwordOk) {
    await recordFailedLogin(email, headers, db, now);
    return { ok: false, status: 401, error: LOGIN_INVALID_MESSAGE };
  }

  // só depois da senha certa: não revela nada para quem não sabe a senha
  if (user.email && !user.emailVerifiedAt) {
    return { ok: false, status: 403, code: "email_not_verified", error: EMAIL_NOT_VERIFIED_MESSAGE };
  }

  return { ok: true, user: { id: user.id, hasCompany: Boolean(user.company) } };
}
