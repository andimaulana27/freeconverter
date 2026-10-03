import type { Metadata } from "next";
import Link from "next/link";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { StatusBadge, statusLabel } from "@/components/cms/StatusBadge";
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
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
      <div className="flex flex-wrap items-end justify-between gap-5 rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile">
        <div>
          <p className="flex items-center gap-2 font-mono text-micro font-bold uppercase text-accent">
            <span className="h-px w-6 bg-accent" />
            Editorial library
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em]">Guides</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-mute">Shape, review, and publish useful content without losing sight of its status.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-faint">{posts.length} results</span>
          <ButtonLink href="/admin/posts/new" variant="primary" size="sm">New guide <span aria-hidden>→</span></ButtonLink>
        </div>
      </div>

      <form className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#181412] p-3 shadow-panel-dark" method="get">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search title or slug"
          className="h-11 min-w-[12rem] flex-1 rounded-control border border-white/10 bg-white/[0.07] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent-light focus:shadow-[0_0_0_3px_rgba(255,106,100,0.13)]"
        />
        <select name="status" defaultValue={status} className="h-11 rounded-control border border-white/10 bg-[#2a2421] px-3 text-sm text-white/75 outline-none focus:border-accent-light">
          <option value="all">All statuses</option>
          {POST_STATUSES.map((item) => (
            <option key={item} value={item}>
              {statusLabel(item)}
            </option>
          ))}
        </select>
        <select name="topic" defaultValue={params.topic ?? ""} className="h-11 rounded-control border border-white/10 bg-[#2a2421] px-3 text-sm text-white/75 outline-none focus:border-accent-light">
          <option value="">All topics</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-control bg-accent px-5 text-sm font-semibold text-white shadow-action transition hover:-translate-y-0.5 hover:bg-accent-ink">
          Apply filter
        </button>
      </form>

      {posts.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post, index) => (
            <Link
              key={post.id}
              href={`/admin/posts/${post.id}`}
              className="group relative isolate flex min-h-64 flex-col overflow-hidden rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-drop outline-none transition duration-280 hover:-translate-y-1 hover:border-black/15 hover:shadow-tile focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="pointer-events-none absolute -right-10 -top-10 -z-10 h-28 w-28 rounded-full bg-accent-soft/0 transition duration-500 group-hover:bg-accent-soft" aria-hidden />
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#e6dedb] bg-[#f7f3f1] text-accent transition duration-280 group-hover:-rotate-3 group-hover:bg-accent group-hover:text-white">
                  <GuideCardIcon />
                </span>
                <StatusBadge status={post.status} />
              </div>

              <div className="mt-6">
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-faint">
                  Guide {String(index + 1).padStart(2, "0")} · {post.topic?.name ?? "No topic"}
                </p>
                <h2 className="mt-2 line-clamp-2 text-lg font-semibold leading-6 tracking-[-0.025em] text-ink">{post.title}</h2>
                <p className="mt-2 truncate font-mono text-[9px] text-faint">/{post.slug}</p>
              </div>

              <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-faint">Last updated</p>
                  <p className="mt-1 text-xs text-mute" title={`Stored in UTC · ${post.updated_at}`}>{formatDate(post.updated_at)}</p>
                </div>
                <span className="flex items-center gap-2 text-xs font-semibold text-accent transition group-hover:translate-x-0.5">
                  Open editor <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[22px] border border-dashed border-[#d9d0cb] bg-white px-6 py-14 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent"><GuideCardIcon /></span>
          <p className="mt-4 text-sm font-semibold text-ink">No matching guides</p>
          <p className="mt-2 text-xs text-mute">Adjust the filters or create a new draft.</p>
          <ButtonLink href="/admin/posts/new" variant="primary" size="sm" className="mt-4">Create a guide</ButtonLink>
        </div>
      )}
    </AdminChrome>
  );
}

function GuideCardIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 2.75h8l4 4v10.5H4z" strokeLinejoin="round" />
      <path d="M12 2.75V7h4M7 10h6M7 13h6M7 16h3" strokeLinecap="round" />
    </svg>
  );
}
