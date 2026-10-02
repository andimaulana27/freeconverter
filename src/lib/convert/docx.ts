import { downloadBlob, stem } from "@/lib/file";

async function mammothApi() {
  const mammoth = await import("mammoth");
  return mammoth;
}

export async function docxToHtmlString(file: File) {
  const mammoth = await mammothApi();
  const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  const html = result.value?.trim();
  if (!html) throw new Error("This Word file is empty or unreadable. Legacy .doc files are not supported.");
  return html;
}

export async function convertDocx(file: File, slug: string, output: string) {
  const name = stem(file.name);
  const target = output || slug.split("-to-")[1] || "";
  if (target === "html") {
    downloadBlob(
      new Blob([`<!doctype html><html><head><meta charset="utf-8"></head><body>${await docxToHtmlString(file)}</body></html>`], {
        type: "text/html",
      }),
      `${name}.html`,
    );
    return;
  }
  if (target === "txt") {
    const mammoth = await mammothApi();
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    const text = result.value?.trim();
    if (!text) throw new Error("This Word file is empty or unreadable.");
    downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), `${name}.txt`);
    return;
  }
  if (target === "pdf") {
    const { htmlStringToPdf } = await import("@/lib/convert/html-pdf");
    await htmlStringToPdf(await docxToHtmlString(file), `${name}.pdf`);
    return;
  }
  throw new Error("This document conversion is not available in the browser yet.");
}
