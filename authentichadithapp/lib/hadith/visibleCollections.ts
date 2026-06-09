export const HIDDEN_COLLECTION_SLUGS: readonly string[] = [
  "musnad-ahmad",
  "sunan-abu-dawud",
  "jami-tirmidhi",
  "sunan-nasai",
  "sunan-ibn-majah",
  "muwatta-malik",
];

// Sahihayn only: Sahih al-Bukhari (7,277) + Sahih al-Muslim (7,167) = 14,444
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
