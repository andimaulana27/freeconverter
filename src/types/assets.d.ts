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

declare module "pako" {
  const pako: {
    inflate(data: Uint8Array | ArrayBuffer, options?: { to?: string }): Uint8Array;
    deflate(data: Uint8Array | ArrayBuffer, options?: { to?: string }): Uint8Array;
  };
  export default pako;
}
