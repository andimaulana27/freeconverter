import { bytesToBlob, stem } from "@/lib/file";
import { renderPdfPages } from "@/lib/convert/pdf-raster";
import { encodeTiff } from "@/lib/convert/tiff";

export async function pdfToTiff(file: File) {
  const parts: { name: string; blob: Blob }[] = [];
  const base = stem(file.name);
  await renderPdfPages(file, async (canvas, ctx, index, total) => {
    const blob = bytesToBlob(encodeTiff(ctx.getImageData(0, 0, canvas.width, canvas.height)), "image/tiff");
    const suffix = total === 1 ? ".tiff" : `-p${index}.tiff`;
    parts.push({ name: `${base}${suffix}`, blob });
  });
  const { downloadZip } = await import("@/lib/convert/zip-download");
  await downloadZip(parts, `${base}-tiff.zip`);
}
