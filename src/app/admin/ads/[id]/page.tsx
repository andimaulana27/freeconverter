import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { AdCreativeEditor } from "@/components/cms/AdCreativeEditor";
import { fetchAdsenseClientId, fetchCreative, listAssignments, listPlacements } from "@/lib/ads/server";
import { requireAds } from "@/lib/auth/session";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Edit ad creative",
  robots: { index: false, follow: false },
};

export default async function EditAdCreativePage({ params }: Props) {
  const { id } = await params;
  const session = await requireAds(`/admin/ads/${id}`);
  const [creative, placements, assignments, globalClient] = await Promise.all([
    fetchCreative(session.supabase, id),
    listPlacements(session.supabase),
    listAssignments(session.supabase),
    fetchAdsenseClientId(session.supabase),
  ]);
  if (!creative) notFound();

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <AdCreativeEditor
        creative={creative}
        placements={placements}
        assignments={assignments}
        globalClient={globalClient}
      />
    </AdminChrome>
  );
}
