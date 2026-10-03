"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { ToolDef } from "@/lib/tools";
import { acceptsInput, conversionSource, sourceKey, toolsForDropped } from "@/lib/tools";
import { extOf, isTiffName } from "@/lib/file";
import { DEFAULT_CROP, type CropBox, type ImageTurn } from "@/lib/convert/image-types";
import { convertUnit, formatUnit, UNIT_OPTIONS, type UnitKind } from "@/lib/convert/units";
import {
  formatPickerHint,
  isImageJob,
  isImageSource,
  isLossyOutput,
  workspaceOutputs,
  workspaceSource,
} from "@/lib/convert/workspace";
import { writePdfExport, writeRasterFiles } from "@/lib/convert/write-output";
import { useConvertSession } from "@/components/convert/ConvertSession";
import { ColorStage } from "@/components/convert/ColorStage";
import { CropStage } from "@/components/convert/CropStage";
import { FormatArtwork } from "@/components/convert/FormatArtwork";
import { JobPicks, OutputSwitch } from "@/components/convert/OutputSwitch";
import { pagesToSpec } from "@/components/convert/PdfStage";
import { StagePanel } from "@/components/convert/StagePanel";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FileChip } from "@/components/ui/FileChip";
import { cn } from "@/lib/cn";

const FillFormStage = dynamic(
  () => import("@/components/convert/FillFormStage").then((module) => module.FillFormStage),
  { ssr: false, loading: () => <p className="mt-5 text-sm text-mute">Reading form fields…</p> },
);

const PdfStage = dynamic(
  () => import("@/components/convert/PdfStage").then((module) => module.PdfStage),
  { ssr: false },
);

function runButtonLabel(active: ToolDef | null | undefined, output: string, busy: boolean, noFile: boolean, mergePdf: boolean) {
  if (busy) return "Converting";
  if (noFile) return "Convert";
  if (mergePdf) return "Merge PDF";
  if (active?.slug === "image-compressor" && output) return `Compress to ${output.toUpperCase()}`;
  if (active?.slug === "image-resizer" && output) return `Resize to ${output.toUpperCase()}`;
  if (active && !conversionSource(active) && !output) return active.title;
  if (output) return `Convert to ${output.toUpperCase()}`;
  return "Convert file";
}

function convertErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Conversion failed.";
  if (/Failed to load chunk|Loading chunk|Failed to fetch dynamically imported module|error loading dynamically imported module/i.test(message)) {
    return "A conversion module failed to load. Refresh the page and try again.";
  }
  if (/WinAnsi|WinAnsiEncoding|cannot encode/i.test(message)) {
    return "This text uses characters the PDF font cannot write. Try simpler Latin text.";
  }
  if (/password|encrypted/i.test(message)) {
    return "This PDF is password-protected.";
  }
  return message;
}

async function pngReady(list: File[]) {
  if (!list.some((file) => isTiffName(file.name))) return list;
  const { tiffFilesAsPng } = await import("@/lib/convert/tiff");
  return tiffFilesAsPng(list);
}

type Props = {
  tool?: ToolDef | null;
  variant?: "default" | "hero";
};

