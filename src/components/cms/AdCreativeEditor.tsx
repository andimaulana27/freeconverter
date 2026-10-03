"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  changeCreativeStatusAction,
  deleteAssignmentAction,
  saveCreativeAction,
  uploadCreativeImageAction,
  upsertAssignmentAction,
} from "@/app/admin/ads/actions";
import { AdStatusBadge } from "@/components/cms/AdStatusBadge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { parseAdSenseSnippet } from "@/lib/ads/parse";
import {
  AD_DIMENSION_PRESETS,
  PLACEMENT_LABELS,
  placementMatchesCreative,
  type AdAssignment,
  type AdCreative,
  type AdPlacement,
  type CreativePayload,
} from "@/lib/ads/types";

function inputClass() {
  return "h-11 w-full rounded-control border border-[#ddd6d2] bg-white px-3 text-sm text-ink outline-none transition duration-180 focus:border-accent focus:shadow-glow";
}

function toInput(iso: string | null) {
  return iso ? iso.slice(0, 16) : "";
}

function fromInput(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function AdCreativeEditor({
  creative: initial,
  placements,
  assignments,
  globalClient,
}: {
  creative: AdCreative;
  placements: AdPlacement[];
  assignments: AdAssignment[];
  globalClient: string | null;
}) {
  const router = useRouter();
  const [creative, setCreative] = useState(initial);
  const [name, setName] = useState(initial.name);
  const [width, setWidth] = useState(initial.width);
  const [height, setHeight] = useState(initial.height);
  const [snippet, setSnippet] = useState("");
  const [clientId, setClientId] = useState(initial.google_client_id ?? globalClient ?? "");
  const [slotId, setSlotId] = useState(initial.google_slot_id ?? "");
  const [targetUrl, setTargetUrl] = useState(initial.target_url ?? "");
  const [altText, setAltText] = useState(initial.alt_text ?? "");
  const [startsAt, setStartsAt] = useState(toInput(initial.starts_at));
  const [endsAt, setEndsAt] = useState(toInput(initial.ends_at));
  const [placementId, setPlacementId] = useState("");
  const [priority, setPriority] = useState(10);
  const [assignStart, setAssignStart] = useState("");
  const [assignEnd, setAssignEnd] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const payload: CreativePayload = useMemo(
    () => ({
      name,
      width,
      height,
      snippet,
      googleClientId: clientId,
      googleSlotId: slotId,
      targetUrl,
      altText,
      startsAt: fromInput(startsAt),
      endsAt: fromInput(endsAt),
    }),
    [name, width, height, snippet, clientId, slotId, targetUrl, altText, startsAt, endsAt],
  );

  const compatible = placements.filter((placement) => placementMatchesCreative(placement, { width, height }));
  const mine = assignments.filter((item) => item.creative_id === creative.id);

  async function run(task: () => Promise<{ ok: boolean; error?: string; creative?: AdCreative; message?: string }>) {
    setBusy(true);
    setMessage("");
    const result = await task();
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error ?? "Save failed.");
      return;
    }
    if (result.creative) {
      setCreative(result.creative);
      setName(result.creative.name);
      setWidth(result.creative.width);
      setHeight(result.creative.height);
      setClientId(result.creative.google_client_id ?? globalClient ?? "");
      setSlotId(result.creative.google_slot_id ?? "");
      setTargetUrl(result.creative.target_url ?? "");
      setAltText(result.creative.alt_text ?? "");
      setStartsAt(toInput(result.creative.starts_at));
      setEndsAt(toInput(result.creative.ends_at));
      setSnippet("");
    }
    setMessage(result.message ?? "Saved.");
    router.refresh();
  }

  function parsePaste() {
    const parsed = parseAdSenseSnippet(snippet);
    if (parsed.clientId) setClientId(parsed.clientId);
    if (parsed.slotId) setSlotId(parsed.slotId);
    if (parsed.width) setWidth(parsed.width);
    if (parsed.height) setHeight(parsed.height);
    setMessage("AdSense details were read successfully. The pasted code itself was not stored.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-5 rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile">
          <div>
            <p className="flex items-center gap-2 font-mono text-micro font-bold uppercase text-accent"><span className="h-px w-6 bg-accent" /> Creative editor</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{creative.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <AdStatusBadge status={creative.status} />
            <ButtonLink href="/admin/ads" variant="secondary" size="sm">← Back to ads</ButtonLink>
          </div>
        </div>
        {message ? (
          <p role="status" className="rounded-control border border-line bg-paper px-3 py-2 text-sm">
            {message}
          </p>
        ) : null}

        <section className="space-y-4 rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-tile sm:p-6">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">Creative details</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">What visitors will see</h2>
            <p className="mt-1 text-xs text-mute">Set the content, dimensions, and optional display dates for this ad.</p>
          </div>
          <label className="block text-sm text-mute">
            Internal name
            <input className={`mt-1.5 ${inputClass()}`} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm text-mute">
              Width
              <input
                type="number"
                min={1}
                className={`mt-1.5 ${inputClass()}`}
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
              />
            </label>
            <label className="block text-sm text-mute">
              Height
              <input
                type="number"
                min={1}
                className={`mt-1.5 ${inputClass()}`}
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
              />
            </label>
            <label className="block text-sm text-mute">
              Preset
              <select
                className={`mt-1.5 ${inputClass()}`}
                value={`${width}x${height}`}
                onChange={(event) => {
                  const preset = AD_DIMENSION_PRESETS.find((item) => `${item.width}x${item.height}` === event.target.value);
                  if (!preset) return;
                  setWidth(preset.width);
                  setHeight(preset.height);
                }}
              >
                <option value={`${width}x${height}`}>Custom {width}×{height}</option>
                {AD_DIMENSION_PRESETS.map((item) => (
                  <option key={item.label} value={`${item.width}x${item.height}`}>
                    {item.label} {item.width}×{item.height}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-mute">
              Start showing (optional)
              <input type="datetime-local" className={`mt-1.5 ${inputClass()}`} value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
            </label>
            <label className="block text-sm text-mute">
              Stop showing (optional)
              <input type="datetime-local" className={`mt-1.5 ${inputClass()}`} value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
            </label>
          </div>

          {creative.type === "adsense" ? (
            <div className="space-y-3">
              <label className="block text-sm text-mute">
                Paste your AdSense ad code
                <textarea
                  className="mt-1.5 min-h-28 w-full rounded-control border border-[#ddd6d2] bg-white px-3 py-2 font-mono text-xs text-ink outline-none transition focus:border-accent focus:shadow-glow"
                  value={snippet}
                  onChange={(event) => setSnippet(event.target.value)}
                  placeholder="Paste the Google ad unit code here. Only the safe account, slot, and size details are kept."
                />
              </label>
              <Button type="button" variant="secondary" size="sm" onClick={parsePaste} disabled={!snippet.trim()}>
                Read ad details
              </Button>
              <details className="group/technical rounded-xl bg-[#f7f4f2] p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-mute">
                  Technical ad identifiers
                  <span className="text-accent transition group-open/technical:rotate-45">+</span>
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-mute">
                    Google account ID
                    <input className={`mt-1.5 ${inputClass()}`} value={clientId} onChange={(event) => setClientId(event.target.value)} placeholder="ca-pub-…" />
                  </label>
                  <label className="block text-sm text-mute">
                    Ad slot ID
                    <input className={`mt-1.5 ${inputClass()}`} value={slotId} onChange={(event) => setSlotId(event.target.value)} placeholder="Digits only" />
                  </label>
                </div>
                {globalClient ? <p className="mt-2 text-xs text-mute">Verified account: {globalClient}</p> : null}
              </details>
            </div>
          ) : null}

          {creative.type === "image" ? (
            <div className="space-y-3">
              <label className="block text-sm text-mute">
                Link visitors should open
                <input className={`mt-1.5 ${inputClass()}`} value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder="https://" />
              </label>
              <label className="block text-sm text-mute">
                Image description
                <input className={`mt-1.5 ${inputClass()}`} value={altText} onChange={(event) => setAltText(event.target.value)} />
              </label>
              {creative.media ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creative.media.url} alt={creative.media.alt_text || creative.name} className="max-h-40 rounded-control border border-line object-contain" />
              ) : (
                <p className="text-sm text-mute">No image uploaded yet.</p>
              )}
              <form
                className="flex flex-wrap items-end gap-2"
                action={async (formData) => {
                  formData.set("creativeId", creative.id);
                  formData.set("altText", altText);
                  await run(() => uploadCreativeImageAction(formData));
                }}
              >
                <label className="block text-sm text-mute">
                  Upload
                  <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-1.5 block text-sm" required />
                </label>
                <Button type="submit" variant="secondary" size="sm" disabled={busy}>
                  Upload image
                </Button>
              </form>
            </div>
          ) : null}

          {creative.type === "empty" ? (
            <p className="rounded-xl bg-[#f7f4f2] px-3 py-3 text-sm text-mute">This is an intentional empty fallback. It displays no ad and follows the selected placement&apos;s empty-space setting.</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => run(() => saveCreativeAction({ id: creative.id, payload }))} disabled={busy}>
              Save changes
            </Button>
            {creative.status !== "active" ? (
              <Button type="button" size="sm" disabled={busy} onClick={() => run(() => changeCreativeStatusAction({ id: creative.id, payload, status: "active" }))}>
                Set live
              </Button>
            ) : (
              <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => run(() => changeCreativeStatusAction({ id: creative.id, payload, status: "paused" }))}>
                Pause display
              </Button>
            )}
            {creative.status === "archived" ? (
              <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => run(() => changeCreativeStatusAction({ id: creative.id, payload, status: "draft" }))}>
                Return to draft
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => run(() => changeCreativeStatusAction({ id: creative.id, payload, status: "archived" }))}>
                Archive
              </Button>
            )}
          </div>
        </section>

        <section className="rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-tile sm:p-6">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">Distribution</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">Where this ad appears</h2>
          <p className="mt-1 text-sm text-mute">Only site locations that fit the {width}×{height} creative are listed below.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-mute sm:col-span-2">
              Site location
              <select className={`mt-1.5 ${inputClass()}`} value={placementId} onChange={(event) => setPlacementId(event.target.value)}>
                <option value="">Choose where this ad should appear</option>
                {compatible.map((placement) => (
                  <option key={placement.id} value={placement.id}>
                    {PLACEMENT_LABELS[placement.key] ?? placement.key}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-mute">
              Priority when ads overlap
              <input
                type="number"
                className={`mt-1.5 ${inputClass()}`}
                value={priority}
                onChange={(event) => setPriority(Number(event.target.value))}
              />
              <span className="mt-1 block text-[10px] font-normal text-faint">Higher numbers are selected first.</span>
            </label>
            <div />
            <label className="text-xs font-medium text-mute">
              Show from (optional)
              <input type="datetime-local" className={`mt-1.5 ${inputClass()}`} value={assignStart} onChange={(event) => setAssignStart(event.target.value)} />
            </label>
            <label className="text-xs font-medium text-mute">
              Show until (optional)
              <input type="datetime-local" className={`mt-1.5 ${inputClass()}`} value={assignEnd} onChange={(event) => setAssignEnd(event.target.value)} />
            </label>
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !placementId}
              onClick={() =>
                run(() =>
                  upsertAssignmentAction({
                    creativeId: creative.id,
                    placementId,
                    priority,
                    startsAt: fromInput(assignStart),
                    endsAt: fromInput(assignEnd),
                    isActive: true,
                  }),
                )
              }
            >
              Add to this location
            </Button>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {mine.map((assignment) => (
              <li key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{assignment.placement ? PLACEMENT_LABELS[assignment.placement.key] ?? assignment.placement.key : assignment.placement_id}</p>
                  <p className="text-xs text-mute">
                    Priority {assignment.priority}
                    {assignment.starts_at ? ` · starts ${new Date(assignment.starts_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}` : ""}
                    {assignment.ends_at ? ` · ends ${new Date(assignment.ends_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}` : ""}
                    {assignment.is_active ? "" : " · currently off"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={busy}
                  onClick={() => run(() => deleteAssignmentAction({ id: assignment.id, creativeId: creative.id }))}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          {!mine.length ? <p className="mt-4 rounded-xl bg-[#f7f4f2] px-3 py-3 text-sm text-mute">This creative is not displayed anywhere yet. Choose a site location above.</p> : null}
        </section>
      </div>

      <aside className="space-y-4">
        <section className="rounded-[22px] border border-white/10 bg-[#181412] p-5 text-white shadow-panel-dark">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent-light">Preview boundary</p>
          <p className="mt-2 text-sm leading-6 text-white/45">{width}×{height} preview frame. Real Google ads are intentionally not loaded in the editor.</p>
          <div className="mt-4 overflow-auto rounded-control border border-dashed border-white/15 bg-white/[0.05] p-3">
            <div className="grid place-items-center border border-white/10 bg-white/[0.06]" style={{ width, height, maxWidth: "100%" }}>
              {creative.type === "image" && creative.media ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creative.media.url} alt={altText || creative.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="px-3 text-center font-mono text-micro uppercase text-white/45">
                  {creative.type === "adsense" ? "Google ad" : creative.type === "image" ? "Image ad" : "Empty fallback"} · preview
                </span>
              )}
            </div>
          </div>
        </section>
        <p className="text-xs leading-5 text-mute">Only creatives marked live and inside their chosen dates can appear on public pages.</p>
      </aside>
    </div>
  );
}
