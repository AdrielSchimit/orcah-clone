import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { getPublicCompanyPage } from "@/lib/public-page";
import { companySharePreview } from "@/lib/share-preview";
import { sharePreviewImage } from "@/lib/share-preview-image";
import { companyPublicUrl } from "@/lib/urls";

export const alt = "Página da empresa no Orçah";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const page = await getPublicCompanyPage(prisma, (await params).slug);
  const preview = page
    ? companySharePreview({
        name: page.name,
        ramo: page.ramo,
        place: page.areaLabel,
        description: page.description,
        host: companyPublicUrl(page.slug).replace(/^https?:\/\//, ""),
      })
    : companySharePreview({ name: "Orçah", ramo: "", place: "", description: null, host: "orcah.com.br" });

  return new ImageResponse(sharePreviewImage(preview), { ...size });
}