export function DropEngine({ tool, variant = "default" }: Props) {
  const { files, setFiles, clearFiles } = useConvertSession();
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [width, setWidth] = useState(1600);
  const [height, setHeight] = useState(1600);
  const [natural, setNatural] = useState({ width: 1600, height: 1600 });
  const [lockRatio, setLockRatio] = useState(true);
  const [quality, setQuality] = useState(72);
  const [crop, setCrop] = useState<CropBox>(DEFAULT_CROP);
  const [pages, setPages] = useState("1");
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [mark, setMark] = useState("DRAFT");
  const [hex, setHex] = useState("#D92D28");
  const [turn, setTurn] = useState<ImageTurn>("90");
  const [flip, setFlip] = useState<ImageTurn>("flip-h");
  const [pdfTurn, setPdfTurn] = useState("90");
  const [orderMode, setOrderMode] = useState<"reverse" | "custom">("reverse");
  const [order, setOrder] = useState("1,2,3");
  const [sign, setSign] = useState("Signed");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [collageCols, setCollageCols] = useState<"2" | "3">("2");
  const [unitKind, setUnitKind] = useState<UnitKind>("mass");
  const [unitFrom, setUnitFrom] = useState("kg");
  const [unitTo, setUnitTo] = useState("lb");
  const [unitAmount, setUnitAmount] = useState("1");
  const [unitResult, setUnitResult] = useState("");
  const [homeSlug, setHomeSlug] = useState<string | null>(null);
  const [outputOverride, setOutputOverride] = useState(tool?.output ?? "");
  const [pdfPageFile, setPdfPageFile] = useState<File | null>(null);
  const dragging = drag > 0;

  const homeOptions = useMemo(() => {
    if (tool || !files[0]) return [];
    return toolsForDropped(extOf(files[0].name));
  }, [tool, files]);

  const homeTool = homeOptions.find((item) => item.slug === homeSlug) ?? homeOptions[0] ?? null;
  const active = tool ?? homeTool;
  const slug = active?.slug;
  const droppedExt = files[0] ? extOf(files[0].name) : "";

  useEffect(() => {
    if (!slug || files.length === 0) return;
    const onceKey = `ayc-metric:tool_start:${slug}`;
    if (sessionStorage.getItem(onceKey)) return;
    sessionStorage.setItem(onceKey, "1");
    void fetch("/api/metrics/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: `/${slug}`, key: "tool_start" }),
      keepalive: true,
    });
  }, [slug, files.length]);
  const source = workspaceSource(active, droppedExt);
  const mergePdf = !tool && source === "pdf" && files.length > 1;
  const formatOptions = useMemo(
    () => (mergePdf ? [] : workspaceOutputs(active, source)),
    [active, mergePdf, source],
  );
  const output = outputOverride || active?.output || formatOptions[0]?.output || "";
  const singleFile =
    slug === "crop-image" ||
    slug === "color-picker" ||
    slug === "rotate-image" ||
    slug === "flip-image" ||
    slug === "rotate-pdf" ||
    slug === "delete-pdf-pages" ||
    slug === "extract-pdf-pages" ||
    slug === "watermark-pdf" ||
    slug === "pdf-page-numbers" ||
    slug === "crop-pdf" ||
    slug === "unlock-pdf" ||
    slug === "organize-pdf" ||
    slug === "flatten-pdf" ||
    slug === "redact-pdf" ||
    slug === "sign-pdf" ||
    slug === "pdf-to-jpg" ||
    slug === "pdf-to-png" ||
    slug === "pdf-to-webp" ||
    slug === "pdf-to-bmp" ||
    slug === "txt-to-pdf" ||
    slug === "csv-to-pdf" ||
    slug === "html-to-pdf" ||
    slug === "html-to-txt" ||
    slug === "fill-pdf" ||
    slug === "extract-pdf-images" ||
    slug === "json-formatter" ||
    slug === "pdf-to-tiff" ||
    slug === "pdf-to-txt" ||
    slug === "pdf-to-docx" ||
    slug === "docx-to-pdf" ||
    slug === "docx-to-txt" ||
    slug === "docx-to-html" ||
    slug === "xlsx-to-pdf" ||
    slug === "xlsx-to-csv" ||
    slug === "xlsx-to-json" ||
    slug === "csv-to-xlsx" ||
    slug === "csv-to-json" ||
    slug === "json-to-csv" ||
    slug === "json-to-xlsx" ||
    slug === "pptx-to-pdf" ||
    slug === "pptx-to-txt";
  const noFile = slug === "unit-converter";
  const visualFrom = files[0] ? extOf(files[0].name) : noFile ? "unit" : (active?.inputs?.[0] ?? "file");
  const visualTo = output || "format";
  const showQuality =
    slug !== "image-resizer" &&
    (slug === "image-compressor" || slug === "gif-compressor" || isLossyOutput(output));
  const showPdfStage =
    Boolean(files[0] && source === "pdf") &&
    slug !== "crop-pdf" &&
    slug !== "redact-pdf" &&
    slug !== "fill-pdf" &&
    slug !== "merge-pdf" &&
    !mergePdf;
  const pickPdfPages = slug === "delete-pdf-pages" || slug === "extract-pdf-pages";

  useEffect(() => {
    setOutputOverride(tool?.output ?? "");
    setSelectedPages([]);
    setPdfPageFile(null);
  }, [tool?.slug, tool?.output]);

  useEffect(() => {
    if (tool) return;
    const next = formatOptions[0]?.output ?? "";
    setOutputOverride((current) => (formatOptions.some((item) => item.output === current) ? current : next));
  }, [tool, formatOptions]);

  useEffect(() => {
    let next = files;
    if (tool?.inputs?.length) {
      const kept = next.filter((file) => acceptsInput(file.name, tool.inputs));
      if (kept.length !== next.length) next = kept;
    }
    if (singleFile && next.length > 1) next = next.slice(0, 1);
    if (next !== files) setFiles(next);
  }, [tool, files, setFiles, singleFile]);

  useEffect(() => {
    const file = files[0];
    if (!file || slug !== "image-resizer") return;
    let alive = true;
    (async () => {
      try {
        if (isTiffName(file.name)) {
          const { canvasFromTiff } = await import("@/lib/convert/tiff");
          const size = await canvasFromTiff(file);
          if (!alive) return;
          setNatural({ width: size.width, height: size.height });
          setWidth(size.width);
          setHeight(size.height);
          return;
        }
        const { loadImage, sizeOf } = await import("@/lib/convert/canvas-draw");
        const img = await loadImage(file);
        if (!alive) return;
        const size = sizeOf(img);
        setNatural(size);
        setWidth(size.width);
        setHeight(size.height);
      } catch {
        /* keep the last size */
      }
    })();
    return () => {
      alive = false;
    };
  }, [files, slug]);

  useEffect(() => {
    const file = files[0];
    if (!file || (slug !== "crop-pdf" && slug !== "redact-pdf")) {
      setPdfPageFile(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const { renderPdfPageFile } = await import("@/lib/convert/pdf-raster");
        const next = await renderPdfPageFile(file);
        if (alive) setPdfPageFile(next);
      } catch {
        if (alive) setPdfPageFile(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [files, slug]);

  function take(list: FileList | File[]) {
    const incoming = Array.from(list);
    if (!incoming.length) return;
    setError("");
    setDone(false);

    let allowed = incoming;
    if (tool?.inputs?.length) {
      allowed = incoming.filter((file) => acceptsInput(file.name, tool.inputs));
      if (!allowed.length) {
        setError(`Choose a ${tool.inputs.map((item) => item.toUpperCase()).join(", ")} file.`);
        return;
      }
    } else if (!tool) {
      const anchor = files[0] ?? incoming[0];
      const dropped = sourceKey(extOf(anchor.name));
      allowed = incoming.filter((file) => sourceKey(extOf(file.name)) === dropped);
      if (!allowed.length) {
        setError("Additional files must use the same format.");
        return;
      }
    }

    if (singleFile) {
      setCrop(DEFAULT_CROP);
      setHex("#D92D28");
      setSelectedPages([]);
      setFiles(allowed.slice(0, 1));
      return;
    }

    const seen = new Set(files.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
    const extra = allowed.filter((file) => !seen.has(`${file.name}:${file.size}:${file.lastModified}`));
    setFiles([...files, ...extra]);
  }

  function removeAt(index: number) {
    setFiles(files.filter((_, i) => i !== index));
    setDone(false);
  }

  function pickOutput(next: string) {
    setOutputOverride(next);
    setError("");
    setDone(false);
  }

  function setResizeWidth(next: number) {
    const value = Math.max(16, Math.min(8000, next || 16));
    setWidth(value);
    if (lockRatio && natural.width) {
      setHeight(Math.max(16, Math.round((value * natural.height) / natural.width)));
    }
  }

  function setResizeHeight(next: number) {
    const value = Math.max(16, Math.min(8000, next || 16));
    setHeight(value);
    if (lockRatio && natural.height) {
      setWidth(Math.max(16, Math.round((value * natural.width) / natural.height)));
    }
  }

  function pickPdf(next: number[]) {
    setSelectedPages(next);
    setPages(pagesToSpec(next) || "1");
  }

  async function run() {
    if (slug === "unit-converter") {
      setBusy(true);
      setError("");
      setDone(false);
      try {
        const value = convertUnit(unitKind, Number(unitAmount), unitFrom, unitTo);
        setUnitResult(`${formatUnit(value)} ${unitTo}`);
        setDone(true);
      } catch (e) {
        setError(convertErrorMessage(e));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!files.length) {
      setError("Choose a file first.");
      return;
    }
    const first = files[0];
    const ext = extOf(first.name);
    const from = sourceKey(ext);
    setBusy(true);
    setError("");
    setDone(false);
    try {
      if (active?.inputs?.length) {
        const mismatch = files.filter((file) => !acceptsInput(file.name, active.inputs));
        if (mismatch.length) {
          throw new Error(`Choose a ${active.inputs.map((item) => item.toUpperCase()).join(", ")} file.`);
        }
      }
      if (active?.need === "vps") {
        throw new Error("This conversion needs a server worker and is not available in the browser yet. Choose a format this page can write locally.");
      }
      const qualityValue = quality / 100;
      if (slug === "merge-pdf" || mergePdf) {
        const { mergePdfs } = await import("@/lib/convert/pdf");
        await mergePdfs(files);
      } else if (slug === "split-pdf") {
        const { splitPdf } = await import("@/lib/convert/pdf");
        await splitPdf(files);
      } else if (slug === "rotate-pdf") {
        const { rotatePdf } = await import("@/lib/convert/pdf");
        await rotatePdf(first, Number(pdfTurn) || 90);
      } else if (slug === "delete-pdf-pages") {
        const { deletePdfPages } = await import("@/lib/convert/pdf");
        await deletePdfPages(first, pages);
      } else if (slug === "extract-pdf-pages") {
        const { extractPdfPages } = await import("@/lib/convert/pdf");
        await extractPdfPages(first, pages);
      } else if (slug === "watermark-pdf") {
        const { watermarkPdf } = await import("@/lib/convert/pdf");
        await watermarkPdf(first, mark);
      } else if (slug === "pdf-page-numbers") {
        const { numberPdfPages } = await import("@/lib/convert/pdf");
        await numberPdfPages(first);
      } else if (slug === "crop-pdf") {
        const { cropPdf } = await import("@/lib/convert/pdf");
        await cropPdf(first, crop);
      } else if (slug === "unlock-pdf") {
        const { unlockPdf } = await import("@/lib/convert/pdf");
        await unlockPdf(first);
      } else if (slug === "organize-pdf") {
        const { organizePdf } = await import("@/lib/convert/pdf");
        await organizePdf(first, orderMode === "reverse" ? "reverse" : order);
      } else if (slug === "flatten-pdf") {
        const { flattenPdf } = await import("@/lib/convert/pdf");
        await flattenPdf(first);
      } else if (slug === "redact-pdf") {
        const { redactPdf } = await import("@/lib/convert/pdf");
        await redactPdf(first, crop);
      } else if (slug === "sign-pdf") {
        const { signPdf } = await import("@/lib/convert/pdf");
        await signPdf(first, sign);
      } else if (slug === "fill-pdf") {
        const { fillPdf } = await import("@/lib/convert/pdf");
        await fillPdf(first, formValues);
      } else if (slug === "extract-pdf-images") {
        const { extractPdfImages } = await import("@/lib/convert/pdf-raster");
        await extractPdfImages(first);
      } else if (from === "pdf" || slug?.startsWith("pdf-to-")) {
        await writePdfExport(first, output, qualityValue);
      } else if (slug === "collage-maker") {
        const ready = await pngReady(files);
        const { collageImages } = await import("@/lib/convert/image");
        await collageImages(ready, Number(collageCols), output);
      } else if (slug === "rotate-image") {
        const [ready] = await pngReady([first]);
        const { rasterTransform } = await import("@/lib/convert/image");
        await rasterTransform(ready, turn, output);
      } else if (slug === "flip-image") {
        const [ready] = await pngReady([first]);
        const { rasterTransform } = await import("@/lib/convert/image");
        await rasterTransform(ready, flip, output);
      } else if (slug === "crop-image") {
        const [ready] = await pngReady([first]);
        const { rasterCrop } = await import("@/lib/convert/image");
        await rasterCrop(ready, crop, output);
      } else if (slug === "color-picker") {
        const { downloadColorSwatch } = await import("@/lib/convert/image");
        await downloadColorSwatch(hex);
      } else if (slug === "ttf-to-woff2" || slug === "otf-to-woff2" || slug === "woff-to-woff2" || ext === "ttf" || ext === "otf" || ext === "woff") {
        const { fontToWoff2 } = await import("@/lib/convert/font");
        for (const file of files) await fontToWoff2(file);
      } else if (from === "html" || slug?.startsWith("html-to-")) {
        const html = await import("@/lib/convert/html-pdf");
        if (output === "txt") await html.htmlToTxt(first);
        else await html.htmlToPdf(first);
      } else if (from === "txt" || slug === "txt-to-pdf") {
        const { txtToPdf } = await import("@/lib/convert/pdf");
        await txtToPdf(first);
      } else if (from === "docx" || slug?.startsWith("docx-to-")) {
        const { convertDocx } = await import("@/lib/convert/docx");
        await convertDocx(first, slug ?? "", output);
      } else if (from === "json" && (output === "json" || slug === "json-formatter" && !outputOverride)) {
        const { formatJson } = await import("@/lib/convert/json");
        await formatJson(first);
      } else if (from === "csv" && output === "pdf") {
        const { csvToPdf } = await import("@/lib/convert/pdf");
        await csvToPdf(first);
      } else if (
        slug?.startsWith("xlsx-to-") ||
        slug?.startsWith("pptx-to-") ||
        slug === "csv-to-xlsx" ||
        slug === "csv-to-json" ||
        slug === "json-to-csv" ||
        slug === "json-to-xlsx" ||
        from === "xlsx" ||
        from === "pptx" ||
        from === "csv" ||
        from === "json"
      ) {
        const { convertOffice } = await import("@/lib/convert/office");
        await convertOffice(first, slug ?? "", output);
      } else if (isImageJob(slug) || isImageSource(from) || active?.engine === "canvas") {
        await writeRasterFiles(files, output, slug === "image-resizer"
          ? { width, height: lockRatio ? undefined : height, stretch: !lockRatio }
          : showQuality
            ? { quality: qualityValue }
            : undefined);
      } else {
        throw new Error("This format is not available in the browser yet. Video and audio require a dedicated worker.");
      }
      setDone(true);
    } catch (e) {
      setError(convertErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden bg-paper transition duration-280",
        variant === "hero" && "rounded-[22px] bg-white",
        dragging && "bg-accent-soft",
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
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-0 bg-accent transition-all duration-280",
          dragging && "w-1",
        )}
      />

      {busy ? (
        <div className="absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-accent-soft">
          <div className="h-full w-1/3 bg-accent animate-progress" />
        </div>
      ) : null}

      <label className={cn("block", noFile ? "pointer-events-none" : "cursor-pointer")} suppressHydrationWarning>
        {noFile ? null : (
        <input
          type="file"
          multiple={!singleFile}
          suppressHydrationWarning
          accept={
            tool?.inputs?.length
              ? tool.inputs.map((item) => `.${item}`).join(",")
              : ".png,.jpg,.jpeg,.webp,.bmp,.gif,.ico,.svg,.avif,.tif,.tiff,.pdf,.txt,.csv,.html,.htm,.json,.ttf,.otf,.woff,.heic,.heif,.docx,.xlsx,.pptx,.doc,.odt,.rtf,.epub,.mobi,.zip,.rar,.7z,.tar,.mp4,.mov,.mkv,.webm,.mp3,.wav,.flac,.ogg"
          }
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) take(e.target.files);
            e.target.value = "";
          }}
        />
        )}
        <FormatArtwork
          from={visualFrom}
          to={visualTo}
          category={active?.category}
          active={dragging}
          busy={busy}
          variant={variant}
        />
        <span className={cn(
          "flex flex-col gap-3",
          variant === "hero" && "items-start gap-2 px-5 py-5 sm:px-6",
          !noFile && !files.length && variant !== "hero" && "m-6 items-center rounded-card border border-dashed border-accent/55 bg-[#fff8f7] px-6 py-8 text-center sm:m-8 sm:px-8 sm:py-10",
          (noFile || files.length > 0) && variant !== "hero" && "px-6 pt-6 sm:px-8 sm:pt-8",
        )}>
          <span className="flex w-full items-center justify-between gap-4">
            <span className={cn("text-[10px] font-bold uppercase tracking-[0.18em] text-mute", variant === "hero" && "text-[9px]")}>
              {variant === "hero" ? "Drop zone" : "Start here"}
            </span>
          </span>
          <span className={cn(
            "text-xl font-semibold tracking-[-0.025em] text-ink sm:text-2xl",
            variant === "hero" && "text-lg sm:text-xl",
            !noFile && !files.length && variant !== "hero" && "text-2xl sm:text-[28px]",
          )}>
            {dragging
              ? "Release to add the file"
              : noFile
                ? "Pick units"
                : files.length
                  ? (singleFile ? "Ready to convert" : "Add more, or convert")
                  : visualFrom === "file"
                    ? "Drop a file here"
                    : `Drop your ${visualFrom.toUpperCase()} ${singleFile ? "file" : "files"} here`}
          </span>
          <span className={cn("text-sm text-mute", variant === "hero" && "text-xs")}>
            {noFile
              ? variant === "hero" ? "No file needed · choose two units" : "No file needed · stays on this device"
              : variant === "hero"
                ? "Drag and drop, or browse from this device"
                : `Drag and drop, or choose ${singleFile ? "a file" : "files"} from this device · up to ~30 MB`}
          </span>
          {!noFile && !files.length ? (
            <span className={cn("mt-4 inline-flex", variant === "hero" ? "self-start" : "self-center")}>
              <span className={cn(
                "group/upload inline-flex items-center gap-2 rounded-control bg-accent font-semibold text-white shadow-action transition duration-180 hover:-translate-y-0.5 hover:bg-accent-ink",
                variant === "hero" ? "px-4 py-2.5 text-xs" : "px-5 py-3 text-sm",
              )}>
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 16h12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {singleFile ? "Upload file" : "Upload files"}
              </span>
            </span>
          ) : null}
        </span>
      </label>

      {files.length > 0 && !noFile ? (
        <ul className={cn("flex flex-col gap-1.5 px-6 pb-2 sm:px-8", variant === "hero" && "px-5 sm:px-6")}>
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

      <div className={cn(
        variant === "hero" ? "px-5 pb-6 sm:px-6" : "px-6 sm:px-8",
        variant !== "hero" && (noFile || files.length > 0) && "pb-8",
        variant !== "hero" && !noFile && files.length === 0 && "empty:hidden pb-6 sm:pb-8",
      )}>
        {formatOptions.length >= 2 ? (
          <OutputSwitch
            options={formatOptions}
            current={output}
            description={formatPickerHint(source, slug)}
            onSelect={(item) => pickOutput(item.output)}
          />
        ) : !tool ? (
          <OutputSwitch options={homeOptions} current={homeTool?.slug} onSelect={(item) => setHomeSlug(item.slug)} />
        ) : null}

        {showPdfStage && files[0] ? (
          <PdfStage
            file={files[0]}
            mode={pickPdfPages ? "pick" : "view"}
            selected={selectedPages}
            onChange={pickPdf}
            label={pickPdfPages ? "Pages" : "Preview"}
            hint={
              pickPdfPages
                ? "Tap pages, or type a range below."
                : slug === "split-pdf"
                  ? "Each page becomes its own PDF."
                  : undefined
            }
          />
        ) : null}

        {slug === "crop-image" && files[0] ? (
          <CropStage file={files[0]} value={crop} onChange={setCrop} />
        ) : null}
        {slug === "crop-pdf" || slug === "redact-pdf" ? (
          <CropStage
            file={pdfPageFile ?? undefined}
            value={crop}
            onChange={setCrop}
            label={slug === "redact-pdf" ? "Redact" : "Trim"}
          />
        ) : null}
        {slug === "rotate-image" ? (
          <StagePanel label="Turn" hint="Choose how far the image should rotate.">
            <JobPicks
              label="Angle"
              value={turn}
              onChange={(id) => setTurn(id as ImageTurn)}
              options={[
                { id: "90", label: "90°" },
                { id: "180", label: "180°" },
                { id: "270", label: "270°" },
              ]}
            />
          </StagePanel>
        ) : null}
        {slug === "flip-image" ? (
          <StagePanel label="Flip" hint="Mirror the image on one axis.">
            <JobPicks
              label="Axis"
              value={flip}
              onChange={(id) => setFlip(id as ImageTurn)}
              options={[
                { id: "flip-h", label: "Horizontal" },
                { id: "flip-v", label: "Vertical" },
              ]}
            />
          </StagePanel>
        ) : null}
        {slug === "color-picker" && files[0] ? (
          <ColorStage file={files[0]} hex={hex} onPick={setHex} />
        ) : null}

        {slug === "image-resizer" ? (
          <StagePanel label="Size" hint="Keep ratio on to avoid stretching.">
            <div className="flex flex-wrap items-center gap-4">
              <Field
                label="Width"
                hint="px"
                type="number"
                min={16}
                max={8000}
                value={width}
                onChange={(e) => setResizeWidth(Number(e.target.value))}
                className="w-24 bg-white"
              />
              <Field
                label="Height"
                hint="px"
                type="number"
                min={16}
                max={8000}
                value={height}
                onChange={(e) => setResizeHeight(Number(e.target.value))}
                className="w-24 bg-white"
              />
            </div>
            <div className="mt-4">
              <JobPicks
                label="Ratio"
                value={lockRatio ? "lock" : "stretch"}
                onChange={(id) => setLockRatio(id === "lock")}
                options={[
                  { id: "lock", label: "Keep" },
                  { id: "stretch", label: "Stretch" },
                ]}
              />
            </div>
          </StagePanel>
        ) : null}

        {showQuality ? (
          <StagePanel label="Quality" hint="Lower quality makes a smaller file.">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={40}
                max={95}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value) || 72)}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#e4dedb] accent-accent"
                aria-label="Quality"
              />
              <span className="w-10 shrink-0 text-right font-mono text-xs font-semibold text-ink">{quality}%</span>
            </div>
          </StagePanel>
        ) : null}

        {slug === "delete-pdf-pages" || slug === "extract-pdf-pages" ? (
          <StagePanel label="Range" hint="Example: 1-3, 5">
            <Field
              label="Pages"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              className="w-40 bg-white"
            />
          </StagePanel>
        ) : null}

        {slug === "rotate-pdf" ? (
          <StagePanel label="Turn" hint="Applied to every page.">
            <JobPicks
              label="Angle"
              value={pdfTurn}
              onChange={setPdfTurn}
              options={[
                { id: "90", label: "90°" },
                { id: "180", label: "180°" },
                { id: "270", label: "270°" },
              ]}
            />
          </StagePanel>
        ) : null}

        {slug === "watermark-pdf" ? (
          <StagePanel label="Mark" hint="Drawn across the center of every page.">
            <Field label="Text" value={mark} onChange={(e) => setMark(e.target.value)} className="w-48 bg-white" />
          </StagePanel>
        ) : null}

        {slug === "organize-pdf" ? (
          <StagePanel label="Order" hint="Reverse the file, or type a custom sequence.">
            <JobPicks
              label="Mode"
              value={orderMode}
              onChange={(id) => setOrderMode(id as "reverse" | "custom")}
              options={[
                { id: "reverse", label: "Reverse" },
                { id: "custom", label: "Custom" },
              ]}
            />
            {orderMode === "custom" ? (
              <div className="mt-4">
                <Field label="Pages" hint="3,1,2" value={order} onChange={(e) => setOrder(e.target.value)} className="w-40 bg-white" />
              </div>
            ) : null}
          </StagePanel>
        ) : null}

        {slug === "sign-pdf" ? (
          <StagePanel label="Sign" hint="A simple text mark on every page.">
            <Field label="Name" value={sign} onChange={(e) => setSign(e.target.value)} className="w-48 bg-white" />
          </StagePanel>
        ) : null}

        {slug === "fill-pdf" && files[0] ? <FillFormStage file={files[0]} values={formValues} onChange={setFormValues} /> : null}

        {slug === "collage-maker" ? (
          <StagePanel label="Layout" hint="More columns make smaller cells.">
            <JobPicks
              label="Columns"
              value={collageCols}
              onChange={(id) => setCollageCols(id as "2" | "3")}
              options={[
                { id: "2", label: "2" },
                { id: "3", label: "3" },
              ]}
            />
          </StagePanel>
        ) : null}

        {slug === "unit-converter" ? (
          <StagePanel label="Units" hint="No file needed. The result stays on this page.">
            <JobPicks
              label="Kind"
              value={unitKind}
              onChange={(id) => {
                const kind = id as UnitKind;
                setUnitKind(kind);
                setUnitFrom(UNIT_OPTIONS[kind][0].id);
                setUnitTo(UNIT_OPTIONS[kind][1]?.id ?? UNIT_OPTIONS[kind][0].id);
                setUnitResult("");
              }}
              options={[
                { id: "mass", label: "Mass" },
                { id: "length", label: "Length" },
                { id: "temp", label: "Temp" },
              ]}
            />
            <div className="mt-4">
              <Field
                label="Value"
                type="number"
                value={unitAmount}
                onChange={(e) => setUnitAmount(e.target.value)}
                className="w-28 bg-white"
              />
            </div>
            <div className="mt-4">
              <JobPicks
                label="From"
                value={unitFrom}
                onChange={setUnitFrom}
                options={UNIT_OPTIONS[unitKind]}
              />
            </div>
            <div className="mt-4">
              <JobPicks
                label="To"
                value={unitTo}
                onChange={setUnitTo}
                options={UNIT_OPTIONS[unitKind]}
              />
            </div>
            {unitResult ? <p className="mt-4 font-mono text-lg text-ink">{unitResult}</p> : null}
          </StagePanel>
        ) : null}

        {noFile || files.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={run} loading={busy}>
              {runButtonLabel(active, output, busy, noFile, mergePdf)}
            </Button>
            {files.length > 0 && !noFile ? (
              <Button
                variant="secondary"
                onClick={() => {
                  clearFiles();
                  setHomeSlug(null);
                  setError("");
                  setDone(false);
                  setCrop(DEFAULT_CROP);
                  setFormValues({});
                  setUnitResult("");
                  setSelectedPages([]);
                  setPdfPageFile(null);
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-danger animate-enter">{error}</p> : null}
        {done && !error ? (
          <p className="mt-3 text-sm text-ok animate-enter">
            {slug === "color-picker"
              ? `${hex} copied. Swatch downloaded.`
              : slug === "unit-converter"
                ? unitResult
                : "Downloaded. Drop another file to convert again."}
          </p>
        ) : null}
        {active?.need === "vps" ? (
          <p className="mt-3 text-sm text-mute">
            This workflow will become available when the dedicated conversion worker is online.
          </p>
        ) : null}
        {slug === "unlock-pdf" ? (
          <p className="mt-3 text-sm text-mute">
            Removes common print and copy restrictions. Password-protected PDFs may not decode in every browser.
          </p>
        ) : null}
        {slug === "redact-pdf" ? (
          <p className="mt-3 text-sm text-mute">
            Black boxes cover the selected area. Underlying text may still remain in the document data.
          </p>
        ) : null}
        {slug === "flatten-pdf" ? (
          <p className="mt-3 text-sm text-mute">Works with PDFs that contain AcroForm fields.</p>
        ) : null}
        {slug === "fill-pdf" ? (
          <p className="mt-3 text-sm text-mute">Supports AcroForm fields. XFA and digital signatures are not included.</p>
        ) : null}
        {slug === "extract-pdf-images" ? (
          <p className="mt-3 text-sm text-mute">Extracts embedded images only. Use PDF to JPG to rasterize full pages.</p>
        ) : null}
        {slug === "html-to-pdf" ? (
          <p className="mt-3 text-sm text-mute">Best for simple HTML. External CSS and scripts are not included.</p>
        ) : null}
        {slug === "html-to-txt" ? (
          <p className="mt-3 text-sm text-mute">Extracts visible text. Scripts, styles, and layout are discarded.</p>
        ) : null}
        {slug?.startsWith("docx-to-") ? (
          <p className="mt-3 text-sm text-mute">Word .docx only. Layout, headers, and old .doc files are limited or skipped.</p>
        ) : null}
        {slug?.startsWith("xlsx-to-") || slug === "csv-to-xlsx" ? (
          <p className="mt-3 text-sm text-mute">First sheet only. Charts, macros, and old .xls files are skipped.</p>
        ) : null}
        {slug?.startsWith("pptx-to-") ? (
          <p className="mt-3 text-sm text-mute">Slide text only. Images and layout are not reproduced.</p>
        ) : null}
        {slug === "pdf-to-txt" || slug === "pdf-to-docx" ? (
          <p className="mt-3 text-sm text-mute">Extracts text. Scanned PDFs need OCR on a later worker.</p>
        ) : null}
      </div>
    </div>
  );
}
