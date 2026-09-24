import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Orçah",
    short_name: "Orçah",
    description: "Crie orçamentos profissionais, envie pelo WhatsApp e acompanhe até o cliente responder.",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    background_color: "#F5F7FA",
    theme_color: "#151F38",
    lang: "pt-BR",
    icons: [
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/brand/orcah-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/orcah-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
