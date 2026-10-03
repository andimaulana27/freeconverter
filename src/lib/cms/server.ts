import "server-only";

import { revalidatePath } from "next/cache";
import { parseBlogBody, readingMinutesFromBody } from "@/lib/blog/content";
import { postSnapshot, publishInputFromPost, storedBody, validateForPublish } from "@/lib/cms/quality";
import { canonicalPathForSlug, isValidSlug, slugify } from "@/lib/cms/slug";
import type {
  CmsActionResult,
  CmsMediaAsset,
  CmsPost,
  CmsPostSummary,
  CmsRevision,
  CmsSchedule,
  CmsTopic,
  EditorPayload,
  MediaSource,
  PostStatus,
} from "@/lib/cms/types";
import { getSupabaseUrl } from "@/lib/supabase/env";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StaffClient = SupabaseClient;

const COVER_SELECT = `
  id, bucket, path, mime_type, byte_size, width, height, alt_text, visibility, owner_id,
  source, generation_status, provider, model_id, prompt_hash, seed, focal_x, focal_y,
  variant, template_key, approved_at, approved_by, created_at, updated_at
`;

const POST_SELECT = `
  id, slug, title, excerpt, body, status, seo_title, seo_description, canonical_path,
  cover_asset_id, author_id, topic_id, tool_slugs, current_revision_id, published_at,
  unpublished_at, scheduled_for, noindex, reading_minutes, created_by, updated_by,
  created_at, updated_at,
  topic:blog_topics!blog_posts_topic_id_fkey ( id, slug, name, description, seo_title, seo_description, is_public ),
  cover:media_assets!blog_posts_cover_asset_id_fkey ( ${COVER_SELECT} ),
  author:admin_profiles!blog_posts_author_id_fkey ( user_id, display_name )
`;

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function publicMediaUrl(bucket: string, path: string) {
  return `${getSupabaseUrl()}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function asMedia(row: Record<string, unknown> | null): CmsMediaAsset | null {
  if (!row?.id || !row.path || !row.bucket) return null;
  const bucket = row.bucket as CmsMediaAsset["bucket"];
  return {
    id: String(row.id),
    bucket,
    path: String(row.path),
    mime_type: typeof row.mime_type === "string" ? row.mime_type : null,
    byte_size: typeof row.byte_size === "number" ? row.byte_size : null,
    width: typeof row.width === "number" ? row.width : null,
    height: typeof row.height === "number" ? row.height : null,
    alt_text: typeof row.alt_text === "string" ? row.alt_text : null,
    visibility: row.visibility === "public" ? "public" : "private",
    owner_id: typeof row.owner_id === "string" ? row.owner_id : null,
    source: (row.source as MediaSource) || "upload",
    generation_status: (row.generation_status as CmsMediaAsset["generation_status"]) || "idle",
    provider: typeof row.provider === "string" ? row.provider : null,
    model_id: typeof row.model_id === "string" ? row.model_id : null,
    prompt_hash: typeof row.prompt_hash === "string" ? row.prompt_hash : null,
    seed: typeof row.seed === "string" ? row.seed : null,
    focal_x: typeof row.focal_x === "number" ? row.focal_x : 0.5,
    focal_y: typeof row.focal_y === "number" ? row.focal_y : 0.5,
    variant: typeof row.variant === "string" ? row.variant : null,
    template_key: typeof row.template_key === "string" ? row.template_key : null,
    approved_at: typeof row.approved_at === "string" ? row.approved_at : null,
    approved_by: typeof row.approved_by === "string" ? row.approved_by : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    url: publicMediaUrl(bucket, String(row.path)),
  };
}

function asPost(row: Record<string, unknown>): CmsPost {
  const topic = one(row.topic as CmsTopic | CmsTopic[] | null);
  const author = one(row.author as CmsPost["author"] | CmsPost["author"][] | null);
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: typeof row.excerpt === "string" ? row.excerpt : null,
    body: storedBody(row.body),
    status: row.status as PostStatus,
    seo_title: typeof row.seo_title === "string" ? row.seo_title : null,
    seo_description: typeof row.seo_description === "string" ? row.seo_description : null,
    canonical_path: typeof row.canonical_path === "string" ? row.canonical_path : null,
    cover_asset_id: typeof row.cover_asset_id === "string" ? row.cover_asset_id : null,
    author_id: typeof row.author_id === "string" ? row.author_id : null,
    topic_id: typeof row.topic_id === "string" ? row.topic_id : null,
    tool_slugs: Array.isArray(row.tool_slugs) ? row.tool_slugs.filter((item): item is string => typeof item === "string") : [],
    current_revision_id: typeof row.current_revision_id === "string" ? row.current_revision_id : null,
    published_at: typeof row.published_at === "string" ? row.published_at : null,
    unpublished_at: typeof row.unpublished_at === "string" ? row.unpublished_at : null,
    scheduled_for: typeof row.scheduled_for === "string" ? row.scheduled_for : null,
    noindex: row.noindex === true,
    reading_minutes: typeof row.reading_minutes === "number" ? row.reading_minutes : null,
    created_by: typeof row.created_by === "string" ? row.created_by : null,
    updated_by: typeof row.updated_by === "string" ? row.updated_by : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    topic,
    cover: asMedia(one(row.cover as Record<string, unknown> | Record<string, unknown>[] | null)),
    author,
  };
}

export function revalidatePublicBlog(slug: string, extraSlugs: string[] = []) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  extraSlugs.forEach((item) => revalidatePath(`/blog/${item}`));
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");
}

export async function writeAudit(
  client: StaffClient,
  input: { actorId: string | null; action: string; entityType: string; entityId?: string | null; metadata?: Record<string, unknown> },
) {
  await client.from("audit_logs").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function insertRevision(
  client: StaffClient,
  input: {
    postId: string;
    snapshot: Record<string, unknown>;
    editorId: string | null;
    source: CmsRevision["change_source"];
    restoredFromId?: string | null;
  },
) {
  const { data, error } = await client
    .from("blog_post_revisions")
    .insert({
      post_id: input.postId,
      snapshot: input.snapshot,
      change_source: input.source,
      editor_id: input.editorId,
      restored_from_id: input.restoredFromId ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return String(data.id);
}

export async function fetchPost(client: StaffClient, id: string) {
  const { data, error } = await client.from("blog_posts").select(POST_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? asPost(data as Record<string, unknown>) : null;
}

export async function listTopics(client: StaffClient) {
  const { data, error } = await client.from("blog_topics").select("id, slug, name, description, seo_title, seo_description, is_public").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as CmsTopic[];
}

export async function listPosts(
  client: StaffClient,
  filters: { status?: PostStatus | "all"; topic?: string; q?: string } = {},
) {
  let query = client
    .from("blog_posts")
    .select("id, slug, title, status, updated_at, published_at, scheduled_for, noindex, topic:blog_topics!blog_posts_topic_id_fkey ( slug, name )")
    .order("updated_at", { ascending: false });
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.topic) query = query.eq("topic_id", filters.topic);
  if (filters.q) {
    const q = filters.q.replace(/[%_,.()]/g, "").slice(0, 80);
    if (q) query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const topic = one(row.topic as { slug: string; name: string } | { slug: string; name: string }[] | null);
    return {
      id: String(row.id),
      slug: String(row.slug),
      title: String(row.title),
      status: row.status as PostStatus,
      updated_at: String(row.updated_at),
      published_at: typeof row.published_at === "string" ? row.published_at : null,
      scheduled_for: typeof row.scheduled_for === "string" ? row.scheduled_for : null,
      noindex: row.noindex === true,
      topic,
    } satisfies CmsPostSummary;
  });
}

export async function listRevisions(client: StaffClient, postId: string) {
  const { data, error } = await client
    .from("blog_post_revisions")
    .select("id, post_id, snapshot, change_source, editor_id, restored_from_id, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw new Error(error.message);
  return (data ?? []) as CmsRevision[];
}

export async function fetchPendingSchedule(client: StaffClient, postId: string) {
  const { data, error } = await client
    .from("publishing_schedules")
    .select("*")
    .eq("post_id", postId)
    .eq("status", "pending")
    .order("run_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as CmsSchedule | null) ?? null;
}

export async function uniqueSlug(client: StaffClient, desired: string, ignoreId?: string) {
  const base = isValidSlug(desired) ? desired : slugify(desired);
  for (let index = 1; index < 40; index += 1) {
    const candidate = index === 1 ? base : `${base.slice(0, 70)}-${index}`;
    let query = client.from("blog_posts").select("id").eq("slug", candidate);
    if (ignoreId) query = query.neq("id", ignoreId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return candidate;
  }
  return `${base.slice(0, 60)}-${Date.now().toString(36)}`;
}

export async function recordSlugChange(client: StaffClient, input: { postId: string; fromSlug: string; toSlug: string; actorId: string | null }) {
  if (input.fromSlug === input.toSlug) return;
  await client.from("blog_slug_redirects").delete().eq("from_slug", input.toSlug);
  await client.from("blog_slug_redirects").update({ to_slug: input.toSlug }).eq("to_slug", input.fromSlug);
  const { error } = await client.from("blog_slug_redirects").upsert(
    {
      from_slug: input.fromSlug,
      to_slug: input.toSlug,
      post_id: input.postId,
      created_by: input.actorId,
    },
    { onConflict: "from_slug" },
  );
  if (error) throw new Error(error.message);
}

async function ensureCurrent(client: StaffClient, postId: string, expectedUpdatedAt: string): Promise<CmsActionResult & { current?: CmsPost }> {
  const current = await fetchPost(client, postId);
  if (!current) return { ok: false, error: "Guide not found." };
  if (current.updated_at !== expectedUpdatedAt) {
    return {
      ok: false,
      error: "This guide was updated in another tab. Reload before saving.",
      code: "conflict",
      post: current,
    };
  }
  return { ok: true, post: current };
}

function payloadUpdate(payload: EditorPayload, actorId: string) {
  const body = storedBody(payload.body);
  return {
    title: payload.title.trim(),
    slug: payload.slug.trim(),
    excerpt: payload.excerpt.trim() || null,
    seo_title: payload.seoTitle.trim() || null,
    seo_description: payload.seoDescription.trim() || null,
    topic_id: payload.topicId,
    tool_slugs: payload.toolSlugs,
    noindex: payload.noindex,
    body,
    canonical_path: canonicalPathForSlug(payload.slug.trim()),
    reading_minutes: readingMinutesFromBody(parseBlogBody(body), null),
    updated_by: actorId,
  };
}

export async function savePostContent(
  client: StaffClient,
  input: {
    postId: string;
    expectedUpdatedAt: string;
    payload: EditorPayload;
    actorId: string;
    createRevision?: boolean;
    source?: CmsRevision["change_source"];
  },
): Promise<CmsActionResult> {
  const gate = await ensureCurrent(client, input.postId, input.expectedUpdatedAt);
  if (!gate.ok) return gate;
  const current = gate.post;
  if (!isValidSlug(input.payload.slug) && !slugify(input.payload.slug)) {
    return { ok: false, error: "Enter a valid slug.", code: "validation" };
  }
  const nextSlug = await uniqueSlug(client, input.payload.slug || slugify(input.payload.title), current.id);
  const update = payloadUpdate({ ...input.payload, slug: nextSlug }, input.actorId);
  if (nextSlug !== current.slug && current.published_at) {
    await recordSlugChange(client, {
      postId: current.id,
      fromSlug: current.slug,
      toSlug: nextSlug,
      actorId: input.actorId,
    });
  }
  const { error } = await client.from("blog_posts").update(update).eq("id", current.id);
  if (error) return { ok: false, error: error.message };
  let post = await fetchPost(client, current.id);
  if (!post) return { ok: false, error: "Guide not found after save." };
  if (input.createRevision) {
    const revisionId = await insertRevision(client, {
      postId: post.id,
      snapshot: postSnapshot(post),
      editorId: input.actorId,
      source: input.source ?? "editor",
    });
    await client.from("blog_posts").update({ current_revision_id: revisionId }).eq("id", post.id);
    post = await fetchPost(client, current.id);
  }
  if (!post) return { ok: false, error: "Guide not found after save." };
  if (post.status === "published") revalidatePublicBlog(post.slug, current.slug === post.slug ? [] : [current.slug]);
  await writeAudit(client, {
    actorId: input.actorId,
    action: input.createRevision ? "post.revision" : "post.save",
    entityType: "blog_post",
    entityId: post.id,
    metadata: { slug: post.slug, createRevision: Boolean(input.createRevision) },
  });
  return { ok: true, post };
}

export async function applyPublish(client: StaffClient, post: CmsPost, actorId: string | null, options: { forceIndex?: boolean } = {}) {
  const issues = validateForPublish(publishInputFromPost(post));
  if (issues.length) throw new Error(issues.map((issue) => issue.message).join(" "));
  const publishedAt = post.published_at ?? new Date().toISOString();
  const { error } = await client
    .from("blog_posts")
    .update({
      status: "published",
      published_at: publishedAt,
      unpublished_at: null,
      scheduled_for: null,
      noindex: options.forceIndex ? false : post.noindex,
      updated_by: actorId,
    })
    .eq("id", post.id);
  if (error) throw new Error(error.message);
  const next = await fetchPost(client, post.id);
  if (!next) throw new Error("Guide not found after publish.");
  const revisionId = await insertRevision(client, {
    postId: next.id,
    snapshot: postSnapshot(next),
    editorId: actorId,
    source: actorId ? "editor" : "system",
  });
  await client.from("blog_posts").update({ current_revision_id: revisionId }).eq("id", next.id);
  revalidatePublicBlog(next.slug);
  return fetchPost(client, next.id);
}

export async function applyArchive(client: StaffClient, post: CmsPost, actorId: string | null) {
  const { error } = await client
    .from("blog_posts")
    .update({
      status: "archived",
      unpublished_at: new Date().toISOString(),
      scheduled_for: null,
      noindex: true,
      updated_by: actorId,
    })
    .eq("id", post.id);
  if (error) throw new Error(error.message);
  const next = await fetchPost(client, post.id);
  if (!next) throw new Error("Guide not found after archive.");
  const revisionId = await insertRevision(client, {
    postId: next.id,
    snapshot: postSnapshot(next),
    editorId: actorId,
    source: actorId ? "editor" : "system",
  });
  await client.from("blog_posts").update({ current_revision_id: revisionId }).eq("id", next.id);
  revalidatePublicBlog(next.slug);
  return fetchPost(client, next.id);
}

export async function setCoverRelation(client: StaffClient, postId: string, mediaAssetId: string | null) {
  await client.from("blog_post_media").delete().eq("post_id", postId).eq("role", "cover");
  if (mediaAssetId) {
    const { error } = await client.from("blog_post_media").insert({
      post_id: postId,
      media_asset_id: mediaAssetId,
      role: "cover",
      sort_order: 0,
    });
    if (error) throw new Error(error.message);
  }
  const { error } = await client.from("blog_posts").update({ cover_asset_id: mediaAssetId }).eq("id", postId);
  if (error) throw new Error(error.message);
}

export async function upsertPublicCover(
  client: StaffClient,
  input: {
    postId: string;
    path: string;
    body: Blob;
    contentType: string;
    altText: string;
    actorId: string;
    source: MediaSource;
    approve: boolean;
    templateKey?: string | null;
    seed?: string | null;
    provider?: string | null;
    modelId?: string | null;
    promptHash?: string | null;
    width?: number | null;
    height?: number | null;
    variant?: string | null;
  },
) {
  const { error: uploadError } = await client.storage.from("blog-public").upload(input.path, input.body, {
    contentType: input.contentType,
    upsert: true,
  });
  if (uploadError) throw new Error(uploadError.message);

  const approvedAt = input.approve ? new Date().toISOString() : null;
  const existing = await client.from("media_assets").select("id").eq("bucket", "blog-public").eq("path", input.path).maybeSingle();
  const fields = {
    mime_type: input.contentType,
    byte_size: input.body.size,
    alt_text: input.altText,
    visibility: "public" as const,
    source: input.source,
    generation_status: "ready" as const,
    template_key: input.templateKey ?? null,
    variant: input.variant ?? "hero",
    seed: input.seed ?? null,
    provider: input.provider ?? null,
    model_id: input.modelId ?? null,
    prompt_hash: input.promptHash ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    approved_at: approvedAt,
    approved_by: input.approve ? input.actorId : null,
  };

  let mediaId = existing.data?.id ? String(existing.data.id) : null;
  if (mediaId) {
    const { error } = await client.from("media_assets").update(fields).eq("id", mediaId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await client
      .from("media_assets")
      .insert({
        bucket: "blog-public",
        path: input.path,
        owner_id: input.actorId,
        ...fields,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Cover record failed.");
    mediaId = String(data.id);
  }

  await setCoverRelation(client, input.postId, mediaId);
  return mediaId;
}
