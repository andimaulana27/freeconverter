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

export function brandedCoverSvg(title: string, kicker = "GUIDE") {
  const lines = wrapTitle(title || "Untitled guide");
  const text = lines
    .map(
      (line, index) =>
        `<text x="72" y="${210 + index * 64}" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700">${escapeXml(line)}</text>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect width="12" height="630" fill="#d92d28"/>
  <rect x="72" y="72" width="56" height="4" fill="#d92d28"/>
  <text x="72" y="118" fill="#d92d28" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" letter-spacing="3">${escapeXml(kicker.toUpperCase())}</text>
  ${text}
  <text x="72" y="556" fill="#6b6b6b" font-family="Arial, Helvetica, sans-serif" font-size="18">AllYouConvert</text>
</svg>`;
}
