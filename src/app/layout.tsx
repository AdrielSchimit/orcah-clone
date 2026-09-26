import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import { appOrigin } from "@/lib/urls";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteTitle = "Orçah — Orçamento no WhatsApp";
const siteDescription =
  "Crie orçamentos profissionais, envie pelo WhatsApp e acompanhe até o cliente responder.";

export const metadata: Metadata = {
  metadataBase: new URL(appOrigin()),
  title: {
    default: siteTitle,
    template: "%s · Orçah",
  },
  description: siteDescription,
  applicationName: "Orçah",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Orçah",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/brand/orcah-icon.svg", type: "image/svg+xml" },
      { url: "/brand/png/orcah-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: "Orçah",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/brand/png/orcah-logo-1744.png",
        width: 1744,
        height: 484,
        alt: "Orçah — Orçamento no WhatsApp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/brand/png/orcah-logo-1744.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-text">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
