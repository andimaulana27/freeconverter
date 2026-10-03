import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { ADS_CACHE_TAG } from "@/lib/ads/empty";
import { isHttpUrl, normalizeAdSenseClient, normalizeAdSenseSlot, parseAdSenseSnippet } from "@/lib/ads/parse";
import {
  AD_CREATIVE_STATUSES,
  AD_CREATIVE_TYPES,
  AD_FALLBACKS,
  AD_MOBILE_POLICIES,
  isPlacementKey,
  placementMatchesCreative,
  type AdAssignment,
  type AdCreative,
  type AdCreativeStatus,
  type AdCreativeType,
  type AdFallbackBehavior,
  type AdMedia,
  type AdMobilePolicy,
  type AdPlacement,
  type AdsActionResult,
  type CreativePayload,
  type PlacementKey,
} from "@/lib/ads/types";
import { writeAudit, type StaffClient } from "@/lib/cms/server";
import { getSupabaseUrl } from "@/lib/supabase/env";

const CREATIVE_SELECT = `
  id, type, name, width, height, google_client_id, google_slot_id, media_asset_id, target_url, alt_text,
  starts_at, ends_at, status, created_by, created_at, updated_at,
  media:media_assets!ad_creatives_media_asset_id_fkey ( id, bucket, path, alt_text, visibility, width, height )
`;

