import "server-only";

import { createHash } from "node:crypto";
import { compactCatalog, productGrounding, toolFacts } from "@/lib/ai/catalog";
import { generateIllustrationPng, generateStructured } from "@/lib/ai/generate";
import { articleDraftSchema, briefOutlineSchema, seoPayloadSchema, titleBatchSchema } from "@/lib/ai/schemas";
import { sanitizeAiError } from "@/lib/ai/provider";
import {
  countRecentJobs,
  fetchBatch,
  hourlyJobLimit,
  insertBatch,
  insertJob,
  listExistingGuideSignals,
  loadModelProfile,
  updateBatch,
  updateJob,
} from "@/lib/ai/server";
import { recordProviderResult } from "@/lib/ai/secrets";
import type {
  ArticleType,
  BatchProgress,
  GenerationTrace,
  TitleCandidate,
  TokenStep,
  VisualBrief,
} from "@/lib/ai/types";
import { TOPIC_SLUG_BY_TYPE } from "@/lib/ai/types";
import { bodyFromGenerated, fallbackVisualBrief, filterKnownToolSlugs, mergeFaq, validateGeneratedDraft } from "@/lib/ai/validate";
import { canPublish } from "@/lib/auth/roles";
import { brandedCoverSvg, illustrationDataUri } from "@/lib/cms/cover-template";
import { postSnapshot } from "@/lib/cms/quality";
import { fetchPost, insertRevision, listTopics, uniqueSlug, upsertPublicCover, writeAudit, type StaffClient } from "@/lib/cms/server";
import { canonicalPathForSlug, slugify } from "@/lib/cms/slug";
import type { StaffRole } from "@/lib/auth/roles";

function appendStep(trace: GenerationTrace, step: TokenStep): GenerationTrace {
  return {
    steps: [...trace.steps, step],
    promptVersions: { ...trace.promptVersions, [step.task]: step.promptVersion ?? 0 },
  };
}

export async function enforceGenerationBudget(client: StaffClient, userId: string, extraJobs = 1) {
  const [usage, limit] = await Promise.all([countRecentJobs(client, userId), hourlyJobLimit(client)]);
  if (usage.jobs + extraJobs > limit || usage.batches >= 12) {
    return { ok: false as const, error: `Hourly generation limit reached (${limit} jobs).`, code: "rate_limited" as const };
  }
  return { ok: true as const };
}

export async function createTitleBatch(input: {
  client: StaffClient;
  role: StaffRole;
  actorId: string;
  topic: string;
  articleType: ArticleType;
  direction: string;
  audience: string;
  language: string;
  tone: string;
  titleCount: number;
  targetToolSlugs: string[];
  includeIllustration: boolean;
}) {
  const count = Math.min(15, Math.max(5, Math.round(input.titleCount) || 8));
  const tools = filterKnownToolSlugs(input.targetToolSlugs);
  const existing = await listExistingGuideSignals(input.client);
  const profile = await loadModelProfile(input.client, "title_ideation");
  const progress: BatchProgress = {
    direction: input.direction.trim(),
    audience: input.audience.trim() || "people who need to convert or fix a file",
    language: input.language.trim() || "en",
    tone: input.tone.trim() || "clear and practical",
    targetToolSlugs: tools,
    includeIllustration: input.includeIllustration,
    titles: [],
  };

  const batch = await insertBatch(input.client, {
    topic: input.topic.trim() || input.articleType.replaceAll("_", " "),
    articleType: input.articleType,
    requestedCount: 1,
    actorId: input.actorId,
    progress,
  });

  try {
    const { output, step } = await generateStructured({
      profile,
      schema: titleBatchSchema,
      name: "TitleBatch",
      extraSystem: productGrounding(),
      prompt: JSON.stringify(
        {
          articleType: input.articleType,
          topic: batch.topic,
          direction: progress.direction,
          audience: progress.audience,
          language: progress.language,
          tone: progress.tone,
          requestedTitles: count,
          focusTools: toolFacts(tools),
          catalog: compactCatalog(),
          existingGuides: existing.slice(0, 40),
        },
        null,
        2,
      ),
    });
    await recordProviderResult({ client: input.client, role: input.role });

    const titles: TitleCandidate[] = output.titles.map((item) => ({
      title: item.title.trim(),
      slugSuggestion: slugify(item.slugSuggestion || item.title),
      searchIntent: item.searchIntent.trim(),
      articleType: item.articleType,
      targetToolSlugs: filterKnownToolSlugs(item.targetToolSlugs.length ? item.targetToolSlugs : tools),
      rationale: item.rationale.trim(),
      rejected: false,
    }));

    await updateBatch(input.client, batch.id, {
      status: "pending",
      progress: { ...progress, titles },
    });
    await writeAudit(input.client, {
      actorId: input.actorId,
      action: "generation.titles",
      entityType: "generation_batch",
      entityId: batch.id,
      metadata: { count: titles.length, modelId: step.modelId, promptVersion: step.promptVersion },
    });
    return { ok: true as const, batchId: batch.id };
  } catch (error) {
    await recordProviderResult({ client: input.client, role: input.role, error });
    await updateBatch(input.client, batch.id, { status: "failed" });
    throw new Error(sanitizeAiError(error));
  }
}

