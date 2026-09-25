import { buildServiceDescription } from "@/lib/onboarding-description";
import { normalizeSearch, titleCaseName } from "@/lib/text";

type DescriptionInput = {
  categoryName?: string | null;
  categorySlug?: string | null;
  customRamoName?: string | null;
  cityName?: string | null;
  servesRegion?: boolean;
};

export type NormalizedOnboardingPayload = {
  name: string;
  whatsapp: string;
  businessCategoryId: number;
  customRamoName: string;
  stateId: number;
  cityName: string;
  servesRegion: boolean;
  description: string;
};

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function serviceAreaSentence(cityName?: string | null, servesRegion = false) {
  const city = titleCaseName(cityName ?? "");
  if (!city) return "";
  return servesRegion ? ` em ${city} e região` : ` em ${city}`;
}

export function buildCompanyDescription(input: DescriptionInput) {
  const customRamo = titleCaseName(input.customRamoName ?? "");
  const slug = normalizeSearch(input.categorySlug ?? "");
  const categoryName = titleCaseName(input.categoryName ?? "");
  const ramo = customRamo || categoryName || slug;
  return buildServiceDescription({ ramo, city: input.cityName, servesRegion: input.servesRegion });
}

export function normalizeCustomDescription(value: unknown) {
  const description = cleanText(value, 500);
  return description.length >= 8 ? description : "";
}

export function normalizeOnboardingPayload(body: Record<string, unknown>) {
  const payload: NormalizedOnboardingPayload = {
    name: cleanText(body.name, 120),
    whatsapp: cleanText(body.whatsapp, 30).replace(/\D/g, ""),
    businessCategoryId: Number(body.businessCategoryId),
    customRamoName: titleCaseName(cleanText(body.customRamoName, 80)),
    stateId: Number(body.stateId),
    cityName: titleCaseName(cleanText(body.cityName, 120)),
    servesRegion: Boolean(body.servesRegion),
    description: normalizeCustomDescription(body.description),
  };

  if (payload.name.length < 2) {
    return { error: "Informe o nome da empresa." } as const;
  }
  if (payload.whatsapp.length < 10 || payload.whatsapp.length > 11) {
    return { error: "Informe um WhatsApp válido." } as const;
  }
  if (!payload.businessCategoryId || !payload.stateId) {
    return { error: "Escolha o ramo e o estado." } as const;
  }

  return { payload } as const;
}
