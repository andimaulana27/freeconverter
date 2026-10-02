import { getDocument, GlobalWorkerOptions, ImageKind, OPS } from "pdfjs-dist";
import { bytesToBlob, stem } from "@/lib/file";
import { encodeBmp } from "@/lib/convert/bmp";

GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export type PdfImageOutput = "jpg" | "png" | "webp" | "bmp";

function pdfError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/worker|setting up fake worker|Failed to fetch|Failed to load/i.test(message)) {
    return new Error("The PDF engine failed to load. Refresh the page and try again.");
  }
  if (/password|encrypted/i.test(message)) {
    return new Error("This PDF is password-protected.");
  }
  if (/Invalid PDF|PDF header|FormatError/i.test(message)) {
    return new Error("This PDF is damaged or unreadable.");
  }
  return error instanceof Error ? error : new Error("Could not read this PDF.");
}

async function openPdf(file: File) {
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    return await getDocument({ data, useSystemFonts: true }).promise;
  } catch (error) {
    throw pdfError(error);
  }
}

export async function previewPdfPages(file: File, limit = 24) {
  const pdf = await openPdf(file);
  const total = pdf.numPages;
  const count = Math.min(total, limit);
  const thumbs: { page: number; url: string }[] = [];
  for (let i = 1; i <= count; i += 1) {
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(1.2, 160 / Math.max(base.width, 1));
    const viewport = page.getViewport({ scale: Math.max(0.12, scale) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available in this browser.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    thumbs.push({ page: i, url: canvas.toDataURL("image/jpeg", 0.72) });
  }
  return { total, thumbs };
}

export async function renderPdfPageFile(file: File, pageNumber = 1) {
  const pdf = await openPdf(file);
  const page = await pdf.getPage(Math.min(pdf.numPages, Math.max(1, pageNumber)));
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(1.4, 720 / Math.max(base.width, 1));
  const viewport = page.getViewport({ scale: Math.max(0.2, scale) });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), "image/jpeg", 0.86);
  });
  if (!blob) throw new Error("Could not preview this PDF page.");
  return new File([blob], "page.jpg", { type: "image/jpeg" });
}

export async function renderPdfPages(
  file: File,
  each: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, index: number, total: number) => Promise<void>,
) {
  const pdf = await openPdf(file);
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 4096 / Math.max(base.width, base.height, 1));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available in this browser.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    await each(canvas, ctx, i, pdf.numPages);
  }
}

async function canvasToImageBlob(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, output: PdfImageOutput, quality = 0.86) {
  if (output === "bmp") {
    return bytesToBlob(encodeBmp(ctx.getImageData(0, 0, canvas.width, canvas.height)), "image/bmp");
  }
  const mime = output === "png" ? "image/png" : output === "webp" ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), mime, output === "png" ? undefined : quality);
  });
  if (blob) return blob;
  if (output === "webp") {
    throw new Error("This browser cannot write WebP. Choose PNG or JPG instead.");
  }
  throw new Error("Could not encode the PDF page.");
}

export async function pdfToImages(file: File, output: PdfImageOutput, opts?: { quality?: number }) {
  const parts: { name: string; blob: Blob }[] = [];
  const base = stem(file.name);
  await renderPdfPages(file, async (canvas, ctx, i, total) => {
    const blob = await canvasToImageBlob(canvas, ctx, output, opts?.quality ?? 0.86);
    const suffix = total === 1 ? `.${output}` : `-p${i}.${output}`;
    parts.push({ name: `${base}${suffix}`, blob });
  });
  const { downloadZip } = await import("@/lib/convert/zip-download");
  await downloadZip(parts, `${base}-${output}.zip`);
}

export async function pdfToText(file: File) {
  const pdf = await openPdf(file);
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (line) parts.push(line);
  }
  const text = parts.join("\n\n").trim();
  if (!text) throw new Error("This PDF has no extractable text. Scanned pages require a dedicated OCR worker.");
  return text;
}

type PdfObjs = { has(id: string): boolean; get(id: string, callback?: (data: unknown) => void): unknown };

function readObj(objs: PdfObjs, id: string) {
  return new Promise<unknown>((resolve) => {
    const finish = (value: unknown) => resolve(value ?? null);
    window.setTimeout(() => finish(null), 4000);
    try {
      if (objs.has(id)) {
        finish(objs.get(id));
        return;
      }
    } catch {
      /* wait via callback */
    }
    objs.get(id, finish);
  });
}

function isJpeg(data: Uint8Array) {
  return data.length > 3 && data[0] === 0xff && data[1] === 0xd8;
}

