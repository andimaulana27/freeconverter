export const PLACEMENT_KEYS = [
  "homepage_left_rail",
  "homepage_right_rail",
  "page_left_rail",
  "page_right_rail",
  "global_pre_footer",
  "article_in_body",
  "article_sidebar",
  "homepage_media_showcase",
  "page_in_body",
  "page_sidebar",
] as const;

export type PlacementKey = (typeof PLACEMENT_KEYS)[number];

export const AD_CREATIVE_TYPES = ["adsense", "image", "empty"] as const;
export type AdCreativeType = (typeof AD_CREATIVE_TYPES)[number];

export const AD_CREATIVE_STATUSES = ["draft", "active", "paused", "archived"] as const;
export type AdCreativeStatus = (typeof AD_CREATIVE_STATUSES)[number];

export const AD_MOBILE_POLICIES = ["hide", "stack", "swap"] as const;
export type AdMobilePolicy = (typeof AD_MOBILE_POLICIES)[number];

export const AD_FALLBACKS = ["placeholder", "collapse"] as const;
export type AdFallbackBehavior = (typeof AD_FALLBACKS)[number];

export const AD_DIMENSION_PRESETS = [
  { label: "Leaderboard", width: 728, height: 90 },
  { label: "Mobile banner", width: 320, height: 100 },
  { label: "Rectangle", width: 300, height: 250 },
  { label: "Skyscraper", width: 160, height: 600 },
] as const;

export const PLACEMENT_LABELS: Record<PlacementKey, string> = {
  homepage_left_rail: "Homepage left rail",
  homepage_right_rail: "Homepage right rail",
  page_left_rail: "Page left rail",
  page_right_rail: "Page right rail",
  global_pre_footer: "Pre-footer leaderboard",
  article_in_body: "Article in-body",
  article_sidebar: "Article sidebar",
  homepage_media_showcase: "Homepage after showcase",
  page_in_body: "In-page leaderboard",
  page_sidebar: "Converter sidebar",
};

export type AdFormat = "leaderboard" | "rectangle" | "skyscraper";

export type AdMedia = {
  id: string;
  bucket: string;
  path: string;
  alt_text: string | null;
  visibility: "public" | "private";
  width: number | null;
  height: number | null;
  url: string;
};

export type AdCreative = {
  id: string;
  type: AdCreativeType;
  name: string;
  width: number;
  height: number;
  google_client_id: string | null;
  google_slot_id: string | null;
  media_asset_id: string | null;
  target_url: string | null;
  alt_text: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: AdCreativeStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  media: AdMedia | null;
};

export type AdPlacement = {
  id: string;
  key: PlacementKey;
  page_scope: string;
  desktop_width: number;
  desktop_height: number;
  mobile_width: number | null;
  mobile_height: number | null;
  mobile_policy: AdMobilePolicy;
  reserve_space: boolean;
  fallback_behavior: AdFallbackBehavior;
  created_at: string;
  updated_at: string;
};

export type AdAssignment = {
  id: string;
  creative_id: string;
  placement_id: string;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creative?: AdCreative | null;
  placement?: AdPlacement | null;
};

export type ResolvedCreative = {
  id: string;
  type: AdCreativeType;
  name: string;
  width: number;
  height: number;
  googleClientId: string | null;
  googleSlotId: string | null;
  imageUrl: string | null;
  targetUrl: string | null;
  altText: string | null;
  source: "cms" | "env";
};

export type ResolvedPlacement = {
  key: PlacementKey;
  pageScope: string;
  desktopWidth: number;
  desktopHeight: number;
  mobileWidth: number | null;
  mobileHeight: number | null;
  mobilePolicy: AdMobilePolicy;
  reserveSpace: boolean;
  fallbackBehavior: AdFallbackBehavior;
  desktop: ResolvedCreative | null;
  mobile: ResolvedCreative | null;
};

export type PublicAdConfig = {
  enabled: boolean;
  adsenseClientId: string | null;
  needsAdSenseScript: boolean;
  placements: Partial<Record<PlacementKey, ResolvedPlacement>>;
};

