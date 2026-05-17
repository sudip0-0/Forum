export function buildCursorHref(
  pathname: string,
  params: Record<string, string | number | boolean | null | undefined>,
  cursor: string | null,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    searchParams.set(key, String(value));
  }

  if (cursor) {
    searchParams.set("cursor", cursor);
  } else {
    searchParams.delete("cursor");
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function parseSearchCursor(
  value: string | undefined,
): { createdAt: string; id: string } | undefined {
  if (!value) return undefined;

  const [createdAt, id] = value.split("_");
  if (!createdAt || !id) return undefined;

  try {
    const decodedCreatedAt = decodeURIComponent(createdAt);
    const decodedId = decodeURIComponent(id);
    if (Number.isNaN(Date.parse(decodedCreatedAt))) return undefined;
    return { createdAt: decodedCreatedAt, id: decodedId };
  } catch {
    return undefined;
  }
}

export function serializeSearchCursor(cursor: { createdAt: string; id: string } | null): string | null {
  if (!cursor) return null;
  return `${encodeURIComponent(cursor.createdAt)}_${encodeURIComponent(cursor.id)}`;
}
