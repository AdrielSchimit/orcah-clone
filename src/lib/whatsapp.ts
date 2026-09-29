export function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

/** DDD + número, sem o 55. Aceita o 55 na frente só quando ele é o código do país. */
export function nationalPhone(phone: string) {
  let digits = digitsOnly(phone);
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  return digits;
}

function isBrazilianPhone(digits: string) {
  if (digits.length !== 10 && digits.length !== 11) return false;
  const ddd = Number(digits.slice(0, 2));
  if (!Number.isInteger(ddd) || ddd < 11 || ddd > 99) return false;
  if (digits.length === 11) return digits[2] === "9";
  return digits[2] >= "2" && digits[2] <= "5";
}

export function whatsappNumber(phone: string) {
  const digits = nationalPhone(phone);
  if (!isBrazilianPhone(digits)) return "";
  return `55${digits}`;
}

export const WHATSAPP_PHONE_EMPTY = "Esse cliente está sem telefone. Coloque o WhatsApp dele pra conseguir mandar.";
export const WHATSAPP_PHONE_INVALID =
  "Esse número não serve pro WhatsApp. Confira o DDD e o celular do cliente.";

export function whatsappPhoneError(phone: string) {
  if (!digitsOnly(phone)) return WHATSAPP_PHONE_EMPTY;
  if (!whatsappNumber(phone)) return WHATSAPP_PHONE_INVALID;
  return "";
}

export { budgetPublicUrl, companyPublicUrl } from "@/lib/urls";

export type WhatsAppIntent = "novo" | "alteracao" | "lembrete" | "aprovado" | "recusado" | "expirado";

export function whatsappIntent(status: string, republished = false): WhatsAppIntent {
  if (status === "waiting" || republished) return "alteracao";
  if (status === "sent" || status === "viewed") return "lembrete";
  if (status === "approved") return "aprovado";
  if (status === "rejected") return "recusado";
  if (status === "expired") return "expirado";
  return "novo";
}

export function whatsappCta(intent: WhatsAppIntent) {
  switch (intent) {
    case "alteracao":
      return {
        label: "Mandar a alteração",
        hint: "Avisa que você mudou. O link continua o mesmo.",
      };
    case "lembrete":
      return {
        label: "Mandar um lembrete",
        hint: "Manda um oi pra saber se a pessoa viu.",
      };
    case "aprovado":
      return {
        label: "Agradecer no WhatsApp",
        hint: "Agradece e combina o serviço.",
      };
    case "recusado":
      return {
        label: "Mandar no WhatsApp",
        hint: "Pergunta se a pessoa quer um ajuste.",
      };
    case "expirado":
      return {
        label: "Mandar no WhatsApp",
        hint: "Avisa que o prazo venceu e você pode refazer.",
      };
    default:
      return {
        label: "Mandar no WhatsApp",
        hint: "A conversa já abre com o orçamento e o link.",
      };
  }
}

function oi(name: string) {
  const first = name.trim().split(/\s+/)[0];
  return first ? `Oi, ${first}!` : "Oi!";
}

export function whatsappBudgetMessage(input: {
  customerName: string;
  number: string;
  totalLabel: string;
  url: string;
  status?: string;
  republished?: boolean;
}) {
  const hello = oi(input.customerName);
  const resumo = `${input.number} · ${input.totalLabel}`;
  const intent = whatsappIntent(input.status ?? "draft", input.republished);

  if (intent === "alteracao") {
    return [hello, "Atualizei o orçamento do jeito que você pediu.", "", resumo, "", "O link é o mesmo:", input.url].join(
      "\n",
    );
  }
  if (intent === "lembrete") {
    return [hello, "Conseguiu ver o orçamento?", "", "Se ficou alguma dúvida, me chama por aqui.", input.url].join("\n");
  }
  if (intent === "aprovado") {
    return [hello, "Vi que você aprovou. Obrigado!", "", "Pra combinar o serviço, é só responder aqui.", input.url].join(
      "\n",
    );
  }
  if (intent === "recusado") {
    return [hello, "Se quiser, eu ajusto o orçamento e mando de novo.", "", input.url].join("\n");
  }
  if (intent === "expirado") {
    return [hello, "O prazo desse orçamento venceu.", "", "Se ainda precisar, eu refaço.", input.url].join("\n");
  }
  return [hello, "Segue o orçamento.", "", resumo, "", "Abre aqui:", input.url].join("\n");
}

export function whatsappHref(phone: string, message: string) {
  const number = whatsappNumber(phone);
  if (!number) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
