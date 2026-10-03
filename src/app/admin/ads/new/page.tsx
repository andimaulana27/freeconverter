import type { Metadata } from "next";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { createCreativeAction } from "@/app/admin/ads/actions";
import { Button } from "@/components/ui/Button";
import { requireAds } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "New ad creative",
  robots: { index: false, follow: false },
};

export default async function NewAdCreativePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireAds("/admin/ads/new");
  const { error } = await searchParams;

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <div className="grid overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-panel lg:grid-cols-[0.76fr_1.24fr]">
        <section className="relative isolate overflow-hidden bg-[#181412] p-7 text-white sm:p-9">
          <div className="pointer-events-none absolute inset-0 -z-20 opacity-30 [background-image:radial-gradient(circle,rgba(255,106,100,0.65)_1px,transparent_1.2px)] [background-size:11px_11px] [mask-image:linear-gradient(to_bottom_left,black,transparent)]" aria-hidden />
          <p className="font-mono text-micro font-bold uppercase text-accent-light">Campaign setup</p>
          <h1 className="mt-5 text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl">Build the unit before it goes live.</h1>
          <p className="mt-5 text-sm leading-6 text-white/48">Every creative begins as a draft. Define its format and dimensions first, then connect content, schedule, and placements.</p>
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/35">Supported routes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["AdSense", "Manual image", "Empty fallback"].map((item) => <span key={item} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/60">{item}</span>)}
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-9 lg:p-12">
          <p className="font-mono text-micro font-bold uppercase tracking-[0.16em] text-accent">Creative identity</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Create a draft</h2>
          <p className="mt-2 max-w-xl text-sm text-mute">AdSense snippets are parsed safely. Image campaigns receive media and destination details in the editor.</p>
          {error ? (
            <p role="alert" className="mt-5 rounded-control border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-ink">
              The creative could not be created. Check the name and dimensions, then try again.
            </p>
          ) : null}
          <form action={createCreativeAction} className="mt-7 max-w-xl space-y-5">
            <label className="flex flex-col gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
              Creative name
              <input name="name" required minLength={2} placeholder="Campaign or placement name" className="h-12 rounded-control border border-[#ddd6d2] bg-white px-4 font-sans text-sm normal-case tracking-normal text-ink outline-none focus:border-accent focus:shadow-glow" />
            </label>
            <label className="flex flex-col gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
              Creative type
              <select name="type" defaultValue="adsense" className="h-12 rounded-control border border-[#ddd6d2] bg-white px-4 font-sans text-sm normal-case tracking-normal text-ink outline-none focus:border-accent">
                <option value="adsense">AdSense unit</option>
                <option value="image">Manual image</option>
                <option value="empty">Empty fallback</option>
              </select>
            </label>
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">Frame size</p>
              <p className="mt-1 text-[10px] text-faint">728×90 leaderboard · 320×100 mobile · 300×250 rectangle · 160×600 rail</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2 text-xs text-mute">
                  Width
                  <input name="width" type="number" min={1} defaultValue={728} className="h-12 rounded-control border border-[#ddd6d2] bg-white px-4 text-sm text-ink outline-none focus:border-accent focus:shadow-glow" />
                </label>
                <label className="flex flex-col gap-2 text-xs text-mute">
                  Height
                  <input name="height" type="number" min={1} defaultValue={90} className="h-12 rounded-control border border-[#ddd6d2] bg-white px-4 text-sm text-ink outline-none focus:border-accent focus:shadow-glow" />
                </label>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full justify-between">Create creative <span aria-hidden>→</span></Button>
          </form>
        </section>
      </div>
    </AdminChrome>
  );
}
