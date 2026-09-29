import { ramos, type RamoSeed } from "../../prisma/data/ramos";
import { normalizeSearch } from "@/lib/text";
import {
  companyTemplate,
  extraDetailLines,
  isTemplateKey,
  itemDetailLines,
  linhasPreviewCliente,
  type BudgetExtras,
  type ExtraField,
  type TemplateKey,
} from "@/lib/templates";
import { ramoMoldes, type RamoMolde } from "@/lib/ramo-moldes";

export const FAMILIAS: { key: TemplateKey; nome: string; clienteVe: string }[] = [
  { key: "equipe-obra", nome: "Equipe de obra", clienteVe: "Ambiente, mão de obra e material" },
  { key: "construtora", nome: "Construtora", clienteVe: "Etapas da obra, material e prazo" },
  { key: "acabamento-visual", nome: "Acabamento visual", clienteVe: "Cor, demãos, área e fotos" },
  { key: "revestimento", nome: "Revestimento", clienteVe: "Área em m², peça e base" },
  { key: "peca-sob-medida", nome: "Peça sob medida", clienteVe: "Medidas, material e ambiente" },
  { key: "oficina-tecnico", nome: "Oficina e técnico", clienteVe: "Diagnóstico, peça e serviço" },
  { key: "projeto", nome: "Projeto", clienteVe: "Pacote, entregas e prazo" },
  { key: "recorrente", nome: "Recorrente", clienteVe: "Frequência e pacote" },
  { key: "base", nome: "Base", clienteVe: "Lista de serviços e total" },
];

/** Ramos que ficam no molde base de propósito. Qualquer outro `base` é erro. */
export const EXCECOES_BASE: Record<string, string> = {
  outro: "Ofício fora da lista. O prestador usa o nome que digitou.",
  mudancas: "Frete não cabe em obra nem em oficina.",
  eventos: "Pacote de evento ainda sem família de projeto.",
  sonorizacao: "Som e palco ainda sem família própria.",
  "personal-organizer": "Organização ainda sem família recorrente.",
};

/** Um ramo de cada família para a matriz de regressão. */
export const CASOS_PRINCIPAIS: Record<TemplateKey, string> = {
  "equipe-obra": "pedreiro",
  construtora: "construtora",
  "acabamento-visual": "pintor",
  revestimento: "azulejista",
  "peca-sob-medida": "marceneiro",
  "oficina-tecnico": "informatica",
  projeto: "arquiteto",
  recorrente: "jardineiro",
  base: "outro",
};

const REGRA_EXTRA: Record<ExtraField, { unidade?: string; regra: string }> = {
  scope: { regra: "Cômodo ou âmbito do serviço." },
  color: { regra: "Cor combinada com o cliente." },
  coats: { unidade: "demão", regra: "Quantidade de demãos." },
  workType: { regra: "Tipo de obra ou de serviço." },
  areaM2: { unidade: "m²", regra: "Área estimada do serviço." },
  diagnosis: { regra: "O que foi encontrado no equipamento ou no veículo." },
  equipment: { regra: "Equipamento, móvel ou veículo." },
  brand: { regra: "Marca." },
  model: { regra: "Modelo." },
  eventDate: { regra: "Data do evento ou da visita." },
  plate: { regra: "Placa do veículo." },
  year: { regra: "Ano." },
  mileage: { unidade: "km", regra: "Quilometragem." },
  city: { regra: "Cidade, quando o endereço completo não entra." },
  destAddress: { regra: "Endereço de destino." },
  travelFee: { unidade: "R$", regra: "Deslocamento entra no total." },
  access: { regra: "Andares ou dificuldade de acesso." },
  elevator: { regra: "Se há elevador." },
};

const AMOSTRA_EXTRA: Record<ExtraField, string> = {
  scope: "Sala",
  color: "Branco gelo",
  coats: "2",
  workType: "Reforma",
  areaM2: "40",
  diagnosis: "Não liga",
  equipment: "Split 12 mil",
  brand: "Consul",
  model: "Inverter",
  eventDate: "2026-10-01",
  plate: "ABC1D23",
  year: "2020",
  mileage: "45000",
  city: "Maravilha",
  destAddress: "Rua B, 10",
  travelFee: "50",
  access: "2 andares",
  elevator: "Não",
};

