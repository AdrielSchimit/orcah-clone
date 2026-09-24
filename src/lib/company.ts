import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export async function requireCompany() {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Faça login." }, { status: 401 }) };
  }
  if (!user.company) {
    return { error: NextResponse.json({ error: "Complete o cadastro da empresa." }, { status: 403 }) };
  }
  return { user, company: user.company };
}
