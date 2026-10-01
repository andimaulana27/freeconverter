# FreeConverter DNA

Locked product rules. Update this file when a decision changes. Visual copies: canvas `freeconverter-dna`, `freeconverter-palette`, `freeconverter-rollout`, `freeconverter-design-directions`, `converter-catalog-plan`.

Last recorded: 1 October 2026 (evening). Palet and tool-page UI remain locked. Catalog grew with browser-only pairs; VPS work stays skipped.

## Status

- Phase 0: done on laptop (Next.js 15, Tailwind, Privacy, Terms).
- Phase 1: in progress. Tool pages are the master UI. Homepage reuses the same workbench.
- Catalog: live browser tools for images, PDF, Office, fonts, and utilities, plus honest worker stub pages for RAW, ebook, archive, vector, CAD, video, audio, and legacy office formats. Format catalog on `/tools` follows CloudConvert’s 11 families, adapted to this site.
- VPS 12 gate: **still open**. No worker, no FFmpeg, no video/audio encode until a dedicated converter machine exists. Do not wait on VPS to ship image/PDF/font pages.
- Design: **H · Hybrid Studio Drop**, palet putih / hitam / abu / merah.

## Search vs URL

| User search | Must open | Title / H1 |
|---|---|---|
| Full site name (FreeConverter) | `/` homepage | Title absolute: `FreeConverter`. Homepage is the brand landing **and** the machine. |
| Specific tool (`convert png to jpg`, `convert png to ico`) | `/{slug}` e.g. `/png-to-jpg`, `/png-to-ico` | `Convert PNG to JPG · FreeConverter`. H1 matches that pair. |

Do not let the homepage title compete with a conversion query.

## Machine on a slug

- Default output matches the slug.
- **Convert to** lists sibling outputs in a fixed order (JPG, PNG, WebP, BMP, ICO, PDF, …). Changing output **navigates to that slug**. Files stay in `ConvertSession` only if they still match the new slug inputs.
- Dropped files must match that page’s `inputs`. A PDF on `/png-to-jpg` is rejected, not silently rastered.
- Multi-file pages append; job pages that use one file replace. Copy “Add more” is real.
- On `/`, the picker stays on the homepage. JSON (no `json-to-*` pair) maps to `/json-formatter`.
- Job pages stay locked to that job: merge, split, rotate, compress, resize, crop, flip, color picker, collage, delete/extract/watermark/number/crop/unlock/organize/flatten/redact/sign/fill PDF, extract PDF images, JSON formatter, unit converter. GIF compressor is a job (first frame → JPG); catalog `output` is `jpg`.
- `/jpg-to-pdf` accepts JPG/JPEG only. PNG and WebP have their own slugs.

## Palette

See `docs/PALETTE.md`.

- Page: `#FFFFFF`. Ink: `#111111`. Mute: `#6B6B6B`. Line: `#E8E8E8`.
- Accent: `#E5322D` only on Convert, active format, drag, progress.
- Never full-bleed red on the hero.

## UI / layout (tool page is the master)

Different from Smallpdf (rounded dashed card) and iLovePDF (icon grid):

- Nav: Linear/Stripe — text links, no pills, one red **Convert** to `/`. Homepage groups and hash links include Utilitas.
- Tool page: two columns. Left = category, giant mono `FROM → TO`, H1. Right = workbench with corner marks, not a boxed dropzone.
- Workbench illustration is functional: source card → animated route → output card. Glyphs follow image, PDF, font, video, and audio types. ICO and SVG use the image glyph.
- A three-item signal strip states where processing happens, queue behavior, and whether output can switch.
- Related tools prefer **sibling pairs first**, then the rest of the category. Type list, not cards.
- Related rows carry small format glyphs; icons must clarify type or status, never decorate randomly.
- `/tools` is a rack of rules, not a tile wall.

## Motion

- Drop: corners grow, stage tints `accent-soft`, left red rule.
- Route dot travels from the source illustration to the output; cards lift and rotate slightly on hover.
- Files: chip slides in 220ms.
- Format arrow nudges. Convert ready: quiet pulse ring. Busy: red sweep.
- Respect `prefers-reduced-motion`.
- No parallax, no confetti, no scroll-hijack.

## Engineering

- Dev server port is **3060**.
- `fs` / `path` aliases are **browser only**.
- Sitemap V1 exists and includes every slug in `tools.json`.
- Raster engine (browser): JPG, PNG, WebP, BMP, TIFF, ICO (PNG-in-ICO 16/32/48), SVG raster, GIF decode (first frame), AVIF/HEIC decode if the browser can. GIF **encode** and HEIC/AVIF **encode** are not supported. PDF pages raster via pdf.js (`/pdf-to-jpg`, `/pdf-to-png`, `/pdf-to-webp`, `/pdf-to-bmp`, `/pdf-to-tiff`). Worker is copied to `/pdf.worker.min.mjs` (Turbopack `?url` does not emit a default export).
- Mass SEO generators and IP quotas remain Phase 4.

