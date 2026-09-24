import { ramoMoldes } from "@/lib/ramo-moldes";
import { formatDate } from "@/lib/date";
import { parseMoney } from "@/lib/money";

export type TemplateKey =
  | "base"
  | "equipe-obra"
  | "acabamento-visual"
  | "construtora"
  | "revestimento"
  | "oficina-tecnico"
  | "peca-sob-medida"
  | "projeto"
  | "recorrente";

export type ItemKind = "mao-de-obra" | "material" | "equipamento" | "servico" | "peca";

export type ExtraField =
  | "scope"
  | "color"
  | "coats"
  | "workType"
  | "areaM2"
  | "diagnosis"
  | "equipment"
  | "brand"
  | "model"
  | "eventDate"
  | "plate"
  | "year"
  | "mileage"
  | "city"
  | "destAddress"
  | "travelFee"
  | "access"
  | "elevator";

export type CatalogItem = {
  name: string;
  unit: string;
  unitPrice?: string;
  kind?: ItemKind;
  groupName?: string;
  notes?: string;
};

export type BudgetFormLayout = {
  simplified: boolean;
  extraTitle?: string;
  showAddress: boolean;
  showStateCity: boolean;
  showValidity: boolean;
  showPrazo: boolean;
  validityInSummary: boolean;
  itemLayout: "standard" | "area-m2";
  itemNotes: boolean;
  itemMaterial: boolean;
  itemDeadline: boolean;
  itemPhotoHint: boolean;
  itemMeasures: boolean;
  itemAreaNote: boolean;
  itemAreaM2: boolean;
  itemPowerKwp: boolean;
  itemVolumeM3: boolean;
  itemSizeWH: boolean;
  itemSizeLW: boolean;
  itemSizeWHD: boolean;
  itemNameLabel?: string;
  itemDeadlineLabel?: string;
  itemMaterialLabel?: string;
  extraEquipmentLabel?: string;
  extraEventDateLabel?: string;
  catalogTitle?: string;
  addressLabel?: string;
  addressRequired: boolean;
  showTravelFee: boolean;
  hideKinds: boolean;
  hideGroups: boolean;
  hideItemDiscount: boolean;
  catalogSave: boolean;
};

export type TemplateConfig = {
  key: TemplateKey;
  title: string;
  publicTitle: string;
  newLabel: string;
  groupLabel?: string;
  groupPlaceholder?: string;
  groupSuggestions?: string[];
  groupSectionTitle?: string;
  kinds?: { value: ItemKind; label: string }[];
  units: string[];
  defaultUnit: string;
  photos: {
    enabled: boolean;
    placement: "before-items" | "after-items";
    sectionTitle: string;
    hint?: string;
    captionRequired: boolean;
    captionSuggestions?: string[];
  };
  extras: ExtraField[];
  suggestions: CatalogItem[];
  footerNote?: string;
  form?: BudgetFormLayout;
};

export type BudgetExtras = {
  scope?: string;
  color?: string;
  coats?: string;
  workType?: string;
  areaM2?: string;
  diagnosis?: string;
  equipment?: string;
  brand?: string;
  model?: string;
  eventDate?: string;
  plate?: string;
  year?: string;
  mileage?: string;
  city?: string;
  destAddress?: string;
  travelFee?: string;
  access?: string;
  elevator?: string;
};

export const EXTRA_FIELDS: ExtraField[] = [
  "scope",
  "color",
  "coats",
  "workType",
  "areaM2",
  "diagnosis",
  "equipment",
  "brand",
  "model",
  "eventDate",
  "plate",
  "year",
  "mileage",
  "city",
  "destAddress",
  "travelFee",
  "access",
  "elevator",
];

export function defaultFormLayout(config: {
  kinds?: TemplateConfig["kinds"];
  groupLabel?: string;
}): BudgetFormLayout {
  return {
    simplified: false,
    extraTitle: "Serviço",
    showAddress: true,
    showStateCity: true,
    showValidity: true,
    showPrazo: true,
    validityInSummary: false,
    itemLayout: "standard",
    itemNotes: false,
    itemMaterial: false,
    itemDeadline: false,
    itemPhotoHint: false,
    itemMeasures: false,
    itemAreaNote: false,
    itemAreaM2: false,
    itemPowerKwp: false,
    itemVolumeM3: false,
    itemSizeWH: false,
    itemSizeLW: false,
    itemSizeWHD: false,
    addressRequired: false,
    showTravelFee: false,
    hideKinds: !config.kinds?.length,
    hideGroups: !config.groupLabel,
    hideItemDiscount: false,
    catalogSave: false,
  };
}

