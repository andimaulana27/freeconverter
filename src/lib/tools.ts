import toolsJson from "@/data/tools.json";
import { extraTools } from "@/data/extra-tools";
import { extOf } from "@/lib/file";

export type ToolNeed = "browser" | "vps";

export type ToolDef = {
  slug: string;
  title: string;
  purpose: string;
  category: string;
  need: ToolNeed;
  engine: string;
  inputs: string[];
  output: string;
  v1: boolean;
};

const seenSlugs = new Set<string>();
export const tools = [...(toolsJson as ToolDef[]), ...extraTools].filter((tool) => {
  if (seenSlugs.has(tool.slug)) return false;
  seenSlugs.add(tool.slug);
  return true;
});

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug) ?? null;
}

export function toolBlurb(tool: ToolDef) {
  const input = tool.inputs[0]?.toUpperCase();
  const output = tool.output.toUpperCase();
  const copy: Record<string, string> = {
    "image-compressor": "Reduce image size while keeping it sharp and share-ready.",
    "image-resizer": "Resize images to the exact width you need.",
    "crop-image": "Crop any image to the perfect frame.",
    "color-picker": "Pick a color from an image and copy its HEX value.",
    "rotate-image": "Rotate images by 90, 180, or 270 degrees.",
    "flip-image": "Mirror an image horizontally or vertically.",
    "collage-maker": "Arrange multiple photos on one clean canvas.",
    "gif-compressor": "Reduce an animated GIF to a lightweight first-frame image.",
    "merge-pdf": "Combine multiple PDF files into one ordered document.",
    "split-pdf": "Separate every PDF page into its own file.",
    "rotate-pdf": "Rotate every page in a PDF permanently.",
    "delete-pdf-pages": "Remove pages you no longer need from a PDF.",
    "extract-pdf-pages": "Save selected PDF pages as a new document.",
    "watermark-pdf": "Place a custom text watermark on every PDF page.",
    "pdf-page-numbers": "Add clear page numbers throughout a PDF.",
    "crop-pdf": "Trim unwanted margins from every PDF page.",
    "unlock-pdf": "Remove common print and copy restrictions from a PDF.",
    "organize-pdf": "Reorder or reverse PDF pages in seconds.",
    "flatten-pdf": "Turn editable PDF form fields into fixed content.",
    "redact-pdf": "Cover sensitive areas with permanent black boxes.",
    "sign-pdf": "Add a simple text signature to every PDF page.",
    "fill-pdf": "Complete supported PDF form fields in your browser.",
    "extract-pdf-images": "Save images embedded inside a PDF.",
    "json-formatter": "Format, validate, and download clean JSON.",
    "unit-converter": "Convert common units for mass, length, and temperature.",
    "video-compressor": "Make video files smaller for faster sharing.",
  };
  if (copy[tool.slug]) return copy[tool.slug];
  const where = tool.need === "browser" ? "in your browser." : "when the dedicated worker is online.";
  if (tool.slug.includes("-to-")) {
    return `Convert ${input ?? "your file"} to ${output} ${where}`;
  }
  if (tool.category === "Font") return `Convert ${input ?? "font files"} to web-ready ${output}.`;
  return `Process ${tool.title.toLowerCase()} ${where}`;
}

export const categories = [...new Set(tools.map((tool) => tool.category))];

export function toolsByCategory(category: string) {
  return tools.filter((tool) => tool.category === category);
}

export function relatedTools(tool: ToolDef, limit = 4) {
  const seen = new Set([tool.slug]);
  const next: ToolDef[] = [];
  const push = (item: ToolDef) => {
    if (seen.has(item.slug)) return;
    seen.add(item.slug);
    next.push(item);
  };
  siblingConversions(tool).forEach(push);
  const isJob = conversionSource(tool) === null;
  if (isJob) {
    tools
      .filter((item) => item.category === tool.category && conversionSource(item) === null)
      .forEach(push);
  }
  tools.filter((item) => item.category === tool.category).forEach(push);
  return next.slice(0, limit);
}

const OUTPUT_RANK: Record<string, number> = {
  jpg: 1,
  png: 2,
  webp: 3,
  bmp: 4,
  ico: 5,
  tiff: 6,
  pdf: 7,
  docx: 8,
  xlsx: 9,
  html: 10,
  csv: 11,
  json: 12,
  txt: 13,
  woff2: 14,
  mp3: 15,
  mp4: 16,
  zip: 17,
  epub: 18,
  webm: 19,
  wav: 20,
  svg: 21,
};

export function sourceKey(ext: string) {
  const key = ext.toLowerCase();
  if (key === "jpeg" || key === "jfif" || key === "jif") return "jpg";
  if (key === "htm") return "html";
  if (key === "heif") return "heic";
  if (key === "tif") return "tiff";
  if (key === "hwpx") return "hwp";
  if (key === "step") return "stp";
  if (key === "aif" || key === "aifc") return "aiff";
  if (key === "mpg") return "mpeg";
  if (key === "3gpp") return "3gp";
  if (key === "oga") return "ogg";
  if (key === "icons") return "icns";
  return key;
}

export function conversionSource(tool: ToolDef) {
  const at = tool.slug.indexOf("-to-");
  return at === -1 ? null : tool.slug.slice(0, at);
}

export function acceptsInput(name: string, inputs: string[]) {
  if (!inputs.length) return true;
  const key = sourceKey(extOf(name));
  return inputs.some((item) => sourceKey(item) === key);
}

function byOutput(a: ToolDef, b: ToolDef) {
  return (OUTPUT_RANK[a.output] ?? 50) - (OUTPUT_RANK[b.output] ?? 50) || a.slug.localeCompare(b.slug);
}

export function conversionsFrom(source: string) {
  const key = sourceKey(source);
  return tools.filter((item) => item.slug.startsWith(`${key}-to-`)).sort(byOutput);
}

export function browserConversionsFrom(source: string) {
  return conversionsFrom(source).filter((item) => item.need === "browser");
}

export function toolsForDropped(source: string) {
  const pairs = browserConversionsFrom(source);
  if (pairs.length) return pairs;
  const key = sourceKey(source);
  return tools.filter(
    (item) => item.need === "browser" && item.inputs.some((input) => sourceKey(input) === key),
  );
}

export function siblingConversions(tool: ToolDef) {
  const source = conversionSource(tool);
  return source ? browserConversionsFrom(source) : [];
}
