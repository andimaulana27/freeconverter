import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideArticle } from "@/components/blog/GuideArticle";
import { SiteShell } from "@/components/layout/SiteShell";
import { requireCms } from "@/lib/auth/session";
import { cmsPostToBlogPost } from "@/lib/cms/preview";
import { fetchPost } from "@/lib/cms/server";
import { listPublishedPosts, relatedGuides } from "@/lib/blog/queries";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Guide preview",
  robots: { index: false, follow: false },
};

export default async function PostPreviewPage({ params }: Props) {
  const { id } = await params;
  const session = await requireCms(`/admin/posts/${id}/preview`);
  const post = await fetchPost(session.supabase, id);
  if (!post) notFound();
  const published = await listPublishedPosts().catch(() => []);
  const preview = cmsPostToBlogPost(post);
  const related = relatedGuides(published, preview);

  return (
    <SiteShell ads={false}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-control border border-line bg-paper px-4 py-3 text-sm">
        <p>Admin preview · this URL is noindex and does not load production ads.</p>
        <Link href={`/admin/posts/${post.id}`} className="font-semibold text-accent">
          Back to editor
        </Link>
      </div>
      <GuideArticle post={preview} related={related} ads={false} preview />
    </SiteShell>
  );
}
