import { GIFEncoder, applyPalette, quantize } from "gifenc";

export function encodeStillGif(imageData: ImageData) {
  const { width, height, data } = imageData;
  const palette = quantize(data, 256);
  const index = applyPalette(data, palette);
  const gif = GIFEncoder();
  gif.writeFrame(index, width, height, { palette, delay: 0, repeat: -1 });
  gif.finish();
  return gif.bytes();
}
