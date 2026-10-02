import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  StandardFonts,
  degrees,
  rgb,
} from "pdf-lib";
import { bytesToBlob, downloadBlob, extOf, stem } from "@/lib/file";
import { rasterToJpegBytes } from "@/lib/convert/raster-jpeg";

const ACCENT = rgb(229 / 255, 50 / 255, 45 / 255);
const INK = rgb(17 / 255, 17 / 255, 17 / 255);

async function loadPdf(file: File, options?: { ignoreEncryption?: boolean }) {
  try {
    return await PDFDocument.load(await file.arrayBuffer(), options);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/encrypt/i.test(message)) throw new Error("This PDF is password-protected.");
    throw new Error("This PDF is damaged or unreadable.");
  }
}

export function parsePageSpec(spec: string, count: number) {
  const parts = spec.split(/[,;\s]+/).map((part) => part.trim()).filter(Boolean);
  if (!parts.length) throw new Error("Enter page numbers first, for example 1-3, 5.");
  const picked = new Set<number>();
  for (const part of parts) {
    const bounds = part.split("-").map((value) => Number(value));
    if (bounds.some((value) => !Number.isInteger(value))) {
      throw new Error("Page numbers must be numeric, for example 1-3, 5.");
    }
    const from = bounds[0];
    const to = bounds.length === 1 ? bounds[0] : bounds[1];
    if (from < 1 || to < 1 || from > count || to > count || from > to) {
      throw new Error(`Page number is out of range. This file has ${count} pages.`);
    }
    for (let page = from; page <= to; page += 1) picked.add(page - 1);
  }
  return [...picked].sort((a, b) => a - b);
}

export function parsePageOrder(spec: string, count: number) {
  const raw = spec.trim().toLowerCase();
  if (!raw || raw === "reverse") {
    return Array.from({ length: count }, (_, index) => count - 1 - index);
  }
  const parts = spec.split(/[,;\s]+/).map((part) => part.trim()).filter(Boolean);
  const order: number[] = [];
  for (const part of parts) {
    const bounds = part.split("-").map((value) => Number(value));
    if (bounds.some((value) => !Number.isInteger(value))) {
      throw new Error("Page numbers must be numeric, for example 3,1,2 or 1-3.");
    }
    const from = bounds[0];
    const to = bounds.length === 1 ? bounds[0] : bounds[1];
    if (from < 1 || to < 1 || from > count || to > count || from > to) {
      throw new Error(`Page number is out of range. This file has ${count} pages.`);
    }
    for (let page = from; page <= to; page += 1) order.push(page - 1);
  }
  return order;
}

async function savePdf(file: File, indices: number[], suffix: string) {
  if (!indices.length) throw new Error("No pages would remain.");
  const src = await loadPdf(file);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((page) => out.addPage(page));
  const bytes = await out.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), `${stem(file.name)}${suffix}.pdf`);
}

export async function imagesToPdf(files: File[]) {
  const pdf = await PDFDocument.create();
  for (const file of files) {
    const ext = extOf(file.name);
    const raw = new Uint8Array(await file.arrayBuffer());
    let img;
    if (ext === "png") {
      try {
        img = await pdf.embedPng(raw);
      } catch {
        img = await pdf.embedJpg(await rasterToJpegBytes(file));
      }
    } else if (ext === "jpg" || ext === "jpeg") {
      try {
        img = await pdf.embedJpg(raw);
      } catch {
        img = await pdf.embedJpg(await rasterToJpegBytes(file));
      }
    } else {
      img = await pdf.embedJpg(await rasterToJpegBytes(file));
    }
    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  const out = await pdf.save();
  downloadBlob(bytesToBlob(out, "application/pdf"), `${stem(files[0].name)}.pdf`);
}

export async function mergePdfs(files: File[]) {
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await loadPdf(file);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((page) => out.addPage(page));
  }
  const bytes = await out.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), "merged.pdf");
}

export async function rotatePdf(file: File, turn = 90) {
  const src = await loadPdf(file);
  const angle = ((Math.round(turn / 90) * 90) % 360 + 360) % 360;
  src.getPages().forEach((page) => page.setRotation(degrees((page.getRotation().angle + angle) % 360)));
  const bytes = await src.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), `${stem(file.name)}-rotated.pdf`);
}

export async function splitPdf(files: File | File[]) {
  const list = Array.isArray(files) ? files : [files];
  if (!list.length) throw new Error("Choose a PDF first.");
  const zipParts: { name: string; blob: Blob }[] = [];
  const used = new Set<string>();
  for (const file of list) {
    const src = await loadPdf(file);
    const count = src.getPageCount();
    if (!count) throw new Error(`${file.name} has no pages.`);
    const base = stem(file.name) || "page";
    for (let i = 0; i < count; i++) {
      const one = await PDFDocument.create();
      const [page] = await one.copyPages(src, [i]);
      one.addPage(page);
      const bytes = await one.save();
      let name = `${base}-p${i + 1}.pdf`;
      for (let n = 2; used.has(name); n += 1) name = `${base}-p${i + 1}-${n}.pdf`;
      used.add(name);
      zipParts.push({
        name,
        blob: bytesToBlob(bytes, "application/pdf"),
      });
    }
  }
  const zipName = list.length === 1 ? `${stem(list[0].name)}-pages.zip` : "split-pages.zip";
  const { downloadZip } = await import("@/lib/convert/zip-download");
  await downloadZip(zipParts, zipName);
}

