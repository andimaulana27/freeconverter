import type { MetadataRoute } from "next";
import { BRAND_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Free Online File Converter`,
    short_name: SITE_NAME,
    description: BRAND_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf9",
    theme_color: "#d92d28",
    lang: "en",
    icons: [
      {
        src: "/favicon.png",
        sizes: "243x243",
        type: "image/png",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
