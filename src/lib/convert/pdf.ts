import { PDFDocument, degrees } from "pdf-lib";
import { bytesToBlob, downloadBlob, extOf, stem } from "@/lib/file";
import { rasterToJpegBytes } from "@/lib/convert/image";

export async function imagesToPdf(files: File[]) {
  const pdf = await PDFDocument.create();
  for (const file of files) {
    const ext = extOf(file.name);
    const bytes =
      ext === "png"
        ? new Uint8Array(await file.arrayBuffer())
        : ext === "jpg" || ext === "jpeg"
          ? new Uint8Array(await file.arrayBuffer())
          : await rasterToJpegBytes(file);
    const img = ext === "png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  const out = await pdf.save();
  downloadBlob(bytesToBlob(out, "application/pdf"), `${stem(files[0].name)}.pdf`);
}

export async function mergePdfs(files: File[]) {
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await PDFDocument.load(await file.arrayBuffer());
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((page) => out.addPage(page));
  }
  const bytes = await out.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), "merged.pdf");
}

export async function rotatePdf(file: File) {
  const src = await PDFDocument.load(await file.arrayBuffer());
  src.getPages().forEach((page) => page.setRotation(degrees((page.getRotation().angle + 90) % 360)));
  const bytes = await src.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), `${stem(file.name)}-rotated.pdf`);
}

export async function splitPdf(file: File) {
  const src = await PDFDocument.load(await file.arrayBuffer());
  const zipParts: { name: string; blob: Blob }[] = [];
  for (let i = 0; i < src.getPageCount(); i++) {
    const one = await PDFDocument.create();
    const [page] = await one.copyPages(src, [i]);
    one.addPage(page);
    const bytes = await one.save();
    zipParts.push({
      name: `${stem(file.name)}-p${i + 1}.pdf`,
      blob: bytesToBlob(bytes, "application/pdf"),
    });
  }
  if (zipParts.length === 1) {
    downloadBlob(zipParts[0].blob, zipParts[0].name);
    return;
  }
  for (const part of zipParts) downloadBlob(part.blob, part.name);
}
