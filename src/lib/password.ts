import bcrypt from "bcryptjs";
import { MIN_PASSWORD_LENGTH, PASSWORD_POLICY_MESSAGE, passwordIsStrong } from "@/lib/password-rules";

export { MIN_PASSWORD_LENGTH, PASSWORD_POLICY_MESSAGE };

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

/** Mesma política do formulário: 8+ caracteres, maiúscula, minúscula, número e símbolo. */
export function passwordIsValid(password: string) {
  return passwordIsStrong(password);
}
