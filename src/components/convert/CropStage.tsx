"use client";

import { useEffect, useRef, useState } from "react";
import type { CropBox } from "@/lib/convert/image-types";
import { cn } from "@/lib/cn";

type Handle = "move" | "nw" | "ne" | "sw" | "se";

type Props = {
  file?: File;
  value: CropBox;
  onChange: (box: CropBox) => void;
  label?: string;
};

function clamp(box: CropBox): CropBox {
  const w = Math.min(1, Math.max(0.08, box.w));
  const h = Math.min(1, Math.max(0.08, box.h));
  return {
    w,
    h,
    x: Math.min(1 - w, Math.max(0, box.x)),
    y: Math.min(1 - h, Math.max(0, box.y)),
  };
}

export function CropStage({ file, value, onChange, label = "Crop" }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ handle: Handle; start: CropBox; x: number; y: number } | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  function point(event: React.PointerEvent) {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  function start(handle: Handle, event: React.PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const at = point(event);
    drag.current = { handle, start: value, x: at.x, y: at.y };
  }

  function move(event: React.PointerEvent) {
    const active = drag.current;
    if (!active) return;
    const at = point(event);
    const dx = at.x - active.x;
    const dy = at.y - active.y;
    const box = active.start;
    if (active.handle === "move") {
      onChange(clamp({ ...box, x: box.x + dx, y: box.y + dy }));
      return;
    }
    const next = { ...box };
    if (active.handle.includes("w")) {
      next.x = box.x + dx;
      next.w = box.w - dx;
    }
    if (active.handle.includes("e")) next.w = box.w + dx;
    if (active.handle.includes("n")) {
      next.y = box.y + dy;
      next.h = box.h - dy;
    }
    if (active.handle.includes("s")) next.h = box.h + dy;
    onChange(clamp(next));
  }

  function end() {
    drag.current = null;
  }

  const handles: { id: Handle; className: string }[] = [
    { id: "nw", className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" },
    { id: "ne", className: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize" },
    { id: "sw", className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize" },
    { id: "se", className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize" },
  ];

  return (
    <div className="mt-5">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-faint">{label}</p>
      <div className="flex justify-center bg-bone py-4">
        <div
          ref={frame}
          className="relative inline-block max-h-56 max-w-full overflow-hidden touch-none select-none"
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="block max-h-56 max-w-full" draggable={false} />
          ) : (
            <span className="block h-56 w-40 border border-line bg-paper" />
          )}
          <span
            className="absolute cursor-move border border-accent"
            style={{
              left: `${value.x * 100}%`,
              top: `${value.y * 100}%`,
              width: `${value.w * 100}%`,
              height: `${value.h * 100}%`,
              boxShadow: "0 0 0 999px rgba(17,17,17,0.4)",
            }}
            onPointerDown={(event) => start("move", event)}
          >
            {handles.map((handle) => (
              <span
                key={handle.id}
                className={cn("absolute h-2.5 w-2.5 bg-accent", handle.className)}
                onPointerDown={(event) => start(handle.id, event)}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
