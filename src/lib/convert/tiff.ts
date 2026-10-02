import pako from "pako";
import UTIFImport from "utif";
import { encodeBmp } from "@/lib/convert/bmp";
import { blobFromCanvas, canvasContext, canvasFromImageFile } from "@/lib/convert/canvas-draw";
import { downloadBlob, downloadBytes, isTiffName, stem } from "@/lib/file";
import type { RasterOutput } from "@/lib/convert/image-types";

type Ifd = { width: number; height: number };

type UtifApi = {
  decode(data: ArrayBuffer | Uint8Array): Ifd[];
  decodeImage(data: ArrayBuffer | Uint8Array, ifd: Ifd): void;
  toRGBA8(ifd: Ifd): Uint8Array;
  encodeImage(rgba: Uint8Array, width: number, height: number): ArrayBuffer;
};

function utifApi(): UtifApi {
  const globalPako = globalThis as { pako?: typeof pako };
  if (!globalPako.pako) globalPako.pako = pako;
  const mod = UTIFImport as UtifApi & { default?: UtifApi };
  const api = typeof mod.decode === "function" ? mod : mod.default;
  if (!api?.decode || !api.decodeImage || !api.toRGBA8 || !api.encodeImage) {
    throw new Error("TIFF decoder failed to load.");
  }
  return api;
}

export async function canvasFromTiff(file: File, opts?: { width?: number; background?: string }) {
  const UTIF = utifApi();
  const data = new Uint8Array(await file.arrayBuffer());
  const pages = UTIF.decode(data);
  if (!pages.length) throw new Error("This TIFF is empty or unreadable.");
  UTIF.decodeImage(data, pages[0]);
  const rgba = UTIF.toRGBA8(pages[0]);
  const natural = { width: Math.max(1, pages[0].width || 1), height: Math.max(1, pages[0].height || 1) };
  if (natural.width > 8192 || natural.height > 8192) {
    throw new Error("This TIFF is too large to convert in the browser.");
  }
  const scale = opts?.width ? Math.min(1, opts.width / natural.width) : 1;
  const width = Math.max(1, Math.round(natural.width * scale));
  const height = Math.max(1, Math.round(natural.height * scale));
  const source = canvasContext(natural.width, natural.height);
  const expected = natural.width * natural.height * 4;
  const buffer = new ArrayBuffer(expected);
  const pixels = new Uint8ClampedArray(buffer);
  pixels.set(rgba.subarray(0, expected));
  source.ctx.putImageData(new ImageData(pixels, natural.width, natural.height), 0, 0);
  if (width === natural.width && height === natural.height && !opts?.background) {
    return { canvas: source.canvas, ctx: source.ctx, width, height, img: source.canvas };
  }
  const { canvas, ctx } = canvasContext(width, height);
  if (opts?.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(source.canvas, 0, 0, width, height);
  return { canvas, ctx, width, height, img: canvas };
}

export function encodeTiff(imageData: ImageData) {
  const UTIF = utifApi();
  const rgba = new Uint8Array(imageData.data.length);
  rgba.set(imageData.data);
  return new Uint8Array(UTIF.encodeImage(rgba, imageData.width, imageData.height));
}

export async function tiffToJpegBytes(file: File, quality = 0.9) {
  const { canvas } = await canvasFromTiff(file, { background: "#ffffff" });
  const blob = await blobFromCanvas(canvas, "image/jpeg", quality);
  return new Uint8Array(await blob.arrayBuffer());
}

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function rasterConvertTiff(file: File, output: RasterOutput, opts?: { quality?: number; width?: number }) {
  const name = stem(file.name);
  const opaque = output === "jpg" || output === "bmp" || output === "tiff";
  const { canvas, ctx } = isTiffName(file.name)
    ? await canvasFromTiff(file, { width: opts?.width, background: opaque ? "#ffffff" : undefined })
    : await canvasFromImageFile(file, { width: opts?.width, background: opaque ? "#ffffff" : undefined });

  if (output === "tiff") {
    downloadBytes(encodeTiff(ctx.getImageData(0, 0, canvas.width, canvas.height)), `${name}.tiff`, "image/tiff");
    return;
  }
  if (output === "bmp") {
    downloadBytes(encodeBmp(ctx.getImageData(0, 0, canvas.width, canvas.height)), `${name}.bmp`, "image/bmp");
    return;
  }
  if (output === "ico") {
    const { rasterConvert } = await import("@/lib/convert/image");
    const blob = await blobFromCanvas(canvas, "image/png");
    await rasterConvert(new File([blob], `${name}.png`, { type: "image/png" }), "ico");
    return;
  }
  if (output === "gif") {
    throw new Error("The browser cannot write animated GIFs. Choose PNG or JPG instead.");
  }
  const blob = await blobFromCanvas(canvas, MIME[output] ?? "image/png", opts?.quality ?? 0.86);
  downloadBlob(blob, `${name}.${output === "jpg" ? "jpg" : output}`);
}

export async function tiffAsPngFile(file: File) {
  const { canvas } = await canvasFromTiff(file);
  const blob = await blobFromCanvas(canvas, "image/png");
  return new File([blob], `${stem(file.name)}.png`, { type: "image/png" });
}

export async function tiffFilesAsPng(files: File[]) {
  const out: File[] = [];
  for (const file of files) {
    out.push(isTiffName(file.name) ? await tiffAsPngFile(file) : file);
  }
  return out;
}

export async function tiffImagesToPdf(files: File[]) {
  const prepared: File[] = [];
  for (const file of files) {
    if (!isTiffName(file.name)) {
      prepared.push(file);
      continue;
    }
    const bytes = await tiffToJpegBytes(file);
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    prepared.push(new File([buffer], `${stem(file.name)}.jpg`, { type: "image/jpeg" }));
  }
  const { imagesToPdf } = await import("@/lib/convert/pdf");
  await imagesToPdf(prepared);
}
