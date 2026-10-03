import { z } from "zod";
import { ARTICLE_TYPES, COVER_MOTIFS, COVER_PALETTES, COVER_TEMPLATES } from "@/lib/ai/types";

export const titleCandidateSchema = z.object({
  title: z.string().min(8).max(90),
  slugSuggestion: z.string().min(3).max(80),
  searchIntent: z.string().min(8).max(180),
  articleType: z.enum(ARTICLE_TYPES),
  targetToolSlugs: z.array(z.string().min(2).max(80)).max(4),
  rationale: z.string().min(8).max(280),
});

export const titleBatchSchema = z.object({
  titles: z.array(titleCandidateSchema).min(3).max(15),
});

export const outlineSectionSchema = z.object({
  heading: z.string().min(4).max(120),
  questions: z.array(z.string().min(4).max(180)).min(1).max(4),
  evidence: z.array(z.string().min(4).max(180)).min(1).max(4),
  notes: z.string().max(240).optional().default(""),
});

export const briefOutlineSchema = z.object({
  searchIntent: z.string().min(8).max(180),
  audience: z.string().min(4).max(120),
  angle: z.string().min(8).max(240),
  questions: z.array(z.string().min(4).max(180)).min(2).max(6),
  evidenceNeeds: z.array(z.string().min(4).max(180)).min(2).max(6),
  internalLinkTargets: z.array(z.string().min(2).max(80)).max(6),
  sections: z.array(outlineSectionSchema).min(3).max(8),
});

const generatedBlockSchema = z.object({
  type: z.enum(["paragraph", "heading", "list", "steps", "faq", "note", "cta"]),
  text: z.string().max(2000).optional().default(""),
  headingLevel: z.union([z.literal(2), z.literal(3)]).optional(),
  listOrdered: z.boolean().optional(),
  listItems: z.array(z.string().min(1).max(400)).max(12).optional(),
  stepItems: z
    .array(z.object({ title: z.string().min(2).max(120), text: z.string().min(8).max(600) }))
    .max(8)
    .optional(),
  faqItems: z
    .array(z.object({ question: z.string().min(8).max(180), answer: z.string().min(8).max(800) }))
    .max(8)
    .optional(),
  ctaTitle: z.string().max(120).optional(),
  ctaLabel: z.string().max(60).optional(),
  ctaHref: z.string().max(180).optional(),
});

export const articleDraftSchema = z.object({
  title: z.string().min(8).max(90),
  slug: z.string().min(3).max(80),
  excerpt: z.string().min(40).max(240),
  toolSlugs: z.array(z.string().min(2).max(80)).min(1).max(6),
  blocks: z.array(generatedBlockSchema).min(8).max(40),
});

export const visualBriefSchema = z.object({
  templateKey: z.enum(COVER_TEMPLATES),
  palette: z.enum(COVER_PALETTES),
  motif: z.enum(COVER_MOTIFS),
  kicker: z.string().min(3).max(32),
  titleLines: z.array(z.string().min(2).max(40)).min(1).max(4),
  altText: z.string().min(12).max(160),
  illustrationPrompt: z.string().min(20).max(400),
});

export const seoPayloadSchema = z.object({
  seoTitle: z.string().min(12).max(70),
  seoDescription: z.string().min(50).max(160),
  excerpt: z.string().min(40).max(240),
  faqs: z.array(z.object({ question: z.string().min(8).max(180), answer: z.string().min(8).max(800) })).max(6),
  linkSuggestions: z.array(z.string().min(2).max(80)).max(6),
  visualBrief: visualBriefSchema,
});

export const healthPingSchema = z.object({
  ok: z.literal(true),
});

export const editorialReviewSchema = z.object({
  verdict: z.enum(["pass", "revise", "hold"]),
  summary: z.string().min(12).max(400),
  issues: z.array(z.object({ field: z.string().min(2).max(40), message: z.string().min(8).max(220) })).max(8),
  strengths: z.array(z.string().min(8).max(180)).max(5),
});