export async function extractPdfPages(file: File, spec: string) {
  const src = await loadPdf(file);
  await savePdf(file, parsePageSpec(spec, src.getPageCount()), "-extract");
}

export async function deletePdfPages(file: File, spec: string) {
  const src = await loadPdf(file);
  const count = src.getPageCount();
  const remove = new Set(parsePageSpec(spec, count));
  const keep = src.getPageIndices().filter((index) => !remove.has(index));
  if (keep.length === count) throw new Error("Choose at least one page to delete.");
  await savePdf(file, keep, "-edit");
}

export async function watermarkPdf(file: File, text: string) {
  const mark = text.trim();
  if (!mark) throw new Error("Enter watermark text first.");
  const pdf = await loadPdf(file);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const size = 28;
  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const labelWidth = font.widthOfTextAtSize(mark, size);
    page.drawText(latin1(mark), {
      x: (width - labelWidth) / 2,
      y: height / 2,
      size,
      font,
      color: ACCENT,
      opacity: 0.18,
      rotate: degrees(-22),
    });
  }
  const bytes = await pdf.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), `${stem(file.name)}-mark.pdf`);
}

export async function numberPdfPages(file: File) {
  const pdf = await loadPdf(file);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const total = pages.length;
  const size = 10;
  pages.forEach((page, index) => {
    const label = `${index + 1} / ${total}`;
    const { width } = page.getSize();
    page.drawText(label, {
      x: (width - font.widthOfTextAtSize(label, size)) / 2,
      y: 16,
      size,
      font,
      color: INK,
      opacity: 0.7,
    });
  });
  const bytes = await pdf.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), `${stem(file.name)}-n.pdf`);
}

export async function cropPdf(file: File, crop: { x: number; y: number; w: number; h: number }) {
  const pdf = await loadPdf(file);
  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const x = crop.x * width;
    const y = (1 - crop.y - crop.h) * height;
    const w = Math.max(8, crop.w * width);
    const h = Math.max(8, crop.h * height);
    page.setMediaBox(x, y, w, h);
    page.setCropBox(x, y, w, h);
    page.setTrimBox(x, y, w, h);
    page.setBleedBox(x, y, w, h);
  }
  const bytes = await pdf.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), `${stem(file.name)}-crop.pdf`);
}

export async function unlockPdf(file: File) {
  const pdf = await loadPdf(file, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const pages = await out.copyPages(pdf, pdf.getPageIndices());
  pages.forEach((page) => out.addPage(page));
  const bytes = await out.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), `${stem(file.name)}-open.pdf`);
}

export async function organizePdf(file: File, spec: string) {
  const src = await loadPdf(file);
  await savePdf(file, parsePageOrder(spec, src.getPageCount()), "-org");
}

export async function flattenPdf(file: File) {
  const pdf = await loadPdf(file);
  try {
    const form = pdf.getForm();
    if (!form.getFields().length) throw new Error("This PDF has no form fields to flatten.");
    form.flatten();
  } catch (error) {
    if (error instanceof Error && /form fields to flatten/.test(error.message)) throw error;
    throw new Error("This PDF has no form fields to flatten.");
  }
  const bytes = await pdf.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), `${stem(file.name)}-flat.pdf`);
}

export async function redactPdf(file: File, crop: { x: number; y: number; w: number; h: number }) {
  const pdf = await loadPdf(file);
  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    page.drawRectangle({
      x: crop.x * width,
      y: (1 - crop.y - crop.h) * height,
      width: Math.max(8, crop.w * width),
      height: Math.max(8, crop.h * height),
      color: rgb(0, 0, 0),
    });
  }
  const bytes = await pdf.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), `${stem(file.name)}-redact.pdf`);
}

export async function signPdf(file: File, name: string) {
  const label = name.trim();
  if (!label) throw new Error("Enter a signature name first.");
  const pdf = await loadPdf(file);
  const font = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const size = 14;
  for (const page of pdf.getPages()) {
    const { width } = page.getSize();
    const textWidth = font.widthOfTextAtSize(label, size);
    const x = Math.max(48, width - 48 - textWidth);
    page.drawLine({
      start: { x, y: 42 },
      end: { x: x + textWidth, y: 42 },
      thickness: 0.6,
      color: INK,
      opacity: 0.45,
    });
    page.drawText(latin1(label), { x, y: 26, size, font, color: INK });
  }
  const bytes = await pdf.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), `${stem(file.name)}-signed.pdf`);
}

function latin1(text: string) {
  return text.replace(/[^\n\r\t\x20-\x7E\xA0-\xFF]/g, "?");
}

