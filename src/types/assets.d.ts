declare module "*?url" {
  const src: string;
  export default src;
}

declare module "utif" {
  type Ifd = { width: number; height: number };
  const UTIF: {
    decode(data: ArrayBuffer | Uint8Array): Ifd[];
    decodeImage(data: ArrayBuffer | Uint8Array, ifd: Ifd): void;
    toRGBA8(ifd: Ifd): Uint8Array;
    encodeImage(rgba: Uint8Array, width: number, height: number): ArrayBuffer;
  };
  export default UTIF;
}

declare module "@jsquash/avif/codec/enc/avif_enc.js" {
  const factory: (opts?: {
    noInitialRun?: boolean;
    locateFile?: (path: string, prefix?: string) => string;
  }) => Promise<{
    encode: (
      data: BufferSource,
      width: number,
      height: number,
      options: Record<string, unknown>,
    ) => Uint8Array | null;
  }>;
  export default factory;
}

declare module "gifenc" {
  type Palette = number[][];
  export function GIFEncoder(opt?: { initialCapacity?: number; auto?: boolean }): {
    writeFrame: (
      index: Uint8Array,
      width: number,
      height: number,
      opts?: { palette?: Palette | null; delay?: number; repeat?: number; transparent?: boolean; transparentIndex?: number },
    ) => void;
    finish: () => void;
    bytes: () => Uint8Array;
  };
  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, options?: object): Palette;
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette, format?: string): Uint8Array;
}

declare module "pako" {
  const pako: {
    inflate(data: Uint8Array | ArrayBuffer, options?: { to?: string }): Uint8Array;
    deflate(data: Uint8Array | ArrayBuffer, options?: { to?: string }): Uint8Array;
  };
  export default pako;
}
