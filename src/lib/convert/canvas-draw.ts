export function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const name = file.name.toLowerCase();
      const type = file.type.toLowerCase();
      if (/\.(heic|heif)$/.test(name) || type.includes("heic") || type.includes("heif")) {
        reject(new Error("This browser cannot decode HEIC. Try Safari, or convert the photo to JPG first."));
        return;
      }
      if (name.endsWith(".avif") || type.includes("avif")) {
        reject(new Error("This browser cannot decode AVIF. Choose PNG or JPG instead."));
        return;
      }
      reject(new Error("This browser cannot read the image. Try PNG, JPG, WebP, SVG, GIF, BMP, or ICO."));
    };
    img.src = url;
  });
}

export function sizeOf(img: HTMLImageElement) {
  const width = img.naturalWidth || 1024;
  const height = img.naturalHeight || 1024;
  return { width, height };
}

export function canvasContext(width: number, height: number) {
  const safeWidth = Math.max(1, Math.min(8192, Math.round(width)));
  const safeHeight = Math.max(1, Math.min(8192, Math.round(height)));
  const canvas = document.createElement("canvas");
  canvas.width = safeWidth;
  canvas.height = safeHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  return { canvas, ctx };
}

export async function blobFromCanvas(canvas: HTMLCanvasElement, mime: string, quality?: number) {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), mime, quality);
  });
  if (blob) return blob;
  if (mime === "image/webp") {
    throw new Error("This browser cannot write WebP. Choose PNG or JPG instead.");
  }
  throw new Error("Could not encode the image.");
}

export async function canvasFromImageFile(file: File, opts?: { width?: number; background?: string }) {
  const img = await loadImage(file);
  const natural = sizeOf(img);
  const maxEdge = 8192;
  const fit = Math.min(1, maxEdge / Math.max(natural.width, natural.height));
  const scale = (opts?.width ? Math.min(1, opts.width / natural.width) : 1) * fit;
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
