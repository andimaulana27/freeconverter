import "server-only";

import { compactCatalog, productGrounding, toolFacts } from "@/lib/ai/catalog";
import { applyCover, estimateTokenUsd } from "@/lib/ai/cover";
import { generateStructured } from "@/lib/ai/generate";
import { isProviderAuthError, sanitizeAiError } from "@/lib/ai/provider";
import { articleDraftSchema, briefOutlineSchema, seoPayloadSchema } from "@/lib/ai/schemas";
import {
  fetchBatch,
  fetchJob,
  fetchStaffRole,
  insertMediaJob,
  listExistingGuideSignals,
  loadModelProfile,
  loadWorkerSettings,
  updateJob,
} from "@/lib/ai/server";
import type { GenerationTrace, TitleCandidate, TokenStep, VisualBrief } from "@/lib/ai/types";
import { TOPIC_SLUG_BY_TYPE } from "@/lib/ai/types";
import { bodyFromGenerated, fallbackVisualBrief, filterKnownToolSlugs, mergeFaq, validateGeneratedDraft } from "@/lib/ai/validate";
import { canPublish, isStaffRole, type StaffRole } from "@/lib/auth/roles";
import { postSnapshot } from "@/lib/cms/quality";
import { evaluatePostQuality, recordAlert, saveQualityReport } from "@/lib/cms/editorial-server";
import { createPublishSchedule } from "@/lib/cms/schedules";
import { fetchPost, insertRevision, listTopics, uniqueSlug, writeAudit, type StaffClient } from "@/lib/cms/server";
import { canonicalPathForSlug, slugify } from "@/lib/cms/slug";

class JobCancelledError extends Error {
  constructor() {
    super("Cancelled.");
    this.name = "JobCancelledError";
  }
}

function appendStep(trace: GenerationTrace, step: TokenStep): GenerationTrace {
  return {
    steps: [...trace.steps, step],
    promptVersions: { ...trace.promptVersions, [step.task]: step.promptVersion ?? 0 },
  };
}

function asTitle(jobTitle: string | null, batchTitles: TitleCandidate[]): TitleCandidate {
  const match = batchTitles.find((item) => item.title === jobTitle);
  if (match) return match;
  return {
    title: jobTitle || "Untitled guide",
    slugSuggestion: slugify(jobTitle || "untitled-guide"),
    searchIntent: "",
    articleType: "tool_tutorial",
    targetToolSlugs: [],
    rationale: "",
    rejected: false,
  };
}

function visualFromUnknown(value: unknown, title: string, kicker: string, seed = title): VisualBrief {
  const fallback = fallbackVisualBrief(title, kicker, seed);
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Record<string, unknown>;
  return {
    templateKey:
      raw.templateKey === "split-band" || raw.templateKey === "quiet-grid" || raw.templateKey === "brand-bar"
        ? raw.templateKey
        : fallback.templateKey,
    palette: raw.palette === "ink" || raw.palette === "bone" || raw.palette === "paper" ? raw.palette : fallback.palette,
    motif: raw.motif === "corner" || raw.motif === "grid" || raw.motif === "rule" ? raw.motif : fallback.motif,
    kicker: typeof raw.kicker === "string" && raw.kicker.trim() ? raw.kicker.slice(0, 32) : fallback.kicker,
    titleLines: Array.isArray(raw.titleLines)
      ? raw.titleLines.filter((item): item is string => typeof item === "string" && item.trim().length > 1).slice(0, 4)
      : fallback.titleLines,
    altText: typeof raw.altText === "string" && raw.altText.trim().length >= 12 ? raw.altText.slice(0, 160) : fallback.altText,
    illustrationPrompt:
      typeof raw.illustrationPrompt === "string" && raw.illustrationPrompt.trim().length >= 20
        ? raw.illustrationPrompt.slice(0, 400)
        : fallback.illustrationPrompt,
  };
}

