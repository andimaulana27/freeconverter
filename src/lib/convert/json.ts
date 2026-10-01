import { downloadBlob, stem } from "@/lib/file";

export async function formatJson(file: File) {
  const raw = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("JSON tidak valid.");
  }
  const out = JSON.stringify(parsed, null, 2);
  downloadBlob(new Blob([out], { type: "application/json" }), `${stem(file.name)}.json`);
}
