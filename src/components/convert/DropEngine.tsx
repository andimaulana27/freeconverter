"use client";

import { useMemo, useState } from "react";
import type { ToolDef } from "@/lib/tools";
import { extOf } from "@/lib/file";
import { rasterConvert } from "@/lib/convert/image";
import { imagesToPdf, mergePdfs, rotatePdf, splitPdf } from "@/lib/convert/pdf";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FileChip } from "@/components/ui/FileChip";
import { Surface } from "@/components/ui/Surface";
import { cn } from "@/lib/cn";

type Props = {
  tool?: ToolDef | null;
};

function guessOutput(files: File[], tool?: ToolDef | null) {
  if (tool) return tool.output;
  const ext = files[0] ? extOf(files[0].name) : "";
  if (ext === "ttf" || ext === "otf") return "woff2";
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "webp", "bmp", "gif", "heic", "heif"].includes(ext)) return "jpg";
  return "";
}

export function DropEngine({ tool }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [width, setWidth] = useState(1600);
  const output = useMemo(() => guessOutput(files, tool), [files, tool]);
  const dragging = drag > 0;

  function take(list: FileList | File[]) {
    setError("");
    setDone(false);
    setFiles(Array.from(list));
  }

  function removeAt(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index));
    setDone(false);
  }

  async function run() {
    if (!files.length) {
      setError("Pilih file dulu.");
      return;
    }
    const slug = tool?.slug;
    const first = files[0];
    const ext = extOf(first.name);
    setBusy(true);
    setError("");
    setDone(false);
    try {
      if (tool?.need === "vps") {
        throw new Error("Tool ini butuh worker VPS. Aktif setelah Scan Vortex pindah ke 12 core.");
      }
      if (slug === "merge-pdf" || (!slug && ext === "pdf" && files.length > 1)) {
        await mergePdfs(files);
      } else if (slug === "split-pdf") {
        await splitPdf(first);
      } else if (slug === "rotate-pdf") {
        await rotatePdf(first);
      } else if (slug === "jpg-to-pdf" || (!slug && ["jpg", "jpeg", "png", "webp"].includes(ext) && output === "pdf")) {
        await imagesToPdf(files);
      } else if (slug === "ttf-to-woff2" || slug === "otf-to-woff2" || ext === "ttf" || ext === "otf") {
        const { fontToWoff2 } = await import("@/lib/convert/font");
        for (const file of files) await fontToWoff2(file);
      } else if (slug === "image-resizer") {
        for (const file of files) await rasterConvert(file, "png", { width });
      } else if (slug === "image-compressor") {
        for (const file of files) await rasterConvert(file, "jpg", { quality: 0.72 });
      } else if (slug === "gif-compressor") {
        for (const file of files) await rasterConvert(file, "jpg", { quality: 0.7 });
      } else if (tool?.engine === "canvas" || ["png", "jpg", "jpeg", "webp", "bmp", "gif", "heic", "heif"].includes(ext)) {
        const out = (
          tool?.output === "jpg" || tool?.output === "png" || tool?.output === "webp" || tool?.output === "gif"
            ? tool.output
            : "jpg"
        ) as "jpg" | "png" | "webp" | "gif";
        for (const file of files) await rasterConvert(file, out === "gif" ? "jpg" : out);
      } else if (ext === "pdf") {
        await mergePdfs(files);
      } else {
        throw new Error("Format ini belum bisa di browser. Video/audio menyusul di Fase 3.");
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Konversi gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Surface
      className={cn(
        "relative overflow-hidden p-6 transition duration-180 sm:p-8",
        dragging && "border-accent bg-accent-soft shadow-glow",
      )}
      onDragEnter={(e) => {
        e.preventDefault();
        setDrag((n) => n + 1);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDrag((n) => Math.max(0, n - 1));
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(0);
        if (e.dataTransfer.files?.length) take(e.dataTransfer.files);
      }}
    >
      {busy ? (
        <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-accent-soft">
          <div className="h-full w-1/3 bg-accent animate-progress" />
        </div>
      ) : null}

      <label className="flex cursor-pointer flex-col items-start gap-3">
        <input
          type="file"
          multiple
          accept={
            tool?.inputs.length
              ? tool.inputs.map((ext) => `.${ext}`).join(",")
              : ".png,.jpg,.jpeg,.webp,.bmp,.gif,.pdf,.ttf,.otf,.heic,.heif"
          }
          className="sr-only"
          onChange={(e) => e.target.files && take(e.target.files)}
        />
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-card border border-dashed border-line text-accent transition duration-180",
            dragging && "border-accent bg-paper",
          )}
          aria-hidden
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-base font-semibold text-ink">{dragging ? "Release to add files" : "Drop files here"}</span>
        <span className="text-sm text-mute">or click to browse · max ~30 MB · stays on this device</span>
      </label>

      {files.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-2">
          {files.map((file, index) => (
            <FileChip
              key={file.name + file.size + index}
              name={file.name}
              size={file.size}
              onRemove={() => removeAt(index)}
            />
          ))}
        </ul>
      ) : null}

      {tool?.slug === "image-resizer" ? (
        <div className="mt-5">
          <Field
            label="Width"
            hint="px"
            type="number"
            min={16}
            max={8000}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value) || 1600)}
            className="w-28"
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={run} loading={busy}>
          {busy ? "Converting" : "Convert"}
        </Button>
        {files.length > 0 ? (
          <Button
            variant="secondary"
            onClick={() => {
              setFiles([]);
              setError("");
              setDone(false);
            }}
          >
            Clear
          </Button>
        ) : null}
        {tool ? (
          <span className="text-sm text-faint">
            {tool.inputs.join(", ").toUpperCase()} → {tool.output.toUpperCase()}
          </span>
        ) : output ? (
          <span className="text-sm text-faint">Detected · {output.toUpperCase()}</span>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-danger animate-enter">{error}</p> : null}
      {done && !error ? <p className="mt-3 text-sm text-ok animate-enter">Downloaded. Drop another file to convert again.</p> : null}
      {tool?.need === "vps" ? (
        <p className="mt-3 text-sm text-mute">Halaman ini sudah ada untuk SEO. Encode video menunggu worker di VPS 6 core.</p>
      ) : null}
    </Surface>
  );
}
