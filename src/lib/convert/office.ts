import { downloadBlob, stem } from "@/lib/file";
import { parseCsv, rowsToPdf, textToPdf } from "@/lib/convert/pdf";
import type JSZip from "jszip";

function xml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripXml(value: string) {
  return value
    .replace(/<a:t[^>]*>/g, "")
    .replace(/<\/a:t>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function colLetter(index: number) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function colFromRef(ref: string) {
  const letters = ref.replace(/\d+/g, "");
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.toUpperCase().charCodeAt(0) - 64);
  return Math.max(0, n - 1);
}

function rowFromRef(ref: string) {
  return Math.max(0, Number(ref.replace(/\D+/g, "")) - 1);
}

function cellText(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export function jsonToRows(value: unknown): string[][] {
  if (Array.isArray(value) && value.every((row) => Array.isArray(row))) {
    return value.map((row) => row.map((cell) => cellText(cell)));
  }
  if (Array.isArray(value) && value.every((row) => row && typeof row === "object" && !Array.isArray(row))) {
    const keys = [...new Set(value.flatMap((row) => Object.keys(row as object)))];
    if (!keys.length) throw new Error("JSON tidak punya field.");
    return [keys, ...value.map((row) => keys.map((key) => cellText((row as Record<string, unknown>)[key])))];
  }
  throw new Error("JSON harus array objek atau array baris.");
}

function rowsToCsv(rows: string[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
          return cell;
        })
        .join(","),
    )
    .join("\n");
}

async function zipOf(file: File) {
  try {
    const JSZip = (await import("jszip")).default;
    return await JSZip.loadAsync(await file.arrayBuffer());
  } catch {
    throw new Error("This Office file is damaged or is not a modern XLSX/PPTX package.");
  }
}

async function readSharedStrings(zip: JSZip) {
  const file = zip.file("xl/sharedStrings.xml");
  if (!file) return [];
  const xmlText = await file.async("string");
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  return [...doc.getElementsByTagName("si")].map((node) => (node.textContent ?? "").trim());
}

export async function xlsxToRows(file: File) {
  const zip = await zipOf(file);
  const strings = await readSharedStrings(zip);
  const sheet = zip.file("xl/worksheets/sheet1.xml") ?? zip.file(/xl\/worksheets\/sheet\d+\.xml/)[0];
  if (!sheet) throw new Error("Excel tidak punya sheet. Pakai XLSX, bukan XLS lama.");
  const doc = new DOMParser().parseFromString(await sheet.async("string"), "application/xml");
  const cells = [...doc.getElementsByTagName("c")];
  if (!cells.length) throw new Error("Sheet Excel kosong.");
  let width = 1;
  let height = 1;
  const map = new Map<string, string>();
  for (const cell of cells) {
    const ref = cell.getAttribute("r") || "";
    if (!ref) continue;
    const col = colFromRef(ref);
    const row = rowFromRef(ref);
    width = Math.max(width, col + 1);
    height = Math.max(height, row + 1);
    const type = cell.getAttribute("t");
    let value = "";
    if (type === "s") {
      const index = Number(cell.getElementsByTagName("v")[0]?.textContent ?? "");
      value = strings[index] ?? "";
    } else if (type === "inlineStr") {
      value = cell.getElementsByTagName("t")[0]?.textContent ?? "";
    } else {
      value = cell.getElementsByTagName("v")[0]?.textContent ?? "";
    }
    map.set(`${row}:${col}`, value);
  }
  width = Math.min(40, width);
  height = Math.min(4000, height);
  const rows: string[][] = [];
  for (let row = 0; row < height; row += 1) {
    const next = Array.from({ length: width }, (_, col) => map.get(`${row}:${col}`) ?? "");
    if (next.some((cell) => cell)) rows.push(next);
  }
  if (!rows.length) throw new Error("Sheet Excel kosong.");
  return rows;
}

