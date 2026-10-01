/**
 * Batch OTF/TTF -> WOFF2.
 *
 *   node scripts/ttf-otf-to-woff2.mjs --in "D:\fonts\teman" --out "D:\fonts\teman-woff2"
 *   node scripts/ttf-otf-to-woff2.mjs --in "./input" --out "./output" --dry-run
 *
 * Only converts files you already have on disk. Does not download Fontspace.
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { compress } from 'woff2-encoder';

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const value = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1] ?? null;
};

const INPUT = path.resolve(value('--in') || './fonts-in');
const OUTPUT = path.resolve(value('--out') || './fonts-out');
const DRY = has('--dry-run');
const CONCURRENCY = Math.max(1, Number(value('--concurrency') || 4));

const FONT_EXT = new Set(['.ttf', '.otf']);
const SKIP_EXT = new Set(['.ttc', '.otc']);

function isSfnt(bytes) {
  if (bytes.length < 4) return false;
  const tag = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  return tag === 'OTTO' || tag === '\x00\x01\x00\x00' || tag === 'true' || tag === 'typ1';
}

async function walk(dir, acc = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    throw new Error(`Tidak bisa baca folder input: ${dir}\n${error.message}`);
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, acc);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    acc.push({ full, rel: path.relative(INPUT, full), ext });
  }
  return acc;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function convertOne(file) {
  const row = {
    file: file.rel,
    status: 'skipped',
    bytesIn: 0,
    bytesOut: 0,
    note: '',
  };

  if (SKIP_EXT.has(file.ext)) {
    row.note = 'koleksi TTC/OTC: pecah dulu jadi TTF/OTF per face';
    return row;
  }

  if (!FONT_EXT.has(file.ext)) {
    row.note = 'bukan ttf/otf';
    return row;
  }

  const input = await readFile(file.full);
  row.bytesIn = input.length;

  if (!isSfnt(input)) {
    row.status = 'error';
    row.note = 'bukan font OpenType/TrueType (header salah)';
    return row;
  }

  const outRel = file.rel.replace(/\.(ttf|otf)$/i, '.woff2');
  const outPath = path.join(OUTPUT, outRel);

  if (DRY) {
    row.status = 'dry-run';
    row.note = outRel;
    return row;
  }

  try {
    const woff2 = Buffer.from(await compress(input));
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, woff2);
    row.status = 'ok';
    row.bytesOut = woff2.length;
    row.note = outRel;
  } catch (error) {
    row.status = 'error';
    row.note = error.message;
  }

  return row;
}

const files = await walk(INPUT);
const fonts = files.filter((file) => FONT_EXT.has(file.ext) || SKIP_EXT.has(file.ext));

if (fonts.length === 0) {
  console.error(`Tidak ada .ttf/.otf di ${INPUT}`);
  process.exit(1);
}

console.log(`${DRY ? 'Dry run' : 'Convert'} ${fonts.length} file`);
console.log(`in  ${INPUT}`);
console.log(`out ${OUTPUT}`);
console.log('');

const results = await mapLimit(fonts, CONCURRENCY, convertOne);
const ok = results.filter((row) => row.status === 'ok' || row.status === 'dry-run').length;
const err = results.filter((row) => row.status === 'error');
const skip = results.filter((row) => row.status === 'skipped');

for (const row of results) {
  const mark = row.status === 'ok' || row.status === 'dry-run' ? 'ok' : row.status;
  console.log(`${mark.padEnd(8)} ${row.file}${row.note ? `  (${row.note})` : ''}`);
}

console.log('');
console.log(`selesai  ok=${ok}  error=${err.length}  skip=${skip.length}`);

if (err.length) {
  process.exitCode = 1;
}
