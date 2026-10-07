import { requireCompany } from "@/lib/company";
import { prisma } from "@/lib/db";
import { assistantReply } from "@/lib/assistant/reply";
import { SupportError } from "@/lib/support/domain";
import { actOnSupportThread, ensureSupportThread, markSupportRead, readSupportThread, sendSupportMessage } from "@/lib/support/service";
import { requireSameOrigin, supportBody } from "@/lib/support/security";
import { supportFailure, supportResponse } from "@/lib/support/response";
import type { ProviderActor } from "@/lib/support/types";
import { wantsHuman } from "@/lib/assistant/retrieval";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ action: string }> };

export async function GET(request: Request, ctx: Context) {
  try {
    if ((await ctx.params).action !== "thread") throw new SupportError(404, "Rota não encontrada.");
    const auth = await requireCompany(); if (auth.error) return auth.error;
    const actor: ProviderActor = { kind: "provider", userId: auth.user.id, companyId: auth.company.id };
    const url = new URL(request.url);
    const requested = url.searchParams.get("threadId");
    const id = requested || (await ensureSupportThread(prisma, actor)).id;
    return supportResponse(await readSupportThread(prisma, actor, id, url.searchParams.get("before") || undefined));
  } catch (error) { return supportFailure(error); }
}

export async function POST(request: Request, ctx: Context) {
  try {
    const auth = await requireCompany(); if (auth.error) return auth.error;
    requireSameOrigin(request);
    const actor: ProviderActor = { kind: "provider", userId: auth.user.id, companyId: auth.company.id };
    const action = (await ctx.params).action;
    const body = await supportBody(request);
    if (typeof body.threadId !== "string" || !body.threadId || body.threadId.length > 100) throw new SupportError(400, "Conversa inválida.");
    let result;
    switch (action) {
      case "messages": {
        const human = typeof body.content === "string" && wantsHuman(body.content);
        const generate = (question: string, route: string) => assistantReply(question, { route, company: auth.company.name, category: auth.company.customRamoName || auth.company.businessCategory?.name || "" });
        result = await sendSupportMessage(prisma, actor, body.threadId, body, human ? undefined : generate, typeof body.route === "string" ? body.route : "/painel");
        if (human) result = await actOnSupportThread(prisma, actor, body.threadId, "escalate");
        break;
      }
      case "escalate": case "cancel-human": case "return-to-bot": result = await actOnSupportThread(prisma, actor, body.threadId, action); break;
      case "read":
        if (typeof body.throughId !== "string") throw new SupportError(400, "Mensagem inválida.");
        await markSupportRead(prisma, actor, body.threadId, body.throughId);
        return supportResponse({ ok: true });
      default: throw new SupportError(404, "Rota não encontrada.");
    }
    return supportResponse(result);
  } catch (error) { return supportFailure(error); }
}
