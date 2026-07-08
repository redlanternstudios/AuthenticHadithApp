export const HIDDEN_COLLECTION_SLUGS: readonly string[] = [
  "musnad-ahmad",
  "sunan-abu-dawud",
  "jami-tirmidhi",
  "sunan-nasai",
  "sunan-ibn-majah",
  "muwatta-malik",
];

export const VISIBLE_COLLECTION_SLUGS: readonly string[] = [
  "sahih-bukhari",
  "sahih-muslim",
];

// Sahihayn only: Sahih al-Bukhari + Sahih Muslim.
// Headline is the CORPUS total (raw Bukhari+Muslim rows = 14,444) so it matches the
// App Store listing copy exactly (KP directive 2026-06-10 — the reviewer
// cross-references the listing against the home screen). NOTE: 212 of those rows
// have blank english_text and are filtered from browse surfaces; actual viewable
// is 14,232. Open integrity item: backfill the 212 blank translations so
// corpus == viewable.
export const VISIBLE_COLLECTION_COUNT = 2;
export const VISIBLE_HADITH_TOTAL = 14_444;

export function isHiddenCollection(slug: string | null | undefined): boolean {
  return !!slug && HIDDEN_COLLECTION_SLUGS.includes(slug);
}

export const HIDDEN_COLLECTION_FILTER: string | null =
  HIDDEN_COLLECTION_SLUGS.length > 0 ? `(${HIDDEN_COLLECTION_SLUGS.join(",")})` : null;

export function filterVisibleCollections<T extends { slug?: string | null }>(
  rows: T[] | null | undefined,
): T[] {
  if (!rows) return [];
  return rows.filter((row) => !isHiddenCollection(row?.slug));
}
