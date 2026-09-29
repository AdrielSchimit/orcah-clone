function phoneDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  return digits.slice(0, 11);
}

/** Máscara enquanto digita. Celular (3º dígito 9): (DD) 9 XXXX-XXXX. Fixo: (DD) XXXX-XXXX. */
export function maskPhoneBR(value: string | null | undefined) {
  const digits = phoneDigits(value ?? "");
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;

  if (digits[2] === "9") {
    const mid = digits.slice(3, 7);
    const tail = digits.slice(7);
    return `(${digits.slice(0, 2)}) 9${mid ? ` ${mid}` : ""}${tail ? `-${tail}` : ""}`;
  }

  const body = digits.slice(0, 10);
  const head = body.slice(2, 6);
  const tail = body.slice(6);
  return `(${body.slice(0, 2)}) ${head}${tail ? `-${tail}` : ""}`;
}

export function formatPhoneBR(value: string | null | undefined) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return maskPhoneBR(digits);
  return value.trim();
}
