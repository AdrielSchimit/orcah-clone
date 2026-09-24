import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "A ativação local saiu. Pague no Pix ou no cartão em /painel/plano." },
    { status: 410 },
  );
}
