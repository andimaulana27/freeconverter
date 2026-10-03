import { PLACEMENT_LABELS, type AdAssignment, type AdPlacement, type PlacementKey } from "@/lib/ads/types";

const MOBILE_LABEL = {
  hide: "Hidden on mobile",
  swap: "Uses a smaller mobile banner",
  stack: "Moves below the content",
} as const;

const FALLBACK_LABEL = {
  placeholder: "keeps the reserved frame",
  collapse: "removes the empty frame",
} as const;

const BOX: Record<PlacementKey, string> = {
  homepage_left_rail: "col-start-1 row-start-2 row-span-3",
  homepage_right_rail: "col-start-3 row-start-2 row-span-3",
  page_left_rail: "col-start-1 row-start-2 row-span-3",
  page_right_rail: "col-start-3 row-start-2 row-span-3",
  homepage_media_showcase: "col-start-2 row-start-2",
  article_in_body: "col-start-2 row-start-3",
  article_sidebar: "col-start-2 row-start-3 justify-self-end w-40",
  page_in_body: "col-start-2 row-start-4",
  page_sidebar: "col-start-2 row-start-4 justify-self-end w-40",
  global_pre_footer: "col-start-2 row-start-5",
};

function assignedLabel(placement: AdPlacement, assignments: AdAssignment[]) {
  const hits = assignments.filter((item) => item.placement_id === placement.id && item.is_active);
  if (!hits.length) return "Unassigned";
  const names = hits
    .slice()
    .sort((a, b) => b.priority - a.priority)
    .map((item) => item.creative?.name ?? "Creative");
  return names[0] + (names.length > 1 ? ` +${names.length - 1}` : "");
}

export function AdsPreviewBoard({
  placements,
  assignments,
}: {
  placements: AdPlacement[];
  assignments: AdAssignment[];
}) {
  const byKey = new Map(placements.map((item) => [item.key, item]));

  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">01 / Public shell</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Homepage and global</h2>
        <p className="mt-1 text-sm text-mute">Boxes show reserved dimensions. Rails stop at the footer. Mobile hide/swap follows each placement policy.</p>
        <div className="mt-4 grid grid-cols-[7rem_minmax(0,1fr)_7rem] grid-rows-[auto_auto_auto_auto_auto] gap-3 rounded-[22px] border border-black/[0.07] bg-white p-4 shadow-tile">
          <div className="col-span-3 rounded-control border border-line bg-[#f4efed] px-3 py-2 text-xs text-mute">Header · converter nav, no Blog</div>
          {(["homepage_left_rail", "homepage_media_showcase", "homepage_right_rail", "page_in_body", "global_pre_footer"] as const).map((key) => {
            const placement = byKey.get(key);
            if (!placement) return null;
            return (
              <article key={key} className={`rounded-control border border-dashed border-accent/25 bg-accent-soft/50 px-3 py-3 ${BOX[key]}`}>
                <p className="font-mono text-[10px] font-bold uppercase text-faint">{PLACEMENT_LABELS[key]}</p>
                <p className="mt-1 text-xs text-ink">
                  {placement.desktop_width}×{placement.desktop_height}
                  {placement.mobile_width ? ` / ${placement.mobile_width}×${placement.mobile_height}` : ""} · {MOBILE_LABEL[placement.mobile_policy]}
                </p>
                <p className="mt-1 text-xs text-mute">{assignedLabel(placement, assignments)}</p>
              </article>
            );
          })}
          <div className="col-span-3 rounded-control border border-line bg-ink px-3 py-2 text-xs text-white">Footer</div>
        </div>
      </section>

      <section>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">02 / Content routes</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Article and converter</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(["article_in_body", "article_sidebar", "page_left_rail", "page_right_rail", "page_sidebar"] as const).map((key) => {
            const placement = byKey.get(key);
            if (!placement) return null;
            return (
              <article key={key} className="rounded-[18px] border border-black/[0.07] bg-white p-4 shadow-drop transition duration-280 hover:border-accent/25 hover:shadow-tile">
                <p className="font-mono text-[10px] font-bold uppercase text-faint">{PLACEMENT_LABELS[key]}</p>
                <p className="mt-1 text-sm">
                  {placement.desktop_width}×{placement.desktop_height}
                  {placement.mobile_width ? ` · mobile ${placement.mobile_width}×${placement.mobile_height}` : " · hidden on small screens"}
                </p>
                <p className="mt-1 text-xs text-mute">{assignedLabel(placement, assignments)} · if empty, {FALLBACK_LABEL[placement.fallback_behavior]}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
