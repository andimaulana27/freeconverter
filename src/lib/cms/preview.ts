import { parseBlogBody, readingMinutesFromBody } from "@/lib/blog/content";
import type { BlogPost } from "@/lib/blog/queries";
import { canonicalPathForSlug } from "@/lib/cms/slug";
import type { CmsPost } from "@/lib/cms/types";

export function cmsPostToBlogPost(post: CmsPost): BlogPost {
  const body = parseBlogBody(post.body);
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt?.trim() || post.seo_description?.trim() || "",
    seoTitle: post.seo_title?.trim() || null,
    seoDescription: post.seo_description?.trim() || null,
    canonicalPath: post.canonical_path || canonicalPathForSlug(post.slug),
    toolSlugs: post.tool_slugs,
    publishedAt: post.published_at || post.created_at,
    updatedAt: post.updated_at || post.created_at,
    noindex: true,
    readingMinutes: readingMinutesFromBody(body, post.reading_minutes),
    topic: post.topic ? { slug: post.topic.slug, name: post.topic.name } : null,
    body,
    cover: post.cover ? { url: post.cover.url, alt: post.cover.alt_text?.trim() || post.title } : null,
  };
}
