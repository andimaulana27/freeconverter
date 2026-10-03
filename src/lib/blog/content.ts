export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string; id: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "faq"; items: { question: string; answer: string }[] }
  | { type: "note"; text: string }
  | { type: "cta"; title: string; text: string; href: string; label: string };

export type BlogBody = {
  version: 1;
  blocks: BlogBlock[];
};

export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

const INTERNAL_HREF = /^\/[a-z0-9#][a-z0-9\-/#]*$/;

export function safeGuideHref(value: unknown) {
  if (typeof value !== "string" || value.length > 180) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("..")) return null;
  if (value === "/admin" || value.startsWith("/admin/") || value.startsWith("/admin?")) return null;
  if (!INTERNAL_HREF.test(value)) return null;
  return value;
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const next = value.trim();
  if (!next || next.length > max) return null;
  return next;
}

function headingId(text: string, used: Map<string, number>) {
  const base = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function parseBlock(value: unknown, usedIds: Map<string, number>): BlogBlock | null {
  if (!value || typeof value !== "object") return null;
  const block = value as Record<string, unknown>;

  if (block.type === "paragraph") {
    const text = cleanText(block.text, 2000);
    return text ? { type: "paragraph", text } : null;
  }

  if (block.type === "heading") {
    const text = cleanText(block.text, 180);
    const level = block.level === 3 ? 3 : block.level === 2 ? 2 : null;
    if (!text || !level) return null;
    return { type: "heading", level, text, id: headingId(text, usedIds) };
  }

  if (block.type === "list" && Array.isArray(block.items)) {
    const items = block.items.map((item) => cleanText(item, 400)).filter((item): item is string => Boolean(item)).slice(0, 12);
    if (!items.length) return null;
    return { type: "list", ordered: block.ordered === true, items };
  }

  if (block.type === "steps" && Array.isArray(block.items)) {
    const items = block.items.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      const title = cleanText(row.title, 120);
      const text = cleanText(row.text, 600);
      return title && text ? [{ title, text }] : [];
    }).slice(0, 8);
    return items.length ? { type: "steps", items } : null;
  }

  if (block.type === "faq" && Array.isArray(block.items)) {
    const items = block.items.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      const question = cleanText(row.question, 180);
      const answer = cleanText(row.answer, 800);
      return question && answer ? [{ question, answer }] : [];
    }).slice(0, 8);
    return items.length ? { type: "faq", items } : null;
  }

  if (block.type === "note") {
    const text = cleanText(block.text, 800);
    return text ? { type: "note", text } : null;
  }

  if (block.type === "cta") {
    const title = cleanText(block.title, 120);
    const text = cleanText(block.text, 400);
    const label = cleanText(block.label, 60);
    const href = safeGuideHref(block.href);
    return title && text && label && href ? { type: "cta", title, text, href, label } : null;
  }

  return null;
}

export function parseBlogBody(value: unknown): BlogBody {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const rawBlocks = Array.isArray(source.blocks) ? source.blocks : [];
  const usedIds = new Map<string, number>();
  const blocks = rawBlocks.flatMap((block) => {
    const parsed = parseBlock(block, usedIds);
    return parsed ? [parsed] : [];
  });
  return { version: 1, blocks };
}

export function tableOfContents(body: BlogBody): TocItem[] {
  return body.blocks.flatMap((block) => (
    block.type === "heading" ? [{ id: block.id, text: block.text, level: block.level }] : []
  ));
}

export function faqEntries(body: BlogBody) {
  return body.blocks.flatMap((block) => (block.type === "faq" ? block.items : []));
}

export function adSplitIndex(blocks: BlogBlock[]) {
  const headings = blocks.flatMap((block, index) => (block.type === "heading" ? [index] : []));
  if (headings.length >= 2) return headings[1];
  return blocks.length;
}

export function readingMinutesFromBody(body: BlogBody, stored: number | null) {
  if (stored && stored > 0) return stored;
  const words = body.blocks.reduce((count, block) => {
    if (block.type === "paragraph" || block.type === "note") return count + block.text.split(/\s+/).length;
    if (block.type === "heading") return count + block.text.split(/\s+/).length;
    if (block.type === "list") return count + block.items.join(" ").split(/\s+/).length;
    if (block.type === "steps" || block.type === "faq") {
      return count + block.items.reduce((sum, item) => sum + `${"title" in item ? item.title : item.question} ${"text" in item ? item.text : item.answer}`.split(/\s+/).length, 0);
    }
    return count + `${block.title} ${block.text}`.split(/\s+/).length;
  }, 0);
  return Math.max(1, Math.round(words / 200));
}
