import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { budgetSharePreview } from "@/lib/share-preview";
import { sharePreviewImage } from "@/lib/share-preview-image";

export const alt = "Orçamento no Orçah";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const budget = await prisma.budget.findUnique({
    where: { publicToken: (await params).token },
    select: {
      number: true,
      total: true,
      company: { select: { name: true } },
      items: { select: { description: true, groupName: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  const item = budget?.items[0];
  const preview = budgetSharePreview({
    companyName: budget?.company.name ?? "Orçah",
    number: budget?.number ?? "",
    service: item?.groupName || item?.description,
    totalLabel: budget ? formatBRL(Number(budget.total)) : null,
  });

  return new ImageResponse(sharePreviewImage(preview), { ...size });
}
