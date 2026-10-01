import { downloadBlob, downloadBytes, extOf, stem } from "@/lib/file";
import type { CropBox, ImageTurn } from "@/lib/convert/image-types";

export type RasterOutput = "jpg" | "png" | "webp" | "gif" | "ico" | "bmp" | "tiff";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const ICON_SIZES = [16, 32, 48];

function load(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This browser cannot read the image. HEIC, AVIF, and TIFF support varies by browser."));
    };
    img.src = url;
  });
}

function sizeOf(img: HTMLImageElement) {
  const width = img.naturalWidth || 1024;
  const height = img.naturalHeight || 1024;
  return { width, height };
}

function canvasContext(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia.");
  return { canvas, ctx };
}

async function blobFromCanvas(canvas: HTMLCanvasElement, mime: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the image."))), mime, quality);
  });
}

async function canvasFromTiff(file: File, opts?: { width?: number; background?: string }) {
  const UTIF = (await import("utif")).default;
  const data = new Uint8Array(await file.arrayBuffer());
  const pages = UTIF.decode(data);
  if (!pages.length) throw new Error("This TIFF is empty or unreadable.");
  UTIF.decodeImage(data, pages[0]);
  const rgba = UTIF.toRGBA8(pages[0]);
  const natural = { width: Math.max(1, pages[0].width || 1), height: Math.max(1, pages[0].height || 1) };
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

async function canvasFromFile(file: File, opts?: { width?: number; background?: string }) {
  const ext = extOf(file.name);
  if (ext === "tif" || ext === "tiff") return canvasFromTiff(file, opts);
  const img = await load(file);
  const natural = sizeOf(img);
  const scale = opts?.width ? Math.min(1, opts.width / natural.width) : 1;
  const width = Math.max(1, Math.round(natural.width * scale));
  const height = Math.max(1, Math.round(natural.height * scale));
  const { canvas, ctx } = canvasContext(width, height);
  if (opts?.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);
  return { canvas, ctx, width, height, img };
}

export function encodeBmp(imageData: ImageData) {
  const { width, height, data } = imageData;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelSize = rowSize * height;
  const fileSize = 14 + 40 + pixelSize;
  const buf = new Uint8Array(fileSize);
  const view = new DataView(buf.buffer);
  buf[0] = 0x42;
  buf[1] = 0x4d;
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelSize, true);
  let offset = 54;
  for (let y = height - 1; y >= 0; y -= 1) {
    const rowStart = offset;
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      buf[offset] = data[i + 2];
      buf[offset + 1] = data[i + 1];
      buf[offset + 2] = data[i];
      offset += 3;
    }
    offset = rowStart + rowSize;
  }
  return buf;
}

async function encodeIco(file: File) {
  const { canvas: source } = await canvasFromFile(file);
  const images = [];
  for (const size of ICON_SIZES) {
    const { canvas, ctx } = canvasContext(size, size);
    const scale = Math.min(size / source.width, size / source.height);
    const width = source.width * scale;
    const height = source.height * scale;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(source, (size - width) / 2, (size - height) / 2, width, height);
    const blob = await blobFromCanvas(canvas, "image/png");
    images.push(new Uint8Array(await blob.arrayBuffer()));
  }
  const count = images.length;
  const headerSize = 6 + 16 * count;
  const total = images.reduce((sum, image) => sum + image.length, headerSize);
  const buf = new Uint8Array(total);
  const view = new DataView(buf.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, count, true);
  let imageOffset = headerSize;
  images.forEach((data, index) => {
    const size = ICON_SIZES[index];
    const entry = 6 + 16 * index;
    buf[entry] = size >= 256 ? 0 : size;
    buf[entry + 1] = size >= 256 ? 0 : size;
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, data.length, true);
    view.setUint32(entry + 12, imageOffset, true);
    buf.set(data, imageOffset);
    imageOffset += data.length;
  });
  return buf;
}

export async function rasterToJpegBytes(file: File, quality = 0.9) {
  const { canvas } = await canvasFromFile(file, { background: "#ffffff" });
  const blob = await blobFromCanvas(canvas, "image/jpeg", quality);
  return new Uint8Array(await blob.arrayBuffer());
}

export async function encodeTiff(imageData: ImageData) {
  const UTIF = (await import("utif")).default;
  const rgba = new Uint8Array(imageData.data.length);
  rgba.set(imageData.data);
  return new Uint8Array(UTIF.encodeImage(rgba, imageData.width, imageData.height));
}

export function asRasterOutput(value: string): RasterOutput | null {
  if (value === "jpeg") return "jpg";
  if (value === "tif") return "tiff";
  if (value === "jpg" || value === "png" || value === "webp" || value === "gif" || value === "ico" || value === "bmp" || value === "tiff") {
    return value;
  }
  return null;
}

