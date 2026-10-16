import type { Metadata } from "next";
import { LiquidDockDemo } from "@/components/liquid-dock-demo";

export const metadata: Metadata = {
  title: "ORÇAH Lab — Liquid Dock",
  description: "Demonstração interativa da navegação líquida móvel do ORÇAH.",
  robots: { index: false, follow: false },
};

export default function LiquidDockPreviewPage() {
  return <LiquidDockDemo />;
}
