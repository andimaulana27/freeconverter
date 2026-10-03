import type { Metadata } from "next";
import Link from "next/link";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { uploadLibraryAsset } from "@/app/admin/media/actions";
import { Button } from "@/components/ui/Button";
import { requireCms } from "@/lib/auth/session";
import { listMediaAssets } from "@/lib/cms/server";
import { MEDIA_SOURCES, type MediaSource } from "@/lib/cms/types";

export const metadata: Metadata = {
  title: "Media library",
  robots: { index: false, follow: false },
};

function isSource(value: string | undefined): value is MediaSource {
  return Boolean(value && MEDIA_SOURCES.includes(value as MediaSource));
}

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; approved?: string; q?: string; uploaded?: string; error?: string }>;
}) {
  const session = await requireCms("/admin/media");
  const params = await searchParams;
  const source = isSource(params.source) ? params.source : "all";
  const approved = params.approved === "yes" || params.approved === "no" ? params.approved : "all";
  const assets = await listMediaAssets(session.supabase, { source, approved, q: params.q?.trim() });

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <div className="flex flex-wrap items-end justify-between gap-5 rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile">
        <div>
          <p className="flex items-center gap-2 font-mono text-micro font-bold uppercase text-accent">
            <span className="h-px w-6 bg-accent" />
            Shared files
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em]">Media library</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-mute">
            Reuse covers and illustrations across guides. Approval still belongs to publishers.
          </p>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-faint">{assets.length} files</span>
      </div>

      {params.uploaded ? (
        <p className="mt-4 text-sm text-ok">File added to the library.</p>
      ) : null}
      {params.error ? (
        <p role="alert" className="mt-4 text-sm text-accent">{params.error}</p>
      ) : null}

      <form action={uploadLibraryAsset} className="mt-5 grid gap-3 rounded-[18px] border border-white/10 bg-[#181412] p-4 text-white shadow-panel-dark sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.6fr)_auto]">
        <label className="text-xs text-white/50">
          Image file
          <input name="file" type="file" required accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml" className="mt-2 block w-full text-sm text-white" />
        </label>
        <label className="text-xs text-white/50">
          Alt text
          <input name="altText" required minLength={12} placeholder="Describe the image" className="mt-2 h-11 w-full rounded-control border border-white/10 bg-white/[0.07] px-3 text-sm text-white outline-none" />
        </label>
        <div className="flex items-end">
          <Button type="submit" size="sm">Upload</Button>
        </div>
      </form>

      <form className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-black/[0.07] bg-white p-3" method="get">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Search alt text or path" className="h-11 min-w-[12rem] flex-1 rounded-control border border-[#ddd6d2] px-4 text-sm outline-none focus:border-accent" />
        <select name="source" defaultValue={source} className="h-11 rounded-control border border-[#ddd6d2] px-3 text-sm">
          <option value="all">All sources</option>
          {MEDIA_SOURCES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select name="approved" defaultValue={approved} className="h-11 rounded-control border border-[#ddd6d2] px-3 text-sm">
          <option value="all">Any approval</option>
          <option value="yes">Approved</option>
          <option value="no">Needs approval</option>
        </select>
        <button type="submit" className="h-11 rounded-control bg-accent px-5 text-sm font-semibold text-white">Filter</button>
      </form>

      {assets.length ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <li key={asset.id}>
              <Link href={`/admin/media/${asset.id}`} className="group block overflow-hidden rounded-[18px] border border-black/[0.07] bg-white shadow-drop outline-none transition hover:-translate-y-0.5 hover:border-black/15 hover:shadow-tile focus-visible:ring-2 focus-visible:ring-accent">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt={asset.alt_text || "Library image"} className="aspect-[1.91/1] w-full object-cover" />
                <div className="p-4">
                  <p className="truncate text-sm font-semibold">{asset.alt_text || asset.path}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-faint">
                    {asset.source} · {asset.approved_at ? "Approved" : "Needs approval"} · {asset.usage.length} guides
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-center text-sm text-mute">No media files match these filters.</p>
      )}
    </AdminChrome>
  );
}
