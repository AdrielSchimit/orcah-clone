export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function slugify(value: string) {
  return normalizeSearch(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const SMALL_WORDS = new Set(["de", "da", "do", "das", "dos", "e"]);

export function titleCaseName(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLocaleLowerCase("pt-BR");
      if (index > 0 && SMALL_WORDS.has(normalizeSearch(lower))) {
        return lower;
      }
      return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
    })
    .join(" ");
}

export function accentCount(value: string) {
  return (value.normalize("NFD").match(/[\u0300-\u036f]/g) ?? []).length;
}
