"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { generateArticleAction, saveTitlesAction } from "@/app/admin/generate/actions";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ARTICLE_TYPE_LABELS, type GenerationJob, type TitleCandidate } from "@/lib/ai/types";

export function TitleReview({
  batchId,
  initialTitles,
  includeIllustration: initialIllustration,
  jobs,
}: {
  batchId: string;
  initialTitles: TitleCandidate[];
  includeIllustration: boolean;
  jobs: GenerationJob[];
}) {
  const router = useRouter();
  const [titles, setTitles] = useState(initialTitles);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    initialTitles.findIndex((item) => !item.rejected) >= 0 ? initialTitles.findIndex((item) => !item.rejected) : null,
  );
  const [includeIllustration, setIncludeIllustration] = useState(initialIllustration);
  const [busy, setBusy] = useState<"save" | "generate" | null>(null);
  const [error, setError] = useState("");

  const selected = selectedIndex != null ? titles[selectedIndex] : null;
  const completed = useMemo(() => jobs.filter((job) => job.status === "completed" && job.post_id), [jobs]);

  function update(index: number, patch: Partial<TitleCandidate>) {
    setTitles((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function onSave() {
    setError("");
    setBusy("save");
    const result = await saveTitlesAction({ batchId, titles, selectedIndex, includeIllustration });
    setBusy(null);
    if (!result.ok) setError(result.error);
  }

  async function onGenerate() {
    if (selectedIndex == null || !selected || selected.rejected) {
      setError("Select one title that has not been rejected.");
      return;
    }
    setError("");
    setBusy("generate");
    const result = await generateArticleAction({ batchId, selectedIndex, titles, includeIllustration });
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.postId) router.push(`/admin/posts/${result.postId}`);
    else router.refresh();
  }

  return (
    <section className="rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">02 / Titles</p>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Choose one title to write</h2>
      <p className="mt-2 text-sm text-mute">Pick the clearest idea, edit it if needed, then create a private draft. Nothing is published automatically.</p>

      <ul className="mt-5 space-y-3">
        {titles.map((title, index) => (
          <li
            key={`${title.slugSuggestion}-${index}`}
            className={`rounded-[18px] border p-4 transition duration-180 ${
              title.rejected
                ? "border-line bg-bone opacity-65"
                : selectedIndex === index
                  ? "border-accent/35 bg-accent-soft/35 shadow-[0_0_0_3px_rgba(217,45,40,0.08)]"
                  : "border-black/[0.07] hover:border-black/15"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                id={`title-option-${index}`}
                type="radio"
                name="selected-title"
                className="mt-1"
                checked={selectedIndex === index}
                disabled={title.rejected}
                onChange={() => setSelectedIndex(index)}
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor={`title-option-${index}`} className="text-xs font-semibold text-ink">
                    Title option {index + 1}
                  </label>
                  {selectedIndex === index && !title.rejected ? <span className="rounded-full bg-accent px-2 py-1 font-mono text-[8px] font-bold uppercase text-white">Selected</span> : null}
                </div>
                <input
                  aria-label={`Edit title option ${index + 1}`}
                  className="h-11 w-full rounded-control border border-[#ddd6d2] bg-white px-3 text-sm font-semibold outline-none focus:border-accent focus:shadow-glow"
                  value={title.title}
                  onChange={(event) => update(index, { title: event.target.value })}
                />
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-faint">
                  <span className="rounded-full border border-line bg-white px-2 py-1">{ARTICLE_TYPE_LABELS[title.articleType]}</span>
                  <span>Suggested address: /{title.slugSuggestion}</span>
                </div>
                <p className="text-sm leading-6 text-mute">{title.searchIntent}</p>
                <details className="group/more rounded-xl bg-white px-3 py-2">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-mute">
                    Why this title?
                    <span className="text-accent transition group-open/more:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-xs leading-5 text-faint">{title.rationale}</p>
                  {title.targetToolSlugs.length ? <p className="mt-2 text-xs text-faint">Related tools: {title.targetToolSlugs.join(", ")}</p> : null}
                </details>
                <button type="button" className="text-xs font-semibold text-mute underline decoration-line underline-offset-4 transition hover:text-accent" onClick={() => update(index, { rejected: !title.rejected })}>
                  {title.rejected ? "Restore this option" : "Remove this option"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <label className="mt-5 flex items-center gap-2 text-sm text-mute">
        <input type="checkbox" checked={includeIllustration} onChange={(event) => setIncludeIllustration(event.target.checked)} />
        Add an optional AI illustration behind the branded cover title
      </label>

      {completed.length ? (
        <ul className="mt-4 space-y-2 text-sm">
          {completed.map((job) => (
            <li key={job.id}>
              <ButtonLink href={`/admin/posts/${job.post_id}`}>Open draft → {job.title}</ButtonLink>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 rounded-control border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-ink">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" loading={busy === "save"} onClick={() => void onSave()}>
          Save title choices
        </Button>
        <Button type="button" loading={busy === "generate"} onClick={() => void onGenerate()}>
          Create selected draft
        </Button>
      </div>
    </section>
  );
}
