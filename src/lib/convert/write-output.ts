import { blobFromCanvas, canvasFromImageFile } from "@/lib/convert/canvas-draw";
import { asRasterOutput } from "@/lib/convert/image-types";
import { isTiffName, stem } from "@/lib/file";

export type RasterWriteOpts = {
  quality?: number;
  width?: number;
  height?: number;
  stretch?: boolean;
};

export async function writeRasterFiles(files: File[], output: string, opts?: RasterWriteOpts) {
  if (output === "pdf") {
    const shaped = Boolean(opts?.width || opts?.height || opts?.quality);
    if (shaped) {
      const prepared: File[] = [];
      for (const file of files) {
        const draw = { width: opts?.width, height: opts?.height, stretch: opts?.stretch, background: "#ffffff" };
        const { canvas } = isTiffName(file.name)
          ? await (await import("@/lib/convert/tiff")).canvasFromTiff(file, draw)
          : await canvasFromImageFile(file, draw);
        const blob = await blobFromCanvas(canvas, "image/jpeg", opts?.quality ?? 0.86);
        prepared.push(new File([blob], `${stem(file.name)}.jpg`, { type: "image/jpeg" }));
      }
      const { imagesToPdf } = await import("@/lib/convert/pdf");
      await imagesToPdf(prepared);
      return;
    }
    if (files.some((file) => isTiffName(file.name))) {
      const { tiffImagesToPdf } = await import("@/lib/convert/tiff");
      await tiffImagesToPdf(files);
      return;
    }
    const { imagesToPdf } = await import("@/lib/convert/pdf");
    await imagesToPdf(files);
    return;
  }

  const raster = asRasterOutput(output);
  if (!raster) throw new Error("Choose an output format first.");
  if (raster === "tiff" || files.some((file) => isTiffName(file.name))) {
    const { rasterConvertTiff } = await import("@/lib/convert/tiff");
    for (const file of files) await rasterConvertTiff(file, raster, opts);
    return;
  }
  const { rasterConvert } = await import("@/lib/convert/image");
  for (const file of files) await rasterConvert(file, raster, opts);
}

export async function writePdfExport(file: File, output: string, quality?: number) {
  if (output === "txt" || output === "docx") {
    const { convertPdfDocument } = await import("@/lib/convert/pdf-text");
    await convertPdfDocument(file, `pdf-to-${output}`, output);
    return;
  }
  if (output === "tiff") {
    const { pdfToTiff } = await import("@/lib/convert/pdf-tiff");
    await pdfToTiff(file);
    return;
  }
  const raster = output === "png" || output === "webp" || output === "bmp" ? output : "jpg";
  const { pdfToImages } = await import("@/lib/convert/pdf-raster");
  await pdfToImages(file, raster, { quality });
}
