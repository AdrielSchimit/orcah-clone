import { NextResponse } from "next/server";
import { isPreviewAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { normalizeSearch } from "@/lib/text";

const PREVIEW_SLUGS = [
  "encanador",
  "construtora",
  "marceneiro",
  "eletricista",
  "pintor",
  "pedreiro",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = normalizeSearch(searchParams.get("q") ?? "");
  const wantAll = searchParams.get("all") === "1";
  const user = wantAll ? await getSessionUser() : null;
  const showAll = Boolean(wantAll && user && isPreviewAdmin(user));

  const rows = await prisma.businessCategory.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const outro = rows.find((row) => row.slug === "outro");
  const rest = rows.filter((row) => row.slug !== "outro");

  const serialize = (row: (typeof rows)[number]) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    templateKey: row.templateKey,
  });

  if (showAll) {
    return NextResponse.json([...rest, ...(outro ? [outro] : [])].map(serialize));
  }

  if (!q) {
    const preview = PREVIEW_SLUGS.map((slug) => rest.find((row) => row.slug === slug)).filter(
      (row): row is (typeof rest)[number] => Boolean(row),
    );
    return NextResponse.json([...preview, ...(outro ? [outro] : [])].map(serialize));
  }

  const matches = rest.filter((row) => {
    const aliases = Array.isArray(row.searchAliases) ? (row.searchAliases as string[]) : [];
    const haystack = [row.name, row.slug, ...aliases]
      .map((item) => normalizeSearch(String(item)))
      .join(" ");
    return haystack.includes(q);
  });

  const list = [...matches.slice(0, 12), ...(outro ? [outro] : [])];
  return NextResponse.json(list.map(serialize));
}