export type CampoMolde = {
  campo: string;
  obrigatorio: boolean;
  unidade?: string;
  regra: string;
};

export type Duplicidade = {
  termo: string;
  slugs: string[];
  tipo: "alias-compartilhado";
};

export type FichaRamo = {
  nome: string;
  slug: string;
  familia: TemplateKey;
  familiaNome: string;
  moldeFino: true;
  excecao: string | null;
  unidades: string[];
  unidadePadrao: string;
  campos: CampoMolde[];
  regras: string[];
  duplicidades: string[];
};

function familiaDe(key: string) {
  const familia = FAMILIAS.find((item) => item.key === key);
  if (!familia || !isTemplateKey(key)) {
    throw new Error(`Família inválida: ${key}`);
  }
  return familia;
}

export function duplicidadesRamos(lista: RamoSeed[] = ramos): Duplicidade[] {
  const porTermo = new Map<string, Set<string>>();
  for (const ramo of lista) {
    for (const termo of [ramo.name, ramo.slug, ...ramo.aliases]) {
      const chave = normalizeSearch(termo);
      const grupo = porTermo.get(chave) ?? new Set<string>();
      grupo.add(ramo.slug);
      porTermo.set(chave, grupo);
    }
  }

  return [...porTermo.entries()]
    .filter(([, slugs]) => slugs.size > 1)
    .map(([termo, slugs]) => ({
      termo,
      slugs: [...slugs].sort(),
      tipo: "alias-compartilhado" as const,
    }))
    .sort((a, b) => a.termo.localeCompare(b.termo));
}

function regrasDoMolde(molde: RamoMolde) {
  const regras: string[] = [];
  if (molde.form.itemLayout === "area-m2") regras.push("A quantidade do item é a área em m².");
  if (molde.form.itemMeasures || molde.form.itemSizeWH || molde.form.itemSizeLW || molde.form.itemSizeWHD) {
    regras.push("O item aceita medidas.");
  }
  if (molde.form.itemAreaM2) regras.push("O item aceita área em m².");
  if (molde.form.itemPowerKwp) regras.push("O item aceita potência em kWp.");
  if (molde.form.itemVolumeM3) regras.push("O item aceita volume em m³.");
  if (molde.form.addressRequired) regras.push("O endereço do serviço é obrigatório.");
  if (molde.form.showTravelFee) regras.push("Pode cobrar deslocamento.");
  if (!regras.length) regras.push("Lista de serviços com quantidade, unidade e valor.");
  return regras;
}

function camposDoMolde(molde: RamoMolde): CampoMolde[] {
  const campos: CampoMolde[] = [
    { campo: "descricao", obrigatorio: true, regra: "Nome do serviço no item." },
    { campo: "quantidade", obrigatorio: true, regra: "Quantidade do item." },
    { campo: "valor", obrigatorio: true, unidade: "R$", regra: "Valor unitário do item." },
    {
      campo: "unidade",
      obrigatorio: true,
      unidade: molde.defaultUnit,
      regra: `Padrão ${molde.defaultUnit}. Também aceita: ${molde.units.join(", ")}.`,
    },
  ];

  if (molde.form.showAddress) {
    campos.push({
      campo: "endereco",
      obrigatorio: molde.form.addressRequired,
      regra: molde.form.addressRequired ? "Endereço do serviço." : "Endereço do serviço, se quiser informar.",
    });
  }

  for (const extra of molde.extras) {
    const regra = REGRA_EXTRA[extra];
    campos.push({
      campo: extra,
      obrigatorio: false,
      ...(regra.unidade ? { unidade: regra.unidade } : {}),
      regra: regra.regra,
    });
  }

  return campos;
}

