import { PDFDocument } from "pdf-lib";
import { bytesToBlob, downloadBlob, stem } from "@/lib/file";
import { textToPdf } from "@/lib/convert/pdf";

function asDocument(html: string) {
  if (/<html/i.test(html)) return html;
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:24px;font:16px/1.5 Helvetica,Arial,sans-serif;color:#111}</style></head><body>${html}</body></html>`;
}

function loadFrame(html: string) {
  return new Promise<{ doc: Document; cleanup: () => void }>((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-same-origin");
    iframe.style.cssText = "position:fixed;left:-12000px;top:0;width:794px;height:1123px;border:0;";
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const cleanup = () => {
      URL.revokeObjectURL(url);
      iframe.remove();
    };
    iframe.onload = () => {
      const doc = iframe.contentDocument;
      if (!doc?.body) {
        cleanup();
        reject(new Error("The HTML could not be rendered."));
        return;
      }
      resolve({ doc, cleanup });
    };
    iframe.onerror = () => {
      cleanup();
      reject(new Error("The HTML could not be rendered."));
    };
    document.body.appendChild(iframe);
    iframe.src = url;
  });
}

async function rasterHtml(doc: Document) {
  const width = Math.min(1200, Math.max(600, doc.documentElement.scrollWidth || 794));
  const height = Math.min(14000, Math.max(800, doc.body.scrollHeight || 1123));
  const inner = doc.body.innerHTML.replace(/<script[\s\S]*?<\/script>/gi, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;font:16px/1.5 Helvetica,Arial,sans-serif;color:#111">${inner}</div>
    </foreignObject>
  </svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This HTML could not be drawn as an image. The text-only PDF fallback will be used."));
    image.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0);
  return canvas;
}

async function canvasSliceToPdf(canvas: HTMLCanvasElement, filename: string) {
  const pdf = await PDFDocument.create();
  const pageW = 595;
  const pageH = 842;
  const margin = 28;
  const drawW = pageW - margin * 2;
  const scale = drawW / canvas.width;
  const sliceH = Math.max(1, Math.floor((pageH - margin * 2) / scale));
  for (let top = 0; top < canvas.height; top += sliceH) {
    const h = Math.min(sliceH, canvas.height - top);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = h;
    const ctx = slice.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available in this browser.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, top, canvas.width, h, 0, 0, canvas.width, h);
    const jpg = await new Promise<Uint8Array>((resolve, reject) => {
      slice.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Could not encode the HTML page."));
          return;
        }
        blob.arrayBuffer().then((buffer) => resolve(new Uint8Array(buffer)), reject);
      }, "image/jpeg", 0.86);
    });
    const image = await pdf.embedJpg(jpg);
    const page = pdf.addPage([pageW, pageH]);
    page.drawImage(image, {
      x: margin,
      y: pageH - margin - h * scale,
      width: drawW,
      height: h * scale,
    });
  }
  const bytes = await pdf.save();
  downloadBlob(bytesToBlob(bytes, "application/pdf"), filename);
}

export async function htmlStringToPdf(html: string, filename: string) {
  const { doc, cleanup } = await loadFrame(asDocument(html));
  try {
    try {
      const canvas = await rasterHtml(doc);
      await canvasSliceToPdf(canvas, filename);
    } catch {
      const text = doc.body.innerText?.trim();
      if (!text) throw new Error("This document cannot be rendered as a PDF in this browser.");
      await textToPdf(text, filename);
    }
  } finally {
    cleanup();
  }
}

export async function htmlToPdf(file: File) {
  await htmlStringToPdf(await file.text(), `${stem(file.name)}.pdf`);
}

function decodeEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&hellip;/gi, "...")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export async function htmlToTxt(file: File) {
  const html = await file.text();
  const text = decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<(br|hr)\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|tr|table|section|article|header|footer)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim(),
  );
  if (!text) throw new Error("No readable text was found in this HTML file.");
  downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), `${stem(file.name)}.txt`);
}
