"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDailyCadenceAction } from "@/app/admin/generate/actions";
import { Button } from "@/components/ui/Button";
import { DAILY_BLOG_MAX_COUNT, resolveDailyTimes, type EditorialSlotView } from "@/lib/blog/cadence";

const STATUS_LABEL: Record<string, string> = {
  waiting: "Waiting for its window",
  planning: "Choosing a title",
  queued: "Writing the draft",
  scheduled: "Scheduled to publish",
  held: "Held by quality checks",
  failed: "Retrying after an error",
};

function fieldClass() {
  return "mt-2 h-11 w-full rounded-control border border-[#ddd6d2] bg-white px-3 text-sm text-ink outline-none transition focus:border-accent focus:shadow-glow disabled:bg-[#f6f3f1]";
}

export function DailyCadenceForm({
  enabled,
  count,
  times,
  timezone,
  canEdit,
  slots,
}: {
  enabled: boolean;
  count: number;
  times: string[];
  timezone: string;
  canEdit: boolean;
  slots: EditorialSlotView[];
}) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [perDay, setPerDay] = useState(count);
  const [clocks, setClocks] = useState(times);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  function changeCount(next: number) {
    const countValue = Math.min(DAILY_BLOG_MAX_COUNT, Math.max(1, next));
    setPerDay(countValue);
    setClocks(resolveDailyTimes(countValue, clocks));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit) return;
    setError("");
    setSaved("");
    setBusy(true);
    const result = await saveDailyCadenceAction({ enabled: on, count: perDay, times: clocks });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved("Clock saved. The bot uses it on the next run.");
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">Daily bot</p>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Guides write themselves</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
        Each day the bot picks a real tool, writes one guide for that clock, and publishes it if quality checks pass.
        Covers are typographic. No image model is used. Times use {timezone}.
      </p>

      <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          className="h-4 w-4 accent-[#d92d28]"
          checked={on}
          disabled={!canEdit || busy}
          onChange={(event) => setOn(event.target.checked)}
        />
        Write guides automatically
      </label>

      <div className="mt-5 grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <label className="block text-xs font-semibold uppercase tracking-wide text-faint">
          Guides per day
          <select
            className={fieldClass()}
            value={perDay}
            disabled={!canEdit || busy}
            onChange={(event) => changeCount(Number(event.target.value))}
          >
            {Array.from({ length: DAILY_BLOG_MAX_COUNT }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">Publish times</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {clocks.map((time, index) => (
              <input
                key={`${index}-${clocks.length}`}
                type="time"
                required
                aria-label={`Publish time ${index + 1}`}
                value={time}
                disabled={!canEdit || busy}
                className="h-11 rounded-control border border-[#ddd6d2] bg-white px-3 text-sm text-ink outline-none transition focus:border-accent focus:shadow-glow disabled:bg-[#f6f3f1]"
                onChange={(event) => {
                  const next = [...clocks];
                  next[index] = event.target.value;
                  setClocks(next);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <ul className="mt-5 divide-y divide-[#eee9e6] rounded-card border border-[#eee9e6]">
        {slots.map((slot) => (
          <li key={slot.time} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
            <span className="font-semibold tabular-nums text-ink">{slot.time}</span>
            <span className="text-mute">{STATUS_LABEL[slot.status] ?? slot.status}</span>
            <span className="text-xs text-faint">{slot.toolSlug ?? "Tool chosen when the window opens"}</span>
          </li>
        ))}
      </ul>
      {slots.some((slot) => slot.error) ? (
        <p className="mt-3 text-sm text-accent-ink">{slots.find((slot) => slot.error)?.error}</p>
      ) : null}

      {canEdit ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save clock"}
          </Button>
          {saved ? <p className="text-sm text-mute">{saved}</p> : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-mute">A publisher can change how many guides go out and when.</p>
      )}
      {error ? <p className="mt-3 text-sm text-accent-ink">{error}</p> : null}
    </form>
  );
}
