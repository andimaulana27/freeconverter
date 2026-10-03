import Link from "next/link";

export default function BlogPostNotFound() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <p className="text-eyebrow font-bold uppercase text-accent-ink">Guides</p>
      <h1 className="text-3xl font-semibold tracking-tight text-ink">That guide is not published.</h1>
      <p className="text-sm leading-6 text-mute">Drafts stay private. Open the guide library or go back to the converter.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/blog" className="rounded-control bg-accent px-4 py-2.5 text-sm font-semibold text-white">All guides</Link>
        <Link href="/" className="rounded-control border border-[#ded7d3] px-4 py-2.5 text-sm font-semibold text-ink">Home</Link>
      </div>
    </div>
  );
}
