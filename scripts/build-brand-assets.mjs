import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcFavicon = join(root, "public", "Convert Favicon.png");
const srcLogo = join(root, "public", "Convert Logo.png");
const brandRed = { r: 217, g: 45, b: 40, alpha: 1 };

function pngsToIco(images) {
  const count = images.length;
  const headerSize = 6 + 16 * count;
  const total = images.reduce((sum, image) => sum + image.length, headerSize);
  const buf = Buffer.alloc(total);
  buf.writeUInt16LE(0, 0);
  buf.writeUInt16LE(1, 2);
  buf.writeUInt16LE(count, 4);
  let offset = headerSize;
  images.forEach((data, index) => {
    const size = data.size;
    const entry = 6 + 16 * index;
    buf[entry] = size >= 256 ? 0 : size;
    buf[entry + 1] = size >= 256 ? 0 : size;
    buf.writeUInt16LE(1, entry + 4);
    buf.writeUInt16LE(32, entry + 6);
    buf.writeUInt32LE(data.length, entry + 8);
    buf.writeUInt32LE(offset, entry + 12);
    data.copy(buf, offset);
    offset += data.length;
  });
  return buf;
}

async function pngSquare(size, { flatten = false } = {}) {
  let pipeline = sharp(srcFavicon)
    .resize(size, size, {
      fit: "contain",
      background: flatten ? brandRed : { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha();
  if (flatten) pipeline = pipeline.flatten({ background: brandRed }).ensureAlpha();
  return pipeline.png({ compressionLevel: 9, effort: 10, palette: false }).toBuffer();
}

async function writePng(path, buffer) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buffer);
}

const { data, info } = await sharp(srcLogo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  if (a < 8) {
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = 0;
    continue;
  }
  const isBrandRed = r > 140 && r - g > 50 && r - b > 50;
  if (!isBrandRed) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
  }
}

const trimmedDark = sharp(srcLogo).trim({ threshold: 10 });
const darkMeta = await trimmedDark.metadata();
const logoWidth = 1200;
const logoHeight = Math.round((logoWidth * (darkMeta.height ?? 986)) / (darkMeta.width ?? 3805));

await writePng(
  join(root, "public", "logo.png"),
  await sharp(srcLogo).trim({ threshold: 10 }).resize({ width: logoWidth }).png({ compressionLevel: 9, effort: 10 }).toBuffer(),
);
await writePng(
  join(root, "public", "logo-light.png"),
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 10 })
    .resize({ width: logoWidth })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer(),
);

const icon16 = await pngSquare(16);
const icon32 = await pngSquare(32);
const icon48 = await pngSquare(48);
const icon180 = await pngSquare(180, { flatten: true });
const icon192 = await pngSquare(192);
const icon512 = await pngSquare(512);

await writePng(join(root, "public", "icon-32.png"), icon32);
await writePng(join(root, "public", "icon-48.png"), icon48);
await writePng(join(root, "public", "icon-192.png"), icon192);
await writePng(join(root, "public", "icon-512.png"), icon512);
await writePng(join(root, "public", "apple-touch-icon.png"), icon180);
await writePng(join(root, "public", "favicon.png"), icon192);

const ico = pngsToIco([
  Object.assign(icon16, { size: 16 }),
  Object.assign(icon32, { size: 32 }),
  Object.assign(icon48, { size: 48 }),
]);
await writeFile(join(root, "public", "favicon.ico"), ico);

await writeFile(join(root, "src", "app", "favicon.ico"), ico);
await writePng(join(root, "src", "app", "icon.png"), icon192);
await writePng(join(root, "src", "app", "apple-icon.png"), icon180);

console.log(
  JSON.stringify(
    {
      logo: { width: logoWidth, height: logoHeight },
      generated: [
        "public/logo.png",
        "public/logo-light.png",
        "public/favicon.ico",
        "public/favicon.png",
        "public/icon-32.png",
        "public/icon-48.png",
        "public/icon-192.png",
        "public/icon-512.png",
        "public/apple-touch-icon.png",
        "src/app/favicon.ico",
        "src/app/icon.png",
        "src/app/apple-icon.png",
      ],
    },
    null,
    2,
  ),
);
