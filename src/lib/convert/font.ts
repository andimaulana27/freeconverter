import { compress } from "wawoff2";
import { downloadBytes, stem } from "@/lib/file";

function isSfnt(bytes: Uint8Array) {
  if (bytes.length < 4) return false;
  const tag = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  return tag === "OTTO" || tag === "\x00\x01\x00\x00" || tag === "true" || tag === "typ1";
}

export async function fontToWoff2(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isSfnt(bytes)) throw new Error("Bukan file TTF atau OTF.");
  const woff2 = await compress(bytes);
  downloadBytes(woff2, `${stem(file.name)}.woff2`, "font/woff2");
}
