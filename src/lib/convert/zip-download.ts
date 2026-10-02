import { downloadBlob } from "@/lib/file";

export async function downloadZip(parts: { name: string; blob: Blob }[], filename: string) {
  if (!parts.length) throw new Error("Nothing to download.");
  if (parts.length === 1) {
    downloadBlob(parts[0].blob, parts[0].name);
    return;
  }
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const part of parts) zip.file(part.name, await part.blob.arrayBuffer());
  downloadBlob(await zip.generateAsync({ type: "blob" }), filename);
}
