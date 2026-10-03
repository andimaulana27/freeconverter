"use server";

import { redirect } from "next/navigation";
import { canPublish } from "@/lib/auth/roles";
import { requireCms, requirePublisher } from "@/lib/auth/session";
import { brandedCoverSvg } from "@/lib/cms/cover-template";
import { postSnapshot, publishInputFromPost, validateForPublish } from "@/lib/cms/quality";
import { cancelPendingSchedules, createPublishSchedule, processDueSchedules } from "@/lib/cms/schedules";
import {
  applyArchive,
  applyPublish,
  fetchPost,
  insertRevision,
  savePostContent,
  setCoverRelation,
  uniqueSlug,
  upsertPublicCover,
  writeAudit,
} from "@/lib/cms/server";
import { canonicalPathForSlug, slugify } from "@/lib/cms/slug";
import type { CmsActionResult, EditorPayload, PostStatus } from "@/lib/cms/types";

const ALLOWED_COVER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

function forbidden(): CmsActionResult {
  return { ok: false, error: "You do not have permission for this action.", code: "forbidden" };
}

function asPayload(input: EditorPayload): EditorPayload {
  return {
    title: input.title,
    slug: slugify(input.slug || input.title),
    excerpt: input.excerpt,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    topicId: input.topicId,
    toolSlugs: input.toolSlugs.filter(Boolean),
    noindex: input.noindex,
    body: input.body,
  };
}

export async function createPost(formData: FormData) {
  const session = await requireCms("/admin/posts/new");
  const title = String(formData.get("title") ?? "").trim() || "Untitled guide";
  const slug = await uniqueSlug(session.supabase, String(formData.get("slug") ?? "") || slugify(title));
  const { data, error } = await session.supabase
    .from("blog_posts")
    .insert({
      title,
      slug,
      excerpt: "",
      body: { version: 1, blocks: [] },
      status: "draft" satisfies PostStatus,
      canonical_path: canonicalPathForSlug(slug),
      author_id: session.user.id,
      created_by: session.user.id,
      updated_by: session.user.id,
      tool_slugs: [],
      noindex: false,
    })
    .select("id")
    .single();
  if (error || !data) redirect("/admin/posts/new?error=create");
  await writeAudit(session.supabase, {
    actorId: session.user.id,
    action: "post.create",
    entityType: "blog_post",
    entityId: String(data.id),
    metadata: { slug },
  });
  redirect(`/admin/posts/${data.id}`);
}

export async function saveDraft(input: {
  postId: string;
  expectedUpdatedAt: string;
  payload: EditorPayload;
  createRevision?: boolean;
}): Promise<CmsActionResult> {
  const session = await requireCms(`/admin/posts/${input.postId}`);
  return savePostContent(session.supabase, {
    postId: input.postId,
    expectedUpdatedAt: input.expectedUpdatedAt,
    payload: asPayload(input.payload),
    actorId: session.user.id,
    createRevision: input.createRevision,
  });
}

