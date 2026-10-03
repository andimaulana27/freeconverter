import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideCard } from "@/components/blog/GuideCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { blogBreadcrumbJsonLd, blogTopicMetadata } from "@/lib/blog/metadata";
import { getTopicArchive, listPublishedPostsForTopic, listTopicArchives } from "@/lib/blog/queries";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const archives = await listTopicArchives();
    return archives.map((topic) => ({ slug: topic.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopicArchive(slug);
  if (!topic) return { title: "Topic not found", robots: { index: false, follow: false } };
  return blogTopicMetadata(topic);
}

export default async function BlogTopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = await getTopicArchive(slug);
  if (!topic) notFound();
  const posts = await listPublishedPostsForTopic(slug);
  const [featured, ...rest] = posts;

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <JsonLd
        data={[
          blogBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/blog" },
            { name: topic.name, path: `/blog/topic/${topic.slug}` },
          ]),
        ]}
      />

      <header className="max-w-3xl">
        <p className="flex items-center gap-3 text-eyebrow font-bold uppercase text-accent-ink">
          <span className="h-px w-7 bg-accent-ink" />
          Topic
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-ink sm:text-5xl">
          {topic.name}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-mute">
          {topic.description || `Reviewed ${topic.name.toLowerCase()} guides. Each article points back to the matching converter.`}
        </p>
        <p className="mt-4 text-xs text-faint">
          <Link href="/blog" className="font-semibold text-mute transition hover:text-accent">All guides</Link>
          <span> · {topic.count} published</span>
        </p>
      </header>

      {featured ? (
        <section aria-label="Featured guide">
          <GuideCard post={featured} index={0} featured />
        </section>
      ) : null}

      {rest.length ? (
        <section aria-label="More guides" className="grid gap-4 md:grid-cols-2">
          {rest.map((post, index) => <GuideCard key={post.id} post={post} index={index + 1} />)}
        </section>
      ) : null}
    </div>
  );
}
