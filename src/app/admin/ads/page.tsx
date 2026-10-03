import type { Metadata } from "next";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { assignFromBoardAction, saveAdsenseClientAction, updatePlacementAction } from "@/app/admin/ads/actions";
import { AdStatusBadge } from "@/components/cms/AdStatusBadge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { fetchAdsenseClientId, listAssignments, listCreatives, listPlacements } from "@/lib/ads/server";
import { PLACEMENT_LABELS, placementMatchesCreative, type AdAssignment, type AdCreative, type AdPlacement, type PlacementKey } from "@/lib/ads/types";
import { canManageSecrets } from "@/lib/auth/roles";
import { requireAds } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Ads manager",
  robots: { index: false, follow: false },
};

function inWindow(startsAt: string | null, endsAt: string | null, now: number) {
  if (startsAt && new Date(startsAt).getTime() > now) return false;
  if (endsAt && new Date(endsAt).getTime() <= now) return false;
  return true;
}

function liveCreative(placement: AdPlacement, assignments: AdAssignment[], now: number) {
  const ranked = assignments
    .filter((item) => item.placement_id === placement.id && item.is_active && inWindow(item.starts_at, item.ends_at, now))
    .filter((item) => item.creative && item.creative.status === "active" && inWindow(item.creative.starts_at, item.creative.ends_at, now))
    .sort((a, b) => b.priority - a.priority);
  return ranked[0]?.creative ?? null;
}

function compatibleCreatives(placement: AdPlacement, creatives: AdCreative[]) {
  return creatives.filter((creative) => placementMatchesCreative(placement, creative));
}

const PLACEMENT_HELP: Record<PlacementKey, { description: string; location: string }> = {
  homepage_left_rail: { description: "Tall ad beside the left edge of the homepage on wide desktop screens.", location: "Homepage · left side" },
  homepage_right_rail: { description: "Tall ad beside the right edge of the homepage on wide desktop screens.", location: "Homepage · right side" },
  page_left_rail: { description: "Tall ad on the left side of converter and other public pages.", location: "Public pages · left side" },
  page_right_rail: { description: "Tall ad on the right side of converter and other public pages.", location: "Public pages · right side" },
  global_pre_footer: { description: "Wide banner shown near the bottom, immediately before the public footer.", location: "All public pages · near footer" },
  article_in_body: { description: "Wide banner inserted between meaningful sections while a visitor reads a guide.", location: "Blog article · inside content" },
  article_sidebar: { description: "Rectangle shown beside an article on screens with enough horizontal space.", location: "Blog article · sidebar" },
  homepage_media_showcase: { description: "Wide banner placed after the homepage tool and file-format showcase.", location: "Homepage · after showcase" },
  page_in_body: { description: "Wide banner placed between content sections on converter and general pages.", location: "Public pages · inside content" },
  page_sidebar: { description: "Rectangle beside the main converter content on larger screens.", location: "Converter pages · sidebar" },
};

const MOBILE_HELP = {
  hide: "Hidden on mobile",
  swap: "Switches to mobile banner",
  stack: "Stacks below content",
} as const;

const FALLBACK_HELP = {
  placeholder: "Keeps the frame if no ad is available",
  collapse: "Removes the frame if no ad is available",
} as const;

const CREATIVE_TYPE_LABEL = {
  adsense: "Google AdSense",
  image: "Image campaign",
  empty: "Empty fallback",
} as const;

const CREATIVE_STATUS_LABEL = {
  draft: "Draft",
  active: "Live",
  paused: "Paused",
  archived: "Archived",
} as const;

