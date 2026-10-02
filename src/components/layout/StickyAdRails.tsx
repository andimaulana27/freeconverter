"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdSlot } from "@/components/layout/AdSlot";

export function StickyAdRails() {
  const pathname = usePathname();
  const [eligible, setEligible] = useState(false);
  const [startOffset, setStartOffset] = useState<number | null>(pathname === "/" ? null : 0);

  useLayoutEffect(() => {
    if (pathname !== "/") {
      setStartOffset(0);
      return;
    }

    const main = document.querySelector<HTMLElement>("main");
    const anchor = document.querySelector<HTMLElement>("[data-home-ad-rail-start]");
    if (!main || !anchor) {
      setStartOffset(0);
      return;
    }

    const update = () => {
      const mainTop = main.getBoundingClientRect().top + window.scrollY;
      const anchorTop = anchor.getBoundingClientRect().top + window.scrollY;
      setStartOffset(Math.max(0, anchorTop - mainTop));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(main);
    observer.observe(anchor);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1840px) and (min-height: 760px)");
    const update = () => setEligible(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (!eligible || startOffset === null) return null;

  return (
    <>
      <div
        className="ad-side-rail absolute bottom-0 z-20"
        style={{
          left: "max(16px, calc((100vw - 72rem) / 2 - 176px))",
          top: startOffset,
        }}
      >
        <div className="sticky top-24">
          <AdSlot format="skyscraper" />
        </div>
      </div>
      <div
        className="ad-side-rail absolute bottom-0 z-20"
        style={{
          right: "max(16px, calc((100vw - 72rem) / 2 - 176px))",
          top: startOffset,
        }}
      >
        <div className="sticky top-24">
          <AdSlot format="skyscraper" />
        </div>
      </div>
    </>
  );
}
