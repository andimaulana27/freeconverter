import { encodeBmp } from "@/lib/convert/bmp";
import { blobFromCanvas } from "@/lib/convert/canvas-draw";
import type { RasterOutput } from "@/lib/convert/image-types";
import { downloadBlob, downloadBytes } from "@/lib/file";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function writeCanvasImage(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  output: RasterOutput,
  name: string,
  opts?: { quality?: number },
) {
  if (output === "ico" || output === "tiff") {
    throw new Error(`Choose the ${output.toUpperCase()} converter for this file.`);
  }
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (output === "bmp") {
    downloadBytes(encodeBmp(imageData), `${name}.bmp`, "image/bmp");
    return;
  }
  if (output === "gif") {
    const { encodeStillGif } = await import("@/lib/convert/gif");
    downloadBytes(encodeStillGif(imageData), `${name}.gif`, "image/gif");
    return;
  }
  if (output === "avif") {
    const { encodeAvif } = await import("@/lib/convert/avif");
    downloadBytes(await encodeAvif(canvas, imageData, opts?.quality ?? 0.72), `${name}.avif`, "image/avif");
    return;
  }
  const blob = await blobFromCanvas(canvas, MIME[output] ?? "image/png", opts?.quality ?? 0.86);
  downloadBlob(blob, `${name}.${output === "jpg" ? "jpg" : output}`);
}