export type CreativePayload = {
  name: string;
  width: number;
  height: number;
  snippet?: string;
  googleClientId?: string;
  googleSlotId?: string;
  targetUrl?: string;
  altText?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  status?: AdCreativeStatus;
};

export type AdsActionResult =
  | { ok: true; creative?: AdCreative; message?: string }
  | { ok: false; error: string; code?: "forbidden" | "validation" };

export function isPlacementKey(value: string): value is PlacementKey {
  return (PLACEMENT_KEYS as readonly string[]).includes(value);
}

export function formatFromSize(width: number, height: number): AdFormat {
  if (width <= 180 && height >= 400) return "skyscraper";
  if (width <= 336 && height <= 300) return "rectangle";
  return "leaderboard";
}

export const PLACEMENT_DEFAULTS: Record<
  PlacementKey,
  {
    pageScope: string;
    desktopWidth: number;
    desktopHeight: number;
    mobileWidth: number | null;
    mobileHeight: number | null;
    mobilePolicy: AdMobilePolicy;
    reserveSpace: boolean;
    fallbackBehavior: AdFallbackBehavior;
  }
> = {
  homepage_left_rail: { pageScope: "homepage", desktopWidth: 160, desktopHeight: 600, mobileWidth: null, mobileHeight: null, mobilePolicy: "hide", reserveSpace: true, fallbackBehavior: "placeholder" },
  homepage_right_rail: { pageScope: "homepage", desktopWidth: 160, desktopHeight: 600, mobileWidth: null, mobileHeight: null, mobilePolicy: "hide", reserveSpace: true, fallbackBehavior: "placeholder" },
  page_left_rail: { pageScope: "non_homepage", desktopWidth: 160, desktopHeight: 600, mobileWidth: null, mobileHeight: null, mobilePolicy: "hide", reserveSpace: true, fallbackBehavior: "placeholder" },
  page_right_rail: { pageScope: "non_homepage", desktopWidth: 160, desktopHeight: 600, mobileWidth: null, mobileHeight: null, mobilePolicy: "hide", reserveSpace: true, fallbackBehavior: "placeholder" },
  global_pre_footer: { pageScope: "all", desktopWidth: 728, desktopHeight: 90, mobileWidth: 320, mobileHeight: 100, mobilePolicy: "swap", reserveSpace: true, fallbackBehavior: "placeholder" },
  article_in_body: { pageScope: "article", desktopWidth: 728, desktopHeight: 90, mobileWidth: 320, mobileHeight: 100, mobilePolicy: "swap", reserveSpace: true, fallbackBehavior: "placeholder" },
  article_sidebar: { pageScope: "article", desktopWidth: 300, desktopHeight: 250, mobileWidth: null, mobileHeight: null, mobilePolicy: "hide", reserveSpace: true, fallbackBehavior: "placeholder" },
  homepage_media_showcase: { pageScope: "homepage", desktopWidth: 728, desktopHeight: 90, mobileWidth: 320, mobileHeight: 100, mobilePolicy: "swap", reserveSpace: true, fallbackBehavior: "placeholder" },
  page_in_body: { pageScope: "all", desktopWidth: 728, desktopHeight: 90, mobileWidth: 320, mobileHeight: 100, mobilePolicy: "swap", reserveSpace: true, fallbackBehavior: "placeholder" },
  page_sidebar: { pageScope: "non_homepage", desktopWidth: 300, desktopHeight: 250, mobileWidth: null, mobileHeight: null, mobilePolicy: "hide", reserveSpace: true, fallbackBehavior: "placeholder" },
};

export function defaultResolvedPlacement(key: PlacementKey): ResolvedPlacement {
  const defaults = PLACEMENT_DEFAULTS[key];
  return {
    key,
    ...defaults,
    desktop: null,
    mobile: null,
  };
}

export function placementMatchesCreative(placement: AdPlacement, creative: Pick<AdCreative, "width" | "height">) {
  if (creative.width === placement.desktop_width && creative.height === placement.desktop_height) return true;
  if (
    placement.mobile_width
    && placement.mobile_height
    && creative.width === placement.mobile_width
    && creative.height === placement.mobile_height
  ) {
    return true;
  }
  return false;
}
