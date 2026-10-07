export type Municipio = { ibge: string; nome: string; uf: string; busca: string };
export type SelectedMunicipio = Pick<Municipio, "ibge" | "nome" | "uf">;

export function normalizeMunicipioSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

export function searchMunicipios(items: Municipio[], value: string, limit = 8) {
  const query = normalizeMunicipioSearch(value);
  if (query.length < 2) return [];
  const starts: Municipio[] = [], contains: Municipio[] = [];
  for (const item of items) {
    if (item.busca.startsWith(query)) starts.push(item);
    else if (item.busca.includes(query)) contains.push(item);
  }
  return [...starts, ...contains].slice(0, limit);
}
