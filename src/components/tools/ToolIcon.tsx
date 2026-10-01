import type { ToolDef } from "@/lib/tools";
import { cn } from "@/lib/cn";

const CATEGORY_TONES: Record<string, string> = {
  Gambar: "bg-[#e8f3ff] text-[#1677df]",
  PDF: "bg-[#ffe8e7] text-[#df3732]",
  Dokumen: "bg-[#fff1dc] text-[#c86b0a]",
  Spreadsheet: "bg-[#e5f7ec] text-[#16885c]",
  Presentasi: "bg-[#fff0e8] text-[#dd6425]",
  "E-book": "bg-[#efe9ff] text-[#7248c7]",
  Arsip: "bg-[#e6f7f6] text-[#128b88]",
  Vektor: "bg-[#ffe8f3] text-[#ca3d85]",
  CAD: "bg-[#e8edf5] text-[#53657e]",
  Font: "bg-[#f1eaff] text-[#7948da]",
  Utilitas: "bg-[#e7f8ef] text-[#16885c]",
  Video: "bg-[#fff0dc] text-[#d87512]",
  Audio: "bg-[#ffe8f3] text-[#ca3d85]",
};

type Props = {
  tool: ToolDef;
  index?: number;
  className?: string;
};

function ToolGlyph({ tool }: { tool: ToolDef }) {
  const { slug, category } = tool;
  if (slug.includes("compress")) {
    return (
      <>
        <path d="M4 9h5V4M15 4v5h5M20 15h-5v5M9 20v-5H4" />
        <path d="m9 9-5-5m11 5 5-5m-5 11 5 5M9 15l-5 5" />
      </>
    );
  }
  if (slug.includes("crop")) {
    return (
      <>
        <path d="M6 3v15a1 1 0 0 0 1 1h14" />
        <path d="M3 6h14a1 1 0 0 1 1 1v14" />
      </>
    );
  }
  if (slug.includes("rotate")) {
    return (
      <>
        <path d="M20 7v5h-5" />
        <path d="M19 12a7 7 0 1 0-2.1 5" />
      </>
    );
  }
  if (slug.includes("merge") || slug.includes("collage")) {
    return (
      <>
        <path d="M8 5H5v4M16 5h3v4M8 19H5v-4M16 19h3v-4" />
        <path d="M9 9h6v6H9z" />
      </>
    );
  }
  if (slug.includes("split") || slug.includes("extract")) {
    return (
      <>
        <path d="M12 3v18" />
        <path d="m8 7-4 5 4 5M16 7l4 5-4 5" />
      </>
    );
  }
  if (slug.includes("color")) {
    return (
      <>
        <path d="M12 3C8 7 6 10 6 14a6 6 0 0 0 12 0c0-4-2-7-6-11Z" />
        <path d="M9 15a3 3 0 0 0 3 3" />
      </>
    );
  }
  if (slug.includes("flip")) {
    return (
      <>
        <path d="M12 3v18" />
        <path d="m9 6-6 6 6 6V6ZM15 6l6 6-6 6V6Z" />
      </>
    );
  }
  if (slug.includes("watermark") || slug.includes("sign")) {
    return (
      <>
        <path d="M4 19c4-5 5-12 7-12 3 0-1 10 2 10 2 0 2-4 4-4 1 0 0 4 3 3" />
        <path d="M4 21h16" />
      </>
    );
  }
  if (slug.includes("delete") || slug.includes("redact")) {
    return (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" />
        <path d="M10 11v6M14 11v6" />
      </>
    );
  }
  if (slug.includes("unlock")) {
    return (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M9 10V7a3 3 0 0 1 5.5-1.7" />
      </>
    );
  }
  if (slug.includes("organize") || slug.includes("page-number")) {
    return (
      <>
        <path d="M8 4h12M8 10h12M8 16h12" />
        <path d="M4 4h.01M4 10h.01M4 16h.01" />
      </>
    );
  }
  if (slug.includes("protect")) {
    return (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V8a4 4 0 0 1 8 0v2M12 14v3" />
      </>
    );
  }
  if (slug.includes("ocr") || slug.includes("scanner")) {
    return (
      <>
        <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
        <path d="M8 9h8M8 12h6M8 15h8" />
      </>
    );
  }
  if (slug.includes("editor") || slug.includes("annotator")) {
    return (
      <>
        <path d="M5 19h4l10-10-4-4L5 15v4Z" />
        <path d="m13 7 4 4M5 21h14" />
      </>
    );
  }
  if (slug.includes("share")) {
    return (
      <>
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="m8.2 10.8 7.5-3.7M8.2 13.2l7.5 3.7" />
      </>
    );
  }
  if (slug.includes("ai-") || slug.includes("chat") || slug.includes("translate")) {
    return (
      <>
        <path d="M12 3l1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Z" />
        <path d="M18.5 14.5 19 17l2.5.5L19 18l-.5 2.5L18 18l-2.5-.5L18 17l.5-2.5Z" />
      </>
    );
  }
  if (slug.includes("json") || slug.includes("unit")) {
    return (
      <>
        <path d="M9 4C6 4 6 7 6 9s-1 3-3 3c2 0 3 1 3 3s0 5 3 5M15 4c3 0 3 3 3 5s1 3 3 3c-2 0-3 1-3 3s0 5-3 5" />
      </>
    );
  }
  if (category === "Spreadsheet") {
    return (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 9h16M4 14h16M10 4v16M15 4v16" />
      </>
    );
  }
  if (category === "Presentasi") {
    return (
      <>
        <rect x="4" y="4" width="16" height="12" rx="2" />
        <path d="M8 20h8M12 16v4M8 12l3-3 2 2 3-3" />
      </>
    );
  }
  if (category === "Arsip") {
    return (
      <>
        <path d="M5 4h6l2 2h6v14H5z" />
        <path d="M12 7v2M12 11v2M12 15v2" />
      </>
    );
  }
  if (category === "E-book") {
    return (
      <>
        <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23V5.5Z" />
        <path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23V5.5Z" />
      </>
    );
  }
  if (category === "CAD" || category === "Vektor") {
    return (
      <>
        <path d="m12 3 8 5v8l-8 5-8-5V8l8-5Z" />
        <path d="m4 8 8 5 8-5M12 13v8" />
      </>
    );
  }
  if (category === "Font") {
    return (
      <>
        <path d="M5 19 10.5 5h3L19 19M7 14h10" />
      </>
    );
  }
  if (category === "Gambar" && slug.includes("-to-")) {
    return (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m6 17 4-4 2.5 2.5 2-2L18 17" />
      </>
    );
  }
  if ((category === "PDF" || category === "Dokumen") && slug.includes("-to-")) {
    return (
      <>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h4M9 12h6M9 16h5" />
      </>
    );
  }
  if (slug.includes("-to-")) {
    return (
      <>
        <path d="M4 8h13" />
        <path d="m14 5 3 3-3 3M20 16H7" />
        <path d="m10 13-3 3 3 3" />
      </>
    );
  }
  return (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  );
}

export function ToolIcon({ tool, className }: Props) {
  const badge = tool.output.toUpperCase().slice(0, 4);
  return (
    <span
      className={cn(
        "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] transition duration-280 group-hover:-rotate-3 group-hover:scale-105",
        CATEGORY_TONES[tool.category] ?? "bg-[#f0eeec] text-[#675f5b]",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[19px] w-[19px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ToolGlyph tool={tool} />
      </svg>
      {tool.slug.includes("-to-") ? (
        <span className="absolute -bottom-1 -right-1 rounded-md border-2 border-white bg-ink px-1 py-0.5 font-mono text-[6px] font-bold leading-none tracking-tight text-white">
          {badge}
        </span>
      ) : null}
    </span>
  );
}
