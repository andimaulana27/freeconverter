"use client";

import { useEffect, useRef, useState } from "react";

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
  const [url, setUrl] = useState("");

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  useEffect(() => {
    if (!url) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 360 / img.naturalWidth, 224 / img.naturalHeight);
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = url;
  }, [url]);

  function pick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height);
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
