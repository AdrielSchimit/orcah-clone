import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stateId = Number(searchParams.get("stateId"));
  if (!stateId) {
    return NextResponse.json([]);
  }

  const cities = await prisma.city.findMany({
    where: { stateId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return NextResponse.json(cities);
}
