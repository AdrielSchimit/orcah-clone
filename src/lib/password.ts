import bcrypt from "bcryptjs";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

export { MIN_PASSWORD_LENGTH };

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function passwordIsValid(password: string) {
  return password.length >= MIN_PASSWORD_LENGTH;
}
