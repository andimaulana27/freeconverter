import type { PublicAdConfig } from "@/lib/ads/types";

export const ADS_CACHE_TAG = "ads-public";

export function disabledAdConfig(): PublicAdConfig {
  return {
    enabled: false,
    adsenseClientId: null,
    needsAdSenseScript: false,
    placements: {},
  };
}
