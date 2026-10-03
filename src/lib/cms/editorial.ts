import { COVER_PALETTES, COVER_TEMPLATES, type CoverPalette } from "@/lib/ai/types";
import { parseBlogBody, type BlogBody } from "@/lib/blog/content";
import { COVER_PALETTE_COLORS } from "@/lib/cms/cover-template";
import type { CmsMediaAsset, QualityIssue } from "@/lib/cms/types";
import { relatedTools, tools, type ToolDef } from "@/lib/tools";

const STOP = new Set([
  "the", "and", "for", "with", "from", "that", "this", "your", "you", "into", "how", "why",
  "what", "when", "are", "not", "can", "use", "using", "file", "files", "guide", "convert",
]);

const UNSAFE_CLAIM =
  /\b(hipaa|soc ?2|100%\s*private|never leaves your (device|browser) guaranteed|military[- ]grade|encrypted on our servers|we (do not|never) (see|store) your files)\b/i;

const BROWSER_CLAIM = /\b(in (your|the) browser|on[- ]device|never uploaded|stays on your (device|computer))\b/i;

export type EditorialPeer = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status: string;
  tool_slugs: string[];
  topic_id: string | null;
  body: unknown;
  cover: Pick<CmsMediaAsset, "template_key" | "variant" | "alt_text" | "byte_size" | "width" | "height" | "approved_at" | "visibility" | "bucket" | "mime_type" | "source"> | null;
};

export type SimilarityHit = {
  id: string;
  slug: string;
  title: string;
  score: number;
  reason: "body" | "intent";
};

export type LinkSuggestion = {
  href: string;
  title: string;
  reason: string;
};

export type EditorialReport = {
  score: number;
  blocking: QualityIssue[];
  warnings: QualityIssue[];
  similar: SimilarityHit[];
  links: LinkSuggestion[];
    visual: {
    contrastInk: number | null;
    contrastAccent: number | null;
    palette: CoverPalette | null;
    template: string | null;
  };
};

export type CoverSignals = {
  alt_text?: string | null;
  approved_at?: string | null;
  visibility?: string | null;
  bucket?: string | null;
  byte_size?: number | null;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
  template_key?: string | null;
  variant?: string | null;
  source?: string | null;
};

export type PublishDraft = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  body: unknown;
  toolSlugs: string[];
  topicId?: string | null;
  cover: CoverSignals | null;
};

function tokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP.has(word)),
  );
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const token of a) if (b.has(token)) inter += 1;
  return inter / (a.size + b.size - inter);
}

