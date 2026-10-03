"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTitleBatchAction } from "@/app/admin/generate/actions";
import { Button } from "@/components/ui/Button";
import { ARTICLE_TYPE_LABELS, ARTICLE_TYPES, type ArticleType } from "@/lib/ai/types";
import type { CatalogTool } from "@/lib/cms/types";

function fieldClass() {
  return "mt-2 h-11 w-full rounded-control border border-[#ddd6d2] bg-white px-3 text-sm text-ink outline-none transition focus:border-accent focus:shadow-glow";
}

export function GenerateForm({
  tools,
  configured,
  disabled,
  healthLabel,
}: {
  tools: CatalogTool[];
  configured: boolean;
  disabled: boolean;
  healthLabel: string;
}) {
  const router = useRouter();
  const [articleType, setArticleType] = useState<ArticleType>("tool_tutorial");
  const [topic, setTopic] = useState("");
  const [direction, setDirection] = useState("");
  const [audience, setAudience] = useState("People searching for a reliable way to convert or fix a file");
  const [language, setLanguage] = useState("en");
  const [tone, setTone] = useState("Clear, specific, and practical");
  const [titleCount, setTitleCount] = useState(8);
  const [includeIllustration, setIncludeIllustration] = useState(false);
  const [toolQuery, setToolQuery] = useState("");
  const [targetToolSlugs, setTargetToolSlugs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const matches = tools
    .filter((tool) => {
      if (targetToolSlugs.includes(tool.slug)) return false;
      const q = toolQuery.trim().toLowerCase();
      if (!q) return false;
      return tool.slug.includes(q) || tool.title.toLowerCase().includes(q);
    })
    .slice(0, 8);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await createTitleBatchAction({
      topic,
      articleType,
      direction,
      audience,
      language,
      tone,
      titleCount,
      targetToolSlugs,
      includeIllustration,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.batchId) router.push(`/admin/generate/${result.batchId}`);
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">01 / Direction</p>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Start a new draft</h2>
      <p className="mt-2 text-sm text-mute">
        First, ask for several title ideas. You will choose 5–15 of them, then the worker writes each draft independently.
      </p>
      <p className="mt-3 flex items-center gap-2 text-xs text-faint"><span className="h-1.5 w-1.5 rounded-full bg-[#55d69a]" />{healthLabel}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
          Guide format
          <select className={fieldClass()} value={articleType} onChange={(event) => setArticleType(event.target.value as ArticleType)}>
            {ARTICLE_TYPES.map((item) => (
              <option key={item} value={item}>
                {ARTICLE_TYPE_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
          Main topic
          <input className={fieldClass()} value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="HEIC photos on Windows" required minLength={3} />
        </label>
        <label className="sm:col-span-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
          What should this guide help with?
          <textarea
            className="mt-2 w-full rounded-control border border-[#ddd6d2] bg-white px-3 py-2 text-sm font-sans font-normal normal-case tracking-normal text-ink outline-none transition focus:border-accent focus:shadow-glow"
            rows={3}
            value={direction}
            onChange={(event) => setDirection(event.target.value)}
            placeholder="Describe the reader's problem, the useful angle, and anything the draft must explain."
          />
        </label>
        <label className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
          Intended reader
          <input className={fieldClass()} value={audience} onChange={(event) => setAudience(event.target.value)} />
        </label>
        <label className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
          Language
          <select className={fieldClass()} value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="en">English</option>
            <option value="id">Bahasa Indonesia</option>
          </select>
        </label>
        <label className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
          Writing style
          <select className={fieldClass()} value={tone} onChange={(event) => setTone(event.target.value)}>
            <option value="Clear, specific, and practical">Clear and practical</option>
            <option value="Friendly, simple, and reassuring">Friendly and simple</option>
            <option value="Professional, concise, and technical">Professional and concise</option>
          </select>
        </label>
        <label className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
          Number of title ideas
          <input
            className={fieldClass()}
            type="number"
            min={5}
            max={15}
            value={titleCount}
            onChange={(event) => setTitleCount(Number(event.target.value))}
          />
          <span className="mt-1 block font-sans text-[10px] font-normal normal-case tracking-normal text-faint">Choose between 5 and 15. More ideas take slightly longer.</span>
        </label>
      </div>

      <div className="mt-5">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">Related converter tools</p>
        <p className="mt-1 text-xs text-mute">Optional. Choose tools the guide should mention or link to.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {targetToolSlugs.map((slug) => (
            <button
              key={slug}
              type="button"
              className="rounded-control border border-line bg-bone px-2 py-1 text-xs"
              onClick={() => setTargetToolSlugs(targetToolSlugs.filter((item) => item !== slug))}
            >
              {tools.find((tool) => tool.slug === slug)?.title ?? slug} ×
            </button>
          ))}
        </div>
        <input className={`${fieldClass()} max-w-md`} placeholder="Search by tool name or format" value={toolQuery} onChange={(event) => setToolQuery(event.target.value)} />
        {matches.length ? (
          <ul className="mt-2 max-w-md divide-y divide-line rounded-control border border-line">
            {matches.map((tool) => (
              <li key={tool.slug}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-bone"
                  onClick={() => {
                    setTargetToolSlugs([...targetToolSlugs, tool.slug]);
                    setToolQuery("");
                  }}
                >
                  <span>{tool.title}</span>
                  <span className="text-xs text-faint">{tool.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <label className="mt-5 flex items-center gap-2 text-sm text-mute">
        <input type="checkbox" checked={includeIllustration} onChange={(event) => setIncludeIllustration(event.target.checked)} />
        Add an optional AI illustration behind the branded cover title
      </label>

      {error ? (
        <p role="alert" className="mt-4 rounded-control border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-ink">
          {error}
        </p>
      ) : null}

      <div className="mt-5">
        <Button type="submit" loading={busy} disabled={!configured || disabled}>
          Suggest title ideas
        </Button>
      </div>
    </form>
  );
}
