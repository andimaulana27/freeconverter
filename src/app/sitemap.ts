import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools";
import { siteUrl } from "@/lib/site";

const TOOL_PAGES_UPDATED = new Date("2026-10-03T02:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${origin}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/tools`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${origin}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${origin}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
  const toolRoutes: MetadataRoute.Sitemap = tools
    .filter((tool) => tool.need === "browser")
    .map((tool) => ({
      url: `${origin}/${tool.slug}`,
      lastModified: TOOL_PAGES_UPDATED,
      changeFrequency: "monthly",
      priority: 0.8,
    }));
  return [...staticRoutes, ...toolRoutes];
}