function relativeLuminance(hex: string) {
  const value = hex.replace("#", "");
  const rgb = [0, 2, 4].map((index) => {
    const channel = Number.parseInt(value.slice(index, index + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

export function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

export function bodyPlainText(body: BlogBody) {
  return body.blocks
    .map((block) => {
      if (block.type === "paragraph" || block.type === "note" || block.type === "heading") return block.text;
      if (block.type === "list") return block.items.join(" ");
      if (block.type === "steps") return block.items.map((item) => `${item.title} ${item.text}`).join(" ");
      if (block.type === "faq") return block.items.map((item) => `${item.question} ${item.answer}`).join(" ");
      return `${block.title} ${block.text} ${block.href}`;
    })
    .join(" ");
}

function bodyHrefs(body: BlogBody) {
  return body.blocks.flatMap((block) => (block.type === "cta" ? [block.href] : []));
}

function paletteFromVariant(variant: string | null | undefined): CoverPalette | null {
  const key = variant?.split(":")[0];
  return COVER_PALETTES.includes(key as CoverPalette) ? (key as CoverPalette) : null;
}

export function evaluateEditorialQuality(input: PublishDraft, peers: EditorialPeer[], threshold = 0.42): EditorialReport {
  const blocking: QualityIssue[] = [];
  const warnings: QualityIssue[] = [];
  const body = parseBlogBody(input.body);
  const text = `${input.title} ${input.excerpt} ${input.seoTitle} ${input.seoDescription} ${bodyPlainText(body)}`;
  const titleTokens = tokens(input.title);
  const bodyTokens = tokens(text);
  const similar: SimilarityHit[] = [];

  for (const peer of peers) {
    if (peer.id && input.id && peer.id === input.id) continue;
    if (peer.slug === input.slug) continue;
    const peerBody = parseBlogBody(peer.body);
    const peerTitle = tokens(peer.title);
    const peerText = tokens(`${peer.title} ${peer.excerpt ?? ""} ${bodyPlainText(peerBody)}`);
    const titleScore = jaccard(titleTokens, peerTitle);
    const bodyScore = jaccard(bodyTokens, peerText);
    const sharedTools = input.toolSlugs.filter((slug) => peer.tool_slugs.includes(slug)).length;
    if (titleScore >= 0.55 && sharedTools > 0) {
      similar.push({ id: peer.id, slug: peer.slug, title: peer.title, score: titleScore, reason: "intent" });
    } else if (bodyScore >= threshold) {
      similar.push({ id: peer.id, slug: peer.slug, title: peer.title, score: bodyScore, reason: "body" });
    }
  }
  similar.sort((a, b) => b.score - a.score);
  const collision = similar[0];
  if (collision?.reason === "intent") {
    blocking.push({
      field: "title",
      message: `Search intent collides with “${collision.title}” (/${collision.slug}).`,
    });
  } else if (collision && collision.score >= Math.max(threshold, 0.5)) {
    blocking.push({
      field: "body",
      message: `This draft is too similar to “${collision.title}” (/${collision.slug}).`,
    });
  } else if (collision) {
    warnings.push({
      field: "body",
      message: `Possible overlap with “${collision.title}” (/${collision.slug}).`,
    });
  }

  if (UNSAFE_CLAIM.test(text)) {
    blocking.push({ field: "body", message: "The draft contains an unsupported privacy or security claim." });
  }

  const catalogBySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  for (const slug of input.toolSlugs) {
    const tool = catalogBySlug.get(slug);
    if (!tool) blocking.push({ field: "toolSlugs", message: `Unknown tool slug: ${slug}.` });
    else if (tool.need === "vps" && BROWSER_CLAIM.test(text)) {
      blocking.push({
        field: "body",
        message: `${tool.title} is a dedicated-worker tool and must not be described as in-browser processing.`,
      });
    }
  }

  for (const href of bodyHrefs(body)) {
    const slug = href.replace(/^\//, "").split("#")[0];
    if (slug && !slug.startsWith("blog/") && !catalogBySlug.has(slug) && slug !== "tools" && slug !== "privacy" && slug !== "terms") {
      warnings.push({ field: "body", message: `CTA points at an unknown path: ${href}.` });
    }
  }

  const cover = input.cover;
  let contrastInk: number | null = null;
  let contrastAccent: number | null = null;
  let palette: CoverPalette | null = cover ? paletteFromVariant(cover.variant) : null;
  const template = cover?.template_key ?? null;
  if (cover) {
    if (!cover.alt_text?.trim() || cover.alt_text.trim().length < 12) {
      blocking.push({ field: "cover", message: "Cover images need descriptive alt text of at least 12 characters." });
    }
    if (cover.alt_text && cover.alt_text.trim().toLowerCase() === input.title.trim().toLowerCase()) {
      warnings.push({ field: "cover", message: "Cover alt text should describe the image, not repeat the title." });
    }
    if (template && !COVER_TEMPLATES.includes(template as (typeof COVER_TEMPLATES)[number])) {
      warnings.push({ field: "cover", message: "Cover template is outside the branded set." });
    }
    const paletteKey: CoverPalette = palette ?? "paper";
    const colors = COVER_PALETTE_COLORS[paletteKey];
    contrastInk = contrastRatio(colors.ink, colors.bg);
    contrastAccent = contrastRatio(colors.accent, colors.bg);
    if (contrastInk < 4.5) blocking.push({ field: "cover", message: "Cover title contrast is below WCAG AA." });
    if (contrastAccent < 3) warnings.push({ field: "cover", message: "Cover accent contrast is low against the background." });
    if (cover.byte_size && cover.byte_size > 1_500_000) {
      blocking.push({ field: "cover", message: "Cover files must stay under 1.5 MB." });
    } else if (cover.byte_size && cover.byte_size > 400_000 && cover.mime_type !== "image/svg+xml") {
      warnings.push({ field: "cover", message: "Cover is large; compress before relying on it in search snippets." });
    }
    if (cover.mime_type && cover.mime_type !== "image/svg+xml") {
      if (cover.width && cover.width < 600) warnings.push({ field: "cover", message: "Raster covers should be at least 600px wide." });
    }
    const sameTemplate = peers.filter(
      (peer) => peer.id !== input.id && peer.cover?.template_key && peer.cover.template_key === template && peer.cover.variant === cover.variant,
    );
    if (sameTemplate.length >= 2) {
      warnings.push({ field: "cover", message: "Several live covers reuse this exact template and palette combination." });
    }
  }

  const links = suggestInternalLinks(input, body, peers);
  if (!links.some((link) => input.toolSlugs.some((slug) => link.href === `/${slug}`)) && input.toolSlugs.length) {
    warnings.push({ field: "body", message: "Add an in-article CTA to the matching converter." });
  }

  const blockingUnique = uniqueIssues(blocking);
  const warningUnique = uniqueIssues(warnings);
  const score = Math.max(0, 100 - blockingUnique.length * 18 - warningUnique.length * 6);
  return {
    score,
    blocking: blockingUnique,
    warnings: warningUnique,
    similar: similar.slice(0, 5),
    links,
    visual: { contrastInk, contrastAccent, palette, template },
  };
}

function uniqueIssues(issues: QualityIssue[]) {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.field}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function suggestInternalLinks(input: PublishDraft, body: BlogBody, peers: EditorialPeer[]): LinkSuggestion[] {
  const existing = new Set(bodyHrefs(body));
  const suggestions: LinkSuggestion[] = [];
  const primary = input.toolSlugs[0] ? tools.find((tool) => tool.slug === input.toolSlugs[0]) : null;
  const related: ToolDef[] = primary ? relatedTools(primary, 4) : [];

  for (const tool of [...input.toolSlugs.flatMap((slug) => {
    const match = tools.find((item) => item.slug === slug);
    return match ? [match] : [];
  }), ...related]) {
    const href = `/${tool.slug}`;
    if (existing.has(href) || suggestions.some((item) => item.href === href)) continue;
    suggestions.push({
      href,
      title: tool.title,
      reason: input.toolSlugs.includes(tool.slug) ? "Primary converter for this guide" : "Nearby tool in the same cluster",
    });
  }

  for (const peer of peers) {
    if (peer.status !== "published") continue;
    if (peer.id === input.id) continue;
    const href = `/blog/${peer.slug}`;
    if (existing.has(href) || suggestions.some((item) => item.href === href)) continue;
    const shared = peer.tool_slugs.some((slug) => input.toolSlugs.includes(slug));
    const sameTopic = Boolean(input.topicId && peer.topic_id === input.topicId);
    if (!shared && !sameTopic) continue;
    suggestions.push({
      href,
      title: peer.title,
      reason: shared ? "Published guide targeting the same tools" : "Same topic cluster",
    });
    if (suggestions.length >= 8) break;
  }

  return suggestions.slice(0, 8);
}

export function linksAsListBlock(links: LinkSuggestion[]) {
  return {
    type: "list" as const,
    ordered: false,
    items: links.map((link) => `${link.title}: ${link.href}`),
  };
}