export function fichaRamo(ramo: RamoSeed, duplicidades = duplicidadesRamos()): FichaRamo {
  const familia = familiaDe(ramo.templateKey);
  const molde = ramoMoldes[ramo.slug];
  if (!molde) throw new Error(`Ramo sem molde fino: ${ramo.slug}`);
  if (!molde.units.includes(molde.defaultUnit)) {
    throw new Error(`Unidade padrão fora da lista: ${ramo.slug}`);
  }

  return {
    nome: ramo.name,
    slug: ramo.slug,
    familia: familia.key,
    familiaNome: familia.nome,
    moldeFino: true,
    excecao: familia.key === "base" ? (EXCECOES_BASE[ramo.slug] ?? null) : null,
    unidades: molde.units,
    unidadePadrao: molde.defaultUnit,
    campos: camposDoMolde(molde),
    regras: regrasDoMolde(molde),
    duplicidades: duplicidades.filter((item) => item.slugs.includes(ramo.slug)).map((item) => item.termo),
  };
}

export function inventarioRamos() {
  const duplicidades = duplicidadesRamos();
  return ramos.map((ramo) => fichaRamo(ramo, duplicidades)).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function familiasAgrupadas() {
  const fichas = inventarioRamos();
  return FAMILIAS.map((familia) => ({
    ...familia,
    ramos: fichas.filter((ficha) => ficha.familia === familia.key).map((ficha) => ficha.slug),
  }));
}

export function vinculosRamoMolde() {
  return ramos.map((ramo) => {
    const ficha = fichaRamo(ramo);
    return {
      slug: ficha.slug,
      familia: ficha.familia,
      moldeFino: ficha.moldeFino,
      excecao: ficha.excecao,
    };
  });
}

export function previewCliente(slug: string) {
  const ramo = ramos.find((item) => item.slug === slug);
  const molde = ramoMoldes[slug];
  if (!ramo || !molde) throw new Error(`Ramo sem preview: ${slug}`);

  const template = companyTemplate({ businessCategory: { templateKey: ramo.templateKey, slug } });
  const extras = Object.fromEntries(molde.extras.map((campo) => [campo, AMOSTRA_EXTRA[campo]])) as BudgetExtras;
  const linhasExtras = extraDetailLines(extras, molde.form);
  const medidas = itemDetailLines(
    {
      notes: molde.form.itemNotes ? "Observação do item" : "",
      material: molde.form.itemMaterial ? "MDF branco" : "",
      length: molde.form.itemMeasures || molde.form.itemSizeLW || molde.form.itemSizeWHD ? "2" : "",
      width: molde.form.itemMeasures || molde.form.itemSizeWH || molde.form.itemSizeLW || molde.form.itemSizeWHD ? "1" : "",
      height: molde.form.itemMeasures || molde.form.itemSizeWH || molde.form.itemSizeWHD ? "0,5" : "",
      areaNote: molde.form.itemAreaM2 || molde.form.itemLayout === "area-m2" ? "12" : "",
      powerNote: molde.form.itemPowerKwp ? "5" : "",
      volumeNote: molde.form.itemVolumeM3 ? "3" : "",
    },
    { depthAsLength: molde.form.itemSizeWHD, materialLabel: molde.form.itemMaterialLabel },
  );
  const linhas = linhasPreviewCliente({
    serviceCity: "Maravilha",
    serviceUf: "SC",
    serviceAddress: molde.form.showAddress ? "Rua A, 10" : "",
    extras,
    form: molde.form,
    estimatedDays: molde.form.showPrazo ? 5 : null,
  });

  return {
    slug,
    titulo: template.publicTitle,
    unidadePadrao: template.defaultUnit,
    linhas,
    linhasExtras,
    medidas,
    desktop: linhas,
    mobile: linhas,
    pdf: linhasExtras,
  };
}

export function exportarCatalogo() {
  return {
    familias: familiasAgrupadas(),
    duplicidades: duplicidadesRamos(),
    excecoes: EXCECOES_BASE,
    casosPrincipais: CASOS_PRINCIPAIS,
    ramos: inventarioRamos(),
  };
}
