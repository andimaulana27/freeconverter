import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { disabledAdConfig, ADS_CACHE_TAG } from "@/lib/ads/empty";
import { getSupabasePublicKey, getSupabaseUrl, hasSupabasePublicConfig } from "@/lib/supabase/env";
import {
  formatFromSize,
  isPlacementKey,
  type AdCreativeType,
  type AdFallbackBehavior,
  type AdMobilePolicy,
  type PublicAdConfig,
  type ResolvedCreative,
  type ResolvedPlacement,
} from "@/lib/ads/types";

export { disabledAdConfig, ADS_CACHE_TAG };

export const ADS_REVALIDATE_SECONDS = 60;

type PlacementRow = {
  id: string;
  key: string;
  page_scope: string;
  desktop_width: number;
  desktop_height: number;
  mobile_width: number | null;
  mobile_height: number | null;
  mobile_policy: AdMobilePolicy;
  reserve_space: boolean;
  fallback_behavior: string;
};

type CreativeRow = {
  id: string;
  type: AdCreativeType;
  name: string;
  width: number;
  height: number;
  google_client_id: string | null;
  google_slot_id: string | null;
  target_url: string | null;
  alt_text: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  media_asset_id: string | null;
  media?: MediaRow | MediaRow[] | null;
};

type MediaRow = {
  id?: string;
  bucket?: string;
  path?: string;
  alt_text?: string | null;
  visibility?: string;
  width?: number | null;
  height?: number | null;
};

type AssignmentRow = {
  id: string;
  creative_id: string;
  placement_id: string;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  creative?: CreativeRow | CreativeRow[] | null;
};