const KIND_MAO = { value: "mao-de-obra" as const, label: "Mão de obra" };
const KIND_MAT = { value: "material" as const, label: "Material" };
const KIND_EQP = { value: "equipamento" as const, label: "Equipamento" };
const KIND_SRV = { value: "servico" as const, label: "Serviço" };
const KIND_PEC = { value: "peca" as const, label: "Peça" };

export const KIND_LABEL: Record<ItemKind, string> = {
  "mao-de-obra": "Mão de obra",
  material: "Material",
  equipamento: "Equipamento",
  servico: "Serviço",
  peca: "Peça",
};

const templates: Record<TemplateKey, TemplateConfig> = {
  base: {
    key: "base",
    title: "Novo orçamento",
    publicTitle: "Orçamento",
    newLabel: "Novo orçamento",
    units: ["un", "m²", "m", "h", "vb"],
    defaultUnit: "un",
    photos: {
      enabled: true,
      placement: "after-items",
      sectionTitle: "Fotos",
      captionRequired: false,
    },
    extras: [],
    suggestions: [],
  },
  "equipe-obra": {
    key: "equipe-obra",
    title: "Nova obra",
    publicTitle: "Orçamento da obra",
    newLabel: "Nova obra",
    groupLabel: "Cômodo ou trecho",
    groupPlaceholder: "Banheiro, muro, laje…",
    groupSuggestions: ["Banheiro", "Cozinha", "Sala", "Quarto", "Muro", "Laje", "Calçada", "Área externa"],
    kinds: [KIND_MAO, KIND_MAT, KIND_EQP],
    units: ["m²", "m", "un", "diária", "saco", "kg", "vb"],
    defaultUnit: "m²",
    photos: {
      enabled: true,
      placement: "before-items",
      sectionTitle: "Situação atual da obra",
      hint: "Foto com subtítulo ajuda o cliente a entender o serviço.",
      captionRequired: true,
      captionSuggestions: [
        "Parede do banheiro onde entra o box",
        "Piso atual, a ser removido",
        "Muro dos fundos",
      ],
    },
    extras: [],
    suggestions: [
      { name: "Demolição", unit: "m²", kind: "mao-de-obra" },
      { name: "Alvenaria", unit: "m²", kind: "mao-de-obra" },
      { name: "Reboco", unit: "m²", kind: "mao-de-obra" },
      { name: "Contrapiso", unit: "m²", kind: "mao-de-obra" },
      { name: "Assentar piso", unit: "m²", kind: "mao-de-obra" },
      { name: "Rejunte", unit: "m²", kind: "mao-de-obra" },
      { name: "Muro", unit: "m", kind: "mao-de-obra" },
      { name: "Laje", unit: "m²", kind: "mao-de-obra" },
      { name: "Mão de obra diária", unit: "diária", kind: "mao-de-obra" },
      { name: "Material", unit: "vb", kind: "material" },
      { name: "Caçamba / entulho", unit: "un", kind: "equipamento" },
      { name: "Deslocamento", unit: "un", kind: "mao-de-obra" },
    ],
  },
  "acabamento-visual": {
    key: "acabamento-visual",
    title: "Nova pintura",
    publicTitle: "Orçamento de pintura",
    newLabel: "Nova pintura",
    groupLabel: "Ambiente",
    groupPlaceholder: "Sala, quarto, muro…",
    groupSuggestions: ["Sala", "Quarto", "Cozinha", "Banheiro", "Muro", "Fachada", "Teto"],
    kinds: [KIND_MAO, KIND_MAT],
    units: ["m²", "m", "un", "vb"],
    defaultUnit: "m²",
    photos: {
      enabled: true,
      placement: "before-items",
      sectionTitle: "Fotos da parede",
      hint: "Uma foto da parede ajuda o cliente a aprovar.",
      captionRequired: true,
      captionSuggestions: [
        "Sala, parede da TV",
        "Muro da frente, sol da tarde",
        "Infiltração no teto do quarto",
        "Cor de referência",
      ],
    },
    extras: ["scope", "color", "coats"],
    suggestions: [
      { name: "Lixamento e preparação", unit: "m²", kind: "mao-de-obra" },
      { name: "Massa corrida", unit: "m²", kind: "mao-de-obra" },
      { name: "Fundo preparador", unit: "m²", kind: "mao-de-obra" },
      { name: "Pintura parede (2 demãos)", unit: "m²", kind: "mao-de-obra" },
      { name: "Pintura teto", unit: "m²", kind: "mao-de-obra" },
      { name: "Pintura muro", unit: "m²", kind: "mao-de-obra" },
      { name: "Esmalte em madeira/ferro", unit: "m", kind: "mao-de-obra" },
      { name: "Material de tinta", unit: "vb", kind: "material" },
      { name: "Andaime / proteção de piso", unit: "un", kind: "material" },
    ],
    footerNote: "Cor a confirmar no local, se não houver código.",
  },
  construtora: {
    key: "construtora",
    title: "Novo orçamento de obra",
    publicTitle: "Proposta da obra",
    newLabel: "Novo orçamento de obra",
    groupLabel: "Etapa",
    groupPlaceholder: "Fundação, alvenaria…",
    groupSuggestions: [
      "Serviços preliminares",
      "Fundação",
      "Estrutura",
      "Alvenaria",
      "Cobertura",
      "Instalações",
      "Revestimentos",
      "Esquadrias",
      "Pintura",
      "Limpeza e entrega",
    ],
    kinds: [KIND_SRV, KIND_MAT],
    units: ["m²", "m", "un", "vb"],
    defaultUnit: "m²",
    photos: {
      enabled: true,
      placement: "before-items",
      sectionTitle: "Terreno / referência",
      captionRequired: true,
      captionSuggestions: ["Terreno", "Casa atual", "Fachada", "Planta / croqui"],
    },
    extras: ["workType", "areaM2"],
    suggestions: [
      { name: "Limpeza do terreno", unit: "m²", kind: "servico", groupName: "Serviços preliminares" },
      { name: "Fundação", unit: "m²", kind: "servico", groupName: "Fundação" },
      { name: "Estrutura de concreto", unit: "m²", kind: "servico", groupName: "Estrutura" },
      { name: "Alvenaria", unit: "m²", kind: "servico", groupName: "Alvenaria" },
      { name: "Telhado", unit: "m²", kind: "servico", groupName: "Cobertura" },
      { name: "Instalação elétrica", unit: "vb", kind: "servico", groupName: "Instalações" },
      { name: "Instalação hidráulica", unit: "vb", kind: "servico", groupName: "Instalações" },
      { name: "Revestimento", unit: "m²", kind: "servico", groupName: "Revestimentos" },
      { name: "Esquadrias", unit: "un", kind: "material", groupName: "Esquadrias" },
      { name: "Pintura", unit: "m²", kind: "servico", groupName: "Pintura" },
      { name: "Limpeza final", unit: "vb", kind: "servico", groupName: "Limpeza e entrega" },
    ],
    footerNote: "Valores de material podem variar conforme a marca escolhida.",
  },
  revestimento: {
    key: "revestimento",
    title: "Novo revestimento",
    publicTitle: "Orçamento de revestimento",
    newLabel: "Novo revestimento",
    groupLabel: "Ambiente",
    groupPlaceholder: "Banheiro, cozinha…",
    groupSuggestions: ["Banheiro", "Cozinha", "Área gourmet", "Fachada", "Área externa"],
    kinds: [KIND_MAO, KIND_MAT],
    units: ["m²", "m", "un"],
    defaultUnit: "m²",
    photos: {
      enabled: true,
      placement: "before-items",
      sectionTitle: "Base e referência",
      hint: "Mostre o banheiro ou a peça. O cliente compara visual, não só o preço.",
      captionRequired: true,
      captionSuggestions: ["Situação atual", "Detalhe do piso/parede", "Referência da peça", "Caixa / lote"],
    },
    extras: ["areaM2"],
    suggestions: [
      { name: "Fornecimento da peça", unit: "m²", kind: "material" },
      { name: "Perda de material (10%)", unit: "m²", kind: "material" },
      { name: "Mão de obra de assentamento", unit: "m²", kind: "mao-de-obra" },
      { name: "Rejunte", unit: "m²", kind: "mao-de-obra" },
      { name: "Impermeabilização", unit: "m²", kind: "mao-de-obra" },
      { name: "Remoção do revestimento antigo", unit: "m²", kind: "mao-de-obra" },
      { name: "Peça especial / recorte", unit: "un", kind: "mao-de-obra" },
      { name: "Soleira / rodapé", unit: "m", kind: "mao-de-obra" },
    ],
    footerNote: "Inclui perda de material, se houver a linha no orçamento.",
  },
  "oficina-tecnico": {
    key: "oficina-tecnico",
    title: "Novo reparo",
    publicTitle: "Orçamento do reparo",
    newLabel: "Novo reparo",
    kinds: [KIND_SRV, KIND_PEC],
    units: ["un", "h"],
    defaultUnit: "un",
    photos: {
      enabled: true,
      placement: "after-items",
      sectionTitle: "Fotos do equipamento",
      captionRequired: false,
      captionSuggestions: ["Equipamento na bancada", "Tela quebrada", "Etiqueta / modelo"],
    },
    extras: ["equipment", "diagnosis"],
    suggestions: [
      { name: "Diagnóstico / taxa de visita", unit: "un", kind: "servico" },
      { name: "Formatação + backup", unit: "un", kind: "servico" },
      { name: "Troca de tela", unit: "un", kind: "peca" },
      { name: "Troca de bateria", unit: "un", kind: "peca" },
      { name: "SSD / memória", unit: "un", kind: "peca" },
      { name: "Limpeza interna", unit: "un", kind: "servico" },
      { name: "Remoção de vírus", unit: "un", kind: "servico" },
      { name: "Montagem de PC", unit: "un", kind: "servico" },
      { name: "Configuração de rede", unit: "un", kind: "servico" },
      { name: "Visita / deslocamento", unit: "un", kind: "servico" },
    ],
  },
  "peca-sob-medida": {
    key: "peca-sob-medida",
    title: "Novo orçamento",
    publicTitle: "Orçamento",
    newLabel: "Novo orçamento",
    groupLabel: "Ambiente",
    groupPlaceholder: "Cozinha, quarto, vão…",
    kinds: [KIND_SRV, KIND_MAT],
    units: ["un", "m²", "m"],
    defaultUnit: "un",
    photos: {
      enabled: true,
      placement: "before-items",
      sectionTitle: "Vão / referência",
      captionRequired: true,
      captionSuggestions: ["Vão medido", "Referência", "Material"],
    },
    extras: [],
    suggestions: [
      { name: "Móvel sob medida", unit: "un", kind: "servico" },
      { name: "Material", unit: "vb", kind: "material" },
      { name: "Instalação", unit: "un", kind: "servico" },
      { name: "Medição / visita", unit: "un", kind: "servico" },
    ],
  },
  projeto: {
    key: "projeto",
    title: "Novo orçamento",
    publicTitle: "Proposta",
    newLabel: "Novo orçamento",
    groupLabel: "Fase ou pacote",
    groupPlaceholder: "Estudo, executivo, essencial…",
    groupSuggestions: ["Essencial", "Completo", "Estudo", "Executivo", "Acompanhamento"],
    kinds: [KIND_SRV],
    units: ["un", "h", "pacote"],
    defaultUnit: "un",
    photos: {
      enabled: false,
      placement: "after-items",
      sectionTitle: "Referências",
      captionRequired: false,
    },
    extras: [],
    suggestions: [
      { name: "Pacote essencial", unit: "pacote", kind: "servico" },
      { name: "Pacote completo", unit: "pacote", kind: "servico" },
      { name: "Visita técnica", unit: "un", kind: "servico" },
      { name: "Hora técnica", unit: "h", kind: "servico" },
    ],
  },
  recorrente: {
    key: "recorrente",
    title: "Novo orçamento",
    publicTitle: "Orçamento",
    newLabel: "Novo orçamento",
    groupLabel: "Frequência",
    groupPlaceholder: "Avulsa, semanal, mensal…",
    groupSuggestions: ["Avulsa", "Semanal", "Quinzenal", "Mensal"],
    units: ["un", "m²", "visita"],
    defaultUnit: "visita",
    photos: {
      enabled: true,
      placement: "after-items",
      sectionTitle: "Fotos",
      captionRequired: false,
    },
    extras: [],
    suggestions: [
      { name: "Visita avulsa", unit: "visita" },
      { name: "Pacote mensal", unit: "un" },
      { name: "Área (m²)", unit: "m²" },
    ],
  },
};

