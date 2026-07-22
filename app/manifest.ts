import type { MetadataRoute } from "next";

// Web app manifest for "Add to Home Screen". Next.js serves this at
// /manifest.webmanifest and auto-adds the <link rel="manifest"> tag.
// Icons already exist in public/ (do not modify them).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GetYourRoom",
    short_name: "GetYourRoom",
    description: "Find rooms and flats for rent across Bhutan.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