function isPng(data: Uint8Array) {
  return data.length > 8 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47;
}

async function pixelsToPng(width: number, height: number, rgba: Uint8ClampedArray) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  const buffer = new ArrayBuffer(rgba.byteLength);
  const pixels = new Uint8ClampedArray(buffer);
  pixels.set(rgba);
  ctx.putImageData(new ImageData(pixels, width, height), 0, 0);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the PDF image."))), "image/png");
  });
}

async function kindToPng(img: { data: Uint8Array | Uint8ClampedArray; width: number; height: number; kind?: number }) {
  const { width, height, data, kind } = img;
  const rgba = new Uint8ClampedArray(width * height * 4);
  if (kind === ImageKind.RGB_24BPP) {
    for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
      rgba[j] = data[i];
      rgba[j + 1] = data[i + 1];
      rgba[j + 2] = data[i + 2];
      rgba[j + 3] = 255;
    }
  } else if (kind === ImageKind.GRAYSCALE_1BPP) {
    let src = 0;
    for (let y = 0; y < height; y += 1) {
      let bit = 0;
      let byte = 0;
      for (let x = 0; x < width; x += 1) {
        if (bit === 0) {
          byte = data[src] ?? 0;
          src += 1;
          bit = 128;
        }
        const on = byte & bit ? 0 : 255;
        bit >>= 1;
        const j = (y * width + x) * 4;
        rgba[j] = on;
        rgba[j + 1] = on;
        rgba[j + 2] = on;
        rgba[j + 3] = 255;
      }
    }
  } else {
    rgba.set(data.subarray(0, rgba.length));
  }
  return pixelsToPng(width, height, rgba);
}

async function drawToPng(source: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the PDF image."))), "image/png");
  });
}

async function objToBlob(img: unknown): Promise<Blob | null> {
  if (!img) return null;
  if (img instanceof Blob) return img;
  if (typeof HTMLCanvasElement !== "undefined" && img instanceof HTMLCanvasElement) {
    return new Promise((resolve, reject) => {
      img.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the PDF image."))), "image/png");
    });
  }
  if (typeof ImageBitmap !== "undefined" && img instanceof ImageBitmap) {
    return drawToPng(img, img.width, img.height);
  }
  if (typeof HTMLImageElement !== "undefined" && img instanceof HTMLImageElement) {
    return drawToPng(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
  }
  const rec = img as {
    bitmap?: unknown;
    data?: Uint8Array | Uint8ClampedArray;
    width?: number;
    height?: number;
    kind?: number;
  };
  if (rec.bitmap) return objToBlob(rec.bitmap);
  if (rec.data instanceof Uint8Array && isJpeg(rec.data)) return bytesToBlob(rec.data, "image/jpeg");
  if (rec.data instanceof Uint8Array && isPng(rec.data)) return bytesToBlob(rec.data, "image/png");
  if (rec.data && rec.width && rec.height) {
    return kindToPng({ data: rec.data, width: rec.width, height: rec.height, kind: rec.kind });
  }
  return null;
}

export async function extractPdfImages(file: File) {
  const pdf = await openPdf(file);
  const blobs: Blob[] = [];
  const take = async (img: unknown) => {
    const blob = await objToBlob(img);
    if (!blob || blob.size < 32) return;
    blobs.push(blob);
  };
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const ops = await page.getOperatorList();
    for (let j = 0; j < ops.fnArray.length; j += 1) {
      const fn = ops.fnArray[j];
      if (
        fn !== OPS.paintImageXObject &&
        fn !== OPS.paintImageXObjectRepeat &&
        fn !== OPS.paintInlineImageXObject
      ) {
        continue;
      }
      const arg = ops.argsArray[j]?.[0];
      if (typeof arg === "string") {
        const img = (await readObj(page.objs, arg)) ?? (await readObj(page.commonObjs, arg));
        await take(img);
      } else {
        await take(arg);
      }
    }
  }
  if (!blobs.length) {
    throw new Error("This PDF has no embedded images. Use PDF to JPG to rasterize full pages.");
  }
  const base = stem(file.name);
  const { downloadZip } = await import("@/lib/convert/zip-download");
  await downloadZip(
    blobs.map((blob, i) => {
      const ext = blob.type === "image/jpeg" ? "jpg" : "png";
      return { name: blobs.length === 1 ? `${base}.${ext}` : `${base}-img${i + 1}.${ext}`, blob };
    }),
    `${base}-images.zip`,
  );
}
