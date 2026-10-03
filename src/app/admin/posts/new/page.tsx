import type { Metadata } from "next";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { createPost } from "@/app/admin/posts/actions";
import { Button } from "@/components/ui/Button";
import { requireCms } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "New guide",
  robots: { index: false, follow: false },
};

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireCms("/admin/posts/new");
  const { error } = await searchParams;

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <p className="font-mono text-micro uppercase text-faint">CMS</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">New guide</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">Start with a working title. The structured editor opens immediately as a draft.</p>
      {error ? (
        <p role="alert" className="mt-4 rounded-control border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-ink">
          The draft could not be created. Check that the slug is unique and try again.
        </p>
      ) : null}
      <form action={createPost} className="mt-6 max-w-lg space-y-4 rounded-tile border border-line bg-paper p-5">
        <label className="flex flex-col gap-1.5 text-sm text-mute">
          Title
          <input
            name="title"
            required
            minLength={3}
            className="h-10 rounded-control border border-line bg-bone px-3 text-sm text-ink outline-none focus:border-accent focus:shadow-glow"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-mute">
          Slug <span className="text-xs text-faint">optional — generated from the title if empty</span>
          <input
            name="slug"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className="h-10 rounded-control border border-line bg-bone px-3 text-sm text-ink outline-none focus:border-accent focus:shadow-glow"
          />
        </label>
        <Button type="submit">Create draft</Button>
      </form>
    </AdminChrome>
  );
}
