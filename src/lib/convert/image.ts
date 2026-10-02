import { encodeBmp } from "@/lib/convert/bmp";
import { blobFromCanvas, canvasContext, canvasFromImageFile, loadImage, sizeOf } from "@/lib/convert/canvas-draw";
import { asRasterOutput, type RasterOutput } from "@/lib/convert/image-types";
import { downloadBlob, downloadBytes, stem } from "@/lib/file";
import type { CropBox, ImageTurn } from "@/lib/convert/image-types";

export type { RasterOutput };
export { asRasterOutput, encodeBmp };

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const ICON_SIZES = [16, 32, 48];

async function canvasFromFile(file: File, opts?: { width?: number; background?: string }) {
  return canvasFromImageFile(file, opts);
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

export async function rasterConvert(file: File, output: RasterOutput, opts?: { quality?: number; width?: number }) {
  const name = stem(file.name);
  if (output === "ico") {
    downloadBytes(await encodeIco(file), `${name}.ico`, "image/x-icon");
    return;
  }
  const opaque = output === "jpg" || output === "bmp";
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
    throw new Error("Choose the TIFF converter for this file.");
  }
  if (output === "gif") {
    throw new Error("The browser cannot write animated GIFs. Choose PNG or JPG instead.");
  }
  const blob = await blobFromCanvas(canvas, MIME[output] ?? "image/png", opts?.quality ?? 0.86);
  downloadBlob(blob, `${name}.${output === "jpg" ? "jpg" : output}`);
}

export async function rasterCrop(file: File, crop: CropBox) {
  const img = await loadImage(file);
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
  const img = await loadImage(file);
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
