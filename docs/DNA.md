# AllYouConvert DNA

Locked product rules. Update this file when a decision changes. Visual copies: canvas `freeconverter-dna`, `freeconverter-palette`, `freeconverter-rollout`, `freeconverter-design-directions`, `converter-catalog-plan`.

Last recorded: 3 October 2026. Palet remains locked. Convert Fase 1 (browser catalog + workspace) is shipped. VPS work stays skipped. Blog Phase 0–7 is complete; remaining blog work is operational follow-up.

## Status

- Brand: **AllYouConvert** (`allyouconvert.com`). Product DNA and canvases still use the `freeconverter-*` filenames.
- Phase 0: done (Next.js 15, Tailwind, Privacy, Terms, Vercel).
- Convert Phase 1: **shipped**. 115 browser tools convert locally. 251 worker-backed pages exist as honest stubs. Optional leftovers (QR, ZIP maker) do not block this phase.
- Convert Phase 2–3: **skipped** until a dedicated converter VPS exists. No FFmpeg, Redis, or worker.
- Convert Phase 4: later. Mass pair-page generation and IP quotas stay closed.
- Blog Phase 0–7: **complete** (public `/blog`, admin CMS, ads manager, durable AI batch jobs, editorial quality, `/admin/growth`). Operational closeout adds `/admin/media`, Vault key rotation, gated `/blog/topic/[slug]`, and signup lock in `config.toml`. Keep Blog out of the primary header. Staff still enroll TOTP themselves.
- VPS 12 gate: **still open**. Do not wait on VPS to ship more browser pages.
- Design: **H · Hybrid Studio Drop**, palet putih / hitam / abu / merah.

## Search vs URL

| User search | Must open | Title / H1 |
|---|---|---|
| Full site name (AllYouConvert) | `/` homepage | Title absolute: `AllYouConvert`. Homepage is the brand landing **and** the machine. |
| Specific tool (`convert png to jpg`, `convert png to ico`) | `/{slug}` e.g. `/png-to-jpg`, `/png-to-ico` | `Convert PNG to JPG · AllYouConvert`. H1 matches that pair. |

Do not let the homepage title compete with a conversion query.

## Machine on a slug

- Default output matches the slug.
- **Convert to** lists the source family (image, PDF, Office, JSON, …) as cards. Changing output **writes that format on the current page**. It does not navigate to a sibling slug. Dedicated pair URLs remain for SEO.
- Image family outputs the browser can write: JPG, WebP, AVIF, PNG, GIF (still frame), PDF, TIFF, BMP, ICO.
- Dropped files must match that page’s `inputs`. A PDF on `/png-to-jpg` is rejected, not silently rastered.
- Multi-file pages append; job pages that use one file replace. Copy “Add more” is real.
- On `/`, the picker stays on the homepage. JSON (no `json-to-*` pair) maps to `/json-formatter`. Multiple PDFs on `/` can merge.
- Job pages stay locked to that job: merge, split, rotate, compress, resize, crop, flip, color picker, collage, delete/extract/watermark/number/crop/unlock/organize/flatten/redact/sign/fill PDF, extract PDF images, JSON formatter, unit converter. GIF compressor is a job (first frame → chosen raster, default JPG).
- `/jpg-to-pdf` accepts JPG/JPEG only. PNG and WebP have their own slugs.

## Palette

See `docs/PALETTE.md`.

- Page: `#FFFFFF`. Ink: `#111111`. Mute: `#6B6B6B`. Line: `#E8E8E8`.
- Accent: `#D92D28` only on Convert, active format, drag, progress.
- Never full-bleed red on the hero.

## UI / layout (tool page is the master)

Different from Smallpdf (rounded dashed card) and iLovePDF (icon grid):

- Nav: Linear/Stripe — text links, no pills, one red **Convert** to `/`. Homepage groups and hash links include Utilitas. Blog stays out of this header.
- Donate is a neutral support action after Utilities, opens the official PayPal.me page, and collapses to a heart icon on small screens.
- Legal pages share one interactive document shell: Privacy/Terms switcher, sticky desktop contents, collapsible mobile contents, dark summary panel, anchored section cards, and back-to-top controls.
- Button styling comes only from `src/components/ui/Button.tsx`; variants and sizes are documented in `docs/PALETTE.md` so menus and future pages reuse the same states.
- Homepage hero is a dark conversion workbench: concrete file-format copy, live upload machine, route shortcuts, and no generic gradient/AI landing-page treatment.
- Footer is a dark, multi-column tool directory. Every link must resolve to a real tool, category, or legal page; worker-backed tools remain honestly labeled on their destination page.
- Tool page: two columns. Left = category, giant mono `FROM → TO`, H1. Right = workbench with job settings, format cards, and PDF page preview where the job needs it.
- Workbench illustration is functional: source card → animated route → output card. Glyphs follow image, PDF, font, video, and audio types. ICO and SVG use the image glyph.
- A three-item signal strip states where processing happens, queue behavior, and whether output can switch.
- Related tools prefer **sibling pairs first**, then the rest of the category. Type list, not cards.
- Related rows carry small format glyphs; icons must clarify type or status, never decorate randomly.
- `/tools` is a rack of rules plus the 11-family format catalog (212 formats), not a tile wall.
- Fixed AdSense units and sticky side rails stay reserved-size. Placement, creative, and assignment CMS lives at `/admin/ads`.

