"use server";

import { redirect } from "next/navigation";
import { canManageSecrets } from "@/lib/auth/roles";
import { requireAds } from "@/lib/auth/session";
import {
  createCreative,
  deleteAssignment,
  fetchAdsenseClientId,
  saveAdsenseClient,
  saveCreative,
  updatePlacementPolicy,
  uploadCreativeImage,
  upsertAssignment,
} from "@/lib/ads/server";
import type { AdCreativeStatus, AdCreativeType, AdFallbackBehavior, AdMobilePolicy, AdsActionResult, CreativePayload } from "@/lib/ads/types";

function datetime(value: FormDataEntryValue | string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createCreativeAction(formData: FormData) {
  const session = await requireAds("/admin/ads/new");
  const type = String(formData.get("type") ?? "empty") as AdCreativeType;
  const name = String(formData.get("name") ?? "").trim() || "Untitled creative";
  const width = Number(formData.get("width") ?? 728);
  const height = Number(formData.get("height") ?? 90);
  const result = await createCreative(session.supabase, {
    type,
    name,
    width,
    height,
    actorId: session.user.id,
  });
  if (!result.ok || !result.creative) redirect("/admin/ads/new?error=create");
  redirect(`/admin/ads/${result.creative.id}`);
}

export async function saveCreativeAction(input: {
  id: string;
  payload: CreativePayload;
}): Promise<AdsActionResult> {
  const session = await requireAds(`/admin/ads/${input.id}`);
  const globalClient = await fetchAdsenseClientId(session.supabase);
  return saveCreative(session.supabase, {
    id: input.id,
    payload: input.payload,
    actorId: session.user.id,
    globalClient,
  });
}

export async function changeCreativeStatusAction(input: {
  id: string;
  payload: CreativePayload;
  status: AdCreativeStatus;
}): Promise<AdsActionResult> {
  return saveCreativeAction({
    id: input.id,
    payload: { ...input.payload, status: input.status },
  });
}

export async function uploadCreativeImageAction(formData: FormData): Promise<AdsActionResult> {
  const id = String(formData.get("creativeId") ?? "");
  const session = await requireAds(`/admin/ads/${id}`);
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Choose an image file." };
  return uploadCreativeImage(session.supabase, {
    creativeId: id,
    file,
    altText: String(formData.get("altText") ?? ""),
    actorId: session.user.id,
  });
}

export async function upsertAssignmentAction(input: {
  creativeId: string;
  placementId: string;
  priority: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
}): Promise<AdsActionResult> {
  const session = await requireAds(`/admin/ads/${input.creativeId}`);
  return upsertAssignment(session.supabase, {
    creativeId: input.creativeId,
    placementId: input.placementId,
    priority: input.priority,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    isActive: input.isActive,
    actorId: session.user.id,
  });
}

export async function deleteAssignmentAction(input: { id: string; creativeId: string }): Promise<AdsActionResult> {
  const session = await requireAds(`/admin/ads/${input.creativeId}`);
  return deleteAssignment(session.supabase, { id: input.id, actorId: session.user.id });
}

export async function saveAdsenseClientAction(formData: FormData) {
  const session = await requireAds("/admin/ads");
  if (!canManageSecrets(session.role)) redirect("/admin/ads?error=forbidden");
  const result = await saveAdsenseClient(session.supabase, {
    clientId: String(formData.get("clientId") ?? ""),
    actorId: session.user.id,
  });
  if (!result.ok) redirect(`/admin/ads?error=${encodeURIComponent(result.error)}`);
  redirect("/admin/ads");
}

export async function updatePlacementAction(formData: FormData) {
  const session = await requireAds("/admin/ads");
  if (!canManageSecrets(session.role)) redirect("/admin/ads?error=forbidden");
  const result = await updatePlacementPolicy(session.supabase, {
    id: String(formData.get("placementId") ?? ""),
    mobilePolicy: String(formData.get("mobilePolicy") ?? "hide") as AdMobilePolicy,
    reserveSpace: String(formData.get("reserveSpace") ?? "true") === "true",
    fallbackBehavior: String(formData.get("fallbackBehavior") ?? "placeholder") as AdFallbackBehavior,
    actorId: session.user.id,
  });
  if (!result.ok) redirect(`/admin/ads?error=${encodeURIComponent(result.error)}`);
  redirect("/admin/ads");
}

export async function assignFromBoardAction(formData: FormData) {
  const session = await requireAds("/admin/ads");
  const creativeId = String(formData.get("creativeId") ?? "");
  const placementId = String(formData.get("placementId") ?? "");
  if (!creativeId || !placementId) redirect("/admin/ads?error=Choose%20a%20creative%20and%20placement.");
  const result = await upsertAssignment(session.supabase, {
    creativeId,
    placementId,
    priority: Number(formData.get("priority") ?? 10),
    startsAt: datetime(formData.get("startsAt")),
    endsAt: datetime(formData.get("endsAt")),
    isActive: true,
    actorId: session.user.id,
  });
  if (!result.ok) redirect(`/admin/ads?error=${encodeURIComponent(result.error)}`);
  redirect("/admin/ads");
}
