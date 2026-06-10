export const HIDDEN_COLLECTION_SLUGS: readonly string[] = [
  "musnad-ahmad",
  "sunan-abu-dawud",
  "jami-tirmidhi",
  "sunan-nasai",
  "sunan-ibn-majah",
  "muwatta-malik",
];

// Sahihayn only: Sahih al-Bukhari + Sahih Muslim.
// Headline reflects ACTUAL VIEWABLE hadiths (non-blank english_text), not raw row
// count. Raw rows = 14,444; 212 are blank and filtered from every surface, so the
// honest user-facing total is 14,232. Verified via service-role count 2026-06-09
// (see SYSTEM_RULES Rule 034 — the claim must match production; app is "Authentic Hadith").
export const VISIBLE_COLLECTION_COUNT = 2;
export const VISIBLE_HADITH_TOTAL = 14_232;

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
