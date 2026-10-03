import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { PostEditor } from "@/components/cms/PostEditor";
import { canPublish } from "@/lib/auth/roles";
import { requireCms } from "@/lib/auth/session";
import { fetchPendingSchedule, fetchPost, listTopics } from "@/lib/cms/server";
import { tools } from "@/lib/tools";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Edit guide",
  robots: { index: false, follow: false },
};

export const maxDuration = 180;

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const session = await requireCms(`/admin/posts/${id}`);
  const [post, topics, schedule] = await Promise.all([
    fetchPost(session.supabase, id),
    listTopics(session.supabase),
    fetchPendingSchedule(session.supabase, id),
  ]);
  if (!post) notFound();

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <PostEditor
        post={post}
        topics={topics}
        canPublish={canPublish(session.role)}
        schedule={schedule}
        tools={tools.map((tool) => ({ slug: tool.slug, title: tool.title, category: tool.category }))}
      />
    </AdminChrome>
  );
}
