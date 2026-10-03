import type { Metadata } from "next";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { StatusBadge } from "@/components/cms/StatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { requireCms } from "@/lib/auth/session";
import { listPosts, listTopics } from "@/lib/cms/server";
import { POST_STATUSES, type PostStatus } from "@/lib/cms/types";

export const metadata: Metadata = {
  title: "Guides",
  robots: { index: false, follow: false },
};

function isStatus(value: string | undefined): value is PostStatus {
  return Boolean(value && POST_STATUSES.includes(value as PostStatus));
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; topic?: string }>;
}) {
  const session = await requireCms("/admin/posts");
  const params = await searchParams;
  const status = isStatus(params.status) ? params.status : "all";
  const [posts, topics] = await Promise.all([
    listPosts(session.supabase, { status, q: params.q?.trim(), topic: params.topic || undefined }),
    listTopics(session.supabase),
  ]);

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-micro uppercase text-faint">CMS</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Guides</h1>
        </div>
        <ButtonLink href="/admin/posts/new" variant="primary" size="sm">
          New guide
        </ButtonLink>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search title or slug"
          className="h-10 min-w-[12rem] flex-1 rounded-control border border-line bg-paper px-3 text-sm outline-none focus:border-accent"
        />
        <select name="status" defaultValue={status} className="h-10 rounded-control border border-line bg-paper px-3 text-sm">
          <option value="all">All statuses</option>
          {POST_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select name="topic" defaultValue={params.topic ?? ""} className="h-10 rounded-control border border-line bg-paper px-3 text-sm">
          <option value="">All topics</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-control border border-line bg-paper px-4 text-sm font-medium">
          Filter
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-tile border border-line bg-paper">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Topic</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{post.title}</p>
                  <p className="text-xs text-mute">/{post.slug}</p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={post.status} /></td>
                <td className="px-4 py-3 text-mute">{post.topic?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-mute">{new Date(post.updated_at).toISOString().slice(0, 16).replace("T", " ")} UTC</td>
                <td className="px-4 py-3 text-right">
                  <ButtonLink href={`/admin/posts/${post.id}`}>Edit</ButtonLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!posts.length ? <p className="px-4 py-8 text-sm text-mute">No guides match this filter.</p> : null}
      </div>
    </AdminChrome>
  );
}
