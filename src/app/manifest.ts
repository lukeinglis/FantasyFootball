import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Backyard Fantasy Football",
    short_name: "Backyard FF",
    description:
      "Greybushes & Chili Dogs fantasy football league. Live standings, matchups, draft analytics, and league history.",
    start_url: "/",
    display: "standalone",
    background_color: "#2C1810",
    theme_color: "#DD550C",
    orientation: "portrait-primary",
    categories: ["sports", "entertainment"],
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
