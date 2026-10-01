"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { ToolDef } from "@/lib/tools";
import { acceptsInput, siblingConversions, sourceKey, toolsForDropped } from "@/lib/tools";
import { extOf } from "@/lib/file";
import {
  DEFAULT_CROP,
  type CropBox,
  type ImageTurn,
} from "@/lib/convert/image-types";
import { convertUnit, formatUnit, UNIT_OPTIONS, type UnitKind } from "@/lib/convert/units";
import { useConvertSession } from "@/components/convert/ConvertSession";
import { ColorStage } from "@/components/convert/ColorStage";
import { CropStage } from "@/components/convert/CropStage";
import { FormatArtwork } from "@/components/convert/FormatArtwork";
import { JobPicks, OutputSwitch } from "@/components/convert/OutputSwitch";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FileChip } from "@/components/ui/FileChip";
import { cn } from "@/lib/cn";

const FillFormStage = dynamic(
  () => import("@/components/convert/FillFormStage").then((module) => module.FillFormStage),
  { ssr: false, loading: () => <p className="mt-5 text-sm text-mute">Reading form fields…</p> },
);

type Props = {
  tool?: ToolDef | null;
};

export function DropEngine({ tool }: Props) {
  const { files, setFiles, clearFiles } = useConvertSession();
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [width, setWidth] = useState(1600);
  const [crop, setCrop] = useState<CropBox>(DEFAULT_CROP);
  const [pages, setPages] = useState("1");
  const [mark, setMark] = useState("DRAFT");
  const [hex, setHex] = useState("#D92D28");
  const [turn, setTurn] = useState<ImageTurn>("90");
  const [flip, setFlip] = useState<ImageTurn>("flip-h");
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
  const dragging = drag > 0;

  const homeOptions = useMemo(() => {
    if (tool || !files[0]) return [];
    return toolsForDropped(extOf(files[0].name));
  }, [tool, files]);

  const slugOptions = tool ? siblingConversions(tool) : [];
  const homeTool = homeOptions.find((item) => item.slug === homeSlug) ?? homeOptions[0] ?? null;
  const active = tool ?? homeTool;
  const output = active?.output ?? "";
  const slug = active?.slug;
  const singleFile =
    slug === "crop-image" ||
    slug === "color-picker" ||
    slug === "rotate-image" ||
    slug === "flip-image" ||
    slug === "split-pdf" ||
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

  useEffect(() => {
    let next = files;
    if (tool?.inputs?.length) {
      const kept = next.filter((file) => acceptsInput(file.name, tool.inputs));
      if (kept.length !== next.length) next = kept;
    }
    if (singleFile && next.length > 1) next = next.slice(0, 1);
    if (next !== files) setFiles(next);
  }, [tool, files, setFiles, singleFile]);

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
      const source = sourceKey(extOf(anchor.name));
      allowed = incoming.filter((file) => sourceKey(extOf(file.name)) === source);
      if (!allowed.length) {
        setError("Additional files must use the same format.");
        return;
      }
    }

    if (singleFile) {
      setCrop(DEFAULT_CROP);
      setHex("#D92D28");
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
        setError(e instanceof Error ? e.message : "Conversion failed.");
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
        throw new Error("This tool needs the dedicated worker. It is not available in the browser yet.");
      }
      if (slug === "merge-pdf" || (!slug && ext === "pdf" && files.length > 1)) {
        const { mergePdfs } = await import("@/lib/convert/pdf");
        await mergePdfs(files);
      } else if (slug === "split-pdf") {
        const { splitPdf } = await import("@/lib/convert/pdf");
        await splitPdf(first);
      } else if (slug === "rotate-pdf") {
        const { rotatePdf } = await import("@/lib/convert/pdf");
        await rotatePdf(first);
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
      } else if (slug === "csv-to-pdf") {
        const { csvToPdf } = await import("@/lib/convert/pdf");
        await csvToPdf(first);
      } else if (slug === "html-to-pdf") {
        const { htmlToPdf } = await import("@/lib/convert/html-pdf");
        await htmlToPdf(first);
      } else if (slug === "html-to-txt") {
        const { htmlToTxt } = await import("@/lib/convert/html-pdf");
        await htmlToTxt(first);
      } else if (slug === "txt-to-pdf") {
        const { txtToPdf } = await import("@/lib/convert/pdf");
        await txtToPdf(first);
      } else if (
        slug?.startsWith("docx-to-") ||
        slug?.startsWith("xlsx-to-") ||
        slug?.startsWith("pptx-to-") ||
        slug === "csv-to-xlsx" ||
        slug === "csv-to-json" ||
        slug === "json-to-csv" ||
        slug === "json-to-xlsx" ||
        slug === "pdf-to-txt" ||
        slug === "pdf-to-docx" ||
        ext === "docx" ||
        ext === "xlsx" ||
        ext === "pptx"
      ) {
        const { convertOffice } = await import("@/lib/convert/office");
        await convertOffice(first, slug ?? "", output);
      } else if (slug === "extract-pdf-images") {
        const { extractPdfImages } = await import("@/lib/convert/pdf-raster");
        await extractPdfImages(first);
      } else if (
        slug === "pdf-to-jpg" ||
        slug === "pdf-to-png" ||
        slug === "pdf-to-webp" ||
        slug === "pdf-to-bmp" ||
        slug === "pdf-to-tiff" ||
        (ext === "pdf" && (output === "jpg" || output === "png" || output === "webp" || output === "bmp" || output === "tiff"))
      ) {
        const { pdfToImages } = await import("@/lib/convert/pdf-raster");
        const out = output === "png" || output === "webp" || output === "bmp" || output === "tiff" ? output : "jpg";
        await pdfToImages(first, out);
      } else if (slug === "jpg-to-pdf" || output === "pdf") {
        const { imagesToPdf } = await import("@/lib/convert/pdf");
        await imagesToPdf(files);
      } else if (slug === "ttf-to-woff2" || slug === "otf-to-woff2" || slug === "woff-to-woff2" || ext === "ttf" || ext === "otf" || ext === "woff") {
        const { fontToWoff2 } = await import("@/lib/convert/font");
        for (const file of files) await fontToWoff2(file);
      } else if (slug === "collage-maker") {
        const { collageImages } = await import("@/lib/convert/image");
        await collageImages(files, Number(collageCols));
      } else if (slug === "json-formatter" || (ext === "json" && output === "json")) {
        const { formatJson } = await import("@/lib/convert/json");
        await formatJson(first);
      } else if (slug === "rotate-image") {
        const { rasterTransform } = await import("@/lib/convert/image");
        await rasterTransform(first, turn);
      } else if (slug === "flip-image") {
        const { rasterTransform } = await import("@/lib/convert/image");
        await rasterTransform(first, flip);
      } else if (slug === "crop-image") {
        const { rasterCrop } = await import("@/lib/convert/image");
        await rasterCrop(first, crop);
      } else if (slug === "color-picker") {
        const { downloadColorSwatch } = await import("@/lib/convert/image");
        await downloadColorSwatch(hex);
      } else if (slug === "image-resizer") {
        const { rasterConvert } = await import("@/lib/convert/image");
        for (const file of files) await rasterConvert(file, "png", { width });
      } else if (slug === "image-compressor") {
        const { rasterConvert } = await import("@/lib/convert/image");
        for (const file of files) await rasterConvert(file, "jpg", { quality: 0.72 });
      } else if (slug === "gif-compressor") {
        const { rasterConvert } = await import("@/lib/convert/image");
        for (const file of files) await rasterConvert(file, "jpg", { quality: 0.7 });
      } else if (
        active?.engine === "canvas" ||
        ["png", "jpg", "jpeg", "webp", "bmp", "gif", "heic", "heif", "ico", "svg", "avif", "tif", "tiff"].includes(ext)
      ) {
        const { asRasterOutput, rasterConvert } = await import("@/lib/convert/image");
        const out = asRasterOutput(output);
        if (!out) throw new Error("Choose an output format first.");
        for (const file of files) await rasterConvert(file, out);
      } else if (ext === "pdf") {
        const { mergePdfs } = await import("@/lib/convert/pdf");
        await mergePdfs(files);
      } else {
        throw new Error("This format is not available in the browser yet. Video and audio require a dedicated worker.");
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden bg-paper transition duration-280",
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
          "pointer-events-none absolute left-0 top-0 z-10 h-7 w-7 border-l-2 border-t-2 border-ink transition duration-280",
          dragging && "h-11 w-11 border-accent animate-mark",
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute right-0 top-0 z-10 h-7 w-7 border-r-2 border-t-2 border-ink transition duration-280",
          dragging && "h-11 w-11 border-accent animate-mark",
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 z-10 h-7 w-7 border-b-2 border-l-2 border-ink transition duration-280",
          dragging && "h-11 w-11 border-accent animate-mark",
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute bottom-0 right-0 z-10 h-7 w-7 border-b-2 border-r-2 border-ink transition duration-280",
          dragging && "h-11 w-11 border-accent animate-mark",
        )}
      />
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
        />
        <span className="flex flex-col gap-3 px-6 py-7 sm:px-8">
          <span className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">Workbench</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
              {active?.need === "vps" ? "Worker" : "Local"}
            </span>
          </span>
          <span className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {dragging ? "Release" : noFile ? "Pick units" : files.length ? (singleFile ? "Ready to convert" : "Add more, or convert") : "Drop a file"}
          </span>
          <span className="text-sm text-mute">{noFile ? "No file needed · stays on this device" : "Click to browse · stays on this device · ~30 MB"}</span>
        </span>
      </label>

      {files.length > 0 && !noFile ? (
        <ul className="flex flex-col gap-1.5 px-6 pb-2 sm:px-8">
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

      <div className="px-6 pb-8 sm:px-8">
        {tool ? (
          <OutputSwitch options={slugOptions} current={tool.slug} />
        ) : (
          <OutputSwitch options={homeOptions} current={homeTool?.slug} onSelect={(item) => setHomeSlug(item.slug)} />
        )}

        {slug === "crop-image" && files[0] ? (
          <CropStage file={files[0]} value={crop} onChange={setCrop} />
        ) : null}
        {slug === "crop-pdf" || slug === "redact-pdf" ? (
          <CropStage value={crop} onChange={setCrop} label={slug === "redact-pdf" ? "Redact" : "Trim"} />
        ) : null}
        {slug === "rotate-image" ? (
          <JobPicks
            label="Turn"
            value={turn}
            onChange={(id) => setTurn(id as ImageTurn)}
            options={[
              { id: "90", label: "90°" },
              { id: "180", label: "180°" },
              { id: "270", label: "270°" },
            ]}
          />
        ) : null}
        {slug === "flip-image" ? (
          <JobPicks
            label="Flip"
            value={flip}
            onChange={(id) => setFlip(id as ImageTurn)}
            options={[
              { id: "flip-h", label: "Horizontal" },
              { id: "flip-v", label: "Vertical" },
            ]}
          />
        ) : null}
        {slug === "color-picker" && files[0] ? (
          <ColorStage file={files[0]} hex={hex} onPick={setHex} />
        ) : null}

        {slug === "image-resizer" ? (
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

        {slug === "delete-pdf-pages" || slug === "extract-pdf-pages" ? (
          <div className="mt-5">
            <Field
              label="Pages"
              hint="1-3, 5"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              className="w-40"
            />
          </div>
        ) : null}

        {slug === "watermark-pdf" ? (
          <div className="mt-5">
            <Field label="Text" value={mark} onChange={(e) => setMark(e.target.value)} className="w-48" />
          </div>
        ) : null}

        {slug === "organize-pdf" ? (
          <>
            <JobPicks
              label="Order"
              value={orderMode}
              onChange={(id) => setOrderMode(id as "reverse" | "custom")}
              options={[
                { id: "reverse", label: "Reverse" },
                { id: "custom", label: "Custom" },
              ]}
            />
            {orderMode === "custom" ? (
              <div className="mt-5">
                <Field label="Pages" hint="3,1,2" value={order} onChange={(e) => setOrder(e.target.value)} className="w-40" />
              </div>
            ) : null}
          </>
        ) : null}

        {slug === "sign-pdf" ? (
          <div className="mt-5">
            <Field label="Sign" value={sign} onChange={(e) => setSign(e.target.value)} className="w-48" />
          </div>
        ) : null}

        {slug === "fill-pdf" && files[0] ? <FillFormStage file={files[0]} values={formValues} onChange={setFormValues} /> : null}

        {slug === "collage-maker" ? (
          <JobPicks
            label="Columns"
            value={collageCols}
            onChange={(id) => setCollageCols(id as "2" | "3")}
            options={[
              { id: "2", label: "2" },
              { id: "3", label: "3" },
            ]}
          />
        ) : null}

        {slug === "unit-converter" ? (
          <>
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
            <div className="mt-5">
              <Field
                label="Value"
                type="number"
                value={unitAmount}
                onChange={(e) => setUnitAmount(e.target.value)}
                className="w-28"
              />
            </div>
            <JobPicks
              label="From"
              value={unitFrom}
              onChange={setUnitFrom}
              options={UNIT_OPTIONS[unitKind]}
            />
            <JobPicks
              label="To"
              value={unitTo}
              onChange={setUnitTo}
              options={UNIT_OPTIONS[unitKind]}
            />
            {unitResult ? <p className="mt-4 font-mono text-lg text-ink">{unitResult}</p> : null}
          </>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="relative">
            {(!busy && (noFile || files.length > 0)) ? (
              <span className="absolute inset-0 rounded-control bg-accent/40 animate-pulseRing pointer-events-none" aria-hidden />
            ) : null}
            <Button onClick={run} loading={busy}>
              {busy ? "Converting" : "Convert"}
            </Button>
          </span>
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
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>

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
