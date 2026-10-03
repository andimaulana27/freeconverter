import type { Metadata } from "next";
import Link from "next/link";
import { GuideCard } from "@/components/blog/GuideCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { blogBreadcrumbJsonLd, blogIndexJsonLd, blogIndexMetadata } from "@/lib/blog/metadata";
import { listPublishedPosts } from "@/lib/blog/queries";

export const revalidate = 300;

type Props = {
  searchParams: Promise<{ topic?: string }>;
};

function topicSlug(value: string | undefined) {
  if (!value || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return null;
  return value;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { topic } = await searchParams;
  return blogIndexMetadata(topicSlug(topic));
}

export default async function BlogIndexPage({ searchParams }: Props) {
  const { topic: rawTopic } = await searchParams;
  const posts = await listPublishedPosts();
  const requested = topicSlug(rawTopic);
  const activeTopic = requested && posts.some((post) => post.topic?.slug === requested) ? requested : null;
  const visible = activeTopic ? posts.filter((post) => post.topic?.slug === activeTopic) : posts;
  const [featured, ...rest] = visible;
  const topics = posts.flatMap((post) => (post.topic ? [post.topic] : [])).filter((topic, index, all) => (
    all.findIndex((item) => item.slug === topic.slug) === index
  ));

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <JsonLd data={[blogIndexJsonLd(posts), blogBreadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Guides", path: "/blog" }])]} />

      <header className="max-w-3xl">
        <p className="flex items-center gap-3 text-eyebrow font-bold uppercase text-accent-ink">
          <span className="h-px w-7 bg-accent-ink" />
          Blog
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-ink sm:text-5xl">
          Guides for real file problems.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-mute">
          Short, reviewed notes on formats, browser conversions, and files that will not open. Each guide points back to the matching tool.
        </p>
      </header>

      {topics.length ? (
        <nav aria-label="Guide topics" className="flex flex-wrap gap-2">
          <Link
            href="/blog"
            aria-current={activeTopic ? undefined : "page"}
            className={`rounded-control border px-3 py-2 text-xs font-semibold transition ${activeTopic ? "border-[#e5dfdc] bg-white text-mute hover:border-[#d3cac6] hover:text-ink" : "border-accent bg-accent text-white"}`}
          >
            All guides
          </Link>
          {topics.map((topic) => {
            const active = topic.slug === activeTopic;
            return (
              <Link
                key={topic.slug}
                href={`/blog?topic=${topic.slug}`}
                aria-current={active ? "page" : undefined}
                className={`rounded-control border px-3 py-2 text-xs font-semibold transition ${active ? "border-accent bg-accent text-white" : "border-[#e5dfdc] bg-white text-mute hover:border-[#d3cac6] hover:text-ink"}`}
              >
                {topic.name}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {featured ? (
        <section aria-label="Featured guide">
          <GuideCard post={featured} index={0} featured />
        </section>
      ) : (
        <section className="rounded-panel border border-[#ded7d3] bg-white p-6 shadow-panel sm:p-8">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink">Guides are being prepared.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-mute">
            Published articles will appear here. The converter tools stay available while this library grows.
          </p>
          <Link href="/tools" className="mt-5 inline-flex text-sm font-semibold text-accent">
            Browse tools
          </Link>
        </section>
      )}

      {rest.length ? (
        <section aria-label="More guides" className="grid gap-4 md:grid-cols-2">
          {rest.map((post, index) => <GuideCard key={post.id} post={post} index={index + 1} />)}
        </section>
      ) : null}

      <p className="text-xs text-faint">
        <Link href="/rss.xml" className="font-semibold text-mute transition hover:text-accent">RSS feed</Link>
        <span> for published guides.</span>
      </p>
    </div>
  );
}