## Live this round (no VPS)

Shipped 1 Oct 2026, all `need: browser`:

- ICO: `/png-to-ico`, `/jpg-to-ico`, `/webp-to-ico`, `/gif-to-ico`, `/svg-to-ico`, `/bmp-to-ico`, `/heic-to-ico`, `/ico-to-png`, `/ico-to-jpg`, `/ico-to-webp`, `/ico-to-bmp`, `/ico-to-pdf`
- GIF decode: `/gif-to-png`, `/gif-to-jpg`, `/gif-to-webp`, `/gif-to-bmp`, `/gif-to-ico`
- SVG raster: `/svg-to-png`, `/svg-to-jpg`, `/svg-to-webp`, `/svg-to-bmp`, `/svg-to-ico`, `/svg-to-pdf`
- BMP: `/bmp-to-png`, `/bmp-to-jpg`, `/bmp-to-webp`, `/bmp-to-ico`, `/png-to-bmp`, `/jpg-to-bmp`, `/webp-to-bmp`
- HEIC (browser decode only): `/heic-to-jpg`, `/heic-to-png`, `/heic-to-webp`, `/heic-to-bmp`, `/heic-to-ico`, `/heic-to-pdf`, `/heic-to-tiff`
- AVIF (browser decode only): `/avif-to-jpg`, `/avif-to-png`, `/avif-to-webp`, `/avif-to-bmp`, `/avif-to-ico`, `/avif-to-tiff`, `/avif-to-pdf`
- TIFF: `*-to-tiff` from every image source; `/tiff-to-jpg` `/tiff-to-png` `/tiff-to-webp` `/tiff-to-bmp` `/tiff-to-ico` `/tiff-to-pdf`; `/pdf-to-tiff`
- PDF pairs: `/png-to-pdf`, `/webp-to-pdf`, `/gif-to-pdf`, `/bmp-to-pdf`, `/svg-to-pdf`, `/ico-to-pdf`, `/pdf-to-jpg`, `/pdf-to-png`, `/pdf-to-webp`, `/pdf-to-bmp`, `/pdf-to-txt`, `/pdf-to-docx`, `/txt-to-pdf`, `/csv-to-pdf`, `/html-to-pdf` (plus existing `/jpg-to-pdf`)
- Dokumen: `/docx-to-pdf`, `/docx-to-txt`, `/docx-to-html`, `/xlsx-to-pdf`, `/xlsx-to-csv`, `/xlsx-to-json`, `/csv-to-xlsx`, `/pptx-to-pdf`, `/pptx-to-txt`
- Jobs: `/crop-image`, `/color-picker`, `/rotate-image`, `/flip-image`, `/collage-maker`, `/delete-pdf-pages`, `/extract-pdf-pages`, `/watermark-pdf`, `/pdf-page-numbers`, `/crop-pdf`, `/unlock-pdf`, `/organize-pdf`, `/flatten-pdf`, `/redact-pdf`, `/sign-pdf`, `/fill-pdf`, `/extract-pdf-images`
- Font: `/woff-to-woff2` (plus TTF/OTF)
- Utilitas: `/json-formatter`, `/unit-converter`, `/csv-to-json`, `/json-to-csv`, `/json-to-xlsx`

## Skip until a converter VPS exists

Do not implement, even as a fake client encode:

- All video and audio FFmpeg jobs (`/mp4-to-mp3`, `/video-compressor`, `/mov-to-mp4` stay stub pages)
- Protect PDF with a user password (`pdf-lib` cannot encrypt; `@cantoo/pdf-lib` is too heavy)
- Compress PDF, ebook, RAW, RAR/7z, true Office layout (LibreOffice)
- Legacy `.doc` / `.xls` / `.ppt` binary files
- OCR, AI PDF, scan-to-PDF, request signatures
- HEIC fallback worker (browser decode only)
- Animated GIF encoder

## Known gaps (still Phase 1, still no VPS)

Optional leftovers: QR generator, ZIP ringan.

Limits, not bugs:

- GIF compressor writes JPG (first frame). Catalog output is `jpg`, not `gif`.
- HEIC/AVIF only if the browser can decode them.
- TIFF write is a simple raster TIFF, not camera RAW.
- Word/Excel/PPT in the browser: text and simple tables. Not print-perfect layout. `.doc` / `.xls` / `.ppt` skipped.
- PDF to Word/TXT extracts text. Scanned pages need OCR on a later worker.
- ICO output is PNG-in-ICO at 16, 32, and 48 px.
- Unlock PDF removes print/copy restrictions. Password-encrypted files often cannot be decrypted in the browser.
- Redact PDF draws a black box. Text under the box is still in the file.
- Flatten / fill PDF only work when the file has AcroForm fields.
- HTML to PDF rasters simple markup. External CSS and scripts are skipped.
- Extract PDF images pulls embedded images, not a page raster.