const ramoCatalog: Record<string, CatalogItem[]> = {
  encanador: [
    { name: "Ponto hidráulico", unit: "un", kind: "mao-de-obra" },
    { name: "Registro", unit: "un", kind: "mao-de-obra" },
    { name: "Vaso sanitário", unit: "un", kind: "mao-de-obra" },
    { name: "Ralo", unit: "un", kind: "mao-de-obra" },
    { name: "Tubo / ramal", unit: "m", kind: "mao-de-obra" },
    { name: "Caça-vazamento", unit: "un", kind: "mao-de-obra" },
    { name: "Material hidráulico", unit: "vb", kind: "material" },
    { name: "Deslocamento", unit: "un", kind: "mao-de-obra" },
  ],
  eletricista: [
    { name: "Ponto de tomada", unit: "un", kind: "mao-de-obra" },
    { name: "Luminária", unit: "un", kind: "mao-de-obra" },
    { name: "Quadro de distribuição", unit: "un", kind: "mao-de-obra" },
    { name: "Chuveiro elétrico", unit: "un", kind: "mao-de-obra" },
    { name: "Cabo", unit: "m", kind: "material" },
    { name: "Disjuntor", unit: "un", kind: "material" },
    { name: "Deslocamento", unit: "un", kind: "mao-de-obra" },
  ],
  gesseiro: [
    { name: "Forro de gesso", unit: "m²", kind: "mao-de-obra" },
    { name: "Sanca", unit: "m", kind: "mao-de-obra" },
    { name: "Drywall", unit: "m²", kind: "mao-de-obra" },
    { name: "Material", unit: "vb", kind: "material" },
  ],
  decorador: [
    { name: "Cortina", unit: "un", kind: "material" },
    { name: "Papel de parede", unit: "m²", kind: "mao-de-obra" },
    { name: "Ambientação", unit: "un", kind: "mao-de-obra" },
    { name: "Consultoria", unit: "h", kind: "mao-de-obra" },
  ],
  "ar-condicionado": [
    { name: "Limpeza / manutenção", unit: "un", kind: "servico" },
    { name: "Carga de gás", unit: "un", kind: "servico" },
    { name: "Instalação split", unit: "un", kind: "servico" },
    { name: "Suporte / mão francesa", unit: "un", kind: "peca" },
    { name: "Visita técnica", unit: "un", kind: "servico" },
  ],
};

