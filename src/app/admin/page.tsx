import type { Metadata } from "next";
import Link from "next/link";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { StatusBadge } from "@/components/cms/StatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { canManageAds, canManageSecrets, canPublish, canUseCms } from "@/lib/auth/roles";
import { requireStaff } from "@/lib/auth/session";
import { processDueSchedules } from "@/lib/cms/schedules";
import { listPosts } from "@/lib/cms/server";
import { POST_STATUSES, type PostStatus } from "@/lib/cms/types";

const STATUS_DETAILS: Record<PostStatus, { label: string; note: string }> = {
  draft: { label: "Drafts", note: "Still being written" },
  review: { label: "In review", note: "Waiting for approval" },
  scheduled: { label: "Scheduled", note: "Ready for timed release" },
  published: { label: "Published", note: "Live for readers" },
  archived: { label: "Archived", note: "Stored, not public" },
};

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
  const totalPosts = posts.length;
  const publishedPercent = totalPosts ? Math.round((counts.published / totalPosts) * 100) : 0;

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <section className="group relative isolate overflow-hidden rounded-[26px] border border-white/10 bg-[#181412] p-6 text-white shadow-panel-dark sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 -z-20 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:46px_46px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[34rem] opacity-35 [background-image:radial-gradient(circle,rgba(255,106,100,0.7)_1px,transparent_1.2px)] [background-size:11px_11px] [mask-image:linear-gradient(to_left,black,transparent)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full border-[38px] border-white/[0.035] transition duration-700 group-hover:scale-105" aria-hidden />

        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="flex items-center gap-3 font-mono text-micro font-bold uppercase text-accent-light">
              <span className="h-px w-7 bg-accent-light" />
              Operations overview
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-none tracking-[-0.055em] sm:text-5xl">
              Manage content and ads
              <br />
              from one clear workspace.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/48">
              See what needs attention, open the right workspace, and move each item to its next step.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManageAds(session.role) ? (
              <ButtonLink href="/admin/ads" variant="secondary" size="sm" className="border-white/10 bg-white/[0.06] text-white hover:border-white/20 hover:bg-white/10">
                Ads manager
              </ButtonLink>
            ) : null}
            {cms ? (
              <>
                <ButtonLink href="/admin/generate" variant="secondary" size="sm" className="border-white/10 bg-white/[0.06] text-white hover:border-white/20 hover:bg-white/10">
                  Generate
                </ButtonLink>
                <ButtonLink href="/admin/growth" variant="secondary" size="sm" className="border-white/10 bg-white/[0.06] text-white hover:border-white/20 hover:bg-white/10">
                  Growth
                </ButtonLink>
                <ButtonLink href="/admin/posts/new" variant="primary" size="sm">
                  New guide <span aria-hidden>→</span>
                </ButtonLink>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-9 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          <DashboardSummaryCard
            label="All guides"
            value={totalPosts}
            note={`${publishedPercent}% are currently public`}
            href={cms ? "/admin/posts" : undefined}
            action="Open guides"
          />
          <DashboardSummaryCard
            label="Scheduled actions"
            value={scheduleCount.count ?? 0}
            note={scheduleRun ? `${scheduleRun.processed} due actions processed` : "Publishing queue is monitored"}
            href={cms ? "/admin/posts?status=scheduled" : undefined}
            action="View schedule"
          />
          <DashboardSummaryCard
            label="Ad placements"
            value={placementCount.count ?? 0}
            note="Reserved slots across public pages"
            href={canManageAds(session.role) ? "/admin/ads" : undefined}
            action="Manage ads"
          />
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {POST_STATUSES.map((status, index) => {
          const content = (
            <>
              <div className="flex items-center justify-between">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f4efed] font-mono text-[9px] text-accent">0{index + 1}</span>
                <span className={`h-1.5 w-8 rounded-full ${status === "published" ? "bg-[#55d69a]" : status === "review" ? "bg-accent" : "bg-[#d8d0cc]"}`} />
              </div>
              <p className="mt-5 text-2xl font-semibold tracking-[-0.04em]">{counts[status]}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.13em] text-ink">{STATUS_DETAILS[status].label}</p>
              <p className="mt-1 text-[10px] text-faint">{STATUS_DETAILS[status].note}</p>
              {cms ? <span className="mt-4 block text-[10px] font-semibold text-accent opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">View items →</span> : null}
            </>
          );
          const className = "group rounded-2xl border border-black/[0.07] bg-white p-4 shadow-drop outline-none transition duration-280 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-tile focus-visible:ring-2 focus-visible:ring-accent";
          return cms ? (
            <Link key={status} href={`/admin/posts?status=${status}`} className={className}>
              {content}
            </Link>
          ) : (
            <article key={status} className={className}>{content}</article>
          );
        })}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(19rem,0.6fr)]">
        <section className="overflow-hidden rounded-[22px] border border-black/[0.07] bg-white shadow-tile">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-accent">Recent activity</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em]">Latest guides</h2>
            </div>
            {cms ? <ButtonLink href="/admin/posts" variant="secondary" size="sm">View library</ButtonLink> : null}
          </div>
          {cms ? (
            recent.length ? (
              <ul className="divide-y divide-line">
                {recent.map((post, index) => (
                  <li key={post.id}>
                    <Link href={`/admin/posts/${post.id}`} className="group/row flex flex-wrap items-center justify-between gap-3 px-5 py-4 outline-none transition hover:bg-[#faf7f5] focus-visible:bg-accent-soft sm:px-6">
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="font-mono text-[9px] text-faint">0{index + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">{post.title}</p>
                          <p className="mt-1 truncate font-mono text-[9px] text-faint">/{post.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={post.status} />
                        <span className="text-[10px] font-semibold text-accent transition group-hover/row:translate-x-0.5">Edit →</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-14 text-center">
                <p className="text-sm font-semibold">No guides yet</p>
                <p className="mt-2 text-xs text-mute">Create the first draft to start the editorial flow.</p>
              </div>
            )
          ) : (
            <p className="px-6 py-10 text-sm text-mute">This role does not have CMS access.</p>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-tile">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-accent">Recommended next</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em]">What needs attention?</h2>
            <div className="mt-4 space-y-2">
              {cms ? (
                <>
                  <QuickAction href="/admin/posts?status=review" label="Review submitted guides" count={counts.review} />
                  <QuickAction href="/admin/posts?status=draft" label="Continue unfinished drafts" count={counts.draft} />
                  <QuickAction href="/admin/posts?status=scheduled" label="Check scheduled releases" count={counts.scheduled} />
                </>
              ) : canManageAds(session.role) ? (
                <QuickAction href="/admin/ads" label="Review creatives and placements" count={placementCount.count ?? 0} />
              ) : (
                <p className="rounded-xl bg-[#f7f4f2] px-3 py-3 text-xs leading-5 text-mute">No action is required for your current role.</p>
              )}
            </div>
          </section>

          <section className="rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-tile">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-accent">Your access</p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em]">What you can manage</h2>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e7f8ef] text-[#16885c]">
                <DashboardShieldIcon />
              </span>
            </div>
            <ul className="mt-5 space-y-2">
              {[
                ["Create and edit guides", cms],
                ["Publish guides", publisher],
                ["Manage ads", canManageAds(session.role)],
                ["Manage integrations", canManageSecrets(session.role)],
              ].map(([label, allowed]) => (
                <li key={String(label)} className="flex items-center justify-between rounded-xl bg-[#f7f4f2] px-3 py-2.5">
                  <span className="text-xs text-mute">{label}</span>
                  <span className={`font-mono text-[8px] font-bold uppercase ${allowed ? "text-ok" : "text-faint"}`}>{allowed ? "Enabled" : "Locked"}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[22px] border border-black/[0.07] bg-[#eee8e4] p-5">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-faint">Integrations</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold tracking-[-0.04em]">{secretCount.count ?? 0}</p>
                <p className="mt-1 text-xs text-mute">Private service connections available to your role</p>
              </div>
              <span className="font-mono text-[8px] uppercase tracking-[0.13em] text-ok">Available</span>
            </div>
          </section>
        </div>
      </div>
    </AdminChrome>
  );
}

function DashboardSummaryCard({
  label,
  value,
  note,
  href,
  action,
}: {
  label: string;
  value: number;
  note: string;
  href?: string;
  action: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">{label}</p>
        <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#55d69a]" />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-white/42">{note}</p>
      {href ? <span className="mt-4 block text-[10px] font-semibold text-accent-light opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">{action} →</span> : null}
    </>
  );
  const className = "group block bg-[#1f1a18]/90 p-5 text-white outline-none transition duration-280 hover:bg-white/[0.08] focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-light";
  return href ? <Link href={href} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}

function QuickAction({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <Link href={href} className="group flex items-center justify-between gap-3 rounded-xl bg-[#f7f4f2] px-3 py-3 outline-none transition hover:bg-[#eee8e4] focus-visible:ring-2 focus-visible:ring-accent">
      <span className="text-xs font-medium text-ink">{label}</span>
      <span className="flex items-center gap-2">
        <span className="grid min-w-6 place-items-center rounded-full bg-white px-1.5 py-1 font-mono text-[9px] text-accent shadow-drop">{count}</span>
        <span className="text-xs text-faint transition group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  );
}

function DashboardShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M10 2.75 16 5v4.6c0 3.6-2.4 6.3-6 7.75-3.6-1.45-6-4.15-6-7.75V5z" strokeLinejoin="round" />
      <path d="m7.5 10 1.7 1.7 3.6-3.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
