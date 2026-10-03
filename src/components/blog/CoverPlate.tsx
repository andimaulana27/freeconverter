import { COVER_PALETTE_COLORS, visualBriefFromSeed } from "@/lib/cms/cover-template";

export function CoverPlate({
  title,
  kicker,
  seed,
  featured = false,
}: {
  title: string;
  kicker: string;
  seed: string;
  featured?: boolean;
}) {
  const brief = visualBriefFromSeed(title, kicker || "Guide", seed || title);
  const colors = COVER_PALETTE_COLORS[brief.palette];
  const lines = featured ? brief.titleLines : brief.titleLines.slice(0, 3);
  const frame =
    brief.templateKey === "split-band"
      ? { borderTop: `10px solid ${colors.accent}` }
      : brief.templateKey === "quiet-grid"
        ? { boxShadow: `inset 0 0 0 2px ${colors.accent}` }
        : { borderLeft: `12px solid ${colors.accent}` };

  return (
    <div
      aria-hidden
      className={`relative overflow-hidden ${featured ? "aspect-[1.91/1]" : "aspect-[16/9]"}`}
      style={{ background: colors.bg, color: colors.ink, ...frame }}
    >
      {brief.motif === "grid" ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${colors.mute}33 1px, transparent 1px)`,
            backgroundSize: "100% 28px",
          }}
        />
      ) : null}
      {brief.motif === "corner" ? (
        <span className="absolute bottom-4 left-4 h-7 w-7 border-b-2 border-l-2" style={{ borderColor: colors.accent }} />
      ) : null}
      <div className={`relative flex h-full flex-col justify-between ${featured ? "p-5 sm:p-8" : "p-4 sm:p-5"}`}>
        <div className="flex items-center gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: colors.accent }}>
            {brief.kicker}
          </p>
          {brief.motif === "rule" ? <span className="h-0.5 w-10" style={{ background: colors.accent }} /> : null}
        </div>
        <div className={featured ? "max-w-3xl" : undefined}>
          {lines.map((line, index) => (
            <p
              key={`${line}-${index}`}
              className={`break-words font-semibold leading-[0.95] tracking-[-0.045em] ${featured ? "text-3xl sm:text-5xl" : "text-lg leading-tight sm:text-2xl"}`}
            >
              {line}
            </p>
          ))}
        </div>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${brief.motif === "corner" ? "pl-8" : ""}`} style={{ color: colors.mute }}>
          AllYouConvert
        </p>
      </div>
    </div>
  );
}
