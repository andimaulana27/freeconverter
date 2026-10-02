import { downloadBytes, stem } from "@/lib/file";

function tagOf(bytes: Uint8Array) {
  if (bytes.length < 4) return "";
  return String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
}

function isSfnt(bytes: Uint8Array) {
  const tag = tagOf(bytes);
  return tag === "OTTO" || tag === "\x00\x01\x00\x00" || tag === "true" || tag === "typ1";
}

function isWoff(bytes: Uint8Array) {
  return tagOf(bytes) === "wOFF";
}

function isWoff2(bytes: Uint8Array) {
  return tagOf(bytes) === "wOF2";
}

function blobFromBytes(data: Uint8Array) {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return new Blob([buffer]);
}

async function inflateZlib(data: Uint8Array) {
  try {
    const stream = blobFromBytes(data).stream().pipeThrough(new DecompressionStream("deflate"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    const stream = blobFromBytes(data).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
}

async function woff1ToSfnt(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const flavor = view.getUint32(4);
  const numTables = view.getUint16(12);
  const tables = [];
  for (let i = 0; i < numTables; i += 1) {
    const at = 44 + i * 20;
    tables.push({
      tag: view.getUint32(at),
      offset: view.getUint32(at + 4),
      compLength: view.getUint32(at + 8),
      origLength: view.getUint32(at + 12),
      checksum: view.getUint32(at + 16),
    });
  }
  const decoded = [];
  for (const table of tables) {
    const chunk = bytes.slice(table.offset, table.offset + table.compLength);
    const data = table.compLength < table.origLength ? await inflateZlib(chunk) : chunk;
    decoded.push({ ...table, data: data.subarray(0, table.origLength) });
  }
  decoded.sort((a, b) => a.tag - b.tag);
  const log2 = Math.floor(Math.log2(numTables));
  const searchRange = 16 * 2 ** log2;
  const entrySelector = log2;
  const rangeShift = 16 * numTables - searchRange;
  const header = 12 + 16 * numTables;
  let offset = header;
  const laid = decoded.map((table) => {
    const start = offset;
    offset += (table.data.length + 3) & ~3;
    return { ...table, start };
  });
  const out = new Uint8Array(offset);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, flavor);
  outView.setUint16(4, numTables);
  outView.setUint16(6, searchRange);
  outView.setUint16(8, entrySelector);
  outView.setUint16(10, rangeShift);
  laid.forEach((table, index) => {
    const at = 12 + index * 16;
    outView.setUint32(at, table.tag);
    outView.setUint32(at + 4, table.checksum);
    outView.setUint32(at + 8, table.start);
    outView.setUint32(at + 12, table.data.length);
    out.set(table.data, table.start);
  });
  return out;
}

export async function fontToWoff2(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let sfnt = bytes;
  if (isWoff2(bytes)) throw new Error("This file is already WOFF2.");
  if (isWoff(bytes)) sfnt = await woff1ToSfnt(bytes);
  else if (!isSfnt(bytes)) throw new Error("Choose a TTF, OTF, or WOFF file.");
  try {
    const { compress } = await import("woff2-encoder");
    const woff2 = await compress(sfnt);
    downloadBytes(new Uint8Array(woff2), `${stem(file.name)}.woff2`, "font/woff2");
  } catch (error) {
    if (error instanceof Error && /already WOFF2|TTF, OTF, or WOFF/.test(error.message)) throw error;
    throw new Error("Could not encode this font as WOFF2 in the browser.");
  }
}
