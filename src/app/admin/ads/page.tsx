import type { Metadata } from "next";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { assignFromBoardAction, saveAdsenseClientAction, updatePlacementAction } from "@/app/admin/ads/actions";
import { AdStatusBadge } from "@/components/cms/AdStatusBadge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { fetchAdsenseClientId, listAssignments, listCreatives, listPlacements } from "@/lib/ads/server";
import { PLACEMENT_LABELS, placementMatchesCreative, type AdAssignment, type AdCreative, type AdPlacement } from "@/lib/ads/types";
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
            Assign structured AdSense units or uploaded image creatives to the fixed slots. Snippets are parsed; arbitrary scripts are not stored.
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
          <div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">01 / Inventory</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Placements</h2></div>
          <span className="font-mono text-[9px] uppercase text-faint">{placements.length} fixed slots</span>
        </div>
        <div className="mt-3 overflow-x-auto rounded-[22px] border border-black/[0.07] bg-white shadow-tile">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-[#faf8f7] font-mono text-[9px] uppercase tracking-[0.13em] text-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Slot</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Live creative</th>
                <th className="px-4 py-3 font-medium">Assign</th>
              </tr>
            </thead>
            <tbody>
              {placements.map((placement) => {
                const live = liveCreative(placement, assignments, now);
                const options = compatibleCreatives(placement, creatives);
                return (
                  <tr key={placement.id} className="border-b border-line align-top transition hover:bg-[#faf7f5] last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{PLACEMENT_LABELS[placement.key] ?? placement.key}</p>
                      <p className="text-xs text-mute">{placement.key} · {placement.page_scope} · {placement.mobile_policy}</p>
                      {superAdmin ? (
                        <form action={updatePlacementAction} className="mt-2 flex flex-wrap gap-2">
                          <input type="hidden" name="placementId" value={placement.id} />
                          <select name="mobilePolicy" defaultValue={placement.mobile_policy} className="h-8 rounded-control border border-line bg-bone px-2 text-xs">
                            <option value="hide">hide</option>
                            <option value="swap">swap</option>
                            <option value="stack">stack</option>
                          </select>
                          <select name="fallbackBehavior" defaultValue={placement.fallback_behavior} className="h-8 rounded-control border border-line bg-bone px-2 text-xs">
                            <option value="placeholder">placeholder</option>
                            <option value="collapse">collapse</option>
                          </select>
                          <select name="reserveSpace" defaultValue={placement.reserve_space ? "true" : "false"} className="h-8 rounded-control border border-line bg-bone px-2 text-xs">
                            <option value="true">reserve</option>
                            <option value="false">no reserve</option>
                          </select>
                          <Button type="submit" variant="ghost" size="xs">
                            Update
                          </Button>
                        </form>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-mute">
                      {placement.desktop_width}×{placement.desktop_height}
                      {placement.mobile_width ? (
                        <>
                          <br />
                          {placement.mobile_width}×{placement.mobile_height}
                        </>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {live ? (
                        <div>
                          <p className="font-medium">{live.name}</p>
                          <p className="text-xs text-mute">{live.type} · {live.width}×{live.height}</p>
                        </div>
                      ) : (
                        <span className="text-mute">Env fallback or placeholder</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <form action={assignFromBoardAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="placementId" value={placement.id} />
                        <select name="creativeId" className="h-8 min-w-[10rem] rounded-control border border-line bg-bone px-2 text-xs" required>
                          <option value="">Creative</option>
                          {options.map((creative) => (
                            <option key={creative.id} value={creative.id}>
                              {creative.name} ({creative.status})
                            </option>
                          ))}
                        </select>
                        <input name="priority" type="number" defaultValue={10} className="h-8 w-16 rounded-control border border-line bg-bone px-2 text-xs" />
                        <Button type="submit" variant="secondary" size="xs">
                          Assign
                        </Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">02 / Library</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Creatives</h2></div>
          <span className="font-mono text-[9px] uppercase text-faint">{creatives.length} units</span>
        </div>
        <div className="mt-3 overflow-x-auto rounded-[22px] border border-black/[0.07] bg-white shadow-tile">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-[#faf8f7] font-mono text-[9px] uppercase tracking-[0.13em] text-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {creatives.map((creative) => (
                <tr key={creative.id} className="border-b border-line transition hover:bg-[#faf7f5] last:border-0">
                  <td className="px-4 py-3 font-medium">{creative.name}</td>
                  <td className="px-4 py-3 text-mute">{creative.type}</td>
                  <td className="px-4 py-3"><AdStatusBadge status={creative.status} /></td>
                  <td className="px-4 py-3 text-mute">{creative.width}×{creative.height}</td>
                  <td className="px-4 py-3 text-right">
                    <ButtonLink href={`/admin/ads/${creative.id}`} variant="ghost" size="xs">Edit →</ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!creatives.length ? <p className="px-4 py-8 text-sm text-mute">No creatives yet. Create an AdSense unit, image, or empty fallback.</p> : null}
        </div>
      </section>
    </AdminChrome>
  );
}