export function isTemplateKey(value: string | null | undefined): value is TemplateKey {
  return !!value && value in templates;
}

export function withFormLayout(config: TemplateConfig): TemplateConfig {
  return { ...config, form: config.form ?? defaultFormLayout(config) };
}

export function resolveTemplate(key?: string | null): TemplateConfig {
  if (isTemplateKey(key)) return withFormLayout(templates[key]);
  return withFormLayout(templates.base);
}

export function companyTemplate(company: {
  businessCategory?: { templateKey: string; slug?: string } | null;
}): TemplateConfig {
  const slug = company.businessCategory?.slug;
  const molde = slug ? ramoMoldes[slug] : undefined;
  if (molde) {
    const base = resolveTemplate(company.businessCategory?.templateKey);
    return withFormLayout({
      ...base,
      title: molde.title ?? "Novo orçamento",
      publicTitle: molde.publicTitle ?? "Orçamento",
      newLabel: molde.newLabel ?? "Novo orçamento",
      groupLabel: molde.groupLabel,
      groupPlaceholder: molde.groupPlaceholder,
      groupSuggestions: molde.groupSuggestions,
      groupSectionTitle: molde.groupSectionTitle,
      kinds: undefined,
      units: molde.units,
      defaultUnit: molde.defaultUnit,
      extras: molde.extras,
      suggestions: molde.suggestions,
      photos: molde.photos ?? {
        enabled: true,
        placement: "after-items",
        sectionTitle: "Fotos",
        hint: "Opcional — anexa depois de salvar.",
        captionRequired: false,
      },
      footerNote: undefined,
      form: molde.form,
    });
  }

  const config = resolveTemplate(company.businessCategory?.templateKey);
  if (!slug || !(slug in ramoCatalog)) return config;
  return withFormLayout({ ...config, suggestions: ramoCatalog[slug] });
}

