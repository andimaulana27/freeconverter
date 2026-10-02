export const STAFF_ROLES = ["super_admin", "editor", "author", "ad_manager"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(role: unknown): role is StaffRole {
  return typeof role === "string" && (STAFF_ROLES as readonly string[]).includes(role);
}

export function readUserRole(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  const role = user?.app_metadata?.role;
  return isStaffRole(role) ? role : null;
}

export function canPublish(role: StaffRole | null) {
  return role === "super_admin" || role === "editor";
}

export function canManageAds(role: StaffRole | null) {
  return role === "super_admin" || role === "ad_manager";
}

export function canManageSecrets(role: StaffRole | null) {
  return role === "super_admin";
}

export function canUseCms(role: StaffRole | null) {
  return role === "super_admin" || role === "editor" || role === "author";
}

export function roleLabel(role: StaffRole) {
  if (role === "super_admin") return "Super admin";
  if (role === "ad_manager") return "Ad manager";
  if (role === "editor") return "Editor";
  return "Author";
}