async function assertActive(client: StaffClient, jobId: string, batchId: string, deadline: number) {
  if (Date.now() > deadline) throw new Error("Job timed out.");
  const [job, batch] = await Promise.all([fetchJob(client, jobId), fetchBatch(client, batchId)]);
  if (!job || !batch) throw new Error("Generation job is no longer available.");
  if (job.cancel_requested || batch.cancel_requested || job.status === "cancelled" || batch.status === "cancelled") {
    throw new JobCancelledError();
  }
  return { job, batch };
}

export function isRetryableGenerationError(error: unknown) {
  if (error instanceof JobCancelledError) return false;
  if (isProviderAuthError(error)) return false;
  const message = sanitizeAiError(error);
  if (/not found|rejected|forbidden|disabled|not configured/i.test(message)) return false;
  return true;
}

export async function processArticleJob(client: StaffClient, jobId: string) {
  const started = await fetchJob(client, jobId);
  if (!started) throw new Error("Generation job not found.");
  const batchStart = await fetchBatch(client, started.batch_id);
  if (!batchStart) throw new Error("Batch not found.");

  if (started.cancel_requested || batchStart.cancel_requested) {
    await updateJob(client, jobId, { status: "cancelled", stage: started.stage, error: "Cancelled." });
    return { ok: true as const, cancelled: true };
  }
  if (started.status === "completed" && started.post_id) {
    return { ok: true as const, postId: started.post_id };
  }

  const actorId = batchStart.created_by;
  if (!actorId) throw new Error("Batch is missing an owner.");
  const roleValue = await fetchStaffRole(client, actorId);
  const role: StaffRole = isStaffRole(roleValue) ? roleValue : "author";
  const settings = await loadWorkerSettings(client);
  const deadline = Date.now() + settings.jobTimeoutSeconds * 1000;

  let trace: GenerationTrace = started.token_usage?.steps?.length
    ? started.token_usage
    : { steps: [], promptVersions: {} };

  try {
    const selected = asTitle(started.title, batchStart.progress.titles ?? []);
    const existing = await listExistingGuideSignals(client);
    const topics = await listTopics(client);
    const topicSlug = TOPIC_SLUG_BY_TYPE[selected.articleType || batchStart.article_type];
    const topic = topics.find((item) => item.slug === topicSlug) ?? null;
    const focusTools = filterKnownToolSlugs([
      ...selected.targetToolSlugs,
      ...(batchStart.progress.targetToolSlugs ?? []),
    ]);
    const facts = toolFacts(focusTools);
    const sharedContext = {
      articleType: selected.articleType || batchStart.article_type,
      topic: batchStart.topic,
      direction: batchStart.progress.direction,
      audience: batchStart.progress.audience,
      language: batchStart.progress.language,
      tone: batchStart.progress.tone,
      selectedTitle: selected,
      toolFacts: facts,
      catalog: compactCatalog(),
      existingGuides: existing.slice(0, 40),
    };

    let outline = started.outline;
    if (!outline) {
      await assertActive(client, jobId, started.batch_id, deadline);
      await updateJob(client, jobId, { stage: "brief", status: "running" });
      const outlineProfile = await loadModelProfile(client, "outline_draft");
      const briefResult = await generateStructured({
        profile: outlineProfile,
        schema: briefOutlineSchema,
        name: "BriefOutline",
        extraSystem: productGrounding(),
        prompt: JSON.stringify(sharedContext, null, 2),
      });
      trace = appendStep(trace, briefResult.step);
      outline = briefResult.output as unknown as Record<string, unknown>;
      await updateJob(client, jobId, { stage: "outline", outline, token_usage: trace });
    }

    let draftPayload = started.draft;
    if (!draftPayload?.body) {
      await assertActive(client, jobId, started.batch_id, deadline);
      await updateJob(client, jobId, { stage: "draft", status: "running" });
      const draftProfile = await loadModelProfile(client, "article_draft");
      const draftResult = await generateStructured({
        profile: draftProfile,
        schema: articleDraftSchema,
        name: "ArticleDraft",
        extraSystem: productGrounding(),
        prompt: JSON.stringify({ ...sharedContext, brief: outline }, null, 2),
      });
      trace = appendStep(trace, draftResult.step);

      await updateJob(client, jobId, { stage: "seo", token_usage: trace });
      const seoProfile = await loadModelProfile(client, "seo_metadata");
      const seoResult = await generateStructured({
        profile: seoProfile,
        schema: seoPayloadSchema,
        name: "SeoVisual",
        extraSystem: productGrounding(),
        prompt: JSON.stringify(
          {
            ...sharedContext,
            brief: outline,
            draftTitle: draftResult.output.title,
            excerptHint: draftResult.output.excerpt,
          },
          null,
          2,
        ),
      });
      trace = appendStep(trace, seoResult.step);

      const toolSlugs = filterKnownToolSlugs(
        draftResult.output.toolSlugs.length ? draftResult.output.toolSlugs : focusTools,
      );
      const body = mergeFaq(bodyFromGenerated(draftResult.output.blocks), seoResult.output.faqs);
      const title = draftResult.output.title.trim() || selected.title;
      const slug = await uniqueSlug(client, slugify(draftResult.output.slug || selected.slugSuggestion || title));
      const excerpt = seoResult.output.excerpt.trim() || draftResult.output.excerpt.trim();
      const seoTitle = seoResult.output.seoTitle.trim() || title.slice(0, 70);
      const seoDescription = seoResult.output.seoDescription.trim() || excerpt.slice(0, 160);
      const visualBrief: VisualBrief = {
        ...fallbackVisualBrief(title, topic?.name ?? "GUIDE", slug),
        ...seoResult.output.visualBrief,
        titleLines: seoResult.output.visualBrief.titleLines.length
          ? seoResult.output.visualBrief.titleLines
          : fallbackVisualBrief(title, topic?.name ?? "GUIDE", slug).titleLines,
      };

      await updateJob(client, jobId, { stage: "validation" });
      const issues = validateGeneratedDraft({
        title,
        slug,
        excerpt,
        seoTitle,
        seoDescription,
        body,
        toolSlugs,
        existingSlugs: existing.map((item) => item.slug),
      });

      draftPayload = {
        title,
        slug,
        excerpt,
        seoTitle,
        seoDescription,
        toolSlugs,
        body,
        visualBrief,
        issues,
        topicName: topic?.name ?? "GUIDE",
        topicId: topic?.id ?? null,
      };
      await updateJob(client, jobId, { draft: draftPayload, validation: { issues }, token_usage: trace });
    }

    await assertActive(client, jobId, started.batch_id, deadline);

    const title = String(draftPayload.title ?? selected.title);
    const slug = String(draftPayload.slug ?? slugify(title));
    const excerpt = String(draftPayload.excerpt ?? "");
    const seoTitle = String(draftPayload.seoTitle ?? title);
    const seoDescription = String(draftPayload.seoDescription ?? excerpt);
    const toolSlugs = Array.isArray(draftPayload.toolSlugs)
      ? draftPayload.toolSlugs.filter((item): item is string => typeof item === "string")
      : focusTools;
    const body = draftPayload.body;
    const visualBrief = visualFromUnknown(draftPayload.visualBrief, title, String(draftPayload.topicName ?? "GUIDE"), slug);
    const topicId = typeof draftPayload.topicId === "string" ? draftPayload.topicId : null;
    const issues = Array.isArray(draftPayload.issues)
      ? (draftPayload.issues as { field: string; message: string }[])
      : [];

    let postId = started.post_id;
    if (!postId) {
      const { data: postRow, error: postError } = await client
        .from("blog_posts")
        .insert({
          title,
          slug,
          excerpt,
          body,
          status: "draft",
          seo_title: seoTitle,
          seo_description: seoDescription,
          canonical_path: canonicalPathForSlug(slug),
          author_id: actorId,
          topic_id: topicId,
          tool_slugs: toolSlugs,
          created_by: actorId,
          updated_by: actorId,
          noindex: false,
        })
        .select("id")
        .single();
      if (postError || !postRow) throw new Error(postError?.message ?? "Could not save the generated draft.");
      postId = String(postRow.id);
      await updateJob(client, jobId, { post_id: postId, stage: "review" });
    }

    try {
      await applyCover({
        client,
        postId,
        title,
        kicker: visualBrief.kicker || String(draftPayload.topicName ?? "GUIDE"),
        actorId,
        role,
        brief: visualBrief,
        illustration: null,
      });
    } catch (error) {
      draftPayload = { ...draftPayload, coverError: sanitizeAiError(error) };
    }

    const post = await fetchPost(client, postId);
    if (!post) throw new Error("Generated draft was not readable after save.");
    if (!post.current_revision_id) {
      const revisionId = await insertRevision(client, {
        postId,
        snapshot: postSnapshot(post),
        editorId: actorId,
        source: "ai",
      });
      await client.from("blog_posts").update({ current_revision_id: revisionId, updated_by: actorId }).eq("id", postId);
    }

    if (batchStart.progress.includeIllustration) {
      await insertMediaJob(client, {
        batchId: started.batch_id,
        generationJobId: jobId,
        postId,
        idempotencyKey: `${jobId}:cover_illustration`,
        payload: { title, kicker: visualBrief.kicker, visualBrief },
        seed: postId,
        maxAttempts: settings.maxAttempts,
      });
    }

    const tokens = trace.steps.reduce((sum, step) => sum + step.totalTokens, 0);
    const { report } = await evaluatePostQuality(client, {
      id: post.id,
      title,
      slug,
      excerpt,
      seoTitle,
      seoDescription,
      body,
      toolSlugs,
      topicId,
      cover: post.cover ?? null,
    });
    await saveQualityReport(client, { postId, report, actorId });
    const allIssues = [...issues, ...report.blocking];
    await updateJob(client, jobId, {
      stage: "saved",
      status: "completed",
      post_id: postId,
      draft: { ...draftPayload, issues: allIssues, links: report.links, similar: report.similar, qualityScore: report.score },
      validation: {
        issues: allIssues,
        warnings: report.warnings,
        similar: report.similar,
        links: report.links,
        coverError: typeof draftPayload.coverError === "string" ? draftPayload.coverError : null,
      },
      token_usage: trace,
      cost_estimate_usd: estimateTokenUsd(tokens),
      error: null,
    });

    const publishIssues = [...allIssues];
    const canAuto =
      batchStart.publishing_mode === "auto" && settings.autoPublishEnabled && canPublish(role) && publishIssues.length === 0;
    const canSchedule = batchStart.publishing_mode === "scheduled" && canPublish(role) && publishIssues.length === 0;
    if (batchStart.publishing_mode !== "draft" && publishIssues.length) {
      await recordAlert(client, {
        kind: "quality_hold",
        severity: "warning",
        message: publishIssues[0]?.message ?? "Generated draft held by quality gates.",
        entityType: "blog_post",
        entityId: postId,
      });
    }
    if ((canAuto || canSchedule) && post.status === "draft") {
      const jobs = await client
        .from("generation_jobs")
        .select("id")
        .eq("batch_id", started.batch_id)
        .eq("status", "completed");
      const index = (jobs.data ?? []).length;
      const runAt = new Date(Date.now() + index * settings.autoPublishStaggerMinutes * 60_000).toISOString();
      await createPublishSchedule(client, { postId, runAt, actorId, action: "publish" });
      await client
        .from("blog_posts")
        .update({ status: "scheduled", scheduled_for: runAt, updated_by: actorId })
        .eq("id", postId);
    }

    await writeAudit(client, {
      actorId,
      action: "generation.article",
      entityType: "generation_job",
      entityId: jobId,
      metadata: {
        postId,
        slug,
        modelIds: trace.steps.map((step) => step.modelId),
        promptVersions: trace.promptVersions,
        issueCount: issues.length,
        durable: true,
      },
    });
    return { ok: true as const, postId };
  } catch (error) {
    if (error instanceof JobCancelledError) {
      await updateJob(client, jobId, { status: "cancelled", error: "Cancelled.", token_usage: trace });
      return { ok: true as const, cancelled: true };
    }
    throw error;
  }
}
