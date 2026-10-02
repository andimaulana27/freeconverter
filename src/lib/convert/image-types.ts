export type CropBox = { x: number; y: number; w: number; h: number };

export const DEFAULT_CROP: CropBox = { x: 0.12, y: 0.12, w: 0.76, h: 0.76 };

export type ImageTurn = "90" | "180" | "270" | "flip-h" | "flip-v";

export type RasterOutput = "jpg" | "png" | "webp" | "gif" | "ico" | "bmp" | "tiff" | "avif";

export function asRasterOutput(value: string): RasterOutput | null {
  if (value === "jpeg") return "jpg";
  if (value === "tif") return "tiff";
  if (value === "jpg" || value === "png" || value === "webp" || value === "gif" || value === "ico" || value === "bmp" || value === "tiff" || value === "avif") {
    return value;
  }
  return null;
}

export function isOpaqueRaster(output: string) {
  return output === "jpg" || output === "jpeg" || output === "bmp" || output === "tiff" || output === "gif";
}
