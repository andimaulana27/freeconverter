import Link from "next/link";
import { guideDateLabel } from "@/lib/blog/metadata";
import type { BlogPostSummary } from "@/lib/blog/queries";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 10h13m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  post: BlogPostSummary;
  index: number;
  featured?: boolean;
};

export function GuideCard({ post, index, featured = false }: Props) {
  return (
    <Link
      href={post.canonicalPath}
      className="group relative flex h-full flex-col overflow-hidden rounded-card border border-[#e8e2df] bg-white p-5 shadow-drop transition duration-280 hover:-translate-y-1 hover:border-[#d8cfca] hover:shadow-tile sm:p-6"
    >
      <span className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent-soft transition duration-500 group-hover:scale-[1.8]" aria-hidden />
      <span className="relative flex items-center justify-between gap-3">
        <span className="text-micro font-bold uppercase text-accent-ink">{post.topic?.name ?? "Guide"}</span>
        <span className="font-mono text-micro text-accent-ink">{String(index + 1).padStart(2, "0")}</span>
      </span>
      <h3 className={`relative mt-4 font-semibold tracking-[-0.04em] text-ink ${featured ? "text-3xl leading-[1.05] sm:text-4xl" : "text-xl leading-snug"}`}>
        {post.title}
      </h3>
      {post.excerpt ? (
        <p className={`relative mt-3 text-sm leading-6 text-mute ${featured ? "max-w-2xl" : "line-clamp-3"}`}>{post.excerpt}</p>
      ) : null}
      <span className="relative mt-6 flex items-center justify-between gap-3 border-t border-[#eee9e6] pt-4 text-xs font-semibold text-ink">
        <span className="font-mono text-micro uppercase text-faint">
          {guideDateLabel(post.updatedAt)} · {post.readingMinutes} min
        </span>
        <span className="inline-flex items-center gap-2 transition group-hover:text-accent">
          Read guide
          <span className="transition group-hover:translate-x-1"><ArrowIcon /></span>
        </span>
      </span>
    </Link>
  );
}
