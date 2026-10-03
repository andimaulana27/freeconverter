"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canPublish } from "@/lib/auth/roles";
import { requireCms, requirePublisher } from "@/lib/auth/session";
import { fetchMediaAsset, fetchPost, setCoverRelation, writeAudit } from "@/lib/cms/server";
import type { CmsActionResult } from "@/lib/cms/types";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

export async function uploadLibraryAsset(formData: FormData) {
  const session = await requireCms("/admin/media");
  const altText = String(formData.get("altText") ?? "").trim();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1) {
    redirect(`/admin/media?error=${encodeURIComponent("Choose an image file.")}`);
  }
  if (file.size > 10 * 1024 * 1024) {
    redirect(`/admin/media?error=${encodeURIComponent("Files must be 10 MB or smaller.")}`);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    redirect(`/admin/media?error=${encodeURIComponent("Use JPG, PNG, WebP, GIF, AVIF, or SVG.")}`);
  }
  if (altText.length < 12) {
    redirect(`/admin/media?error=${encodeURIComponent("Add descriptive alt text of at least 12 characters.")}`);
  }

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "") || "image";
  const path = `library/${session.user.id}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await session.supabase.storage.from("blog-public").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    redirect(`/admin/media?error=${encodeURIComponent(uploadError.message)}`);
  }

  const publisher = canPublish(session.role);
  const { data, error } = await session.supabase
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
  if (error || !data) {
    redirect(`/admin/media?error=${encodeURIComponent(error?.message ?? "Media record failed.")}`);
  }

  await writeAudit(session.supabase, {
    actorId: session.user.id,
    action: "media.upload",
    entityType: "media_asset",
    entityId: String(data.id),
  });
  revalidatePath("/admin/media");
  redirect("/admin/media?uploaded=1");
}

export async function updateLibraryAsset(input: { id: string; altText: string; focalX: number; focalY: number }) {
  const session = await requireCms("/admin/media");
  const { error } = await session.supabase
    .from("media_assets")
    .update({
      alt_text: input.altText.trim() || null,
      focal_x: Math.min(1, Math.max(0, input.focalX)),
      focal_y: Math.min(1, Math.max(0, input.focalY)),
    })
    .eq("id", input.id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/media");
  revalidatePath(`/admin/media/${input.id}`);
  return { ok: true as const };
}

export async function approveLibraryAsset(id: string) {
  const session = await requirePublisher("/admin/media");
  const { error } = await session.supabase
    .from("media_assets")
    .update({ approved_at: new Date().toISOString(), approved_by: session.user.id })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  await writeAudit(session.supabase, {
    actorId: session.user.id,
    action: "media.approve",
    entityType: "media_asset",
    entityId: id,
  });
  revalidatePath("/admin/media");
  revalidatePath(`/admin/media/${id}`);
  return { ok: true as const };
}

export async function deleteLibraryAsset(id: string) {
  const session = await requireCms("/admin/media");
  const asset = await fetchMediaAsset(session.supabase, id);
  if (!asset) return { ok: false as const, error: "Asset not found." };
  if (asset.usage.length) return { ok: false as const, error: "Detach this file from guides before deleting it." };
  if (!canPublish(session.role) && asset.owner_id !== session.user.id) {
    return { ok: false as const, error: "You can only delete files you uploaded." };
  }
  await session.supabase.storage.from(asset.bucket).remove([asset.path]);
  const { error } = await session.supabase.from("media_assets").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  await writeAudit(session.supabase, {
    actorId: session.user.id,
    action: "media.delete",
    entityType: "media_asset",
    entityId: id,
  });
  revalidatePath("/admin/media");
  return { ok: true as const };
}

export async function attachExistingCover(input: {
  postId: string;
  mediaAssetId: string;
  expectedUpdatedAt: string;
}): Promise<CmsActionResult> {
  const session = await requireCms(`/admin/posts/${input.postId}`);
  const post = await fetchPost(session.supabase, input.postId);
  if (!post) return { ok: false, error: "Guide not found." };
  if (post.updated_at !== input.expectedUpdatedAt) {
    return { ok: false, error: "This guide was updated in another tab. Reload before attaching a cover.", code: "conflict", post };
  }
  const asset = await fetchMediaAsset(session.supabase, input.mediaAssetId);
  if (!asset || asset.bucket !== "blog-public" || asset.visibility !== "public") {
    return { ok: false, error: "Choose an approved public blog image." };
  }
  if (!asset.approved_at && !canPublish(session.role)) {
    return { ok: false, error: "This image still needs publisher approval." };
  }
  await setCoverRelation(session.supabase, post.id, asset.id);
  await session.supabase.from("blog_posts").update({ updated_by: session.user.id }).eq("id", post.id);
  await writeAudit(session.supabase, {
    actorId: session.user.id,
    action: "post.cover_library",
    entityType: "blog_post",
    entityId: post.id,
    metadata: { mediaAssetId: asset.id },
  });
  const next = await fetchPost(session.supabase, post.id);
  return next ? { ok: true, post: next } : { ok: false, error: "Guide not found." };
}