export async function saveTitleSelections(input: {
  client: StaffClient;
  batchId: string;
  titles: TitleCandidate[];
  selectedIndex: number | null;
  includeIllustration: boolean;
}) {
  const batch = await fetchBatch(input.client, input.batchId);
  if (!batch) throw new Error("Batch not found.");
  await updateBatch(input.client, batch.id, {
    progress: {
      ...batch.progress,
      titles: input.titles,
      selectedIndex: input.selectedIndex ?? undefined,
      includeIllustration: input.includeIllustration,
    },
  });
}

async function applyCover(input: {
  client: StaffClient;
  postId: string;
  title: string;
  kicker: string;
  actorId: string;
  role: StaffRole;
  brief: VisualBrief;
  illustration?: { bytes: Uint8Array; mediaType: string; modelId: string; prompt: string } | null;
}) {
  const dataUri = input.illustration
    ? illustrationDataUri(input.illustration.bytes, input.illustration.mediaType)
    : null;
  const svg = brandedCoverSvg(input.title, input.kicker, {
    ...input.brief,
    illustrationDataUri: dataUri,
  });
  const body = new Blob([svg], { type: "image/svg+xml" });
  const promptHash = input.illustration
    ? createHash("sha256").update(input.illustration.prompt).digest("hex").slice(0, 32)
    : null;
  return upsertPublicCover(input.client, {
    postId: input.postId,
    path: `covers/${input.postId}/template.svg`,
    body,
    contentType: "image/svg+xml",
    altText: input.brief.altText || `Branded cover for ${input.title}`,
    actorId: input.actorId,
    source: input.illustration && dataUri ? "ai" : "template",
    approve: canPublish(input.role),
    templateKey: input.brief.templateKey,
    seed: input.postId,
    provider: input.illustration ? "google" : null,
    modelId: input.illustration?.modelId ?? null,
    promptHash,
    width: 1200,
    height: 630,
  });
}

