import { parseBlogBody, readingMinutesFromBody, safeGuideHref, type BlogBody } from "@/lib/blog/content";
import { isValidSlug } from "@/lib/cms/slug";
import type { CmsPost, QualityIssue } from "@/lib/cms/types";
import { getTool } from "@/lib/tools";

export const SEO_LIMITS = {
  title: { min: 8, max: 90 },
  seoTitle: { min: 12, max: 70 },
  seoDescription: { min: 50, max: 160 },
  excerpt: { min: 40, max: 240 },
};

export type PublishInput = {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  body: unknown;
  toolSlugs: string[];
  cover: { alt_text?: string | null; approved_at?: string | null; visibility?: string | null; bucket?: string | null } | null;
};

function lengthIssue(field: string, value: string, min: number, max: number, label: string): QualityIssue | null {
  const length = value.trim().length;
  if (length < min) return { field, message: `${label} needs at least ${min} characters.` };
  if (length > max) return { field, message: `${label} must be ${max} characters or fewer.` };
  return null;
}

export function postSnapshot(post: Pick<
  CmsPost,
  | "title"
  | "slug"
  | "excerpt"
  | "body"
  | "status"
  | "seo_title"
  | "seo_description"
  | "canonical_path"
  | "cover_asset_id"
  | "topic_id"
  | "tool_slugs"
  | "noindex"
  | "reading_minutes"
>): Record<string, unknown> {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    status: post.status,
    seo_title: post.seo_title,
    seo_description: post.seo_description,
    canonical_path: post.canonical_path,
    cover_asset_id: post.cover_asset_id,
    topic_id: post.topic_id,
    tool_slugs: post.tool_slugs,
    noindex: post.noindex,
    reading_minutes: post.reading_minutes,
  };
}

export function validateForPublish(input: PublishInput): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const title = input.title.trim();
  const excerpt = input.excerpt.trim();
  const seoTitle = input.seoTitle.trim() || title;
  const seoDescription = input.seoDescription.trim() || excerpt;

  const titleIssue = lengthIssue("title", title, SEO_LIMITS.title.min, SEO_LIMITS.title.max, "Title");
  if (titleIssue) issues.push(titleIssue);
  if (!isValidSlug(input.slug)) issues.push({ field: "slug", message: "Slug must be a lowercase kebab-case path of 3–80 characters." });
  const excerptIssue = lengthIssue("excerpt", excerpt, SEO_LIMITS.excerpt.min, SEO_LIMITS.excerpt.max, "Excerpt");
  if (excerptIssue) issues.push(excerptIssue);
  const seoTitleIssue = lengthIssue("seoTitle", seoTitle, SEO_LIMITS.seoTitle.min, SEO_LIMITS.seoTitle.max, "SEO title");
  if (seoTitleIssue) issues.push(seoTitleIssue);
  const seoDescriptionIssue = lengthIssue(
    "seoDescription",
    seoDescription,
    SEO_LIMITS.seoDescription.min,
    SEO_LIMITS.seoDescription.max,
    "Meta description",
  );
  if (seoDescriptionIssue) issues.push(seoDescriptionIssue);

  const body = parseBlogBody(input.body);
  const headings = body.blocks.filter((block) => block.type === "heading");
  const paragraphs = body.blocks.filter((block) => block.type === "paragraph" || block.type === "note");
  if (!headings.length) issues.push({ field: "body", message: "Add at least one heading so the guide has a table of contents." });
  if (!paragraphs.length) issues.push({ field: "body", message: "Add at least one paragraph of useful body copy." });
  if (readingMinutesFromBody(body, null) < 2) {
    issues.push({ field: "body", message: "The guide is too short to publish. Aim for about 400 words of useful steps." });
  }

  for (const block of body.blocks) {
    if (block.type === "cta" && !safeGuideHref(block.href)) {
      issues.push({ field: "body", message: "Tool CTAs must use a same-site path and cannot point at /admin." });
    }
  }

  if (!input.toolSlugs.length) {
    issues.push({ field: "toolSlugs", message: "Link at least one real tool from the catalog." });
  }
  for (const slug of input.toolSlugs) {
    if (!getTool(slug)) issues.push({ field: "toolSlugs", message: `Unknown tool slug: ${slug}.` });
  }

  if (input.cover) {
    if (!input.cover.alt_text?.trim()) issues.push({ field: "cover", message: "Cover images need descriptive alt text." });
    if (!input.cover.approved_at) issues.push({ field: "cover", message: "Cover images need publisher approval before going live." });
    if (input.cover.visibility && input.cover.visibility !== "public") {
      issues.push({ field: "cover", message: "The live cover must be a public blog-public asset." });
    }
    if (input.cover.bucket && input.cover.bucket !== "blog-public") {
      issues.push({ field: "cover", message: "The live cover must be stored in the public blog bucket." });
    }
  }

  return issues;
}

export function publishInputFromPost(post: CmsPost): PublishInput {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    seoTitle: post.seo_title ?? "",
    seoDescription: post.seo_description ?? "",
    body: post.body,
    toolSlugs: post.tool_slugs,
    cover: post.cover,
  };
}

export function storedBody(value: unknown): BlogBody {
  if (value && typeof value === "object" && Array.isArray((value as { blocks?: unknown }).blocks)) {
    return { version: 1, blocks: (value as BlogBody).blocks };
  }
  return { version: 1, blocks: [] };
}