export async function rasterConvert(file: File, output: RasterOutput, opts?: { quality?: number; width?: number }) {
  const name = stem(file.name);
  if (output === "ico") {
    downloadBytes(await encodeIco(file), `${name}.ico`, "image/x-icon");
    return;
  }
  const opaque = output === "jpg" || output === "bmp" || output === "tiff";
  const { canvas, ctx } = await canvasFromFile(file, {
    width: opts?.width,
    background: opaque ? "#ffffff" : undefined,
  });
  if (output === "bmp") {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    downloadBytes(encodeBmp(imageData), `${name}.bmp`, "image/bmp");
    return;
  }
  if (output === "tiff") {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    downloadBytes(await encodeTiff(imageData), `${name}.tiff`, "image/tiff");
    return;
  }
  if (output === "gif") {
    throw new Error("The browser cannot write animated GIFs. Choose PNG or JPG instead.");
  }
  const blob = await blobFromCanvas(canvas, MIME[output] ?? "image/png", opts?.quality ?? 0.86);
  downloadBlob(blob, `${name}.${output === "jpg" ? "jpg" : output}`);
}

export async function rasterCrop(file: File, crop: CropBox) {
  const img = await load(file);
  const natural = sizeOf(img);
  const sx = Math.max(0, Math.round(crop.x * natural.width));
  const sy = Math.max(0, Math.round(crop.y * natural.height));
  const sw = Math.max(1, Math.min(natural.width - sx, Math.round(crop.w * natural.width)));
  const sh = Math.max(1, Math.min(natural.height - sy, Math.round(crop.h * natural.height)));
  const { canvas, ctx } = canvasContext(sw, sh);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  const blob = await blobFromCanvas(canvas, "image/png");
  downloadBlob(blob, `${stem(file.name)}-crop.png`);
}

export async function downloadColorSwatch(hex: string) {
  const { canvas, ctx } = canvasContext(256, 256);
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 256, 256);
  const blob = await blobFromCanvas(canvas, "image/png");
  downloadBlob(blob, `${hex.replace("#", "")}.png`);
  try {
    await navigator.clipboard.writeText(hex);
  } catch {
    /* clipboard may be blocked */
  }
}

export async function rasterTransform(file: File, turn: ImageTurn) {
  const img = await load(file);
  const { width, height } = sizeOf(img);
  const swap = turn === "90" || turn === "270";
  const { canvas, ctx } = canvasContext(swap ? height : width, swap ? width : height);
  ctx.save();
  if (turn === "90") {
    ctx.translate(height, 0);
    ctx.rotate(Math.PI / 2);
  } else if (turn === "180") {
    ctx.translate(width, height);
    ctx.rotate(Math.PI);
  } else if (turn === "270") {
    ctx.translate(0, width);
    ctx.rotate(-Math.PI / 2);
  } else if (turn === "flip-h") {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, height);
    ctx.scale(1, -1);
  }
  ctx.drawImage(img, 0, 0);
  ctx.restore();
  const blob = await blobFromCanvas(canvas, "image/png");
  downloadBlob(blob, `${stem(file.name)}-${turn}.png`);
}

export async function collageImages(files: File[], cols: number) {
  if (files.length < 2) throw new Error("Choose at least two images.");
  const columns = cols === 3 ? 3 : 2;
  const loaded: Awaited<ReturnType<typeof canvasFromFile>>[] = [];
  for (const file of files) loaded.push(await canvasFromFile(file));
  const cellW = 640;
  const rows = Math.ceil(loaded.length / columns);
  const gap = 16;
  const pad = 16;
  const rowHeights = Array.from({ length: rows }, (_, row) => {
    let height = 0;
    for (let col = 0; col < columns; col += 1) {
      const item = loaded[row * columns + col];
      if (!item) continue;
      height = Math.max(height, (cellW / item.width) * item.height);
    }
    return height;
  });
  const width = pad * 2 + columns * cellW + (columns - 1) * gap;
  const height = pad * 2 + rowHeights.reduce((sum, value) => sum + value, 0) + (rows - 1) * gap;
  const max = 4096;
  const scale = Math.min(1, max / Math.max(width, height));
  const { canvas, ctx } = canvasContext(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  let y = pad;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const item = loaded[row * columns + col];
      if (!item) continue;
      const h = (cellW / item.width) * item.height;
      const x = pad + col * (cellW + gap);
      ctx.drawImage(item.canvas, x, y + (rowHeights[row] - h) / 2, cellW, h);
    }
    y += rowHeights[row] + gap;
  }
  const blob = await blobFromCanvas(canvas, "image/png");
  downloadBlob(blob, "collage.png");
}