export default async function AdsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireAds("/admin/ads");
  const { error } = await searchParams;
  const superAdmin = canManageSecrets(session.role);
  const [placements, creatives, assignments, adsenseClient] = await Promise.all([
    listPlacements(session.supabase),
    listCreatives(session.supabase),
    listAssignments(session.supabase),
    fetchAdsenseClientId(session.supabase),
  ]);
  const now = Date.now();

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <div className="flex flex-wrap items-end justify-between gap-5 rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile">
        <div>
          <p className="flex items-center gap-2 font-mono text-micro font-bold uppercase text-accent"><span className="h-px w-6 bg-accent" /> Campaign control</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em]">Ads manager</h1>
          <p className="mt-2 max-w-2xl text-sm text-mute">
            Choose where ads appear, connect a matching creative, and preview every reserved space before making it live.
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/admin/ads/preview" variant="secondary" size="sm">Preview boundaries</ButtonLink>
          <ButtonLink href="/admin/ads/new" variant="primary" size="sm">
            New creative <span aria-hidden>→</span>
          </ButtonLink>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-control border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-ink">
          {error}
        </p>
      ) : null}

      {superAdmin ? (
        <form action={saveAdsenseClientAction} className="mt-5 flex flex-wrap items-end gap-3 rounded-[18px] border border-white/10 bg-[#181412] p-4 shadow-panel-dark">
          <label className="min-w-[18rem] flex-1 text-sm text-mute">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">Verified AdSense client</span>
            <input
              name="clientId"
              defaultValue={adsenseClient ?? ""}
              placeholder="ca-pub-…"
              className="mt-2 h-11 w-full rounded-control border border-white/10 bg-white/[0.07] px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent-light"
            />
          </label>
          <Button type="submit" variant="secondary" size="sm" className="border-white/10 bg-white/[0.07] text-white hover:bg-white/10">
            Save client
          </Button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-mute">Verified client: {adsenseClient || "not set · env fallback may still apply"}</p>
      )}

      <section className="mt-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">01 / Inventory</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Where ads appear</h2>
            <p className="mt-1 max-w-2xl text-sm text-mute">Each card represents one fixed area on the public site. Choose a matching creative, then adjust advanced behavior only when needed.</p>
          </div>
          <span className="font-mono text-[9px] uppercase text-faint">{placements.length} fixed slots</span>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {placements.map((placement) => {
            const live = liveCreative(placement, assignments, now);
            const options = compatibleCreatives(placement, creatives);
            const help = PLACEMENT_HELP[placement.key];
            return (
              <article key={placement.id} className="group overflow-hidden rounded-[22px] border border-black/[0.07] bg-white shadow-drop transition duration-280 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-tile">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f4efed] text-accent transition duration-280 group-hover:bg-accent group-hover:text-white">
                        <PlacementIcon placementKey={placement.key} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-ink">{PLACEMENT_LABELS[placement.key]}</h3>
                        <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.11em] text-faint">{help.location}</p>
                      </div>
                    </div>
                    <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[8px] font-bold uppercase ${live ? "bg-[#e7f8ef] text-[#16885c]" : "bg-[#f4efed] text-faint"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-[#55d69a]" : "bg-[#b9b0ab]"}`} />
                      {live ? "Live" : "Empty"}
                    </span>
                  </div>

                  <p className="mt-4 min-h-10 text-xs leading-5 text-mute">{help.description}</p>

                  <div className="mt-4 grid gap-4 rounded-2xl border border-[#ebe4e1] bg-[#faf8f7] p-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
                    <PlacementMap placementKey={placement.key} />
                    <div className="space-y-3">
                      <div>
                        <p className="font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-faint">Display sizes</p>
                        <p className="mt-1 text-xs font-semibold text-ink">Desktop {placement.desktop_width}×{placement.desktop_height}</p>
                        <p className="mt-0.5 text-[10px] text-mute">
                          {placement.mobile_width ? `Mobile ${placement.mobile_width}×${placement.mobile_height}` : "No mobile frame"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-[#e3dbd7] bg-white px-2 py-1 text-[9px] text-mute">{MOBILE_HELP[placement.mobile_policy]}</span>
                        <span className="rounded-full border border-[#e3dbd7] bg-white px-2 py-1 text-[9px] text-mute">{placement.reserve_space ? "Space reserved" : "No reserved space"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#ebe4e1] px-3 py-3">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${live ? "bg-[#e7f8ef] text-[#16885c]" : "bg-[#f4efed] text-faint"}`}>
                      <CreativeIcon active={Boolean(live)} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-faint">Currently displayed</p>
                      {live ? (
                        <p className="mt-1 truncate text-xs font-semibold">{live.name} <span className="font-normal text-mute">· {live.type} · {live.width}×{live.height}</span></p>
                      ) : (
                        <p className="mt-1 text-xs text-mute">No active creative — the configured fallback is shown.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-line bg-[#fcfbfa] p-4">
                  <p className="font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-faint">Assign a creative</p>
                  <form action={assignFromBoardAction} className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_auto]">
                    <input type="hidden" name="placementId" value={placement.id} />
                    <select name="creativeId" className="h-10 min-w-0 rounded-control border border-[#ddd6d2] bg-white px-3 text-xs text-ink outline-none focus:border-accent" required disabled={!options.length}>
                      <option value="">{options.length ? "Select a matching creative" : "No matching creative available"}</option>
                      {options.map((creative) => (
                        <option key={creative.id} value={creative.id}>
                          {creative.name} · {CREATIVE_STATUS_LABEL[creative.status]} · {creative.width}×{creative.height}
                        </option>
                      ))}
                    </select>
                    <label className="sr-only" htmlFor={`priority-${placement.id}`}>Priority</label>
                    <input id={`priority-${placement.id}`} name="priority" aria-label="Assignment priority" title="Higher priority is selected first" type="number" defaultValue={10} className="h-10 w-full rounded-control border border-[#ddd6d2] bg-white px-3 text-xs outline-none focus:border-accent" />
                    <Button type="submit" variant="secondary" size="sm" disabled={!options.length}>Assign</Button>
                  </form>
                  {!options.length ? <p className="mt-2 text-[10px] text-warn">Create an active or draft creative with a matching size before assigning this slot.</p> : <p className="mt-2 text-[10px] text-faint">Priority 10 is the default. Higher numbers win when schedules overlap.</p>}

                  {superAdmin ? (
                    <details className="group/settings mt-4 border-t border-line pt-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-mute outline-none transition hover:text-ink focus-visible:text-ink">
                        Advanced placement settings
                        <span className="text-accent transition group-open/settings:rotate-45">+</span>
                      </summary>
                      <form action={updatePlacementAction} className="mt-3 grid gap-3 rounded-xl bg-[#f4efed] p-3 sm:grid-cols-3">
                        <input type="hidden" name="placementId" value={placement.id} />
                        <label className="text-[10px] text-mute">
                          Mobile behavior
                          <select name="mobilePolicy" defaultValue={placement.mobile_policy} className="mt-1 h-9 w-full rounded-control border border-[#ddd6d2] bg-white px-2 text-xs">
                            <option value="hide">Hide on mobile</option>
                            <option value="swap">Use mobile size</option>
                            <option value="stack">Stack below content</option>
                          </select>
                        </label>
                        <label className="text-[10px] text-mute">
                          Empty fallback
                          <select name="fallbackBehavior" defaultValue={placement.fallback_behavior} className="mt-1 h-9 w-full rounded-control border border-[#ddd6d2] bg-white px-2 text-xs">
                            <option value="placeholder">Keep empty frame</option>
                            <option value="collapse">Remove empty frame</option>
                          </select>
                        </label>
                        <label className="text-[10px] text-mute">
                          Layout stability
                          <select name="reserveSpace" defaultValue={placement.reserve_space ? "true" : "false"} className="mt-1 h-9 w-full rounded-control border border-[#ddd6d2] bg-white px-2 text-xs">
                            <option value="true">Reserve space</option>
                            <option value="false">Do not reserve</option>
                          </select>
                        </label>
                        <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-[10px] text-faint">{FALLBACK_HELP[placement.fallback_behavior]}. Reserved space helps prevent layout movement.</p>
                          <Button type="submit" variant="ink" size="xs">Save settings</Button>
                        </div>
                      </form>
                    </details>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">02 / Library</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Ad creatives</h2>
            <p className="mt-1 text-sm text-mute">These are the ads or intentional empty states you can assign to the site locations above.</p>
          </div>
          <span className="font-mono text-[9px] uppercase text-faint">{creatives.length} units</span>
        </div>
        {creatives.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {creatives.map((creative) => (
              <article key={creative.id} className="group rounded-[18px] border border-black/[0.07] bg-white p-5 shadow-drop transition duration-280 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-tile">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4efed] text-accent transition group-hover:bg-accent group-hover:text-white">
                    <CreativeTypeIcon type={creative.type} />
                  </span>
                  <AdStatusBadge status={creative.status} />
                </div>
                <h3 className="mt-5 truncate text-sm font-semibold">{creative.name}</h3>
                <p className="mt-1 text-xs text-mute">{CREATIVE_TYPE_LABEL[creative.type]}</p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className="font-mono text-[9px] text-faint">{creative.width}×{creative.height}</span>
                  <ButtonLink href={`/admin/ads/${creative.id}`} variant="ghost" size="xs">Open editor →</ButtonLink>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[22px] border border-dashed border-[#d9d0cb] bg-white px-6 py-12 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent"><CreativeTypeIcon type="image" /></span>
            <p className="mt-4 text-sm font-semibold">No ad creatives yet</p>
            <p className="mt-2 text-xs text-mute">Create a Google ad, image campaign, or intentional empty fallback.</p>
            <ButtonLink href="/admin/ads/new" variant="primary" size="sm" className="mt-4">Create the first creative</ButtonLink>
          </div>
        )}
      </section>
    </AdminChrome>
  );
}

function PlacementIcon({ placementKey }: { placementKey: PlacementKey }) {
  const rail = placementKey.includes("rail");
  const sidebar = placementKey.includes("sidebar");
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="2.5" y="2.75" width="15" height="14.5" rx="2" />
      <path d="M2.5 6h15" />
      {rail ? (
        <>
          <path d="M6 6v11M14 6v11" />
          <path d={placementKey.includes("left") ? "M3.8 8.5h1" : "M15.2 8.5h1"} strokeWidth="2.2" strokeLinecap="round" />
        </>
      ) : sidebar ? (
        <>
          <path d="M12.5 6v11" />
          <rect x="13.8" y="8" width="2.2" height="4.5" rx=".5" fill="currentColor" stroke="none" />
        </>
      ) : (
        <path d="M5.5 11.5h9" strokeWidth="2.2" strokeLinecap="round" />
      )}
    </svg>
  );
}

function PlacementMap({ placementKey }: { placementKey: PlacementKey }) {
  const position =
    placementKey.includes("left_rail")
      ? "bottom-2 left-1.5 top-5 w-2.5"
      : placementKey.includes("right_rail")
        ? "bottom-2 right-1.5 top-5 w-2.5"
        : placementKey.includes("sidebar")
          ? "right-3 top-8 h-9 w-6"
          : placementKey === "global_pre_footer"
            ? "bottom-3 left-5 right-5 h-2.5"
            : placementKey === "homepage_media_showcase"
              ? "bottom-7 left-5 right-5 h-2.5"
              : "left-5 right-5 top-10 h-2.5";

  return (
    <div className="relative h-24 overflow-hidden rounded-xl border border-[#ded6d2] bg-white shadow-drop" aria-hidden>
      <span className="absolute inset-x-0 top-0 h-4 border-b border-[#e8e1de] bg-[#f1ece9]" />
      <span className="absolute left-3 top-1.5 h-1 w-1 rounded-full bg-accent/60" />
      <span className="absolute left-5 top-1.5 h-1 w-1 rounded-full bg-[#cfc6c1]" />
      <span className="absolute left-4 right-4 top-7 h-2 rounded-sm bg-[#eee8e5]" />
      <span className="absolute left-4 right-8 top-[3.8rem] h-1.5 rounded-sm bg-[#eee8e5]" />
      <span className={`absolute rounded-sm bg-accent shadow-[0_3px_10px_rgba(217,45,40,0.22)] ${position}`} />
    </div>
  );
}

function CreativeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="2.75" y="4" width="14.5" height="12" rx="2" />
      {active ? (
        <path d="m6.5 10 2.2 2.2 4.8-4.7" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6.5 10h7" strokeLinecap="round" />
      )}
    </svg>
  );
}

function CreativeTypeIcon({ type }: { type: AdCreative["type"] }) {
  if (type === "adsense") {
    return (
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="2.5" y="4" width="15" height="12" rx="2" />
        <path d="M5.5 7h9M5.5 10h5M5.5 13h3" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "empty") {
    return (
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="2.5" y="4" width="15" height="12" rx="2" strokeDasharray="2.5 2.5" />
        <path d="M7 10h6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
      <circle cx="7" cy="8" r="1.3" />
      <path d="m4.5 14 3.5-3 2.5 2 2-1.8 3 2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
