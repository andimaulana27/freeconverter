import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { GuideArticle } from "@/components/blog/GuideArticle";
import { blogPostMetadata } from "@/lib/blog/metadata";
import { getPublishedPost, getPublishedSlugRedirect, listPublishedPosts, relatedGuides } from "@/lib/blog/queries";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const posts = await listPublishedPosts();
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Guide not found", robots: { index: false, follow: false } };
  return blogPostMetadata(post);
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, posts] = await Promise.all([getPublishedPost(slug), listPublishedPosts()]);
  if (!post) {
    const target = await getPublishedSlugRedirect(slug);
    if (target) permanentRedirect(`/blog/${target}`);
    notFound();
  }

  return <GuideArticle post={post} related={relatedGuides(posts, post)} />;
}
