// Single source of truth for which collections ship to users in the current release.
//
// v1: Musnad Ahmad is HIDDEN. The nq production table holds only 393 of its ~28k
// hadiths (a partial seed). It is internally consistent (declared = actual = 393,
// 100% Arabic) so it would not read as "broken," but it is visibly thin next to
// Bukhari's 7,277 and would undercut credibility for knowledgeable users.
//
// To re-enable in v1.1: re-seed the full Musnad Ahmad corpus into nq, then remove
// its slug from HIDDEN_COLLECTION_SLUGS below. No other code changes required.

export const HIDDEN_COLLECTION_SLUGS: readonly string[] = ['musnad-ahmad'];

// Displayed totals for the 7 shipping collections (31,886 total - 393 Musnad Ahmad).
export const VISIBLE_COLLECTION_COUNT = 7;
export const VISIBLE_HADITH_TOTAL = 31_493;

export function isHiddenCollection(slug: string | null | undefined): boolean {
  return !!slug && HIDDEN_COLLECTION_SLUGS.includes(slug);
}

// PostgREST "in"-list for excluding hidden-collection hadiths from a `hadiths`
// query, e.g. `query.not('collection_slug', 'in', HIDDEN_COLLECTION_FILTER)`.
// null when nothing is hidden (v1.1), so callers skip the filter cleanly instead
// of emitting an invalid `in.()`. To re-enable a collection in v1.1, remove its
// slug from HIDDEN_COLLECTION_SLUGS above; every call site goes live with no
// further edits.
export const HIDDEN_COLLECTION_FILTER: string | null =
  HIDDEN_COLLECTION_SLUGS.length > 0 ? `(${HIDDEN_COLLECTION_SLUGS.join(',')})` : null;

// Drop hidden collections from any list of rows that carry a `slug` field.
export function filterVisibleCollections<T extends { slug?: string | null }>(
  rows: T[] | null | undefined,
): T[] {
  if (!rows) return [];
  return rows.filter((row) => !isHiddenCollection(row?.slug));
}