export async function changePostStatus(input: {
  postId: string;
  expectedUpdatedAt: string;
  payload: EditorPayload;
  action: "review" | "draft" | "publish" | "unpublish" | "archive" | "schedule" | "cancel_schedule";
  runAt?: string;
  scheduleAction?: "publish" | "unpublish";
}): Promise<CmsActionResult> {
  const session = await requireCms(`/admin/posts/${input.postId}`);
  const publisher = canPublish(session.role);
  if (!publisher && (input.action === "publish" || input.action === "unpublish" || input.action === "archive" || input.action === "schedule" || input.action === "cancel_schedule")) {
    return forbidden();
  }

  const saved = await savePostContent(session.supabase, {
    postId: input.postId,
    expectedUpdatedAt: input.expectedUpdatedAt,
    payload: asPayload(input.payload),
    actorId: session.user.id,
  });
  if (!saved.ok) return saved;
  const post = saved.post;

  if (input.action === "review" || input.action === "draft") {
    if (!publisher && post.status !== "draft" && post.status !== "review") return forbidden();
    const nextStatus = input.action === "review" ? "review" : "draft";
    const { error } = await session.supabase
      .from("blog_posts")
      .update({ status: nextStatus, scheduled_for: null, updated_by: session.user.id })
      .eq("id", post.id);
    if (error) return { ok: false, error: error.message };
    await cancelPendingSchedules(session.supabase, post.id);
    await writeAudit(session.supabase, {
      actorId: session.user.id,
      action: nextStatus === "review" ? "post.submit_review" : "post.return_draft",
      entityType: "blog_post",
      entityId: post.id,
    });
    const next = await fetchPost(session.supabase, post.id);
    return next ? { ok: true, post: next } : { ok: false, error: "Guide not found." };
  }

  if (input.action === "publish") {
    const issues = validateForPublish(publishInputFromPost(post));
    if (issues.length) return { ok: false, error: issues[0].message, code: "validation", issues, post };
    await cancelPendingSchedules(session.supabase, post.id);
    const next = await applyPublish(session.supabase, post, session.user.id);
    if (!next) return { ok: false, error: "Publish failed." };
    await writeAudit(session.supabase, {
      actorId: session.user.id,
      action: "post.publish",
      entityType: "blog_post",
      entityId: next.id,
      metadata: { slug: next.slug },
    });
    return { ok: true, post: next, message: "Published." };
  }

  if (input.action === "unpublish" || input.action === "archive") {
    await cancelPendingSchedules(session.supabase, post.id);
    const next = await applyArchive(session.supabase, post, session.user.id);
    if (!next) return { ok: false, error: "Archive failed." };
    await writeAudit(session.supabase, {
      actorId: session.user.id,
      action: input.action === "unpublish" ? "post.unpublish" : "post.archive",
      entityType: "blog_post",
      entityId: next.id,
    });
    return { ok: true, post: next };
  }

  if (input.action === "cancel_schedule") {
    await cancelPendingSchedules(session.supabase, post.id);
    const { error } = await session.supabase
      .from("blog_posts")
      .update({
        status: post.status === "scheduled" ? "draft" : post.status,
        scheduled_for: null,
        updated_by: session.user.id,
      })
      .eq("id", post.id);
    if (error) return { ok: false, error: error.message };
    await writeAudit(session.supabase, {
      actorId: session.user.id,
      action: "post.cancel_schedule",
      entityType: "blog_post",
      entityId: post.id,
    });
    const next = await fetchPost(session.supabase, post.id);
    return next ? { ok: true, post: next } : { ok: false, error: "Guide not found." };
  }

  const runAt = input.runAt ? new Date(input.runAt) : null;
  if (!runAt || Number.isNaN(runAt.getTime()) || runAt.getTime() < Date.now() + 30_000) {
    return { ok: false, error: "Choose a schedule time at least 30 seconds in the future.", code: "validation", post };
  }
  const scheduleAction = input.scheduleAction ?? "publish";
  if (scheduleAction === "publish") {
    const issues = validateForPublish(publishInputFromPost(post));
    if (issues.length) return { ok: false, error: issues[0].message, code: "validation", issues, post };
  }
  await createPublishSchedule(session.supabase, {
    postId: post.id,
    runAt: runAt.toISOString(),
    actorId: session.user.id,
    action: scheduleAction,
  });
  const { error } = await session.supabase
    .from("blog_posts")
    .update({
      status: scheduleAction === "publish" ? "scheduled" : post.status,
      scheduled_for: runAt.toISOString(),
      updated_by: session.user.id,
    })
    .eq("id", post.id);
  if (error) return { ok: false, error: error.message };
  await writeAudit(session.supabase, {
    actorId: session.user.id,
    action: "post.schedule",
    entityType: "blog_post",
    entityId: post.id,
    metadata: { action: scheduleAction, runAt: runAt.toISOString() },
  });
  const next = await fetchPost(session.supabase, post.id);
  return next ? { ok: true, post: next, message: "Schedule saved." } : { ok: false, error: "Guide not found." };
}

