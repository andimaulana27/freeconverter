import { parseBlogBody, readingMinutesFromBody, type BlogBlock, type BlogBody } from "@/lib/blog/content";
import { SEO_LIMITS, validateForPublish } from "@/lib/cms/quality";
import type { QualityIssue } from "@/lib/cms/types";
import { isValidSlug, slugify } from "@/lib/cms/slug";
import { getTool } from "@/lib/tools";
import type { VisualBrief } from "@/lib/ai/types";
import type { articleDraftSchema } from "@/lib/ai/schemas";
import type { z } from "zod";

const UNSAFE_CLAIM = /\b(hipaa|soc ?2|100%\s*private|never leaves your (device|browser) guaranteed|military[- ]grade|encrypted on our servers|we (do not|never) (see|store) your files)\b/i;

export function filterKnownToolSlugs(slugs: string[]) {
  return [...new Set(slugs.map((slug) => slugify(slug)).filter((slug) => Boolean(getTool(slug))))];
}

export function blocksFromGenerated(raw: z.infer<typeof articleDraftSchema>["blocks"]): BlogBlock[] {
  return raw.flatMap((block): BlogBlock[] => {
    if (block.type === "heading") {
      const text = block.text.trim();
      return text ? [{ type: "heading", level: block.headingLevel === 3 ? 3 : 2, text, id: slugify(text) }] : [];
    }
    if (block.type === "list") {
      const items = (block.listItems ?? []).map((item) => item.trim()).filter(Boolean);
      return items.length ? [{ type: "list", ordered: block.listOrdered === true, items }] : [];
    }
    if (block.type === "steps") {
      const items = (block.stepItems ?? []).filter((item) => item.title.trim() && item.text.trim());
      return items.length ? [{ type: "steps", items }] : [];
    }
    if (block.type === "faq") {
      const items = (block.faqItems ?? []).filter((item) => item.question.trim() && item.answer.trim());
      return items.length ? [{ type: "faq", items }] : [];
    }
    if (block.type === "note") {
      const text = block.text.trim();
      return text ? [{ type: "note", text }] : [];
    }
    if (block.type === "cta") {
      const href = block.ctaHref?.startsWith("/") ? block.ctaHref : `/${(block.ctaHref ?? "").replace(/^\/+/, "")}`;
      const title = (block.ctaTitle || block.text || "Open the tool").trim();
      const text = block.text.trim() || "Use the matching AllYouConvert tool in your browser.";
      const label = (block.ctaLabel || "Open the tool").trim();
      return [{ type: "cta", title, text, href, label }];
    }
    const text = block.text.trim();
    return text ? [{ type: "paragraph", text }] : [];
  });
}

export function bodyFromGenerated(raw: z.infer<typeof articleDraftSchema>["blocks"]): BlogBody {
  return parseBlogBody({ version: 1, blocks: blocksFromGenerated(raw) });
}

export function mergeFaq(body: BlogBody, faqs: { question: string; answer: string }[]): BlogBody {
  if (!faqs.length) return body;
  const existing = body.blocks.some((block) => block.type === "faq");
  if (existing) return body;
  const items = faqs.filter((item) => item.question.trim() && item.answer.trim()).slice(0, 6);
  if (!items.length) return body;
  return parseBlogBody({ version: 1, blocks: [...body.blocks, { type: "faq", items }] });
}

export function validateGeneratedDraft(input: {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  body: BlogBody;
  toolSlugs: string[];
  existingSlugs: string[];
}): QualityIssue[] {
  const issues = validateForPublish({
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    body: input.body,
    toolSlugs: input.toolSlugs,
    cover: null,
  });

  if (!isValidSlug(input.slug)) {
    issues.push({ field: "slug", message: "Generated slug is not valid kebab-case." });
  }
  if (input.existingSlugs.includes(input.slug)) {
    issues.push({ field: "slug", message: "This slug already exists. The draft will use a unique suffix." });
  }
  const text = JSON.stringify(input.body);
  if (UNSAFE_CLAIM.test(text) || UNSAFE_CLAIM.test(input.title) || UNSAFE_CLAIM.test(input.excerpt)) {
    issues.push({ field: "body", message: "The draft contains an unsupported privacy or security claim." });
  }
  if (readingMinutesFromBody(input.body, null) < 2) {
    issues.push({ field: "body", message: "The generated draft is short. Edit before publishing." });
  }
  return issues;
}

export function clipSeo(value: string, min: number, max: number) {
  const trimmed = value.trim();
  if (trimmed.length > max) return trimmed.slice(0, max).trim();
  if (trimmed.length >= min) return trimmed;
  return trimmed;
}

export function seoLimits() {
  return SEO_LIMITS;
}

export function fallbackVisualBrief(title: string, kicker: string): VisualBrief {
  return {
    templateKey: "brand-bar",
    palette: "paper",
    motif: "rule",
    kicker: kicker.slice(0, 32) || "GUIDE",
    titleLines: title.trim().split(/\s+/).reduce<string[]>((lines, word) => {
      const current = lines[lines.length - 1];
      if (!current || `${current} ${word}`.length > 26) lines.push(word);
      else lines[lines.length - 1] = `${current} ${word}`;
      return lines;
    }, []).slice(0, 4),
    altText: `Branded AllYouConvert cover for ${title}`.slice(0, 160),
    illustrationPrompt: `Abstract geometric file-conversion motif on white, black, gray, and one red accent. No text, letters, logos, UI, or watermarks. Subject: ${title.slice(0, 80)}`,
  };
}