const PLACEMENT_SELECT =
  "id, key, page_scope, desktop_width, desktop_height, mobile_width, mobile_height, mobile_policy, reserve_space, fallback_behavior, created_at, updated_at";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function publicMediaUrl(bucket: string, path: string) {
  return `${getSupabaseUrl()}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function asMedia(row: Record<string, unknown> | null): AdMedia | null {
  if (!row?.id || !row.path || !row.bucket) return null;
  return {
    id: String(row.id),
    bucket: String(row.bucket),
    path: String(row.path),
    alt_text: typeof row.alt_text === "string" ? row.alt_text : null,
    visibility: row.visibility === "public" ? "public" : "private",
    width: typeof row.width === "number" ? row.width : null,
    height: typeof row.height === "number" ? row.height : null,
    url: publicMediaUrl(String(row.bucket), String(row.path)),
  };
}

function asCreative(row: Record<string, unknown>): AdCreative {
  return {
    id: String(row.id),
    type: row.type as AdCreativeType,
    name: String(row.name),
    width: Number(row.width),
    height: Number(row.height),
    google_client_id: typeof row.google_client_id === "string" ? row.google_client_id : null,
    google_slot_id: typeof row.google_slot_id === "string" ? row.google_slot_id : null,
    media_asset_id: typeof row.media_asset_id === "string" ? row.media_asset_id : null,
    target_url: typeof row.target_url === "string" ? row.target_url : null,
    alt_text: typeof row.alt_text === "string" ? row.alt_text : null,
    starts_at: typeof row.starts_at === "string" ? row.starts_at : null,
    ends_at: typeof row.ends_at === "string" ? row.ends_at : null,
    status: row.status as AdCreativeStatus,
    created_by: typeof row.created_by === "string" ? row.created_by : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    media: asMedia(one(row.media as Record<string, unknown> | Record<string, unknown>[] | null)),
  };
}

function asPlacement(row: Record<string, unknown>): AdPlacement {
  const key = String(row.key);
  return {
    id: String(row.id),
    key: isPlacementKey(key) ? key : (key as PlacementKey),
    page_scope: String(row.page_scope),
    desktop_width: Number(row.desktop_width),
    desktop_height: Number(row.desktop_height),
    mobile_width: typeof row.mobile_width === "number" ? row.mobile_width : null,
    mobile_height: typeof row.mobile_height === "number" ? row.mobile_height : null,
    mobile_policy: row.mobile_policy as AdMobilePolicy,
    reserve_space: row.reserve_space !== false,
    fallback_behavior: row.fallback_behavior === "collapse" ? "collapse" : "placeholder",
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function asAssignment(row: Record<string, unknown>): AdAssignment {
  const creative = one(row.creative as Record<string, unknown> | Record<string, unknown>[] | null);
  const placement = one(row.placement as Record<string, unknown> | Record<string, unknown>[] | null);
  return {
    id: String(row.id),
    creative_id: String(row.creative_id),
    placement_id: String(row.placement_id),
    priority: Number(row.priority ?? 0),
    starts_at: typeof row.starts_at === "string" ? row.starts_at : null,
    ends_at: typeof row.ends_at === "string" ? row.ends_at : null,
    is_active: row.is_active !== false,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    creative: creative ? asCreative(creative) : null,
    placement: placement ? asPlacement(placement) : null,
  };
}

export function revalidateAds() {
  revalidateTag(ADS_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/blog");
}

export async function listPlacements(client: StaffClient) {
  const { data, error } = await client.from("ad_placements").select(PLACEMENT_SELECT).order("key");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(asPlacement);
}

export async function listCreatives(client: StaffClient) {
  const { data, error } = await client.from("ad_creatives").select(CREATIVE_SELECT).order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(asCreative);
}

export async function fetchCreative(client: StaffClient, id: string) {
  const { data, error } = await client.from("ad_creatives").select(CREATIVE_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? asCreative(data as Record<string, unknown>) : null;
}

export async function listAssignments(client: StaffClient) {
  const { data, error } = await client
    .from("ad_assignments")
    .select(
      `
      id, creative_id, placement_id, priority, starts_at, ends_at, is_active, created_at, updated_at,
      creative:ad_creatives!ad_assignments_creative_id_fkey ( ${CREATIVE_SELECT} ),
      placement:ad_placements!ad_assignments_placement_id_fkey ( ${PLACEMENT_SELECT} )
    `,
    )
    .order("priority", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(asAssignment);
}

export async function fetchAdsenseClientId(client: StaffClient) {
  const { data, error } = await client.from("site_settings").select("value").eq("key", "adsense_client_id").maybeSingle();
  if (error) throw new Error(error.message);
  return normalizeAdSenseClient(typeof data?.value === "string" ? data.value : "");
}

export function activationError(creative: AdCreative, globalClient: string | null) {
  if (creative.type === "adsense") {
    if (!normalizeAdSenseSlot(creative.google_slot_id)) return "Paste an AdSense unit and save a slot ID before activation.";
    if (!normalizeAdSenseClient(creative.google_client_id) && !globalClient && !normalizeAdSenseClient(process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT)) {
      return "Set a verified AdSense client ID before activation.";
    }
    if (globalClient && creative.google_client_id && creative.google_client_id !== globalClient) {
      return `AdSense client must match the verified ID ${globalClient}.`;
    }
  }
  if (creative.type === "image") {
    if (!creative.media_asset_id || !creative.media) return "Upload an image before activation.";
    if (!creative.target_url || !isHttpUrl(creative.target_url)) return "Image creatives need an http(s) destination URL.";
    if (!creative.alt_text?.trim()) return "Image creatives need alt text.";
  }
  if (creative.width < 1 || creative.height < 1) return "Width and height must be positive.";
  return null;
}

export async function createCreative(
  client: StaffClient,
  input: { type: AdCreativeType; name: string; width: number; height: number; actorId: string },
): Promise<AdsActionResult> {
  if (!AD_CREATIVE_TYPES.includes(input.type)) return { ok: false, error: "Unknown creative type.", code: "validation" };
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Name the creative.", code: "validation" };
  if (!Number.isInteger(input.width) || !Number.isInteger(input.height) || input.width < 1 || input.height < 1) {
    return { ok: false, error: "Choose a fixed width and height.", code: "validation" };
  }
  const { data, error } = await client
    .from("ad_creatives")
    .insert({
      type: input.type,
      name,
      width: input.width,
      height: input.height,
      status: "draft" satisfies AdCreativeStatus,
      created_by: input.actorId,
    })
    .select(CREATIVE_SELECT)
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not create the creative." };
  const creative = asCreative(data as Record<string, unknown>);
  await writeAudit(client, {
    actorId: input.actorId,
    action: "ad.creative_create",
    entityType: "ad_creative",
    entityId: creative.id,
    metadata: { type: creative.type, name: creative.name },
  });
  return { ok: true, creative };
}

export async function saveCreative(
  client: StaffClient,
  input: { id: string; payload: CreativePayload; actorId: string; globalClient: string | null },
): Promise<AdsActionResult> {
  const current = await fetchCreative(client, input.id);
  if (!current) return { ok: false, error: "Creative not found." };
  const name = input.payload.name.trim();
  if (name.length < 2) return { ok: false, error: "Name the creative.", code: "validation" };
  if (input.payload.width < 1 || input.payload.height < 1) return { ok: false, error: "Choose a fixed width and height.", code: "validation" };

  let googleClientId = normalizeAdSenseClient(input.payload.googleClientId ?? current.google_client_id);
  let googleSlotId = normalizeAdSenseSlot(input.payload.googleSlotId ?? current.google_slot_id);
  let width = input.payload.width;
  let height = input.payload.height;
  if (current.type === "adsense" && input.payload.snippet?.trim()) {
    const parsed = parseAdSenseSnippet(input.payload.snippet);
    googleClientId = parsed.clientId ?? googleClientId;
    googleSlotId = parsed.slotId ?? googleSlotId;
    width = parsed.width ?? width;
    height = parsed.height ?? height;
  }
  if (input.globalClient && googleClientId && googleClientId !== input.globalClient) {
    return { ok: false, error: `AdSense client must match ${input.globalClient}.`, code: "validation" };
  }
  if (!googleClientId && input.globalClient) googleClientId = input.globalClient;

  const targetUrl = input.payload.targetUrl?.trim() || null;
  if (targetUrl && !isHttpUrl(targetUrl)) return { ok: false, error: "Destination URL must start with http:// or https://.", code: "validation" };

  const nextStatus = input.payload.status && AD_CREATIVE_STATUSES.includes(input.payload.status) ? input.payload.status : current.status;
  const next: AdCreative = {
    ...current,
    name,
    width,
    height,
    google_client_id: current.type === "adsense" ? googleClientId : null,
    google_slot_id: current.type === "adsense" ? googleSlotId : null,
    target_url: current.type === "image" ? targetUrl : null,
    alt_text: current.type === "image" ? input.payload.altText?.trim() || null : current.alt_text,
    starts_at: input.payload.startsAt ?? null,
    ends_at: input.payload.endsAt ?? null,
    status: nextStatus,
  };
  if (nextStatus === "active") {
    const issue = activationError(next, input.globalClient);
    if (issue) return { ok: false, error: issue, code: "validation" };
  }

  const { error } = await client
    .from("ad_creatives")
    .update({
      name: next.name,
      width: next.width,
      height: next.height,
      google_client_id: next.google_client_id,
      google_slot_id: next.google_slot_id,
      target_url: next.target_url,
      alt_text: next.alt_text,
      starts_at: next.starts_at,
      ends_at: next.ends_at,
      status: next.status,
    })
    .eq("id", current.id);
  if (error) return { ok: false, error: error.message };
  const creative = await fetchCreative(client, current.id);
  if (!creative) return { ok: false, error: "Creative not found after save." };
  await writeAudit(client, {
    actorId: input.actorId,
    action: next.status !== current.status ? "ad.creative_status" : "ad.creative_update",
    entityType: "ad_creative",
    entityId: creative.id,
    metadata: { status: creative.status },
  });
  revalidateAds();
  return { ok: true, creative };
}

export async function saveAdsenseClient(
  client: StaffClient,
  input: { clientId: string; actorId: string },
): Promise<AdsActionResult> {
  const clientId = input.clientId.trim() ? normalizeAdSenseClient(input.clientId) : "";
  if (input.clientId.trim() && !clientId) return { ok: false, error: "Use a ca-pub- client ID.", code: "validation" };
  const { error } = await client.from("site_settings").upsert(
    {
      key: "adsense_client_id",
      value: clientId || "",
      is_public: true,
      updated_by: input.actorId,
    },
    { onConflict: "key" },
  );
  if (error) return { ok: false, error: error.message };
  await writeAudit(client, {
    actorId: input.actorId,
    action: "ad.adsense_client",
    entityType: "site_setting",
    entityId: "adsense_client_id",
    metadata: { clientId: clientId || null },
  });
  revalidateAds();
  return { ok: true, message: clientId ? "AdSense client saved." : "AdSense client cleared." };
}

export async function updatePlacementPolicy(
  client: StaffClient,
  input: {
    id: string;
    mobilePolicy: AdMobilePolicy;
    reserveSpace: boolean;
    fallbackBehavior: AdFallbackBehavior;
    actorId: string;
  },
): Promise<AdsActionResult> {
  if (!AD_MOBILE_POLICIES.includes(input.mobilePolicy)) return { ok: false, error: "Unknown mobile policy.", code: "validation" };
  if (!AD_FALLBACKS.includes(input.fallbackBehavior)) return { ok: false, error: "Unknown fallback.", code: "validation" };
  const { data, error } = await client
    .from("ad_placements")
    .update({
      mobile_policy: input.mobilePolicy,
      reserve_space: input.reserveSpace,
      fallback_behavior: input.fallbackBehavior,
    })
    .eq("id", input.id)
    .select("key")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  await writeAudit(client, {
    actorId: input.actorId,
    action: "ad.placement_update",
    entityType: "ad_placement",
    entityId: input.id,
    metadata: { key: data?.key, mobilePolicy: input.mobilePolicy, fallbackBehavior: input.fallbackBehavior },
  });
  revalidateAds();
  return { ok: true, message: "Placement updated." };
}

export async function upsertAssignment(
  client: StaffClient,
  input: {
    creativeId: string;
    placementId: string;
    priority: number;
    startsAt: string | null;
    endsAt: string | null;
    isActive: boolean;
    actorId: string;
  },
): Promise<AdsActionResult> {
  const [creative, placements] = await Promise.all([fetchCreative(client, input.creativeId), listPlacements(client)]);
  if (!creative) return { ok: false, error: "Creative not found." };
  const placement = placements.find((item) => item.id === input.placementId);
  if (!placement) return { ok: false, error: "Placement not found." };
  if (!placementMatchesCreative(placement, creative)) {
    return {
      ok: false,
      error: `This creative is ${creative.width}×${creative.height}. ${placement.key} allows ${placement.desktop_width}×${placement.desktop_height}${placement.mobile_width ? ` or ${placement.mobile_width}×${placement.mobile_height}` : ""}.`,
      code: "validation",
    };
  }
  const { error } = await client.from("ad_assignments").upsert(
    {
      creative_id: input.creativeId,
      placement_id: input.placementId,
      priority: Number.isFinite(input.priority) ? Math.trunc(input.priority) : 0,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      is_active: input.isActive,
    },
    { onConflict: "creative_id,placement_id" },
  );
  if (error) return { ok: false, error: error.message };
  await writeAudit(client, {
    actorId: input.actorId,
    action: "ad.assignment_upsert",
    entityType: "ad_assignment",
    entityId: input.creativeId,
    metadata: { placementKey: placement.key, priority: input.priority, isActive: input.isActive },
  });
  revalidateAds();
  return { ok: true, creative, message: "Assignment saved." };
}

export async function deleteAssignment(client: StaffClient, input: { id: string; actorId: string }): Promise<AdsActionResult> {
  const { error } = await client.from("ad_assignments").delete().eq("id", input.id);
  if (error) return { ok: false, error: error.message };
  await writeAudit(client, {
    actorId: input.actorId,
    action: "ad.assignment_delete",
    entityType: "ad_assignment",
    entityId: input.id,
  });
  revalidateAds();
  return { ok: true, message: "Assignment removed." };
}

const ALLOWED_AD_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function uploadCreativeImage(
  client: StaffClient,
  input: { creativeId: string; file: File; altText: string; actorId: string },
): Promise<AdsActionResult> {
  const creative = await fetchCreative(client, input.creativeId);
  if (!creative) return { ok: false, error: "Creative not found." };
  if (creative.type !== "image") return { ok: false, error: "Only image creatives can receive uploads.", code: "validation" };
  if (!ALLOWED_AD_TYPES.has(input.file.type)) return { ok: false, error: "Use JPG, PNG, WebP, or GIF.", code: "validation" };
  if (input.file.size > 5 * 1024 * 1024) return { ok: false, error: "Ad images must be 5 MB or smaller.", code: "validation" };
  const altText = input.altText.trim() || creative.alt_text?.trim() || "";
  if (!altText) return { ok: false, error: "Add alt text before uploading.", code: "validation" };

  const safeName = input.file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "") || "creative";
  const path = `${creative.id}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await client.storage.from("ad-creatives").upload(path, input.file, {
    contentType: input.file.type,
    upsert: false,
  });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: asset, error: assetError } = await client
    .from("media_assets")
    .insert({
      bucket: "ad-creatives",
      path,
      mime_type: input.file.type,
      byte_size: input.file.size,
      width: creative.width,
      height: creative.height,
      alt_text: altText,
      visibility: "public",
      owner_id: input.actorId,
      source: "upload",
      generation_status: "ready",
      variant: `${creative.width}x${creative.height}`,
    })
    .select("id")
    .single();
  if (assetError || !asset) return { ok: false, error: assetError?.message ?? "Media record failed." };

  const { error } = await client
    .from("ad_creatives")
    .update({ media_asset_id: asset.id, alt_text: altText })
    .eq("id", creative.id);
  if (error) return { ok: false, error: error.message };

  await writeAudit(client, {
    actorId: input.actorId,
    action: "ad.creative_upload",
    entityType: "ad_creative",
    entityId: creative.id,
    metadata: { mediaAssetId: asset.id },
  });
  revalidateAds();
  const next = await fetchCreative(client, creative.id);
  return next ? { ok: true, creative: next } : { ok: false, error: "Creative not found after upload." };
}
