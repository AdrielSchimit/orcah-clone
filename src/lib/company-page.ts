import { instagramHandle } from "@/lib/instagram";
import { normalizeHexColor } from "@/lib/public-page";

/**
 * Campos da página comercial que o próprio prestador edita em /painel/pagina.
 * Só entram no update os campos enviados (cada seção salva a sua parte).
 */

export type CompanyPagePatch = {
  name?: string;
  description?: string | null;
  openingHours?: string | null;
  whatsapp?: string;
  phone?: string;
  instagram?: string | null;
  instagramConfirmed?: boolean;
  facebook?: string | null;
  website?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  servesRegion?: boolean;
  serviceRadiusKm?: number | null;
  serviceCityIds?: number[];
};

export type RegionPatch = { stateId: number; cityName: string } | null;

function text(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function phoneDigits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 13);
}

export function normalizeCompanyPagePatch(body: Record<string, unknown>):
  | { data: CompanyPagePatch; region: RegionPatch }
  | { error: string } {
  const data: CompanyPagePatch = {};

  if ("name" in body) {
    const name = text(body.name, 160).replace(/\s+/g, " ");
    if (name.length < 2) return { error: "Informe o nome do seu negócio." };
    data.name = name;
  }
  if ("description" in body) data.description = text(body.description, 600) || null;
  if ("openingHours" in body) data.openingHours = text(body.openingHours, 160) || null;
  if ("whatsapp" in body) {
    const whatsapp = phoneDigits(body.whatsapp);
    if (whatsapp.length < 10) return { error: "Informe o WhatsApp com DDD." };
    data.whatsapp = whatsapp;
  }
  if ("phone" in body) {
    const phone = phoneDigits(body.phone);
    if (phone && phone.length < 10) return { error: "Telefone com DDD, por favor." };
    if (phone) data.phone = phone;
  }
  if ("instagram" in body) {
    const handle = instagramHandle(body.instagram);
    const confirmed = body.instagramConfirmed === true || body.instagramConfirmed === "true" || body.instagramConfirmed === "on";
    if (handle && !confirmed) {
      return { error: "Confirme o Instagram. O @ é o da conta, não o nome da página." };
    }
    data.instagram = handle || null;
    data.instagramConfirmed = Boolean(handle);
  }
  if ("facebook" in body) data.facebook = text(body.facebook, 180) || null;
  if ("website" in body) data.website = text(body.website, 180) || null;
  for (const key of ["primaryColor", "secondaryColor"] as const) {
    if (key in body) {
      const raw = text(body[key], 9);
      const color = normalizeHexColor(raw);
      if (raw && !color) return { error: "Cor inválida." };
      data[key] = color;
    }
  }
  if ("servesRegion" in body) data.servesRegion = body.servesRegion === true || body.servesRegion === "true";
  if ("serviceRadiusKm" in body) {
    const raw=body.serviceRadiusKm;
    const radius=raw===null || raw==="" ? null : Number(raw);
    if(radius!==null && (!Number.isInteger(radius) || radius<1 || radius>500)) return {error:"Informe uma distância entre 1 e 500 km."};
    data.serviceRadiusKm=radius;
    if(radius!==null) data.servesRegion=true;
  }

  let region: RegionPatch = null;
  if ("serviceCityIds" in body) {
    const ids = body.serviceCityIds;
    if (!Array.isArray(ids) || ids.length > 30 || ids.some(id => !Number.isInteger(id) || id <= 0)) return {error:"Escolha até 30 cidades válidas."};
    data.serviceCityIds = [...new Set(ids)] as number[];
    if (data.serviceCityIds.length) { data.servesRegion = false; data.serviceRadiusKm = null; }
  }
  if ("stateId" in body) {
    const stateId = Number(body.stateId);
    if (!Number.isInteger(stateId) || stateId <= 0) return { error: "Escolha o estado." };
    region = { stateId, cityName: text(body.cityName, 120) };
  }

  return { data, region };
}

export type CompletenessInput = {
  coverPath?: string | null;
  cityId?: number | null;
  logoPath: string | null;
  description: string | null;
  whatsapp: string | null;
  openingHours: string | null;
  instagram: string | null;
  website: string | null;
  facebook: string | null;
  servicesCount: number;
  photosCount: number;
};

/** Progresso da página. Só orienta: a página funciona (e é pública) desde o cadastro. */
export function pageCompleteness(input: CompletenessInput) {
  const items = [
    { key: "servicos", label: "Cadastrar um serviço", done: input.servicesCount > 0, href: "/painel/servicos/novo" },
    { key: "fotos", label: "Adicione pelo menos 3 fotos dos seus trabalhos", done: input.photosCount >= 3, href: "#fotos" },
    { key: "descricao", label: "Escrever o que você faz", done: Boolean(input.description?.trim()), href: "#perfil" },
    { key: "logo", label: "Colocar sua logo", done: Boolean(input.logoPath), href: "#logo" },
    { key: "whatsapp", label: "Conferir o WhatsApp", done: Boolean(input.whatsapp && input.whatsapp.length >= 10), href: "#perfil" },
    { key: "capa", label: "Escolha uma capa para sua página", done: Boolean(input.coverPath), href: "#capa" },
    { key: "area", label: "Defina sua área de atendimento", done: Boolean(input.cityId), href: "#perfil" },
  ];
  const done = items.filter((item) => item.done).length;
  return { percent: Math.round((done / items.length) * 100), items, missing: items.filter((item) => !item.done) };
}
