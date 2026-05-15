/**
 * Converts a string to a URL-safe slug.
 * Lowercase, trims, replaces non-alphanumeric runs with hyphens,
 * and strips leading/trailing hyphens.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
