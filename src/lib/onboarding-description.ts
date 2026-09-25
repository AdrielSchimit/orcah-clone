export type ServiceDescriptionInput = {
  ramo?: string | null;
  city?: string | null;
  servesRegion?: boolean;
};

function serviceLead(ramo: string) {
  const normalized = ramo.trim().toLocaleLowerCase("pt-BR");

  if (/eletric/.test(normalized)) return "Serviços elétricos residenciais e comerciais";
  if (/encan|hidrául|hidraul/.test(normalized)) return "Serviços hidráulicos, instalações e reparos";
  if (/pedreir|constru/.test(normalized)) return "Serviços de construção, reforma e manutenção";
  if (/pintor|pintura/.test(normalized)) return "Pintura residencial e comercial";
  if (/marcen/.test(normalized)) return "Marcenaria sob medida, montagem e reparos";
  if (/serralh/.test(normalized)) return "Serviços de serralheria, fabricação e manutenção";
  if (/gesseir|gesso/.test(normalized)) return "Serviços em gesso, acabamento e manutenção";
  if (/jardineir|paisag/.test(normalized)) return "Jardinagem, manutenção e cuidados com áreas verdes";
  if (/ar condicionado|refrigera/.test(normalized)) return "Instalação e manutenção de climatização e refrigeração";
  if (/mecân|mecan/.test(normalized)) return "Serviços de manutenção e reparos mecânicos";
  if (/limpez/.test(normalized)) return "Serviços profissionais de limpeza e conservação";

  return "Serviços de " + normalized;
}

export function buildServiceDescription({
  ramo,
  city,
  servesRegion = false,
}: ServiceDescriptionInput) {
  const cleanRamo = ramo?.trim() ?? "";
  if (!cleanRamo) return "";

  const lead = serviceLead(cleanRamo);
  const cleanCity = city?.trim() ?? "";

  if (cleanCity) {
    return lead + " em " + cleanCity + (servesRegion ? " e região." : ".");
  }

  return lead + ".";
}
