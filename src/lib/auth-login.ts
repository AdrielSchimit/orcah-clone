import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth-security";
import { verifyPassword } from "@/lib/password";
import { loginRateIsLimited, recordFailedLogin, type AuthDb } from "@/lib/password-reset";

export const LOGIN_INVALID_MESSAGE = "E-mail ou senha incorretos.";
export const LOGIN_LIMITED_MESSAGE = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";

// hash bcrypt de uma senha aleatória: usuário inexistente também paga o custo do bcrypt,
// então o tempo de resposta não revela se o e-mail tem conta
const DUMMY_PASSWORD_HASH = "$2b$10$SKFCoF9y6kXTnSLfTjwIb.fQ5qxNV1gBKAaeSG7CovI05JjvkUX/2";

export type LoginResult =
  | { ok: true; user: { id: number; hasCompany: boolean } }
  | { ok: false; status: 401 | 429; error: string };

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
  const email = normalizeEmail(rawEmail);

  if (await loginRateIsLimited(email, headers, db, now)) {
    return { ok: false, status: 429, error: LOGIN_LIMITED_MESSAGE };
  }

  const user = email
    ? await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true, company: { select: { id: true } } } })
    : null;
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !passwordOk) {
    await recordFailedLogin(email, headers, db, now);
    return { ok: false, status: 401, error: LOGIN_INVALID_MESSAGE };
  }

  return { ok: true, user: { id: user.id, hasCompany: Boolean(user.company) } };
}
