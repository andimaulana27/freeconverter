import { absUrl, SITE_NAME } from "@/lib/site";
import { listPublishedPosts } from "@/lib/blog/queries";

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const posts = (await listPublishedPosts()).filter((post) => !post.noindex);
  const items = posts.map((post) => `
    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${xmlEscape(absUrl(post.canonicalPath))}</link>
      <guid>${xmlEscape(absUrl(post.canonicalPath))}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description>${xmlEscape(post.seoDescription || post.excerpt)}</description>
    </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(`${SITE_NAME} guides`)}</title>
    <link>${xmlEscape(absUrl("/blog"))}</link>
    <description>Published file guides from ${xmlEscape(SITE_NAME)}.</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
