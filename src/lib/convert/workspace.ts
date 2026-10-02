import { conversionSource, sourceKey, type ToolDef } from "@/lib/tools";

export type OutputOption = {
  slug: string;
  output: string;
  category: string;
};

const IMAGE_SOURCES = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp", "ico", "svg", "heic", "heif", "avif", "tif", "tiff"]);

const IMAGE_JOBS = new Set([
  "image-compressor",
  "image-resizer",
  "crop-image",
  "rotate-image",
  "flip-image",
  "collage-maker",
  "gif-compressor",
]);

const PDF_JOBS = new Set([
  "merge-pdf",
  "split-pdf",
  "rotate-pdf",
  "delete-pdf-pages",
  "extract-pdf-pages",
  "watermark-pdf",
  "pdf-page-numbers",
  "crop-pdf",
  "unlock-pdf",
  "organize-pdf",
  "flatten-pdf",
  "redact-pdf",
  "sign-pdf",
  "fill-pdf",
  "extract-pdf-images",
]);

function chips(items: [string, string][]): OutputOption[] {
  return items.map(([output, category]) => ({
    slug: `out-${output}`,
    output,
    category,
  }));
}

export const IMAGE_OUTPUTS = chips([
  ["jpg", "Gambar"],
  ["webp", "Gambar"],
  ["avif", "Gambar"],
  ["png", "Gambar"],
  ["gif", "Gambar"],
  ["pdf", "PDF"],
  ["tiff", "Gambar"],
  ["bmp", "Gambar"],
  ["ico", "Gambar"],
]);

export const PDF_OUTPUTS = chips([
  ["jpg", "Gambar"],
  ["webp", "Gambar"],
  ["png", "Gambar"],
  ["tiff", "Gambar"],
  ["bmp", "Gambar"],
  ["txt", "Dokumen"],
  ["docx", "Dokumen"],
]);

const DOCX_OUTPUTS = chips([
  ["pdf", "PDF"],
  ["txt", "Dokumen"],
  ["html", "Dokumen"],
]);

const XLSX_OUTPUTS = chips([
  ["pdf", "PDF"],
  ["csv", "Spreadsheet"],
  ["json", "Utilitas"],
]);

const CSV_OUTPUTS = chips([
  ["xlsx", "Spreadsheet"],
  ["json", "Utilitas"],
  ["pdf", "PDF"],
]);

const JSON_OUTPUTS = chips([
  ["json", "Utilitas"],
  ["csv", "Utilitas"],
  ["xlsx", "Spreadsheet"],
]);

const HTML_OUTPUTS = chips([
  ["pdf", "PDF"],
  ["txt", "Dokumen"],
]);

const PPTX_OUTPUTS = chips([
  ["pdf", "PDF"],
  ["txt", "Dokumen"],
]);

export function isImageSource(value: string) {
  return IMAGE_SOURCES.has(sourceKey(value));
}

export function isImageJob(slug?: string) {
  return Boolean(slug && IMAGE_JOBS.has(slug));
}

export function isPdfJob(slug?: string) {
  return Boolean(slug && PDF_JOBS.has(slug));
}

export function isLossyOutput(output: string) {
  return output === "jpg" || output === "webp" || output === "avif";
}

export function formatPickerHint(source: string, slug?: string) {
  if (isImageJob(slug) || isImageSource(source)) return "Image, PDF, and icon files this browser can write.";
  if (source === "pdf" || slug?.startsWith("pdf-to-")) return "Pages as images, or text you can edit.";
  if (source === "docx" || slug?.startsWith("docx-to-")) return "PDF, plain text, or HTML.";
  if (source === "xlsx" || slug?.startsWith("xlsx-to-")) return "PDF, CSV, or JSON.";
  if (source === "csv" || slug?.startsWith("csv-to-")) return "Spreadsheet, JSON, or PDF.";
  if (source === "json" || slug?.startsWith("json-to-") || slug === "json-formatter") return "Keep JSON, or export a table.";
  if (source === "html" || slug?.startsWith("html-to-")) return "PDF or plain text.";
  if (source === "pptx" || slug?.startsWith("pptx-to-")) return "PDF or slide text.";
  return "Choose the finished file. These run in this browser.";
}

export function workspaceSource(tool?: ToolDef | null, ext?: string) {
  if (ext) return sourceKey(ext);
  if (!tool) return "";
  return sourceKey(conversionSource(tool) || tool.inputs[0] || "");
}

export function workspaceOutputs(tool?: ToolDef | null, source = ""): OutputOption[] {
  const src = sourceKey(source);
  const slug = tool?.slug ?? "";

  if (slug === "color-picker" || slug === "unit-converter") return [];
  if (isPdfJob(slug)) return [];
  if (isImageJob(slug) || isImageSource(src)) return IMAGE_OUTPUTS;
  if (src === "pdf" || slug.startsWith("pdf-to-")) return PDF_OUTPUTS;
  if (src === "docx" || slug.startsWith("docx-to-")) return DOCX_OUTPUTS;
  if (src === "xlsx" || slug.startsWith("xlsx-to-")) return XLSX_OUTPUTS;
  if (src === "csv" || slug.startsWith("csv-to-")) return CSV_OUTPUTS;
  if (src === "json" || slug.startsWith("json-to-") || slug === "json-formatter") return JSON_OUTPUTS;
  if (src === "html" || slug.startsWith("html-to-")) return HTML_OUTPUTS;
  if (src === "pptx" || slug.startsWith("pptx-to-")) return PPTX_OUTPUTS;
  if (src === "txt" || slug === "txt-to-pdf") return chips([["pdf", "PDF"]]);
  return [];
}
