import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Veolia — Suivi conso d'eau",
    short_name: "Veolia",
    description: "Suivi quotidien de la consommation d'eau",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#0284c7",
    icons: [
      // Ton icône, exportée en PNG dans /public (voir instructions).
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Variante "maskable" (fond plein cadre) pour un beau rendu sur Android.
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