export async function generateSelectedArticle(input: {
  client: StaffClient;
  role: StaffRole;
  actorId: string;
  batchId: string;
  selectedIndex: number;
}) {
  const batch = await fetchBatch(input.client, input.batchId);
  if (!batch) throw new Error("Batch not found.");
  const titles = batch.progress.titles ?? [];
  const selected = titles[input.selectedIndex];
  if (!selected || selected.rejected) throw new Error("Select a title that has not been rejected.");

  await updateBatch(input.client, batch.id, {
    status: "running",
    progress: { ...batch.progress, selectedIndex: input.selectedIndex, titles },
  });

  const slugKey = slugify(selected.slugSuggestion || selected.title);
  const job = await insertJob(input.client, {
    batchId: batch.id,
    title: selected.title,
    idempotencyKey: `${batch.id}:${slugKey}`,
  }).catch(async (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (!/duplicate|unique/i.test(message)) throw error;
    throw new Error("This title already has a generation job in this batch.");
  });

  let trace: GenerationTrace = { steps: [], promptVersions: {} };
  try {
    const existing = await listExistingGuideSignals(input.client);
    const topics = await listTopics(input.client);
    const topicSlug = TOPIC_SLUG_BY_TYPE[selected.articleType || batch.article_type];
    const topic = topics.find((item) => item.slug === topicSlug) ?? null;
    const focusTools = filterKnownToolSlugs([
      ...selected.targetToolSlugs,
      ...(batch.progress.targetToolSlugs ?? []),
    ]);
    const facts = toolFacts(focusTools);
    const sharedContext = {
      articleType: selected.articleType || batch.article_type,
      topic: batch.topic,
      direction: batch.progress.direction,
      audience: batch.progress.audience,
      language: batch.progress.language,
      tone: batch.progress.tone,
      selectedTitle: selected,
      toolFacts: facts,
      catalog: compactCatalog(),
      existingGuides: existing.slice(0, 40),
    };

    await updateJob(input.client, job.id, { stage: "brief", status: "running" });
    const outlineProfile = await loadModelProfile(input.client, "outline_draft");
    const briefResult = await generateStructured({
      profile: outlineProfile,
      schema: briefOutlineSchema,
      name: "BriefOutline",
      extraSystem: productGrounding(),
      prompt: JSON.stringify(sharedContext, null, 2),
    });
    trace = appendStep(trace, briefResult.step);
    await updateJob(input.client, job.id, {
      stage: "outline",
      outline: briefResult.output as unknown as Record<string, unknown>,
      token_usage: trace,
    });

    await updateJob(input.client, job.id, { stage: "draft" });
    const draftProfile = await loadModelProfile(input.client, "article_draft");
    const draftResult = await generateStructured({
      profile: draftProfile,
      schema: articleDraftSchema,
      name: "ArticleDraft",
      extraSystem: productGrounding(),
      prompt: JSON.stringify({ ...sharedContext, brief: briefResult.output }, null, 2),
    });
    trace = appendStep(trace, draftResult.step);

    await updateJob(input.client, job.id, { stage: "seo" });
    const seoProfile = await loadModelProfile(input.client, "seo_metadata");
    const seoResult = await generateStructured({
      profile: seoProfile,
      schema: seoPayloadSchema,
      name: "SeoVisual",
      extraSystem: productGrounding(),
      prompt: JSON.stringify(
        {
          ...sharedContext,
          brief: briefResult.output,
          draftTitle: draftResult.output.title,
          excerptHint: draftResult.output.excerpt,
        },
        null,
        2,
      ),
    });
    trace = appendStep(trace, seoResult.step);

    const toolSlugs = filterKnownToolSlugs(draftResult.output.toolSlugs.length ? draftResult.output.toolSlugs : focusTools);
    const body = mergeFaq(bodyFromGenerated(draftResult.output.blocks), seoResult.output.faqs);
    const title = draftResult.output.title.trim() || selected.title;
    const slug = await uniqueSlug(input.client, slugify(draftResult.output.slug || selected.slugSuggestion || title));
    const excerpt = seoResult.output.excerpt.trim() || draftResult.output.excerpt.trim();
    const seoTitle = seoResult.output.seoTitle.trim() || title.slice(0, 70);
    const seoDescription = seoResult.output.seoDescription.trim() || excerpt.slice(0, 160);
    const visualBrief: VisualBrief = {
      ...fallbackVisualBrief(title, topic?.name ?? "GUIDE"),
      ...seoResult.output.visualBrief,
      titleLines: seoResult.output.visualBrief.titleLines.length
        ? seoResult.output.visualBrief.titleLines
        : fallbackVisualBrief(title, topic?.name ?? "GUIDE").titleLines,
    };

    await updateJob(input.client, job.id, { stage: "validation" });
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

    const { data: postRow, error: postError } = await input.client
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
        author_id: input.actorId,
        topic_id: topic?.id ?? null,
        tool_slugs: toolSlugs,
        created_by: input.actorId,
        updated_by: input.actorId,
        noindex: false,
      })
      .select("id")
      .single();
    if (postError || !postRow) throw new Error(postError?.message ?? "Could not save the generated draft.");

    const postId = String(postRow.id);
    let coverError: string | null = null;
    try {
      let illustration: { bytes: Uint8Array; mediaType: string; modelId: string; prompt: string } | null = null;
      if (batch.progress.includeIllustration) {
        try {
          const imageProfile = await loadModelProfile(input.client, "cover_illustration");
          const image = await generateIllustrationPng({
            profile: imageProfile,
            prompt: visualBrief.illustrationPrompt,
          });
          trace = appendStep(trace, image.step);
          illustration = {
            bytes: image.bytes,
            mediaType: image.mediaType,
            modelId: imageProfile.model_id,
            prompt: visualBrief.illustrationPrompt,
          };
        } catch (error) {
          coverError = `Illustration skipped: ${sanitizeAiError(error)}`;
        }
      }
      await applyCover({
        client: input.client,
        postId,
        title,
        kicker: visualBrief.kicker || topic?.name || "GUIDE",
        actorId: input.actorId,
        role: input.role,
        brief: visualBrief,
        illustration,
      });
    } catch (error) {
      coverError = sanitizeAiError(error);
    }

    const post = await fetchPost(input.client, postId);
    if (!post) throw new Error("Generated draft was not readable after save.");
    const revisionId = await insertRevision(input.client, {
      postId,
      snapshot: postSnapshot(post),
      editorId: input.actorId,
      source: "ai",
    });
    await input.client.from("blog_posts").update({ current_revision_id: revisionId, updated_by: input.actorId }).eq("id", postId);

    await updateJob(input.client, job.id, {
      stage: "saved",
      status: "completed",
      post_id: postId,
      draft: {
        title,
        slug,
        excerpt,
        seoTitle,
        seoDescription,
        toolSlugs,
        body,
        visualBrief,
        coverError,
      },
      validation: { issues, coverError },
      token_usage: trace,
      error: null,
    });
    await updateBatch(input.client, batch.id, { status: "completed" });
    await recordProviderResult({ client: input.client, role: input.role });
    await writeAudit(input.client, {
      actorId: input.actorId,
      action: "generation.article",
      entityType: "generation_job",
      entityId: job.id,
      metadata: {
        postId,
        slug,
        modelIds: trace.steps.map((step) => step.modelId),
        promptVersions: trace.promptVersions,
        issueCount: issues.length,
      },
    });
    return { ok: true as const, batchId: batch.id, jobId: job.id, postId, message: coverError ?? "Draft saved." };
  } catch (error) {
    await recordProviderResult({ client: input.client, role: input.role, error });
    await updateJob(input.client, job.id, {
      status: "failed",
      error: sanitizeAiError(error),
      token_usage: trace,
    });
    await updateBatch(input.client, batch.id, { status: "failed" });
    throw new Error(sanitizeAiError(error));
  }
}

