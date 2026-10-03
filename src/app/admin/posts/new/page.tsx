import type { Metadata } from "next";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { createPost } from "@/app/admin/posts/actions";
import { Button } from "@/components/ui/Button";
import { requireCms } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "New guide",
  robots: { index: false, follow: false },
};

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireCms("/admin/posts/new");
  const { error } = await searchParams;

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <div className="grid overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-panel lg:grid-cols-[0.78fr_1.22fr]">
        <section className="relative isolate overflow-hidden bg-[#181412] p-7 text-white sm:p-9">
          <div className="pointer-events-none absolute inset-0 -z-20 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:44px_44px]" aria-hidden />
          <div className="pointer-events-none absolute -bottom-20 -right-20 -z-10 h-60 w-60 rounded-full border-[38px] border-white/[0.04]" aria-hidden />
          <p className="font-mono text-micro font-bold uppercase text-accent-light">New editorial route</p>
          <h1 className="mt-5 text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl">Start with one clear idea.</h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/48">Create the identity first. The structured editor will open immediately so the article can grow from a focused draft.</p>
          <div className="mt-10 space-y-3">
            {["Create as a private draft", "Create a clean web address", "Continue in the content editor"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3">
                <span className="font-mono text-[9px] text-accent-light">0{index + 1}</span>
                <span className="text-xs text-white/65">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-9 lg:p-12">
          <div className="w-full max-w-xl">
            <p className="font-mono text-micro font-bold uppercase tracking-[0.16em] text-accent">Draft identity</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Name the guide</h2>
            <p className="mt-2 text-sm text-mute">You can refine the title, metadata, and publishing details in the editor.</p>
            {error ? (
              <p role="alert" className="mt-5 rounded-control border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-ink">
                The draft could not be created. Check that the slug is unique and try again.
              </p>
            ) : null}
            <form action={createPost} className="mt-7 space-y-5">
              <label className="flex flex-col gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
                Working title
                <input
                  name="title"
                  required
                  minLength={3}
                  placeholder="A useful, specific guide title"
                  className="h-14 rounded-control border border-[#ddd6d2] bg-white px-4 font-sans text-sm normal-case tracking-normal text-ink outline-none transition focus:border-accent focus:shadow-glow"
                />
              </label>
              <label className="flex flex-col gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
                Web address
                <input
                  name="slug"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  placeholder="optional-auto-generated-slug"
                  className="h-14 rounded-control border border-[#ddd6d2] bg-white px-4 font-mono text-xs normal-case tracking-normal text-ink outline-none transition focus:border-accent focus:shadow-glow"
                />
                <span className="font-sans text-[10px] font-normal normal-case tracking-normal text-faint">Optional — generated from the title if left empty.</span>
              </label>
              <Button type="submit" size="lg" className="w-full justify-between">
                Create draft <span aria-hidden>→</span>
              </Button>
            </form>
          </div>
        </section>
      </div>
    </AdminChrome>
  );
}
