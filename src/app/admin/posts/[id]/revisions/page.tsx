import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { restoreRevision } from "@/app/admin/posts/actions";
import { Button, ButtonLink } from "@/components/ui/Button";
import { requireCms } from "@/lib/auth/session";
import { fetchPost, listRevisions } from "@/lib/cms/server";

export const metadata: Metadata = {
  title: "Revisions",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function RevisionsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await requireCms(`/admin/posts/${id}/revisions`);
  const [post, revisions] = await Promise.all([fetchPost(session.supabase, id), listRevisions(session.supabase, id)]);
  if (!post) notFound();

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-micro uppercase text-faint">Revisions</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{post.title}</h1>
        </div>
        <ButtonLink href={`/admin/posts/${post.id}`} variant="secondary" size="sm">
          Back to editor
        </ButtonLink>
      </div>
      <p className="mt-3 text-sm text-mute">Restoring copies content into the current draft. It does not publish by itself.</p>
      {error ? (
        <p role="alert" className="mt-4 rounded-control border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-ink">
          Restore failed. Reload the editor and try again if another tab saved first.
        </p>
      ) : null}
      <ul className="mt-6 space-y-3">
        {revisions.map((revision) => {
          const snapshot = revision.snapshot;
          const title = typeof snapshot.title === "string" ? snapshot.title : post.title;
          const slug = typeof snapshot.slug === "string" ? snapshot.slug : post.slug;
          return (
            <li key={revision.id} className="rounded-card border border-line bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-xs text-mute">
                    {new Date(revision.created_at).toISOString().replace("T", " ").slice(0, 19)} UTC · {revision.change_source} · /{slug}
                  </p>
                  {post.current_revision_id === revision.id ? <p className="mt-1 text-xs text-ok">Current revision</p> : null}
                </div>
                <form
                  action={async () => {
                    "use server";
                    const result = await restoreRevision({
                      postId: post.id,
                      revisionId: revision.id,
                      expectedUpdatedAt: post.updated_at,
                    });
                    if (!result.ok) redirect(`/admin/posts/${post.id}/revisions?error=1`);
                    redirect(`/admin/posts/${post.id}`);
                  }}
                >
                  <Button type="submit" variant="secondary" size="sm">
                    Restore
                  </Button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
      {!revisions.length ? <p className="mt-6 text-sm text-mute">No revisions yet. Use Save revision in the editor.</p> : null}
    </AdminChrome>
  );
}