export async function generateAiCoverForPost(input: {
  client: StaffClient;
  role: StaffRole;
  actorId: string;
  postId: string;
  title: string;
  kicker?: string;
}) {
  const post = await fetchPost(input.client, input.postId);
  if (!post) throw new Error("Guide not found.");
  const brief = fallbackVisualBrief(input.title || post.title, input.kicker || post.topic?.name || "GUIDE");
  const imageProfile = await loadModelProfile(input.client, "cover_illustration");
  try {
    const image = await generateIllustrationPng({
      profile: imageProfile,
      prompt: brief.illustrationPrompt,
    });
    await recordProviderResult({ client: input.client, role: input.role });
    await applyCover({
      client: input.client,
      postId: post.id,
      title: input.title || post.title,
      kicker: brief.kicker,
      actorId: input.actorId,
      role: input.role,
      brief,
      illustration: {
        bytes: image.bytes,
        mediaType: image.mediaType,
        modelId: imageProfile.model_id,
        prompt: brief.illustrationPrompt,
      },
    });
    await writeAudit(input.client, {
      actorId: input.actorId,
      action: "post.cover_ai",
      entityType: "blog_post",
      entityId: post.id,
      metadata: { modelId: imageProfile.model_id },
    });
  } catch (error) {
    await recordProviderResult({ client: input.client, role: input.role, error });
    throw new Error(sanitizeAiError(error));
  }
  return fetchPost(input.client, post.id);
}
