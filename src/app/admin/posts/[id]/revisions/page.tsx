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

function revisionSource(value: string) {
  const labels: Record<string, string> = {
    autosave: "Auto-saved from editor",
    manual: "Saved manually",
    restore: "Restored from an earlier version",
    publish: "Saved during publishing",
    schedule: "Saved while scheduling",
  };
  return labels[value] ?? "Saved from editor";
}

function formatRevisionDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function RevisionsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await requireCms(`/admin/posts/${id}/revisions`);
  const [post, revisions] = await Promise.all([fetchPost(session.supabase, id), listRevisions(session.supabase, id)]);
  if (!post) notFound();

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <div className="flex flex-wrap items-end justify-between gap-5 rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile">
        <div>
          <p className="flex items-center gap-2 font-mono text-micro font-bold uppercase text-accent"><span className="h-px w-6 bg-accent" /> Version history</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{post.title}</h1>
          <p className="mt-2 text-sm text-mute">Restore content safely without publishing it.</p>
        </div>
        <ButtonLink href={`/admin/posts/${post.id}`} variant="secondary" size="sm">
          ← Back to editor
        </ButtonLink>
      </div>
      {error ? (
        <p role="alert" className="mt-4 rounded-control border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-ink">
          Restore failed. Reload the editor and try again if another tab saved first.
        </p>
      ) : null}
      <ul className="mt-5 space-y-3">
        {revisions.map((revision, index) => {
          const snapshot = revision.snapshot;
          const title = typeof snapshot.title === "string" ? snapshot.title : post.title;
          const slug = typeof snapshot.slug === "string" ? snapshot.slug : post.slug;
          return (
            <li key={revision.id} className="group rounded-[18px] border border-black/[0.07] bg-white p-5 shadow-drop transition duration-280 hover:border-black/15 hover:shadow-tile">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f4efed] font-mono text-[9px] text-accent">0{index + 1}</span>
                  <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-[10px] leading-5 text-faint" title={`Stored in UTC · ${revision.created_at}`}>
                    {formatRevisionDate(revision.created_at)} · {revisionSource(revision.change_source)}
                  </p>
                  <p className="font-mono text-[9px] text-faint">/{slug}</p>
                  {post.current_revision_id === revision.id ? <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ok">● Current revision</p> : null}
                  </div>
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
                    Restore version
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
