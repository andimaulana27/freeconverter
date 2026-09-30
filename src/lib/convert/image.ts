import { downloadBlob, stem } from "@/lib/file";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

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
      reject(new Error("Browser tidak bisa membaca gambar ini (HEIC sering gagal di Chrome)."));
    };
    img.src = url;
  });
}

export async function rasterToJpegBytes(file: File, quality = 0.9) {
  const img = await load(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal encode JPEG."))), "image/jpeg", quality);
  });
  return new Uint8Array(await blob.arrayBuffer());
}

export async function rasterConvert(
  file: File,
  output: "jpg" | "png" | "webp" | "gif",
  opts?: { quality?: number; width?: number },
) {
  const img = await load(file);
  const scale = opts?.width ? Math.min(1, opts.width / img.naturalWidth) : 1;
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia.");
  if (output === "jpg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  const mime = MIME[output] ?? "image/png";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Gagal encode gambar."))),
      mime,
      opts?.quality ?? 0.86,
    );
  });
  downloadBlob(blob, `${stem(file.name)}.${output === "jpg" ? "jpg" : output}`);
}
