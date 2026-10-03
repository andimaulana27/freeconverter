import Link from "next/link";
import { GuideCard } from "@/components/blog/GuideCard";
import { getHomepageGuides } from "@/lib/blog/queries";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 10h13m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export async function LatestGuides() {
  let guides;
  try {
    guides = await getHomepageGuides();
  } catch {
    return null;
  }
  if (guides.length === 0) return null;

  return (
    <section className="relative isolate overflow-hidden rounded-panel border border-[#ded7d3] bg-[#f6f3f1] p-6 shadow-panel sm:p-8 lg:p-10" aria-labelledby="latest-guides-heading">
      <div
        className="pointer-events-none absolute -right-16 -top-20 -z-10 h-72 w-72 rounded-full border-[46px] border-white/70"
        aria-hidden
      />
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-3 text-eyebrow font-bold uppercase text-accent-ink">
            <span className="h-px w-7 bg-accent" />
            Latest guides
          </p>
          <h2 id="latest-guides-heading" className="mt-4 max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-ink sm:text-5xl">
            Practical notes for the file in front of you.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-mute">
            One format choice, one browser tutorial, and one fix for a file that will not open.
          </p>
        </div>
        <Link
          href="/blog"
          className="inline-flex shrink-0 items-center gap-2 rounded-control border border-[#ded7d3] bg-white px-4 py-3 text-sm font-semibold text-ink transition duration-180 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
        >
          Read all guides
          <ArrowIcon />
        </Link>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {guides.map((post, index) => <GuideCard key={post.id} post={post} index={index} />)}
      </div>
    </section>
  );
}
