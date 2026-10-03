import type { CoverMotif, CoverPalette, CoverTemplate, VisualBrief } from "@/lib/ai/types";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapTitle(title: string, width = 26) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
      if (lines.length === 3) break;
    } else {
      current = next;
    }
  }
  if (current && lines.length < 4) lines.push(current);
  return lines.slice(0, 4);
}

function seedNumber(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const PALETTE: Record<CoverPalette, { bg: string; ink: string; mute: string; accent: string }> = {
  paper: { bg: "#ffffff", ink: "#111111", mute: "#6b6b6b", accent: "#d92d28" },
  bone: { bg: "#f7f7f7", ink: "#111111", mute: "#6b6b6b", accent: "#d92d28" },
  ink: { bg: "#111111", ink: "#ffffff", mute: "#9a9a9a", accent: "#ff6a64" },
};

function pickFromSeed<T extends string>(seed: number, values: readonly T[], index = 0): T {
  return values[(seed + index) % values.length] as T;
}

export function visualBriefFromSeed(title: string, kicker: string, seed = title): VisualBrief {
  const n = seedNumber(seed);
  return {
    templateKey: pickFromSeed(n, ["brand-bar", "split-band", "quiet-grid"] as const),
    palette: pickFromSeed(n, ["paper", "ink", "bone"] as const, 1),
    motif: pickFromSeed(n, ["rule", "corner", "grid"] as const, 2),
    kicker: (kicker || "GUIDE").slice(0, 32),
    titleLines: wrapTitle(title || "Untitled guide"),
    altText: `Branded AllYouConvert cover for ${title}`.slice(0, 160),
    illustrationPrompt: "",
  };
}

function motifMarkup(motif: CoverMotif, colors: (typeof PALETTE)[CoverPalette], template: CoverTemplate) {
  if (motif === "corner") {
    return `<rect x="72" y="520" width="88" height="6" fill="${colors.accent}"/><rect x="72" y="520" width="6" height="54" fill="${colors.accent}"/>`;
  }
  if (motif === "grid") {
    const stroke = template === "quiet-grid" ? colors.accent : colors.mute;
    return `<g stroke="${stroke}" stroke-opacity="0.12" stroke-width="1">
      <path d="M0 210 H1200"/><path d="M0 274 H1200"/><path d="M0 338 H1200"/><path d="M0 402 H1200"/>
    </g>`;
  }
  return `<rect x="72" y="140" width="72" height="4" fill="${colors.accent}"/>`;
}

export function brandedCoverSvg(title: string, kicker = "GUIDE", brief?: Partial<VisualBrief> & { illustrationDataUri?: string | null }) {
  const fallback = visualBriefFromSeed(title, kicker);
  const template = brief?.templateKey ?? fallback.templateKey;
  const palette = brief?.palette ?? fallback.palette;
  const motif = brief?.motif ?? fallback.motif;
  const colors = PALETTE[palette];
  const lines = (brief?.titleLines?.length ? brief.titleLines : fallback.titleLines).slice(0, 4);
  const label = (brief?.kicker || kicker || "GUIDE").toUpperCase();
  const illustration = brief?.illustrationDataUri
    ? `<image href="${escapeXml(brief.illustrationDataUri)}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/>
       <rect width="1200" height="630" fill="${colors.bg}" fill-opacity="0.78"/>`
    : "";

  const text = lines
    .map(
      (line, index) =>
        `<text x="72" y="${210 + index * 64}" fill="${colors.ink}" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700">${escapeXml(line)}</text>`,
    )
    .join("");

  const frame =
    template === "split-band"
      ? `<rect width="1200" height="54" fill="${colors.accent}"/>`
      : template === "quiet-grid"
        ? `<rect x="48" y="48" width="1104" height="534" fill="none" stroke="${colors.accent}" stroke-width="2"/>`
        : `<rect width="12" height="630" fill="${colors.accent}"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630" role="img">
  <rect width="1200" height="630" fill="${colors.bg}"/>
  ${illustration}
  ${frame}
  <text x="72" y="118" fill="${colors.accent}" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" letter-spacing="3">${escapeXml(label)}</text>
  ${motifMarkup(motif, colors, template)}
  ${text}
  <text x="72" y="556" fill="${colors.mute}" font-family="Arial, Helvetica, sans-serif" font-size="18">AllYouConvert</text>
</svg>`;
}

export function illustrationDataUri(bytes: Uint8Array, mediaType: string) {
  const encoded = Buffer.from(bytes).toString("base64");
  if (encoded.length > 1_400_000) return null;
  return `data:${mediaType};base64,${encoded}`;
}
