import { blobFromCanvas, canvasFromImageFile } from "@/lib/convert/canvas-draw";

export async function rasterToJpegBytes(file: File, quality = 0.9) {
  const { canvas } = await canvasFromImageFile(file, { background: "#ffffff" });
  const blob = await blobFromCanvas(canvas, "image/jpeg", quality);
  return new Uint8Array(await blob.arrayBuffer());
}
