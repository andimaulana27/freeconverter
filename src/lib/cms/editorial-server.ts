import "server-only";

import { generateStructured } from "@/lib/ai/generate";
import { editorialReviewSchema } from "@/lib/ai/schemas";
import { loadModelProfile } from "@/lib/ai/server";
import { evaluateEditorialQuality, type EditorialPeer, type EditorialReport, type PublishDraft } from "@/lib/cms/editorial";
import { validateForPublish, type PublishInput } from "@/lib/cms/quality";
import type { CmsPost, OperationalAlert, QualityIssue, QualityReportRow } from "@/lib/cms/types";
import type { StaffClient } from "@/lib/cms/server";

const CORPUS_SELECT = `
  id, slug, title, excerpt, status, tool_slugs, topic_id, body,
  cover:media_assets!blog_posts_cover_asset_id_fkey (
    template_key, variant, alt_text, byte_size, width, height, approved_at, visibility, bucket, mime_type, source
  )
`;

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function draftFromPost(post: CmsPost): PublishDraft {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    seoTitle: post.seo_title ?? "",
    seoDescription: post.seo_description ?? "",
    body: post.body,
    toolSlugs: post.tool_slugs,
    topicId: post.topic_id,
    cover: post.cover,
  };
}

export async function listEditorialPeers(client: StaffClient, ignoreId?: string): Promise<EditorialPeer[]> {
  let query = client.from("blog_posts").select(CORPUS_SELECT).neq("status", "archived").order("updated_at", { ascending: false }).limit(120);
  if (ignoreId) query = query.neq("id", ignoreId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const cover = one(row.cover as EditorialPeer["cover"] | EditorialPeer["cover"][] | null);
    return {
      id: String(row.id),
      slug: String(row.slug),
      title: String(row.title),
      excerpt: typeof row.excerpt === "string" ? row.excerpt : null,
      status: String(row.status ?? ""),
      tool_slugs: Array.isArray(row.tool_slugs) ? row.tool_slugs.filter((item): item is string => typeof item === "string") : [],
      topic_id: typeof row.topic_id === "string" ? row.topic_id : null,
      body: row.body,
      cover,
    };
  });
}

export async function similarityThreshold(client: StaffClient) {
  const { data } = await client.from("site_settings").select("value").eq("key", "quality_similarity_threshold").maybeSingle();
  const value = Number(data?.value);
  return Number.isFinite(value) && value > 0 && value < 1 ? value : 0.42;
}

export function mergePublishIssues(base: QualityIssue[], report: EditorialReport): QualityIssue[] {
  return [...base, ...report.blocking.map((issue) => ({ ...issue, severity: "error" as const }))];
}

export async function evaluatePostQuality(client: StaffClient, post: CmsPost | (PublishInput & { id?: string; topicId?: string | null; cover: CmsPost["cover"] })) {
  const draft: PublishDraft =
    "tool_slugs" in post
      ? draftFromPost(post)
      : {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          body: post.body,
          toolSlugs: post.toolSlugs,
          topicId: post.topicId,
          cover: post.cover,
        };
  const [peers, threshold] = await Promise.all([listEditorialPeers(client, draft.id), similarityThreshold(client)]);
  const report = evaluateEditorialQuality(draft, peers, threshold);
  const base = validateForPublish({
    title: draft.title,
    slug: draft.slug,
    excerpt: draft.excerpt,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription,
    body: draft.body,
    toolSlugs: draft.toolSlugs,
    cover: draft.cover,
  });
  return { report, issues: mergePublishIssues(base, report) };
}

export async function saveQualityReport(
  client: StaffClient,
  input: { postId: string; report: EditorialReport; actorId: string | null; editorial?: Record<string, unknown> | null },
) {
  const { data, error } = await client
    .from("content_quality_reports")
    .insert({
      post_id: input.postId,
      score: input.report.score,
      blocking_count: input.report.blocking.length,
      warning_count: input.report.warnings.length,
      findings: {
        similar: input.report.similar,
        links: input.report.links,
        visual: input.report.visual,
        blocking: input.report.blocking,
        warnings: input.report.warnings,
      },
      editorial: input.editorial ?? null,
      created_by: input.actorId,
    })
    .select("id, post_id, score, blocking_count, warning_count, findings, editorial, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data as QualityReportRow;
}

export async function latestQualityReport(client: StaffClient, postId: string) {
  const { data, error } = await client
    .from("content_quality_reports")
    .select("id, post_id, score, blocking_count, warning_count, findings, editorial, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as QualityReportRow | null) ?? null;
}

export async function runEditorialReview(client: StaffClient, post: CmsPost) {
  const profile = await loadModelProfile(client, "editorial_review");
  const { output, step } = await generateStructured({
    profile,
    schema: editorialReviewSchema,
    name: "EditorialReview",
    extraSystem: "Ground claims in the tool catalog. Do not invent capabilities. Hold content that duplicates another guide or makes privacy guarantees.",
    prompt: JSON.stringify({
      title: post.title,
      excerpt: post.excerpt,
      tools: post.tool_slugs,
      body: post.body,
    }),
  });
  return { output, step };
}

export async function recordAlert(
  client: StaffClient,
  input: {
    kind: OperationalAlert["kind"];
    severity: OperationalAlert["severity"];
    message: string;
    entityType?: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await client.from("operational_alerts").insert({
    kind: input.kind,
    severity: input.severity,
    message: input.message.slice(0, 500),
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function listOpenAlerts(client: StaffClient, limit = 20) {
  const { data, error } = await client
    .from("operational_alerts")
    .select("id, kind, severity, entity_type, entity_id, message, metadata, resolved_at, created_at")
    .is("resolved_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as OperationalAlert[];
}

export async function scanAdFailures(client: StaffClient) {
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("ad_assignments")
    .select("id, creative_id, placement_id, starts_at, ends_at, ad_creatives!inner(id, name, status)")
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .limit(40);
  if (error) return;
  const open = await client
    .from("operational_alerts")
    .select("entity_id")
    .eq("kind", "ad_failure")
    .is("resolved_at", null);
  const existing = new Set((open.data ?? []).map((row) => String(row.entity_id ?? "")));
  for (const row of data ?? []) {
    const creative = Array.isArray(row.ad_creatives) ? row.ad_creatives[0] : row.ad_creatives;
    if (!creative || creative.status === "active") continue;
    if (existing.has(String(row.id))) continue;
    await recordAlert(client, {
      kind: "ad_failure",
      severity: "warning",
      message: `Assignment ${row.id} points at inactive creative ${creative.name}.`,
      entityType: "ad_assignment",
      entityId: String(row.id),
    });
  }
}

export async function listRecentQualityReports(client: StaffClient, limit = 12) {
  const { data, error } = await client
    .from("content_quality_reports")
    .select("id, post_id, score, blocking_count, warning_count, findings, editorial, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as QualityReportRow[];
}
