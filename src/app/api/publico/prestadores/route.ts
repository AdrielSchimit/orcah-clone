import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchPublicProviders, type ProviderSort } from "@/lib/provider-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const servico = searchParams.get("servico") ?? undefined;
  const cidade = searchParams.get("cidade") ?? undefined;
  const cidadeTexto = searchParams.get("cidadeTexto") ?? undefined;
  const tipo = searchParams.get("tipo") ?? "";
  const ordenar = (searchParams.get("ordenar") ?? "relevancia") as ProviderSort;

  if (tipo && tipo !== "profissional" && tipo !== "empresa") {
    return NextResponse.json({ error: "Filtro de tipo inválido." }, { status: 400 });
  }
  if (ordenar !== "relevancia" && ordenar !== "nome") {
    return NextResponse.json({ error: "Ordenação inválida." }, { status: 400 });
  }

  try {
    const result = await searchPublicProviders(prisma, {
      servico,
      cidade,
      cidadeTexto,
      tipo: tipo === "profissional" || tipo === "empresa" ? tipo : "",
      ordenar,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Não foi possível buscar prestadores." }, { status: 500 });
  }
}
