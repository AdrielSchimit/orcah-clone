import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const states = await prisma.state.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, uf: true },
  });
  return NextResponse.json(states);
}
