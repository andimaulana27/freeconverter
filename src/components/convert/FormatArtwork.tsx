import { cn } from "@/lib/cn";
import { ShotHit, ShotKick, ShotLane, shotStyle } from "@/components/convert/ShotRoute";

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
  busy?: boolean;
  variant?: "default" | "hero";
};

export function FormatArtwork({ from = "file", to = "format", category, active, busy, variant = "default" }: ArtworkProps) {
  const hot = Boolean(active || busy);
  const style = shotStyle(hot);

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
        <div className="relative z-[1] flex h-full items-center gap-1 px-5 sm:gap-2 sm:px-6">
          <ShotKick hot={hot}>
            <div
              className={cn(
                "relative flex items-center gap-2 rounded-2xl border border-[#ded5d0] bg-white p-2 shadow-[0_8px_22px_rgba(42,28,22,0.09)] transition duration-300 sm:gap-3 sm:px-3 sm:py-2.5",
                "group-hover/art:-translate-y-0.5 group-hover/art:border-[#cfc2bc]",
                active && "border-accent/35",
              )}
            >
              <span className="pointer-events-none absolute right-0 top-1/2 size-4 rounded-full bg-accent/80 blur-[2px] motion-safe:animate-muzzle" style={style} />
              <FormatGlyph format={from} category={category} className="h-8 w-8 rounded-xl border-[#e8e1dd] bg-[#faf7f5] sm:h-9 sm:w-9" />
              <span className="hidden min-[380px]:block">
                <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-mute">Input</span>
                <span className="mt-0.5 block font-mono text-xs font-bold uppercase text-ink">{from}</span>
              </span>
            </div>
          </ShotKick>
          <ShotLane hot={hot} />
          <ShotHit hot={hot}>
            <div
              className={cn(
                "relative flex items-center gap-2 rounded-2xl border border-[#2b2522] bg-[#181412] p-2 text-white shadow-[0_14px_32px_rgba(24,20,18,0.18)] transition duration-300 sm:gap-3 sm:px-3 sm:py-2.5",
                "group-hover/art:-translate-y-0.5 group-hover/art:border-accent/70",
                active && "border-accent bg-accent",
              )}
            >
              <FormatGlyph format={to} category={category} className="h-8 w-8 rounded-xl border-white/10 bg-white/10 text-white sm:h-9 sm:w-9" />
              <span className="hidden min-[380px]:block">
                <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-white/55">Output</span>
                <span className="mt-0.5 block font-mono text-xs font-bold uppercase">{to}</span>
              </span>
            </div>
          </ShotHit>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/art relative h-[7.25rem] overflow-hidden border-y border-line bg-bone/70 transition-colors duration-280",
        active && "bg-accent-soft",
      )}
      aria-hidden
    >
      <span className="absolute left-1/2 top-0 h-full w-px bg-line" />
      <span className="absolute left-0 top-1/2 h-px w-full bg-line" />
      <div className="relative z-[1] flex h-full items-center px-6 sm:px-8">
        <ShotKick hot={hot}>
          <div
            className={cn(
              "relative flex min-w-28 items-center gap-2 rounded-xl border border-[#d8cfca] bg-white p-3 shadow-[0_7px_18px_rgba(42,28,22,0.07)] transition duration-280",
              "group-hover/art:-translate-y-0.5 group-hover/art:border-[#bcaea7]",
              active && "border-accent",
            )}
          >
            <span className="pointer-events-none absolute right-0 top-1/2 size-3.5 rounded-full bg-accent blur-[1px] motion-safe:animate-muzzle" style={style} />
            <FormatGlyph format={from} category={category} />
            <span>
              <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-mute">Input</span>
              <span className="mt-0.5 block font-mono text-xs font-bold uppercase text-ink">{from}</span>
            </span>
          </div>
        </ShotKick>
        <ShotLane hot={hot} />
        <ShotHit hot={hot}>
          <div
            className={cn(
              "relative flex min-w-28 items-center gap-2 rounded-xl border border-ink bg-ink p-3 text-white shadow-[0_8px_20px_rgba(24,20,18,0.13)] transition duration-280",
              "group-hover/art:-translate-y-0.5 group-hover/art:border-accent",
              active && "border-accent bg-accent",
              hot && "shadow-[0_0_0_4px_rgba(217,45,40,0.18),0_10px_24px_rgba(217,45,40,0.28)]",
            )}
          >
            <FormatGlyph format={to} category={category} className="border-white/20 bg-white/10 text-white" />
            <span>
              <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-white/55">Output</span>
              <span className="mt-0.5 block font-mono text-xs font-bold uppercase">{to}</span>
            </span>
          </div>
        </ShotHit>
      </div>
    </div>
  );
}
