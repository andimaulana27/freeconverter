export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "untitled-guide";
}

export function canonicalPathForSlug(slug: string) {
  return `/blog/${slug}`;
}

export function isValidSlug(value: string) {
  return SLUG_PATTERN.test(value) && value.length >= 3 && value.length <= 80;
}
