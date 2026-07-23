import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CaLí Dinner Club",
    short_name: "CaLí Dinner Club",
    description: "Dinner club platform that arranges events and rates restaurants together.",
    start_url: "/",
    display: "standalone",
    background_color: "#191712",
    theme_color: "#191712",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-wide.png",
        sizes: "1568x973",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/screenshot-narrow.png",
        sizes: "373x763",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
  };
}
