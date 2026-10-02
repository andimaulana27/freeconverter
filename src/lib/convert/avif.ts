const AVIF_WASM = "/avif_enc.wasm";

type AvifModule = {
  encode: (
    data: BufferSource,
    width: number,
    height: number,
    options: Record<string, unknown>,
  ) => Uint8Array | null;
};

let encoder: Promise<AvifModule> | null = null;

async function nativeAvif(canvas: HTMLCanvasElement, quality: number) {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), "image/avif", quality);
  });
  if (!blob || blob.size < 32 || !blob.type.includes("avif")) return null;
  return new Uint8Array(await blob.arrayBuffer());
}

async function wasmEncoder() {
  if (!encoder) {
    encoder = (async () => {
      const { default: createModule } = await import("@jsquash/avif/codec/enc/avif_enc.js");
      return createModule({
        noInitialRun: true,
        locateFile: (path: string) => (path.endsWith(".wasm") ? AVIF_WASM : path),
      });
    })();
  }
  try {
    return await encoder;
  } catch (error) {
    encoder = null;
    throw error;
  }
}

export async function encodeAvif(canvas: HTMLCanvasElement, imageData: ImageData, quality = 0.72) {
  const native = await nativeAvif(canvas, quality);
  if (native) return native;

  const codec = await wasmEncoder();
  const pixels = new Uint8Array(imageData.data);
  const encoded = codec.encode(pixels, imageData.width, imageData.height, {
    quality: Math.round(Math.min(100, Math.max(1, quality * 100))),
    qualityAlpha: -1,
    denoiseLevel: 0,
    tileRowsLog2: 0,
    tileColsLog2: 0,
    speed: 8,
    subsample: 1,
    chromaDeltaQ: false,
    sharpness: 0,
    enableSharpYUV: false,
    tune: 0,
    lossless: false,
    bitDepth: 8,
  });
  if (!encoded?.length) {
    throw new Error("Could not encode AVIF. Try WebP or JPG instead.");
  }
  return encoded;
}
