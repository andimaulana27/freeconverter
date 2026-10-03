import type { Metadata } from "next";
import { toolBlurb, type ToolDef } from "@/lib/tools";
import { absUrl, BRAND_DESCRIPTION, BRAND_TITLE, SITE_NAME, siteUrl } from "@/lib/site";

export function toolHeadline(tool: ToolDef) {
  if (tool.slug.includes("-to-")) return `Convert ${tool.title}`;
  return tool.title;
}

function isConversion(tool: ToolDef) {
  return tool.slug.includes("-to-") || / to /i.test(tool.title);
}

export function toolSeoName(tool: ToolDef) {
  return isConversion(tool) ? `Free ${tool.title} Converter` : `Free ${tool.title} Tool`;
}

export function toolDocumentTitle(tool: ToolDef) {
  return `${toolSeoName(tool)} · ${SITE_NAME}`;
}

export function toolDescription(tool: ToolDef) {
  const where = tool.need === "browser" ? "in your browser. Nothing is uploaded." : "when the dedicated worker is online.";
  return `${toolBlurb(tool)} ${SITE_NAME} handles ${formatList(tool.inputs)} to ${tool.output.toUpperCase()} ${where}`;
}

function formatList(inputs: string[] | undefined) {
  const names = (inputs ?? []).map((item) => item.toUpperCase());
  if (names.length === 0) return "this workflow";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} or ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, or ${names.at(-1)}`;
}

export function brandMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: BRAND_TITLE,
      template: `%s · ${SITE_NAME}`,
    },
    description: BRAND_DESCRIPTION,
    applicationName: SITE_NAME,
    category: "File conversion tools",
    creator: SITE_NAME,
    publisher: SITE_NAME,
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
        { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
      shortcut: "/favicon.ico",
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: BRAND_TITLE,
      description: BRAND_DESCRIPTION,
      url: "/",
      locale: "en_US",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} file converter` }],
    },
    twitter: {
      card: "summary_large_image",
      title: BRAND_TITLE,
      description: BRAND_DESCRIPTION,
      images: ["/opengraph-image"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : undefined,
  };
}

export function homeMetadata(): Metadata {
  return {
    title: { absolute: BRAND_TITLE },
    description: BRAND_DESCRIPTION,
    alternates: { canonical: "/" },
    openGraph: {
      title: BRAND_TITLE,
      description: BRAND_DESCRIPTION,
      url: "/",
      siteName: SITE_NAME,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} file converter` }],
    },
    twitter: {
      card: "summary_large_image",
      title: BRAND_TITLE,
      description: BRAND_DESCRIPTION,
      images: ["/opengraph-image"],
    },
  };
}

export function toolMetadata(tool: ToolDef): Metadata {
  const documentTitle = toolDocumentTitle(tool);
  const description = toolDescription(tool);
  const path = `/${tool.slug}`;
  return {
    title: { absolute: documentTitle },
    description,
    alternates: { canonical: path },
    robots: { index: tool.need === "browser", follow: true },
    openGraph: {
      title: documentTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${toolSeoName(tool)} on ${SITE_NAME}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: documentTitle,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absUrl("/"),
    description: BRAND_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absUrl("/"),
      logo: absUrl("/icon-512.png"),
    },
  };
}

export function toolJsonLd(tool: ToolDef) {
  const url = absUrl(`/${tool.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: toolSeoName(tool),
    url,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript and a modern web browser",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absUrl("/") },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: toolDescription(tool),
  };
}

export function breadcrumbJsonLd(tool: ToolDef) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: absUrl("/") },
      { "@type": "ListItem", position: 2, name: "Tools", item: absUrl("/tools") },
      { "@type": "ListItem", position: 3, name: toolHeadline(tool), item: absUrl(`/${tool.slug}`) },
    ],
  };
}
