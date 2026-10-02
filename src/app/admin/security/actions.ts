"use server";

import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";

const MIN_PASSWORD_LENGTH = 12;

export async function changeAdminPassword(formData: FormData) {
  const session = await requireStaff("/admin/security");
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect("/admin/security?status=missing");
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    redirect("/admin/security?status=weak");
  }

  if (newPassword !== confirmPassword) {
    redirect("/admin/security?status=mismatch");
  }

  if (currentPassword === newPassword) {
    redirect("/admin/security?status=unchanged");
  }

  const signIn = await session.supabase.auth.signInWithPassword({
    email: session.email,
    password: currentPassword,
  });
  if (signIn.error) {
    redirect("/admin/security?status=current-invalid");
  }

  const updated = await session.supabase.auth.updateUser({ password: newPassword });
  if (updated.error) {
    redirect("/admin/security?status=failed");
  }

  redirect("/admin/security?status=updated");
}
