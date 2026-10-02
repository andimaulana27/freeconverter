import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
mkdirSync(publicDir, { recursive: true });

function copyAsset(id, destName) {
  const src = require.resolve(id);
  const dest = join(publicDir, destName);
  copyFileSync(src, dest);
  console.log(`${destName} → ${dest}`);
}

copyAsset("pdfjs-dist/build/pdf.worker.min.mjs", "pdf.worker.min.mjs");
copyFileSync(
  join(dirname(require.resolve("@jsquash/avif/package.json")), "codec/enc/avif_enc.wasm"),
  join(publicDir, "avif_enc.wasm"),
);
console.log(`avif_enc.wasm → ${join(publicDir, "avif_enc.wasm")}`);
