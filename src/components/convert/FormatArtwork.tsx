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
  variant?: "default" | "hero";
};

export function FormatArtwork({ from = "file", to = "format", category, active, variant = "default" }: ArtworkProps) {
  if (variant === "hero") {
    return (
      <div
        className={cn(
          "group/art relative h-32 overflow-hidden border-b border-[#ebe5e1] bg-[radial-gradient(circle_at_50%_0%,rgba(217,45,40,0.08),transparent_48%),linear-gradient(135deg,#fff_0%,#faf7f5_100%)] transition-colors duration-300",
          active && "bg-[#fff5f4]",
        )}
        aria-hidden
      >
        <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(circle,rgba(24,20,18,0.12)_1px,transparent_1px)] [background-size:15px_15px] [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]" />

        <div
          className={cn(
            "absolute left-5 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-2xl border border-[#ded5d0] bg-white p-2 shadow-[0_8px_22px_rgba(42,28,22,0.09)] transition duration-300 sm:left-7 sm:gap-3 sm:px-3 sm:py-2.5",
            "group-hover/art:-translate-y-[52%] group-hover/art:border-[#cfc2bc]",
            active && "-translate-y-[52%] border-accent/35",
          )}
        >
          <FormatGlyph format={from} category={category} className="h-8 w-8 rounded-xl border-[#e8e1dd] bg-[#faf7f5] sm:h-9 sm:w-9" />
          <span className="hidden min-[380px]:block">
            <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-mute">Input</span>
            <span className="mt-0.5 block font-mono text-xs font-bold uppercase text-ink">{from}</span>
          </span>
        </div>

        <div className="absolute left-1/2 top-1/2 w-[26%] -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-px overflow-visible bg-[linear-gradient(to_right,rgba(217,45,40,0.22)_50%,transparent_50%)] bg-[length:8px_1px]">
            <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-white bg-accent/80 shadow-[0_0_0_3px_rgba(217,45,40,0.08)] motion-safe:animate-route" />
          </div>
          <span className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap font-mono text-[7px] font-semibold uppercase tracking-[0.14em] text-mute">
            Input → output
          </span>
        </div>

        <div
          className={cn(
            "absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-2xl border border-[#2b2522] bg-[#181412] p-2 text-white shadow-[0_14px_32px_rgba(24,20,18,0.18)] transition duration-300 sm:right-7 sm:gap-3 sm:px-3 sm:py-2.5",
            "group-hover/art:-translate-y-[52%] group-hover/art:border-accent/70",
            active && "-translate-y-[52%] border-accent bg-accent",
          )}
        >
          <FormatGlyph format={to} category={category} className="h-8 w-8 rounded-xl border-white/10 bg-white/10 text-white sm:h-9 sm:w-9" />
          <span className="hidden min-[380px]:block">
            <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-white/55">Output</span>
            <span className="mt-0.5 block font-mono text-xs font-bold uppercase">{to}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/art relative h-28 overflow-hidden border-y border-line bg-bone/70 transition-colors duration-280",
        active && "bg-accent-soft",
      )}
      aria-hidden
    >
      <span className="absolute left-1/2 top-0 h-full w-px bg-line" />
      <span className="absolute left-0 top-1/2 h-px w-full bg-line" />

      <div
        className={cn(
          "absolute left-6 top-1/2 flex min-w-28 -translate-y-1/2 items-center gap-2 rounded-xl border border-[#d8cfca] bg-white p-3 shadow-[0_7px_18px_rgba(42,28,22,0.07)] transition duration-280 sm:left-10",
          "group-hover/art:-translate-y-[54%] group-hover/art:border-[#bcaea7]",
          active && "-translate-y-[54%] border-accent",
        )}
      >
        <FormatGlyph format={from} category={category} />
        <span>
          <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-mute">Input</span>
          <span className="mt-0.5 block font-mono text-xs font-bold uppercase text-ink">{from}</span>
        </span>
      </div>

      <div className="absolute left-1/2 top-1/2 w-16 -translate-x-1/2 -translate-y-1/2 sm:w-24">
        <svg viewBox="0 0 112 28" className="w-full overflow-visible" fill="none">
          <path
            d="M2 14h102M95 6l9 8-9 8"
            className="stroke-[#b6aaa4] transition group-hover/art:stroke-accent"
            strokeWidth="1.25"
            strokeDasharray="5 5"
          />
        </svg>
        <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent/80 motion-safe:animate-route" />
      </div>

      <div
        className={cn(
          "absolute right-6 top-1/2 flex min-w-28 -translate-y-1/2 items-center gap-2 rounded-xl border border-ink bg-ink p-3 text-white shadow-[0_8px_20px_rgba(24,20,18,0.13)] transition duration-280 sm:right-10",
          "group-hover/art:-translate-y-[54%] group-hover/art:border-accent",
          active && "-translate-y-[54%] border-accent bg-accent",
        )}
      >
        <FormatGlyph format={to} category={category} className="border-white/20 bg-white/10 text-white" />
        <span>
          <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-white/55">Output</span>
          <span className="mt-0.5 block font-mono text-xs font-bold uppercase">{to}</span>
        </span>
      </div>
    </div>
  );
}
