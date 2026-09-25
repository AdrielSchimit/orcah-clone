import { Resend } from "resend";
import { PASSWORD_RESET_TTL_MINUTES } from "@/lib/auth-security";

function resendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTH_EMAIL_FROM?.trim();
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

export function resendIsConfigured() {
  return resendConfig() !== null;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function passwordResetEmailContent(link: string) {
  const subject = "Redefina sua senha do Orçah";
  const text = [
    "Redefina sua senha",
    "",
    "Recebemos uma solicitação para alterar sua senha.",
    "",
    `Criar nova senha: ${link}`,
    "",
    `Este link expira em ${PASSWORD_RESET_TTL_MINUTES} minutos.`,
    "",
    "Se você não solicitou isso, ignore este e-mail.",
  ].join("\n");
  const href = escapeHtml(link);
  const html = `
    <div style="font-family: Arial, sans-serif; color: #151f38; line-height: 1.5;">
      <h1 style="font-size: 22px; margin: 0 0 12px;">Redefina sua senha</h1>
      <p>Recebemos uma solicitação para alterar sua senha.</p>
      <p style="margin: 24px 0;">
        <a href="${href}" style="background: #ffb020; color: #151f38; display: inline-block; font-weight: 700; padding: 12px 18px; text-decoration: none; border-radius: 8px;">
          Criar nova senha
        </a>
      </p>
      <p>Este link expira em ${PASSWORD_RESET_TTL_MINUTES} minutos.</p>
      <p style="color: #5f687a; font-size: 13px;">Se você não solicitou isso, ignore este e-mail.</p>
    </div>
  `;
  return { subject, text, html };
}

export async function sendPasswordResetEmail({ email, link }: { email: string; link: string }) {
  const config = resendConfig();
  if (!config) throw new Error("Resend não configurado");

  const { subject, text, html } = passwordResetEmailContent(link);
  const { error } = await new Resend(config.apiKey).emails.send({ from: config.from, to: email, subject, text, html });
  // o SDK não lança exceção em erro de API: devolve { error }. Só o nome do erro vai para o log.
  if (error) throw new Error(`Resend recusou o envio (${error.name})`);
}
