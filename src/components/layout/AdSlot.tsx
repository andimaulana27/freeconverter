"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type AdFormat = "leaderboard" | "rectangle" | "skyscraper";

type AdSpec = {
  width: number;
  height: number;
  slot?: string;
};

type Props = {
  className?: string;
  format?: AdFormat;
};

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT;

function GoogleUnit({ spec }: { spec: AdSpec }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT || !spec.slot || initialized.current) return;
    initialized.current = true;

    try {
      const adsWindow = window as typeof window & { adsbygoogle?: Record<string, never>[] };
      (adsWindow.adsbygoogle ??= []).push({});
    } catch {
      initialized.current = false;
    }
  }, [spec.slot]);

  if (!ADSENSE_CLIENT || !spec.slot) {
    return (
      <div
        className="grid place-items-center border border-dashed border-[#d6ceca] bg-white/80 text-center"
        style={{ width: spec.width, height: spec.height }}
      >
        <span>
          <span className="block font-mono text-micro font-bold uppercase text-mute">Fixed ad unit</span>
          <span className="mt-1 block text-[10px] text-mute">{spec.width} × {spec.height}</span>
        </span>
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "inline-block", width: spec.width, height: spec.height }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={spec.slot}
      data-full-width-responsive="false"
      data-adtest={process.env.NODE_ENV === "production" ? undefined : "on"}
    />
  );
}

export function AdSlot({ className, format = "leaderboard" }: Props) {
  const [mobileBanner, setMobileBanner] = useState<boolean | null>(format === "leaderboard" ? null : false);

  useEffect(() => {
    if (format !== "leaderboard") return;
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMobileBanner(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [format]);

  const spec: AdSpec =
    format === "skyscraper"
      ? { width: 160, height: 600, slot: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_VERTICAL_SLOT }
      : format === "rectangle"
        ? { width: 300, height: 250, slot: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_RECTANGLE_SLOT }
        : mobileBanner
          ? {
              width: 320,
              height: 100,
              slot: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_MOBILE_SLOT ?? process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_HORIZONTAL_SLOT,
            }
          : { width: 728, height: 90, slot: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_HORIZONTAL_SLOT };
  const ready = format !== "leaderboard" || mobileBanner !== null;

  return (
    <aside
      aria-label="Advertisement"
      className={cn(
        "group relative flex flex-col items-center justify-center gap-2 overflow-hidden border border-[#ded7d3] bg-[#f6f3f1] text-mute shadow-drop",
        format === "leaderboard"
          ? "left-1/2 min-h-[132px] w-screen max-w-full -translate-x-1/2 rounded-tile px-0 py-4 sm:left-auto sm:w-full sm:translate-x-0"
          : format === "rectangle"
            ? "min-h-[294px] rounded-tile p-4"
            : "h-[638px] w-[160px] rounded-card py-3",
        className,
      )}
    >
      <div
        className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(24,20,18,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(24,20,18,0.035)_1px,transparent_1px)] [background-size:32px_32px]"
        aria-hidden
      />
      <span className="relative font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-mute">Advertisement</span>
      <div className="relative flex w-full justify-center overflow-visible">
        {ready ? <GoogleUnit key={`${spec.width}x${spec.height}:${spec.slot ?? "preview"}`} spec={spec} /> : (
          <div className="h-[100px] w-[320px] sm:h-[90px] sm:w-[728px]" aria-hidden />
        )}
      </div>
    </aside>
  );
}
