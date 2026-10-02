"use client";

import { useEffect, useRef } from "react";
import { loadImage } from "@/lib/convert/canvas-draw";
import { isTiffName } from "@/lib/file";

type Props = {
  file: File;
  hex: string;
  onPick: (hex: string) => void;
};

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function ColorStage({ file, hex, onPick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let alive = true;
    (async () => {
      try {
        let source: HTMLCanvasElement | HTMLImageElement;
        if (isTiffName(file.name)) {
          const { canvasFromTiff } = await import("@/lib/convert/tiff");
          source = (await canvasFromTiff(file)).canvas;
        } else {
          source = await loadImage(file);
        }
        if (!alive) return;
        const naturalWidth = "naturalWidth" in source ? source.naturalWidth || source.width : source.width;
        const naturalHeight = "naturalHeight" in source ? source.naturalHeight || source.height : source.height;
        const scale = Math.min(1, 360 / naturalWidth, 224 / naturalHeight);
        canvas.width = Math.max(1, Math.round(naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(naturalHeight * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      } catch {
        if (!alive) return;
        canvas.width = 1;
        canvas.height = 1;
      }
    })();
    return () => {
      alive = false;
    };
  }, [file]);

  function pick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !canvas.width || !canvas.height) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(canvas.width - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width)));
    const y = Math.min(canvas.height - 1, Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height)));
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    onPick(toHex(pixel[0], pixel[1], pixel[2]));
  }

  return (
    <div className="mt-5">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-faint">Pick</p>
      <div className="flex flex-col items-start gap-3 bg-bone p-4">
        <canvas
          ref={canvasRef}
          className="max-h-56 max-w-full cursor-crosshair"
          onClick={pick}
        />
        <p className="flex items-center gap-3 font-mono text-sm text-ink">
          <span className="h-8 w-8 border border-line" style={{ background: hex }} />
          {hex}
        </p>
      </div>
    </div>
  );
}