function publicClient() {
  if (!hasSupabasePublicConfig()) return null;
  return createClient(getSupabaseUrl(), getSupabasePublicKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function inWindow(startsAt: string | null | undefined, endsAt: string | null | undefined, now: number) {
  if (startsAt && new Date(startsAt).getTime() > now) return false;
  if (endsAt && new Date(endsAt).getTime() <= now) return false;
  return true;
}

function publicMediaUrl(bucket: string, path: string) {
  return `${getSupabaseUrl()}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function asClientId(value: unknown) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^ca-pub-[0-9]{9,22}$/);
  return match ? match[0] : null;
}

function envClient() {
  return asClientId(process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT ?? "");
}

function envSlot(kind: "vertical" | "horizontal" | "mobile" | "rectangle") {
  const value =
    kind === "vertical"
      ? process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_VERTICAL_SLOT
      : kind === "rectangle"
        ? process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_RECTANGLE_SLOT
        : kind === "mobile"
          ? process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_MOBILE_SLOT ?? process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_HORIZONTAL_SLOT
          : process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_HORIZONTAL_SLOT;
  return value && /^[0-9]{6,22}$/.test(value) ? value : null;
}

function envFallback(placement: PlacementRow, viewport: "desktop" | "mobile"): ResolvedCreative | null {
  const client = envClient();
  if (!client) return null;
  const format = formatFromSize(placement.desktop_width, placement.desktop_height);
  const width = viewport === "mobile" && placement.mobile_width ? placement.mobile_width : placement.desktop_width;
  const height = viewport === "mobile" && placement.mobile_height ? placement.mobile_height : placement.desktop_height;
  const slot =
    format === "skyscraper"
      ? envSlot("vertical")
      : format === "rectangle"
        ? envSlot("rectangle")
        : viewport === "mobile"
          ? envSlot("mobile")
          : envSlot("horizontal");
  if (!slot) return null;
  return {
    id: `env:${placement.key}:${viewport}`,
    type: "adsense",
    name: "Environment fallback",
    width,
    height,
    googleClientId: client,
    googleSlotId: slot,
    imageUrl: null,
    targetUrl: null,
    altText: null,
    source: "env",
  };
}

function creativeImageUrl(row: CreativeRow) {
  const media = one(row.media);
  if (!media?.path || media.bucket !== "ad-creatives" || media.visibility !== "public") return null;
  return publicMediaUrl(media.bucket, media.path);
}

function toResolved(row: CreativeRow): ResolvedCreative | null {
  if (row.type === "adsense" && !row.google_slot_id) return null;
  if (row.type === "image") {
    const imageUrl = creativeImageUrl(row);
    if (!imageUrl || !row.target_url || !row.alt_text) return null;
    return {
      id: row.id,
      type: "image",
      name: row.name,
      width: row.width,
      height: row.height,
      googleClientId: null,
      googleSlotId: null,
      imageUrl,
      targetUrl: row.target_url,
      altText: row.alt_text,
      source: "cms",
    };
  }
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    width: row.width,
    height: row.height,
    googleClientId: asClientId(row.google_client_id) ?? envClient(),
    googleSlotId: row.google_slot_id,
    imageUrl: null,
    targetUrl: null,
    altText: row.alt_text,
    source: "cms",
  };
}

function pickWinner(
  placement: PlacementRow,
  assignments: AssignmentRow[],
  viewport: "desktop" | "mobile",
  now: number,
) {
  const width = viewport === "mobile" && placement.mobile_width ? placement.mobile_width : placement.desktop_width;
  const height = viewport === "mobile" && placement.mobile_height ? placement.mobile_height : placement.desktop_height;
  const live = assignments.flatMap((assignment) => {
    if (!assignment.is_active || !inWindow(assignment.starts_at, assignment.ends_at, now)) return [];
    const creative = one(assignment.creative);
    if (!creative || creative.status !== "active") return [];
    if (!inWindow(creative.starts_at, creative.ends_at, now)) return [];
    const resolved = toResolved(creative);
    if (!resolved) return [];
    return [{ assignment, resolved }];
  });
  const sized = live.filter((item) => item.resolved.width === width && item.resolved.height === height);
  const pool = sized.length ? sized : viewport === "desktop" ? live : [];
  pool.sort((a, b) => b.assignment.priority - a.assignment.priority);
  return pool[0]?.resolved ?? envFallback(placement, viewport);
}

function resolvePlacement(placement: PlacementRow, assignments: AssignmentRow[], now: number): ResolvedPlacement | null {
  if (!isPlacementKey(placement.key)) return null;
  const fallback = AD_FALLBACKS_SAFE(placement.fallback_behavior);
  return {
    key: placement.key,
    pageScope: placement.page_scope,
    desktopWidth: placement.desktop_width,
    desktopHeight: placement.desktop_height,
    mobileWidth: placement.mobile_width,
    mobileHeight: placement.mobile_height,
    mobilePolicy: placement.mobile_policy,
    reserveSpace: placement.reserve_space !== false,
    fallbackBehavior: fallback,
    desktop: pickWinner(placement, assignments, "desktop", now),
    mobile: placement.mobile_policy === "hide" ? null : pickWinner(placement, assignments, "mobile", now),
  };
}

function AD_FALLBACKS_SAFE(value: string): AdFallbackBehavior {
  return value === "collapse" ? "collapse" : "placeholder";
}

async function loadPublicAdConfig(): Promise<PublicAdConfig> {
  const empty: PublicAdConfig = {
    enabled: true,
    adsenseClientId: envClient(),
    needsAdSenseScript: false,
    placements: {},
  };
  const supabase = publicClient();
  const now = Date.now();
  if (!supabase) {
    return empty;
  }

  const [{ data: placementRows, error: placementError }, { data: settingRows, error: settingError }] = await Promise.all([
    supabase
      .from("ad_placements")
      .select("id, key, page_scope, desktop_width, desktop_height, mobile_width, mobile_height, mobile_policy, reserve_space, fallback_behavior"),
    supabase.from("site_settings").select("key, value").eq("key", "adsense_client_id").eq("is_public", true),
  ]);
  if (placementError) throw new Error(placementError.message);
  if (settingError) throw new Error(settingError.message);

  const placements = (placementRows ?? []) as PlacementRow[];
  const ids = placements.map((row) => row.id);
  const { data: assignmentRows, error: assignmentError } = ids.length
    ? await supabase
        .from("ad_assignments")
        .select(
          `
          id, creative_id, placement_id, priority, starts_at, ends_at, is_active,
          creative:ad_creatives (
            id, type, name, width, height, google_client_id, google_slot_id, target_url, alt_text,
            starts_at, ends_at, status, media_asset_id,
            media:media_assets!ad_creatives_media_asset_id_fkey ( id, bucket, path, alt_text, visibility, width, height )
          )
        `,
        )
        .in("placement_id", ids)
        .eq("is_active", true)
    : { data: [], error: null };
  if (assignmentError) throw new Error(assignmentError.message);

  const assignments = (assignmentRows ?? []) as AssignmentRow[];
  const byPlacement = new Map<string, AssignmentRow[]>();
  for (const assignment of assignments) {
    const list = byPlacement.get(assignment.placement_id) ?? [];
    list.push(assignment);
    byPlacement.set(assignment.placement_id, list);
  }

  const resolved: PublicAdConfig["placements"] = {};
  for (const placement of placements) {
    const item = resolvePlacement(placement, byPlacement.get(placement.id) ?? [], now);
    if (item) resolved[item.key] = item;
  }

  const settingClient = asClientId((settingRows ?? []).find((row) => row.key === "adsense_client_id")?.value);
  const creativeClients = Object.values(resolved).flatMap((placement) => {
    if (!placement) return [];
    return [placement.desktop, placement.mobile].flatMap((creative) =>
      creative?.type === "adsense" && creative.googleClientId ? [creative.googleClientId] : [],
    );
  });
  const adsenseClientId = settingClient ?? envClient() ?? creativeClients[0] ?? null;
  const needsAdSenseScript = creativeClients.length > 0 || Object.values(resolved).some((placement) => placement?.desktop?.type === "adsense" || placement?.mobile?.type === "adsense");

  return {
    enabled: true,
    adsenseClientId,
    needsAdSenseScript: Boolean(needsAdSenseScript && adsenseClientId),
    placements: resolved,
  };
}

export const getPublicAdConfig = cache(async () =>
  unstable_cache(loadPublicAdConfig, ["ads-public-v1"], {
    tags: [ADS_CACHE_TAG],
    revalidate: ADS_REVALIDATE_SECONDS,
  })(),
);