function wrapPdfLine(text: string, font: { widthOfTextAtSize: (value: string, size: number) => number }, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    while (current.length > 1 && font.widthOfTextAtSize(current, size) > maxWidth) {
      let cut = current.length - 1;
      while (cut > 1 && font.widthOfTextAtSize(current.slice(0, cut), size) > maxWidth) cut -= 1;
      lines.push(current.slice(0, cut));
      current = current.slice(cut);
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function textToPdf(text: string, filename: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const size = 11;
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 48;
  const lineHeight = 15;
  const maxWidth = pageWidth - margin * 2;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  const paragraphs = latin1(text).replace(/\r\n/g, "\n").split("\n");
  for (const paragraph of paragraphs) {
    for (const line of wrapPdfLine(paragraph, font, size, maxWidth)) {
      if (y < margin + lineHeight) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line || " ", { x: margin, y, size, font, color: INK });
      y -= lineHeight;
    }
  }
  const bytes = await pdf.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), filename);
}

export async function txtToPdf(file: File) {
  await textToPdf(await file.text(), `${stem(file.name)}.pdf`);
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
        continue;
      }
      cell += ch;
      continue;
    }
    if (ch === '"') {
      quoted = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.length) || rows.length) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const width = Math.min(20, Math.max(0, ...rows.map((item) => item.length)));
  if (!width) throw new Error("CSV kosong.");
  return rows
    .map((item) => {
      const next = item.slice(0, width);
      while (next.length < width) next.push("");
      return next.map((value) => latin1(value.replace(/\s+/g, " ").trim()));
    })
    .filter((item) => item.some((value) => value));
}

function fitCell(text: string, font: { widthOfTextAtSize: (value: string, size: number) => number }, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let cut = text.length;
  while (cut > 1 && font.widthOfTextAtSize(`${text.slice(0, cut)}…`, size) > maxWidth) cut -= 1;
  return `${text.slice(0, cut)}…`;
}

export async function rowsToPdf(rows: string[][], filename: string) {
  const body = rows.slice(0, 4000);
  const cols = body[0]?.length ?? 0;
  if (!cols) throw new Error("Tabel kosong.");
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const landscape = cols > 5;
  const pageWidth = landscape ? 842 : 595;
  const pageHeight = landscape ? 595 : 842;
  const margin = 36;
  const size = cols > 8 ? 7 : 9;
  const rowHeight = 16;
  const colWidth = (pageWidth - margin * 2) / cols;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  body.forEach((row, index) => {
    if (y < margin + rowHeight) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    row.forEach((cell, col) => {
      const x = margin + col * colWidth;
      page.drawRectangle({
        x,
        y: y - rowHeight + 3,
        width: colWidth,
        height: rowHeight,
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 0.4,
        color: index === 0 ? rgb(0.96, 0.96, 0.96) : undefined,
      });
      page.drawText(fitCell(cell, font, size, colWidth - 8), {
        x: x + 4,
        y: y - 10,
        size,
        font,
        color: INK,
      });
    });
    y -= rowHeight;
  });
  const bytes = await pdf.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), filename);
}

export async function csvToPdf(file: File) {
  await rowsToPdf(parseCsv(await file.text()), `${stem(file.name)}.pdf`);
}

export type PdfFormDraft = {
  name: string;
  type: "text" | "check" | "choice";
  value: string;
  options?: string[];
};

async function formOf(file: File) {
  const pdf = await loadPdf(file);
  const form = pdf.getForm();
  if (!form.getFields().length) throw new Error("This PDF has no form fields to fill.");
  return { pdf, form };
}

export async function listPdfFields(file: File): Promise<PdfFormDraft[]> {
  const { form } = await formOf(file);
  const drafts: PdfFormDraft[] = [];
  for (const field of form.getFields()) {
    const name = field.getName();
    if (field instanceof PDFTextField) {
      drafts.push({ name, type: "text", value: field.getText() ?? "" });
    } else if (field instanceof PDFCheckBox) {
      drafts.push({ name, type: "check", value: field.isChecked() ? "yes" : "no" });
    } else if (field instanceof PDFDropdown || field instanceof PDFRadioGroup || field instanceof PDFOptionList) {
      const selected = field.getSelected();
      const value = Array.isArray(selected) ? (selected[0] ?? "") : (selected ?? "");
      drafts.push({ name, type: "choice", value, options: field.getOptions() });
    }
  }
  if (!drafts.length) throw new Error("This form has no fields that can be filled in the browser.");
  return drafts;
}

export async function fillPdf(file: File, values: Record<string, string>) {
  const { pdf, form } = await formOf(file);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const field of form.getFields()) {
    const next = values[field.getName()];
    if (next === undefined) continue;
    if (field instanceof PDFTextField) field.setText(latin1(next));
    else if (field instanceof PDFCheckBox) {
      if (next === "yes") field.check();
      else field.uncheck();
    } else if (field instanceof PDFDropdown || field instanceof PDFRadioGroup || field instanceof PDFOptionList) {
      if (next) field.select(next);
    }
  }
  form.updateFieldAppearances(font);
  const bytes = await pdf.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), `${stem(file.name)}-filled.pdf`);
}