async function rowsToXlsx(rows: string[][], filename: string) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const strings = [...new Set(rows.flat())];
  const indexOf = new Map(strings.map((value, index) => [value, index]));
  const shared = strings
    .map((value) => `<si><t xml:space="preserve">${xml(value)}</t></si>`)
    .join("");
  const sheetRows = rows
    .map((row, r) => {
      const cells = row
        .map((cell, c) => `<c r="${colLetter(c)}${r + 1}" t="s"><v>${indexOf.get(cell) ?? 0}</v></c>`)
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
  );
  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
  );
  zip.file(
    "xl/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="1"><fill><patternFill patternType="none"/></fill></fills>
<borders count="1"><border/></borders>
<cellStyleXfs count="1"><xf/></cellStyleXfs>
<cellXfs count="1"><xf/></cellXfs>
</styleSheet>`,
  );
  zip.file(
    "xl/sharedStrings.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">${shared}</sst>`,
  );
  zip.file(
    "xl/worksheets/sheet1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`,
  );
  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  downloadBlob(blob, filename);
}

async function pptxToText(file: File) {
  const zip = await zipOf(file);
  const slides = zip.file(/ppt\/slides\/slide\d+\.xml/).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  if (!slides.length) throw new Error("This PPTX has no readable slides.");
  const parts: string[] = [];
  for (const slide of slides) {
    const text = stripXml(await slide.async("string"));
    if (text) parts.push(text);
  }
  const out = parts.join("\n\n").trim();
  if (!out) throw new Error("This slide has no extractable text. Layouts and images are not included.");
  return out;
}

export async function convertOffice(file: File, slug: string, output: string) {
  const name = stem(file.name);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (slug === "xlsx-to-csv" || (ext === "xlsx" && output === "csv")) {
    downloadBlob(new Blob([rowsToCsv(await xlsxToRows(file))], { type: "text/csv;charset=utf-8" }), `${name}.csv`);
    return;
  }
  if (slug === "xlsx-to-json" || (ext === "xlsx" && output === "json")) {
    const rows = await xlsxToRows(file);
    const [header, ...body] = rows;
    const data = body.map((row) => Object.fromEntries(header.map((key, i) => [key || `col${i + 1}`, row[i] ?? ""])));
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `${name}.json`);
    return;
  }
  if (slug === "xlsx-to-pdf" || (ext === "xlsx" && output === "pdf")) {
    await rowsToPdf(await xlsxToRows(file), `${name}.pdf`);
    return;
  }

  if (slug === "csv-to-xlsx") {
    await rowsToXlsx(parseCsv(await file.text()), `${name}.xlsx`);
    return;
  }
  if (slug === "csv-to-json") {
    const rows = parseCsv(await file.text());
    const [header, ...body] = rows;
    if (!header?.length) throw new Error("CSV kosong.");
    const data = body.map((row) => Object.fromEntries(header.map((key, i) => [key || `col${i + 1}`, row[i] ?? ""])));
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `${name}.json`);
    return;
  }
  if (slug === "json-to-csv") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      throw new Error("JSON tidak valid.");
    }
    downloadBlob(new Blob([rowsToCsv(jsonToRows(parsed))], { type: "text/csv;charset=utf-8" }), `${name}.csv`);
    return;
  }
  if (slug === "json-to-xlsx") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      throw new Error("JSON tidak valid.");
    }
    await rowsToXlsx(jsonToRows(parsed), `${name}.xlsx`);
    return;
  }

  if (slug === "pptx-to-txt" || (ext === "pptx" && output === "txt")) {
    downloadBlob(new Blob([await pptxToText(file)], { type: "text/plain;charset=utf-8" }), `${name}.txt`);
    return;
  }
  if (slug === "pptx-to-pdf" || (ext === "pptx" && output === "pdf")) {
    await textToPdf(await pptxToText(file), `${name}.pdf`);
    return;
  }

  throw new Error("This document conversion is not available in the browser yet.");
}
