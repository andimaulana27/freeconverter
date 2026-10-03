import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { approveLibraryAsset, deleteLibraryAsset, updateLibraryAsset } from "@/app/admin/media/actions";
import { Button, ButtonLink } from "@/components/ui/Button";
import { canPublish } from "@/lib/auth/roles";
import { requireCms } from "@/lib/auth/session";
import { fetchMediaAsset } from "@/lib/cms/server";

export const metadata: Metadata = {
  title: "Media asset",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function AdminMediaDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireCms(`/admin/media/${id}`);
  const asset = await fetchMediaAsset(session.supabase, id);
  if (!asset) notFound();
  const publisher = canPublish(session.role);

  async function saveMeta(formData: FormData) {
    "use server";
    const result = await updateLibraryAsset({
      id,
      altText: String(formData.get("altText") ?? ""),
      focalX: Number(formData.get("focalX") ?? 0.5),
      focalY: Number(formData.get("focalY") ?? 0.5),
    });
    redirect(result.ok ? `/admin/media/${id}` : `/admin/media/${id}?error=${encodeURIComponent(result.error)}`);
  }

  async function approve() {
    "use server";
    const result = await approveLibraryAsset(id);
    redirect(result.ok ? `/admin/media/${id}` : `/admin/media/${id}?error=${encodeURIComponent(result.error)}`);
  }

  async function remove() {
    "use server";
    const result = await deleteLibraryAsset(id);
    if (result.ok) redirect("/admin/media");
    redirect(`/admin/media/${id}?error=${encodeURIComponent(result.error)}`);
  }

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <ButtonLink href="/admin/media" variant="ghost" size="sm">← Library</ButtonLink>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Media file</h1>
          <p className="mt-2 text-sm text-mute">{asset.path}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <section className="rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-tile">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.url} alt={asset.alt_text || "Library image"} className="aspect-[1.91/1] w-full rounded-card object-cover" />
          <p className="mt-3 text-xs text-mute">
            {asset.source} · {asset.mime_type || "unknown type"} · {asset.approved_at ? "Approved" : "Needs approval"}
          </p>
        </section>

        <section className="rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-tile">
          <form action={saveMeta} className="space-y-4">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-mute">
              Alt text
              <input name="altText" defaultValue={asset.alt_text ?? ""} className="h-11 rounded-control border border-[#ddd6d2] px-3 text-sm" />
            </label>
            <label className="text-xs text-mute">
              Horizontal crop focus
              <input type="range" name="focalX" min="0" max="1" step="0.05" defaultValue={asset.focal_x} className="mt-2 w-full" />
            </label>
            <label className="text-xs text-mute">
              Vertical crop focus
              <input type="range" name="focalY" min="0" max="1" step="0.05" defaultValue={asset.focal_y} className="mt-2 w-full" />
            </label>
            <Button type="submit" size="sm">Save details</Button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {publisher && !asset.approved_at ? (
              <form action={approve}>
                <Button type="submit" size="sm">Approve</Button>
              </form>
            ) : null}
            <form action={remove}>
              <Button type="submit" variant="ghost" size="sm">Delete</Button>
            </form>
          </div>
          {asset.usage.length ? (
            <div className="mt-6">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">Used on</p>
              <ul className="mt-2 space-y-2">
                {asset.usage.map((item) => (
                  <li key={`${item.postId}-${item.role}`}>
                    <Link href={`/admin/posts/${item.postId}`} className="text-sm font-semibold text-accent">
                      {item.title}
                    </Link>
                    <span className="ml-2 text-[10px] uppercase text-faint">{item.role}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-6 text-xs text-mute">Not attached to a guide yet.</p>
          )}
        </section>
      </div>
    </AdminChrome>
  );
}