export function parseExtras(raw: unknown): BudgetExtras | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const extras: BudgetExtras = {};
  for (const field of EXTRA_FIELDS) {
    const value = source[field];
    if (typeof value === "string" && value.trim()) extras[field] = value.trim();
    else if (typeof value === "number" && Number.isFinite(value)) extras[field] = String(value);
  }
  return Object.keys(extras).length ? extras : null;
}

export function extraDetailLines(
  extras: BudgetExtras | null | undefined,
  form?: BudgetFormLayout | null,
): string[] {
  if (!extras) return [];
  const lines: string[] = [];
  if (extras.workType) lines.push(`Tipo de obra: ${extras.workType}`);
  if (extras.areaM2) lines.push(`Área: ${extras.areaM2} m²`);
  if (extras.scope) lines.push(`Âmbito: ${extras.scope}`);
  if (extras.color) lines.push(`Cor: ${extras.color}`);
  if (extras.coats) lines.push(`Demãos: ${extras.coats}`);
  if (extras.equipment) {
    const label = (form?.extraEquipmentLabel ?? (form?.extraTitle === "Veículo" ? "Veículo" : "Equipamento")).replace(
      / \(opcional\)$/i,
      "",
    );
    lines.push(`${label}: ${extras.equipment}`);
  }
  if (extras.plate) lines.push(`Placa: ${extras.plate}`);
  if (extras.year) lines.push(`Ano: ${extras.year}`);
  if (extras.mileage) lines.push(`Quilometragem: ${extras.mileage}`);
  if (extras.brand) lines.push(`Marca: ${extras.brand}`);
  if (extras.model) lines.push(`Modelo: ${extras.model}`);
  if (extras.destAddress) lines.push(`Destino: ${extras.destAddress}`);
  if (extras.city) lines.push(`Cidade: ${extras.city}`);
  if (extras.eventDate) {
    const dateLabel = (form?.extraEventDateLabel ?? "Data").replace(/ \(opcional\)$/i, "");
    lines.push(`${dateLabel}: ${formatDate(`${extras.eventDate}T12:00:00`)}`);
  }
  if (extras.access) lines.push(`Andares / acesso: ${extras.access}`);
  if (extras.elevator) lines.push(`Elevador: ${extras.elevator}`);
  if (extras.diagnosis) lines.push(`Diagnóstico: ${extras.diagnosis}`);
  return lines;
}

