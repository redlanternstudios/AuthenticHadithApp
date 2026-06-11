/**
 * AUDIT-061 — Collection visibility contract regression
 *
 * Locks in three KP-approved constants from lib/hadith/visibleCollections.ts.
 * These values are load-bearing: VISIBLE_HADITH_TOTAL matches the App Store
 * listing copy (KP directive 2026-06-10) and Apple reviewers cross-reference it
 * against the home screen. A mismatch is an App Store rejection risk.
 *
 * RULE 037: Changes to these constants require explicit KP sign-off.
 * HARD-001 ALPHA: If any of these tests fail after a PR, the PR changed a
 * locked constant without authorization — revert and get sign-off first.
 */

import {
  HIDDEN_COLLECTION_SLUGS,
  VISIBLE_COLLECTION_COUNT,
  VISIBLE_HADITH_TOTAL,
  isHiddenCollection,
  filterVisibleCollections,
  HIDDEN_COLLECTION_FILTER,
} from '@/lib/hadith/visibleCollections'

// ─────────────────────────────────────────────────────────────────────────────
describe('Collection visibility constants — AUDIT-061 / Rule 037', () => {
  // ── Exact-value locks (KP-approved) ─────────────────────────────────────────
  it('HIDDEN_COLLECTION_SLUGS contains exactly 6 entries', () => {
    expect(HIDDEN_COLLECTION_SLUGS).toHaveLength(6)
  })

  it('VISIBLE_COLLECTION_COUNT equals 2', () => {
    expect(VISIBLE_COLLECTION_COUNT).toBe(2)
  })

  it('VISIBLE_HADITH_TOTAL equals 14444 — matches App Store listing copy', () => {
    expect(VISIBLE_HADITH_TOTAL).toBe(14444)
  })

  // ── Hidden slug membership ───────────────────────────────────────────────────
  it('HIDDEN_COLLECTION_SLUGS contains all six expected slugs', () => {
    const expected = [
      'musnad-ahmad',
      'sunan-abu-dawud',
      'jami-tirmidhi',
      'sunan-nasai',
      'sunan-ibn-majah',
      'muwatta-malik',
    ]
    for (const slug of expected) {
      expect(HIDDEN_COLLECTION_SLUGS).toContain(slug)
    }
  })

  it('Sahih Bukhari and Sahih Muslim are NOT in HIDDEN_COLLECTION_SLUGS', () => {
    expect(HIDDEN_COLLECTION_SLUGS).not.toContain('sahih-bukhari')
    expect(HIDDEN_COLLECTION_SLUGS).not.toContain('sahih-muslim')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('isHiddenCollection()', () => {
  it('returns true for each of the 6 hidden slugs', () => {
    const hiddenSlugs = [
      'musnad-ahmad',
      'sunan-abu-dawud',
      'jami-tirmidhi',
      'sunan-nasai',
      'sunan-ibn-majah',
      'muwatta-malik',
    ]
    for (const slug of hiddenSlugs) {
      expect(isHiddenCollection(slug)).toBe(true)
    }
  })

  it('returns false for Sahih Bukhari and Sahih Muslim (visible collections)', () => {
    expect(isHiddenCollection('sahih-bukhari')).toBe(false)
    expect(isHiddenCollection('sahih-muslim')).toBe(false)
  })

  it('returns false for null input', () => {
    expect(isHiddenCollection(null)).toBe(false)
  })

  it('returns false for undefined input', () => {
    expect(isHiddenCollection(undefined)).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isHiddenCollection('')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('filterVisibleCollections()', () => {
  it('removes all 6 hidden collections from the array', () => {
    const all = [
      { slug: 'sahih-bukhari' },
      { slug: 'sahih-muslim' },
      { slug: 'musnad-ahmad' },
      { slug: 'sunan-abu-dawud' },
      { slug: 'jami-tirmidhi' },
      { slug: 'sunan-nasai' },
      { slug: 'sunan-ibn-majah' },
      { slug: 'muwatta-malik' },
    ]
    const visible = filterVisibleCollections(all)
    expect(visible).toHaveLength(2)
    expect(visible.map((c) => c.slug)).toEqual(
      expect.arrayContaining(['sahih-bukhari', 'sahih-muslim']),
    )
  })

  it('returns [] for null input', () => {
    expect(filterVisibleCollections(null)).toEqual([])
  })

  it('returns [] for undefined input', () => {
    expect(filterVisibleCollections(undefined)).toEqual([])
  })

  it('returns the array unchanged when all slugs are visible', () => {
    const input = [{ slug: 'sahih-bukhari' }, { slug: 'sahih-muslim' }]
    expect(filterVisibleCollections(input)).toHaveLength(2)
  })

  it('returns [] when all slugs are hidden', () => {
    const input = [{ slug: 'musnad-ahmad' }, { slug: 'sunan-abu-dawud' }]
    expect(filterVisibleCollections(input)).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('HIDDEN_COLLECTION_FILTER', () => {
  it('is a non-null, non-empty string when there are hidden slugs', () => {
    // If this fails, the Supabase .not('collection_slug','in',...) filter breaks.
    expect(HIDDEN_COLLECTION_FILTER).not.toBeNull()
    expect(typeof HIDDEN_COLLECTION_FILTER).toBe('string')
    expect((HIDDEN_COLLECTION_FILTER as string).length).toBeGreaterThan(0)
  })

  it('contains all 6 hidden slugs in the filter string', () => {
    const slugs = [
      'musnad-ahmad',
      'sunan-abu-dawud',
      'jami-tirmidhi',
      'sunan-nasai',
      'sunan-ibn-majah',
      'muwatta-malik',
    ]
    for (const slug of slugs) {
      expect(HIDDEN_COLLECTION_FILTER).toContain(slug)
    }
  })
})