export async function restoreRevision(input: {
  postId: string;
  revisionId: string;
  expectedUpdatedAt: string;
}): Promise<CmsActionResult> {
  const session = await requireCms(`/admin/posts/${input.postId}`);
  const post = await fetchPost(session.supabase, input.postId);
  if (!post) return { ok: false, error: "Guide not found." };
  if (post.updated_at !== input.expectedUpdatedAt) {
    return { ok: false, error: "This guide was updated in another tab. Reload before restoring.", code: "conflict", post };
  }
  if (!canPublish(session.role) && post.status !== "draft" && post.status !== "review") return forbidden();

  const { data, error } = await session.supabase
    .from("blog_post_revisions")
    .select("id, snapshot")
    .eq("id", input.revisionId)
    .eq("post_id", post.id)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Revision not found." };
  const snapshot = (data.snapshot ?? {}) as Record<string, unknown>;
  const nextSlug = typeof snapshot.slug === "string" ? await uniqueSlug(session.supabase, snapshot.slug, post.id) : post.slug;
  const { error: updateError } = await session.supabase
    .from("blog_posts")
    .update({
      title: typeof snapshot.title === "string" ? snapshot.title : post.title,
      slug: nextSlug,
      excerpt: typeof snapshot.excerpt === "string" ? snapshot.excerpt : post.excerpt,
      body: snapshot.body ?? post.body,
      seo_title: typeof snapshot.seo_title === "string" ? snapshot.seo_title : post.seo_title,
      seo_description: typeof snapshot.seo_description === "string" ? snapshot.seo_description : post.seo_description,
      canonical_path: canonicalPathForSlug(nextSlug),
      cover_asset_id: typeof snapshot.cover_asset_id === "string" ? snapshot.cover_asset_id : post.cover_asset_id,
      topic_id: typeof snapshot.topic_id === "string" ? snapshot.topic_id : post.topic_id,
      tool_slugs: Array.isArray(snapshot.tool_slugs) ? snapshot.tool_slugs : post.tool_slugs,
      noindex: typeof snapshot.noindex === "boolean" ? snapshot.noindex : post.noindex,
      updated_by: session.user.id,
    })
    .eq("id", post.id);
  if (updateError) return { ok: false, error: updateError.message };

  const restored = await fetchPost(session.supabase, post.id);
  if (!restored) return { ok: false, error: "Guide not found after restore." };
  const revisionId = await insertRevision(session.supabase, {
    postId: restored.id,
    snapshot: postSnapshot(restored),
    editorId: session.user.id,
    source: "restore",
    restoredFromId: input.revisionId,
  });
  await session.supabase.from("blog_posts").update({ current_revision_id: revisionId }).eq("id", restored.id);
  await writeAudit(session.supabase, {
    actorId: session.user.id,
    action: "post.restore",
    entityType: "blog_post",
    entityId: restored.id,
    metadata: { revisionId: input.revisionId },
  });
  const next = await fetchPost(session.supabase, post.id);
  return next ? { ok: true, post: next, message: "Revision restored." } : { ok: false, error: "Guide not found." };
}