## Motion

- Drop: corners grow, stage tints `accent-soft`, left red rule.
- Route dot travels from the source illustration to the output; cards lift and rotate slightly on hover. Shot-route motion is shared across conversion paths.
- Files: chip slides in 220ms.
- Format arrow nudges. Convert ready: quiet pulse ring. Busy: red sweep.
- Respect `prefers-reduced-motion`.
- No parallax, no confetti, no scroll-hijack.

## Engineering

- Dev server port is **3060**.
- `fs` / `path` aliases are **browser only**.
- Sitemap V1 includes every **browser** slug. Worker stub pages are routable but not in the sitemap until they convert.
- Raster write (browser): JPG, PNG, WebP, BMP, TIFF, ICO (PNG-in-ICO 16/32/48), SVG raster, GIF decode, GIF **still** encode (`gifenc`), AVIF decode if the browser can, AVIF encode (`canvas.toBlob` or `@jsquash/avif` WASM). Animated GIF encode is not supported. HEIC encode is not supported.
- PDF pages raster via pdf.js. Worker is copied to `/pdf.worker.min.mjs` (Turbopack `?url` does not emit a default export).
- Catalog sources: `src/data/tools.json` (live converters + 3 video/audio stubs) and `src/data/extra-tools.ts` (honest worker stubs). Duplicate slugs collapse in `src/lib/tools.ts`.
- Mass SEO generators and IP quotas remain Phase 4.

## Live catalog (3 October 2026)

Counted from `tools.json` + `extra-tools.ts`:

| Surface | Count | Meaning |
|---|---|---|
| Browser converters | 115 | Convert locally. In the sitemap. |
| Worker stub pages | 251 | Listed honestly; Convert refuses encode. |
| Total tool URLs | 366 | What the homepage “tools” stat reads. |
| Format catalog | 212 | CloudConvert-style families on `/tools`. |

Shipped browser work, all `need: browser`:

- Image pairs across PNG/JPG/WebP/GIF/BMP/ICO/SVG/HEIC/AVIF/TIFF, including PDF round-trips.
- Image jobs: compress, resize (canvas size + lock ratio), crop, rotate, flip, collage, color picker, GIF compressor.
- Workspace can write GIF stills and AVIF from those image jobs even when a dedicated `*-to-gif` / `*-to-avif` slug does not exist.
- PDF jobs: merge, split (multi-file), rotate, delete/extract pages, watermark, page numbers, crop, unlock, organize, flatten, redact, sign, fill, extract images, raster to JPG/PNG/WebP/BMP/TIFF, TXT, DOCX.
- Dokumen: DOCX → PDF/TXT/HTML; XLSX → PDF/CSV/JSON; CSV → XLSX/JSON/PDF; JSON → CSV/XLSX; PPTX → PDF/TXT; HTML → PDF/TXT; TXT → PDF.
- Font: TTF/OTF/WOFF → WOFF2.
- Utilitas: JSON formatter, unit converter.

## Skip until a converter VPS exists

Do not implement, even as a fake client encode:

- All video and audio FFmpeg jobs (`/mp4-to-mp3`, `/video-compressor`, `/mov-to-mp4` stay stub pages)
- Protect PDF with a user password (`pdf-lib` cannot encrypt; `@cantoo/pdf-lib` is too heavy)
- Compress PDF, ebook, RAW, RAR/7z, true Office layout (LibreOffice)
- Legacy `.doc` / `.xls` / `.ppt` binary files
- OCR, AI PDF, scan-to-PDF, request signatures
- HEIC encode / HEIC fallback worker (browser decode only)
- Animated GIF encoder

## Known gaps (still no VPS)

Optional leftovers, not blockers for Convert Phase 1:

- QR generator
- ZIP maker / unzip as a user-facing tool (`jszip` is only used to download multi-page rasters)
- Dedicated `*-to-gif` and `*-to-avif` pair slugs (workspace already writes those outputs)
- Image enlarger, GIF maker, text tools

Limits, not bugs:

- GIF compressor defaults to a still raster (usually JPG). Animated GIF encode is out of scope.
- HEIC/AVIF **decode** only if the browser can. AVIF **encode** uses native canvas or WASM.
- TIFF write is a simple raster TIFF, not camera RAW.
- Word/Excel/PPT in the browser: text and simple tables. Not print-perfect layout. `.doc` / `.xls` / `.ppt` skipped.
- PDF to Word/TXT extracts text. Scanned pages need OCR on a later worker.
- ICO output is PNG-in-ICO at 16, 32, and 48 px.
- Unlock PDF removes print/copy restrictions. Password-encrypted files often cannot be decrypted in the browser.
- Redact PDF draws a black box. Text under the box is still in the file.
- Flatten / fill PDF only work when the file has AcroForm fields.
- HTML to PDF rasters simple markup. External CSS and scripts are skipped.
- Extract PDF images pulls embedded images, not a page raster.
