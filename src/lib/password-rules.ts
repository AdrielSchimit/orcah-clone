// Regra de senha compartilhada entre servidor e formulários (sem bcrypt: roda no navegador também).

export const MIN_PASSWORD_LENGTH = 8;
// o bcrypt só considera os primeiros 72 bytes
export const MAX_PASSWORD_BYTES = 72;

export const PASSWORD_POLICY_MESSAGE =
  "Use uma senha com 8 ou mais caracteres, letra maiúscula, letra minúscula, número e símbolo.";

export type PasswordRuleKey = "length" | "upper" | "lower" | "number" | "symbol";

export const PASSWORD_RULES: { key: PasswordRuleKey; label: string; test: (password: string) => boolean }[] = [
  { key: "length", label: "8 ou mais caracteres", test: (password) => password.length >= MIN_PASSWORD_LENGTH },
  { key: "upper", label: "Letra maiúscula", test: (password) => /\p{Lu}/u.test(password) },
  { key: "lower", label: "Letra minúscula", test: (password) => /\p{Ll}/u.test(password) },
  { key: "number", label: "Número", test: (password) => /\p{Nd}/u.test(password) },
  { key: "symbol", label: "Símbolo", test: (password) => /[^\p{L}\p{N}\s]/u.test(password) },
];

export function passwordChecks(password: string) {
  return PASSWORD_RULES.map((rule) => ({ key: rule.key, label: rule.label, ok: rule.test(password) }));
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

export function passwordIsStrong(password: string) {
  return (
    typeof password === "string" &&
    byteLength(password) <= MAX_PASSWORD_BYTES &&
    PASSWORD_RULES.every((rule) => rule.test(password))
  );
}