export async function uploadCover(formData: FormData): Promise<CmsActionResult> {
  const postId = String(formData.get("postId") ?? "");
  const expectedUpdatedAt = String(formData.get("expectedUpdatedAt") ?? "");
  const altText = String(formData.get("altText") ?? "").trim();
  const file = formData.get("file");
  const session = await requireCms(`/admin/posts/${postId}`);
  if (!(file instanceof File) || file.size < 1) return { ok: false, error: "Choose an image file." };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Covers must be 10 MB or smaller." };
  if (!ALLOWED_COVER_TYPES.has(file.type)) return { ok: false, error: "Use JPG, PNG, WebP, GIF, AVIF, or SVG." };
  if (!altText) return { ok: false, error: "Add alt text before uploading." };

  const post = await fetchPost(session.supabase, postId);
  if (!post) return { ok: false, error: "Guide not found." };
  if (post.updated_at !== expectedUpdatedAt) {
    return { ok: false, error: "This guide was updated in another tab. Reload before uploading.", code: "conflict", post };
  }

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "") || "cover";
  const path = `covers/${post.id}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await session.supabase.storage.from("blog-public").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return { ok: false, error: uploadError.message };

  const publisher = canPublish(session.role);
  const { data: asset, error: assetError } = await session.supabase
    .from("media_assets")
    .insert({
      bucket: "blog-public",
      path,
      mime_type: file.type,
      byte_size: file.size,
      alt_text: altText,
      visibility: "public",
      owner_id: session.user.id,
      source: "upload",
      generation_status: "ready",
      variant: "hero",
      approved_at: publisher ? new Date().toISOString() : null,
      approved_by: publisher ? session.user.id : null,
    })
    .select("id")
    .single();
  if (assetError || !asset) return { ok: false, error: assetError?.message ?? "Cover record failed." };

  await setCoverRelation(session.supabase, post.id, String(asset.id));
  await session.supabase.from("blog_posts").update({ updated_by: session.user.id }).eq("id", post.id);
  await writeAudit(session.supabase, {
    actorId: session.user.id,
    action: "post.cover_upload",
    entityType: "blog_post",
    entityId: post.id,
    metadata: { mediaAssetId: asset.id },
  });
  const next = await fetchPost(session.supabase, post.id);
  return next ? { ok: true, post: next } : { ok: false, error: "Guide not found." };
}

export async function generateTemplateCover(input: {
  postId: string;
  expectedUpdatedAt: string;
  title: string;
}): Promise<CmsActionResult> {
  const session = await requireCms(`/admin/posts/${input.postId}`);
  const post = await fetchPost(session.supabase, input.postId);
  if (!post) return { ok: false, error: "Guide not found." };
  if (post.updated_at !== input.expectedUpdatedAt) {
    return { ok: false, error: "This guide was updated in another tab. Reload before generating a cover.", code: "conflict", post };
  }

  const svg = brandedCoverSvg(input.title || post.title, post.topic?.name ?? "GUIDE");
  const body = new Blob([svg], { type: "image/svg+xml" });
  try {
    const mediaId = await upsertPublicCover(session.supabase, {
      postId: post.id,
      path: `covers/${post.id}/template.svg`,
      body,
      contentType: "image/svg+xml",
      altText: `Branded cover for ${input.title || post.title}`,
      actorId: session.user.id,
      source: "template",
      approve: canPublish(session.role),
      templateKey: "brand-bar",
      seed: post.id,
      width: 1200,
      height: 630,
    });
    await session.supabase.from("blog_posts").update({ updated_by: session.user.id }).eq("id", post.id);
    await writeAudit(session.supabase, {
      actorId: session.user.id,
      action: "post.cover_template",
      entityType: "blog_post",
      entityId: post.id,
      metadata: { mediaAssetId: mediaId },
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Cover generation failed." };
  }
  const next = await fetchPost(session.supabase, post.id);
  return next ? { ok: true, post: next } : { ok: false, error: "Guide not found." };
}

export async function generateAiIllustrationCover(input: {
  postId: string;
  expectedUpdatedAt: string;
  title: string;
}): Promise<CmsActionResult> {
  const session = await requireCms(`/admin/posts/${input.postId}`);
  const post = await fetchPost(session.supabase, input.postId);
  if (!post) return { ok: false, error: "Guide not found." };
  if (post.updated_at !== input.expectedUpdatedAt) {
    return { ok: false, error: "This guide was updated in another tab. Reload before generating a cover.", code: "conflict", post };
  }
  const { assertGenerationAvailable } = await import("@/lib/ai/secrets");
  const { generateAiCoverForPost } = await import("@/lib/ai/pipeline");
  const available = await assertGenerationAvailable(session.supabase, session.role);
  if (!available.ok) return { ok: false, error: available.error };
  try {
    const next = await generateAiCoverForPost({
      client: session.supabase,
      role: session.role,
      actorId: session.user.id,
      postId: post.id,
      title: input.title || post.title,
      kicker: post.topic?.name ?? "GUIDE",
    });
    await session.supabase.from("blog_posts").update({ updated_by: session.user.id }).eq("id", post.id);
    return next ? { ok: true, post: next } : { ok: false, error: "Guide not found." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "AI illustration failed. The article draft was left unchanged." };
  }
}

export async function updateCoverMeta(input: {
  postId: string;
  expectedUpdatedAt: string;
  altText: string;
  focalX: number;
  focalY: number;
}): Promise<CmsActionResult> {
  const session = await requireCms(`/admin/posts/${input.postId}`);
  const post = await fetchPost(session.supabase, input.postId);
  if (!post?.cover) return { ok: false, error: "This guide has no cover." };
  if (post.updated_at !== input.expectedUpdatedAt) {
    return { ok: false, error: "This guide was updated in another tab.", code: "conflict", post };
  }
  const { error } = await session.supabase
    .from("media_assets")
    .update({
      alt_text: input.altText.trim() || null,
      focal_x: Math.min(1, Math.max(0, input.focalX)),
      focal_y: Math.min(1, Math.max(0, input.focalY)),
    })
    .eq("id", post.cover.id);
  if (error) return { ok: false, error: error.message };
  await session.supabase.from("blog_posts").update({ updated_by: session.user.id }).eq("id", post.id);
  const next = await fetchPost(session.supabase, post.id);
  return next ? { ok: true, post: next } : { ok: false, error: "Guide not found." };
}

export async function approveCover(input: { postId: string; expectedUpdatedAt: string }): Promise<CmsActionResult> {
  const session = await requirePublisher(`/admin/posts/${input.postId}`);
  const post = await fetchPost(session.supabase, input.postId);
  if (!post?.cover) return { ok: false, error: "This guide has no cover." };
  if (post.updated_at !== input.expectedUpdatedAt) {
    return { ok: false, error: "This guide was updated in another tab.", code: "conflict", post };
  }
  const { error } = await session.supabase
    .from("media_assets")
    .update({ approved_at: new Date().toISOString(), approved_by: session.user.id })
    .eq("id", post.cover.id);
  if (error) return { ok: false, error: error.message };
  await session.supabase.from("blog_posts").update({ updated_by: session.user.id }).eq("id", post.id);
  await writeAudit(session.supabase, {
    actorId: session.user.id,
    action: "post.cover_approve",
    entityType: "blog_post",
    entityId: post.id,
  });
  const next = await fetchPost(session.supabase, post.id);
  return next ? { ok: true, post: next } : { ok: false, error: "Guide not found." };
}

export async function removeCover(input: { postId: string; expectedUpdatedAt: string }): Promise<CmsActionResult> {
  const session = await requireCms(`/admin/posts/${input.postId}`);
  const post = await fetchPost(session.supabase, input.postId);
  if (!post) return { ok: false, error: "Guide not found." };
  if (post.updated_at !== input.expectedUpdatedAt) {
    return { ok: false, error: "This guide was updated in another tab.", code: "conflict", post };
  }
  await setCoverRelation(session.supabase, post.id, null);
  await session.supabase.from("blog_posts").update({ updated_by: session.user.id }).eq("id", post.id);
  const next = await fetchPost(session.supabase, post.id);
  return next ? { ok: true, post: next } : { ok: false, error: "Guide not found." };
}

export async function runDueSchedulesAction() {
  const session = await requirePublisher("/admin");
  return processDueSchedules(session.supabase, session.user.id);
}
