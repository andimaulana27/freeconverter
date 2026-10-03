import type { Metadata } from "next";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { StatusBadge } from "@/components/cms/StatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { canManageAds, canManageSecrets, canPublish, canUseCms } from "@/lib/auth/roles";
import { requireStaff } from "@/lib/auth/session";
import { processDueSchedules } from "@/lib/cms/schedules";
import { listPosts } from "@/lib/cms/server";
import { POST_STATUSES, type PostStatus } from "@/lib/cms/types";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminHomePage() {
  const session = await requireStaff("/admin");
  const cms = canUseCms(session.role);
  const publisher = canPublish(session.role);

  const [posts, scheduleCount, secretCount, placementCount] = await Promise.all([
    cms ? listPosts(session.supabase) : Promise.resolve([]),
    publisher
      ? session.supabase.from("publishing_schedules").select("id", { count: "exact", head: true }).eq("status", "pending")
      : Promise.resolve({ count: 0 }),
    session.supabase.from("integration_secret_refs").select("id", { count: "exact", head: true }),
    session.supabase.from("ad_placements").select("id", { count: "exact", head: true }),
  ]);

  let scheduleRun: { processed: number; failed: number } | null = null;
  if (publisher) {
    try {
      scheduleRun = await processDueSchedules(session.supabase, session.user.id);
    } catch {
      scheduleRun = null;
    }
  }

  const counts = Object.fromEntries(POST_STATUSES.map((status) => [status, posts.filter((post) => post.status === status).length])) as Record<PostStatus, number>;
  const recent = posts.slice(0, 8);

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-micro uppercase text-faint">Content health</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard</h1>
        </div>
        {cms ? (
          <ButtonLink href="/admin/posts/new" variant="primary" size="sm">
            New guide
          </ButtonLink>
        ) : null}
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {POST_STATUSES.map((status) => (
          <article key={status} className="rounded-card border border-line bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">{status}</p>
            <p className="mt-2 text-2xl font-semibold">{counts[status]}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <article className="rounded-card border border-line bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Pending schedules</p>
          <p className="mt-2 text-2xl font-semibold">{scheduleCount.count ?? 0}</p>
          {scheduleRun ? (
            <p className="mt-2 text-xs text-mute">
              Ran due jobs: {scheduleRun.processed} processed, {scheduleRun.failed} failed
            </p>
          ) : null}
        </article>
        <article className="rounded-card border border-line bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Ad placements</p>
          <p className="mt-2 text-2xl font-semibold">{placementCount.count ?? 0}</p>
        </article>
        <article className="rounded-card border border-line bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Secret refs visible</p>
          <p className="mt-2 text-2xl font-semibold">{secretCount.count ?? 0}</p>
        </article>
      </section>

      <section className="mt-8 rounded-tile border border-line bg-paper p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Recent guides</h2>
          {cms ? <ButtonLink href="/admin/posts">Open list</ButtonLink> : null}
        </div>
        {cms ? (
          recent.length ? (
            <ul className="mt-4 divide-y divide-line">
              {recent.map((post) => (
                <li key={post.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{post.title}</p>
                    <p className="text-xs text-mute">/{post.slug}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={post.status} />
                    <ButtonLink href={`/admin/posts/${post.id}`}>Edit</ButtonLink>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-mute">No guides yet. Create the first draft from the post list.</p>
          )
        ) : (
          <p className="mt-4 text-sm text-mute">This role does not have CMS access. Ads manager screens land in Phase 4.</p>
        )}
        <ul className="mt-6 space-y-1 text-sm text-mute">
          <li>CMS access: {cms ? "yes" : "no"}</li>
          <li>Publishing: {publisher ? "yes" : "no"}</li>
          <li>Ads manager: {canManageAds(session.role) ? "yes" : "no"}</li>
          <li>Secret refs: {canManageSecrets(session.role) ? "yes" : "no"}</li>
        </ul>
      </section>
    </AdminChrome>
  );
}
