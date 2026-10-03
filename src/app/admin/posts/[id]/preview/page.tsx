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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e5ddda] bg-[#faf8f7] px-5 py-4 text-sm shadow-drop">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-warn shadow-[0_0_0_4px_rgba(180,83,9,0.08)]" />
          <p><span className="font-semibold text-ink">Preview only.</span> This guide is not public and ads are hidden.</p>
        </div>
        <Link href={`/admin/posts/${post.id}`} className="font-semibold text-accent transition hover:text-accent-ink">
          ← Back to editor
        </Link>
      </div>
      <GuideArticle post={preview} related={related} ads={false} preview />
    </SiteShell>
  );
}
