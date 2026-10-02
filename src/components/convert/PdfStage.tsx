"use client";

import { useEffect, useState } from "react";
import { StagePanel } from "@/components/convert/StagePanel";
import { cn } from "@/lib/cn";

type Thumb = { page: number; url: string };

type Props = {
  file: File;
  mode?: "view" | "pick";
  selected?: number[];
  onChange?: (pages: number[]) => void;
  label?: string;
  hint?: string;
};

export function PdfStage({
  file,
  mode = "view",
  selected = [],
  onChange,
  label = "Pages",
  hint,
}: Props) {
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setThumbs([]);
    setError("");
    (async () => {
      try {
        const { previewPdfPages } = await import("@/lib/convert/pdf-raster");
        const next = await previewPdfPages(file);
        if (!alive) return;
        setThumbs(next.thumbs);
        setTotal(next.total);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Could not preview this PDF.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [file]);

  function toggle(page: number) {
    if (mode !== "pick" || !onChange) return;
    onChange(selected.includes(page) ? selected.filter((item) => item !== page) : [...selected, page].sort((a, b) => a - b));
  }

  return (
    <StagePanel
      label={label}
      hint={hint ?? (total ? `${total} page${total === 1 ? "" : "s"}` : "Reading pages…")}
    >
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {thumbs.length
          ? thumbs.map((item) => {
              const active = mode === "view" || selected.includes(item.page);
              return (
                <button
                  key={item.page}
                  type="button"
                  disabled={mode === "view"}
                  onClick={() => toggle(item.page)}
                  className={cn(
                    "relative w-20 shrink-0 overflow-hidden rounded-xl border bg-white p-1 text-left transition duration-180",
                    active ? "border-accent shadow-drop" : "border-[#e4dedb] opacity-55 hover:opacity-100",
                    mode === "pick" && "cursor-pointer hover:-translate-y-0.5",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" className="h-24 w-full rounded-lg object-cover object-top" />
                  <span className="mt-1 block text-center font-mono text-[9px] font-bold text-faint">{item.page}</span>
                </button>
              );
            })
          : !error
            ? Array.from({ length: 3 }, (_, index) => (
                <span key={index} className="h-[7.5rem] w-20 shrink-0 rounded-xl border border-[#e4dedb] bg-white" />
              ))
            : null}
      </div>
    </StagePanel>
  );
}

export function pagesToSpec(pages: number[]) {
  if (!pages.length) return "";
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
      continue;
    }
    parts.push(start === prev ? String(start) : `${start}-${prev}`);
    start = sorted[i];
    prev = sorted[i];
  }
  parts.push(start === prev ? String(start) : `${start}-${prev}`);
  return parts.join(", ");
}
