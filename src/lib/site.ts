export const SITE_NAME = "AllYouConvert";
export const SITE_DOMAIN = "allyouconvert.com";
const DEFAULT_SITE_URL = `https://${SITE_DOMAIN}`;

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
}

export function absUrl(path = "/") {
  if (path === "/") return `${siteUrl()}/`;
  const next = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${next}`;
}

export const BRAND_TITLE = `${SITE_NAME} — Free Online File Converter`;
export const BRAND_DESCRIPTION =
  "Convert images, PDFs, documents, ebooks, archives, fonts, video, and audio with free tools. No account, no hidden watermark, and local processing when supported.";
