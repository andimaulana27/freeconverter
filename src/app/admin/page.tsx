import type { Metadata } from "next";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { requireStaff } from "@/lib/auth/session";
import { canManageSecrets, canPublish, canUseCms, canManageAds } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminHomePage() {
  const session = await requireStaff("/admin");
  const [{ count: placementCount }, { count: profileCount }, { count: secretCount }, { count: draftCount }] =
    await Promise.all([
      session.supabase.from("ad_placements").select("id", { count: "exact", head: true }),
      session.supabase.from("ai_model_profiles").select("id", { count: "exact", head: true }),
      session.supabase.from("integration_secret_refs").select("id", { count: "exact", head: true }),
      session.supabase.from("blog_posts").select("id", { count: "exact", head: true }).neq("status", "published"),
    ]);

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-card border border-line bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Ad placements</p>
          <p className="mt-2 text-2xl font-semibold">{placementCount ?? 0}</p>
        </article>
        <article className="rounded-card border border-line bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Model profiles</p>
          <p className="mt-2 text-2xl font-semibold">{profileCount ?? 0}</p>
        </article>
        <article className="rounded-card border border-line bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Secret refs visible</p>
          <p className="mt-2 text-2xl font-semibold">{secretCount ?? 0}</p>
        </article>
      </section>
      <section className="mt-8 rounded-tile border border-line bg-paper p-6">
        <h2 className="text-base font-semibold">Secure foundation</h2>
        <ul className="mt-4 space-y-2 text-sm text-mute">
          <li>CMS access: {canUseCms(session.role) ? "yes" : "no"}</li>
          <li>Publishing: {canPublish(session.role) ? "yes" : "no"}</li>
          <li>Ads manager: {canManageAds(session.role) ? "yes" : "no"}</li>
          <li>Secret refs: {canManageSecrets(session.role) ? "yes" : "no"}</li>
          <li>Unpublished posts visible to this session: {draftCount ?? 0}</li>
        </ul>
        <p className="mt-4 text-sm text-mute">
          The public guide library is live. The editor, ads manager, and generation workflows land in later phases.
        </p>
      </section>
    </AdminChrome>
  );
}
