import { cn } from "@/lib/cn";

type GlyphProps = {
  format?: string;
  category?: string;
  className?: string;
};

function kindOf(format = "", category = "") {
  const value = `${format} ${category}`.toLowerCase();
  if (/(png|jpg|jpeg|webp|gif|bmp|ico|svg|heic|heif|avif|tif|tiff|raw|psd|gambar|image)/.test(value)) return "image";
  if (/(pdf|txt|csv|html|htm|json|docx|xlsx|pptx|epub|mobi|document|dokumen|ebook)/.test(value)) return "document";
  if (/(zip|rar|7z|tar|gz|arsip|archive)/.test(value)) return "file";
  if (/(ttf|otf|woff|eot|font)/.test(value)) return "font";
  if (/(mp4|mov|mkv|webm|avi|wmv|video)/.test(value)) return "video";
  if (/(mp3|wav|aac|flac|ogg|m4a|audio)/.test(value)) return "audio";
  return "file";
}

export function FormatGlyph({ format, category, className }: GlyphProps) {
  const kind = kindOf(format, category);

  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-paper text-ink",
        className,
      )}
      aria-hidden
    >
      {kind === "font" ? (
        <span className="font-serif text-sm font-semibold tracking-tight">Aa</span>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          {kind === "image" ? (
            <>
              <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
              <circle cx="9" cy="9.5" r="1.5" />
              <path d="m5.5 17 4.2-4.2 2.7 2.6 2.2-2.1 3.9 3.7" />
            </>
          ) : null}
          {kind === "document" ? (
            <>
              <path d="M7 3.5h7l4 4V20H7z" />
              <path d="M14 3.5V8h4M9.5 12h6M9.5 15h6" />
            </>
          ) : null}
          {kind === "video" ? (
            <>
              <rect x="3.5" y="5" width="17" height="14" rx="2" />
              <path d="m10 9 5 3-5 3z" />
            </>
          ) : null}
          {kind === "audio" ? (
            <>
              <path d="M4 12h2l1.5-4 3 8 2.5-11 2.5 14 1.5-7h3" />
            </>
          ) : null}
          {kind === "file" ? (
            <>
              <path d="M7 3.5h7l4 4V20H7z" />
              <path d="M14 3.5V8h4" />
            </>
          ) : null}
        </svg>
      )}
    </span>
  );
}

type ArtworkProps = {
  from?: string;
  to?: string;
  category?: string;
  active?: boolean;
};

export function FormatArtwork({ from = "file", to = "format", category, active }: ArtworkProps) {
  return (
    <div
      className={cn(
        "group/art relative h-32 overflow-hidden border-y border-line bg-bone/70 transition-colors duration-280",
        active && "bg-accent-soft",
      )}
      aria-hidden
    >
      <span className="absolute left-1/2 top-0 h-full w-px bg-line" />
      <span className="absolute left-0 top-1/2 h-px w-full bg-line" />

      <div
        className={cn(
          "absolute left-6 top-6 flex w-28 items-center gap-2 border border-line bg-paper p-3 transition duration-280 sm:left-10",
          "group-hover/art:-translate-y-1 group-hover/art:-rotate-2",
          active && "-translate-y-1 -rotate-2 border-accent",
        )}
      >
        <FormatGlyph format={from} category={category} />
        <span className="font-mono text-xs font-semibold uppercase text-ink">{from}</span>
      </div>

      <div className="absolute left-1/2 top-1/2 w-20 -translate-x-1/2 -translate-y-1/2 sm:w-28">
        <svg viewBox="0 0 112 28" className="w-full overflow-visible" fill="none">
          <path
            d="M2 14h102M95 6l9 8-9 8"
            className="stroke-faint group-hover/art:stroke-accent"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
        </svg>
        <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-accent animate-route" />
      </div>

      <div
        className={cn(
          "absolute right-6 top-6 flex w-28 items-center gap-2 border border-ink bg-ink p-3 text-white transition duration-280 sm:right-10",
          "group-hover/art:-translate-y-1 group-hover/art:rotate-2",
          active && "-translate-y-1 rotate-2 border-accent bg-accent",
        )}
      >
        <FormatGlyph format={to} category={category} className="border-white/20 bg-white/10 text-white" />
        <span className="font-mono text-xs font-semibold uppercase">{to}</span>
      </div>
    </div>
  );
}
