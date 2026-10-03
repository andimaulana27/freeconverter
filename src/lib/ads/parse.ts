export type ParsedAdSense = {
  clientId: string | null;
  slotId: string | null;
  width: number | null;
  height: number | null;
};

const CLIENT_RE = /ca-pub-[0-9]{9,22}/;
const SLOT_ATTR_RE = /data-ad-slot\s*=\s*["']([0-9]{6,22})["']/i;
const CLIENT_ATTR_RE = /data-ad-client\s*=\s*["'](ca-pub-[0-9]{9,22})["']/i;
const STYLE_SIZE_RE = /width\s*:\s*(\d+)px[\s\S]{0,80}?height\s*:\s*(\d+)px/i;
const STYLE_SIZE_REV_RE = /height\s*:\s*(\d+)px[\s\S]{0,80}?width\s*:\s*(\d+)px/i;
const ATTR_SIZE_RE = /(?:width\s*=\s*["'](\d+)["'][\s\S]{0,80}?height\s*=\s*["'](\d+)["'])|(?:height\s*=\s*["'](\d+)["'][\s\S]{0,80}?width\s*=\s*["'](\d+)["'])/i;

export function normalizeAdSenseClient(value: string | null | undefined) {
  const match = String(value ?? "").trim().match(CLIENT_RE);
  return match ? match[0] : null;
}

export function normalizeAdSenseSlot(value: string | null | undefined) {
  const match = String(value ?? "").trim().match(/^[0-9]{6,22}$/);
  return match ? match[0] : null;
}

export function parseAdSenseSnippet(input: string): ParsedAdSense {
  const text = input.trim();
  if (!text) {
    return { clientId: null, slotId: null, width: null, height: null };
  }

  const clientId = text.match(CLIENT_ATTR_RE)?.[1] ?? text.match(CLIENT_RE)?.[0] ?? null;
  const slotId = text.match(SLOT_ATTR_RE)?.[1] ?? null;

  let width: number | null = null;
  let height: number | null = null;
  const style = text.match(STYLE_SIZE_RE);
  if (style) {
    width = Number(style[1]);
    height = Number(style[2]);
  } else {
    const reversed = text.match(STYLE_SIZE_REV_RE);
    if (reversed) {
      height = Number(reversed[1]);
      width = Number(reversed[2]);
    } else {
      const attrs = text.match(ATTR_SIZE_RE);
      if (attrs) {
        width = Number(attrs[1] || attrs[4]);
        height = Number(attrs[2] || attrs[3]);
      }
    }
  }

  return {
    clientId,
    slotId,
    width: width && width > 0 ? width : null,
    height: height && height > 0 ? height : null,
  };
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
