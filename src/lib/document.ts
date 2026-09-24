export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function isCpfCnpj(value: string) {
  const digits = digitsOnly(value);
  return digits.length === 11 || digits.length === 14;
}