export function travelFeeAmount(extras: BudgetExtras | null | undefined) {
  return parseMoney(extras?.travelFee);
}

export function itemDetailLines(
  item: {
    notes?: string | null;
    material?: string | null;
    deadline?: string | null;
    length?: string | null;
    width?: string | null;
    height?: string | null;
    areaNote?: string | null;
    powerNote?: string | null;
    volumeNote?: string | null;
  },
  options?: { depthAsLength?: boolean; materialLabel?: string },
) {
  const lines: string[] = [];
  if (item.notes?.trim()) lines.push(item.notes.trim());
  if (item.material?.trim()) {
    const materialLabel = (options?.materialLabel ?? "Peça/material").replace(/ \(opcional\)$/i, "");
    lines.push(`${materialLabel}: ${item.material.trim()}`);
  }
  if (item.deadline?.trim()) lines.push(`Prazo: ${item.deadline.trim()}`);
  const measures = options?.depthAsLength
    ? [
        item.width?.trim() ? `L ${item.width.trim()}` : "",
        item.height?.trim() ? `A ${item.height.trim()}` : "",
        item.length?.trim() ? `P ${item.length.trim()}` : "",
      ]
    : [
        item.length?.trim() ? `C ${item.length.trim()}` : "",
        item.width?.trim() ? `L ${item.width.trim()}` : "",
        item.height?.trim() ? `A ${item.height.trim()}` : "",
      ];
  const filled = measures.filter(Boolean);
  if (filled.length) lines.push(`Medidas: ${filled.join(" × ")}`);
  if (item.areaNote?.trim()) {
    const area = item.areaNote.trim();
    lines.push(/^[\d.,\s]+$/.test(area) ? `Área: ${area} m²` : `Área: ${area}`);
  }
  if (item.powerNote?.trim()) {
    const power = item.powerNote.trim();
    lines.push(/kwp/i.test(power) ? `Potência: ${power}` : `Potência: ${power} kWp`);
  }
  if (item.volumeNote?.trim()) {
    const volume = item.volumeNote.trim();
    lines.push(/m³|m3/i.test(volume) ? `Volume: ${volume}` : `Volume: ${volume} m³`);
  }
  return lines;
}

export function isItemKind(value: string | null | undefined): value is ItemKind {
  return !!value && value in KIND_LABEL;
}
