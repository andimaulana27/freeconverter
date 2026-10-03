import type { Metadata } from "next";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { AdsPreviewBoard } from "@/components/cms/AdsPreviewBoard";
import { ButtonLink } from "@/components/ui/Button";
import { listAssignments, listPlacements } from "@/lib/ads/server";
import { requireAds } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Ad placement preview",
  robots: { index: false, follow: false },
};

export default async function AdsPreviewPage() {
  const session = await requireAds("/admin/ads/preview");
  const [placements, assignments] = await Promise.all([
    listPlacements(session.supabase),
    listAssignments(session.supabase),
  ]);

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <div className="flex flex-wrap items-end justify-between gap-5 rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile">
        <div>
          <p className="flex items-center gap-2 font-mono text-micro font-bold uppercase text-accent"><span className="h-px w-6 bg-accent" /> Layout preview</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em]">Placement boundaries</h1>
          <p className="mt-2 max-w-2xl text-sm text-mute">
            Preview reserved frames before activation. Public article previews still keep production ads off.
          </p>
        </div>
        <ButtonLink href="/admin/ads" variant="secondary" size="sm">← Back to ads</ButtonLink>
      </div>
      <div className="mt-6">
        <AdsPreviewBoard placements={placements} assignments={assignments} />
      </div>
    </AdminChrome>
  );
}
