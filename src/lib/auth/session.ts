import "server-only";

import { redirect } from "next/navigation";
import { readUserRole, type StaffRole } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getStaffSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = readUserRole(user);
  if (!user || !role) return null;

  const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return {
    supabase,
    user,
    role,
    email: user.email ?? "",
    currentAal: assurance.data?.currentLevel ?? "aal1",
    nextAal: assurance.data?.nextLevel ?? "aal1",
  };
}

export async function requireStaff(nextPath = "/admin"): Promise<{
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: NonNullable<Awaited<ReturnType<typeof getStaffSession>>>["user"];
  role: StaffRole;
  email: string;
  currentAal: string;
  nextAal: string;
}> {
  const session = await getStaffSession();
  if (!session) redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  if (session.nextAal === "aal2" && session.currentAal !== "aal2") {
    redirect(`/admin/mfa?next=${encodeURIComponent(nextPath)}`);
  }
  return session;
}
