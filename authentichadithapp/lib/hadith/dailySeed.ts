// lib/hadith/dailySeed.ts
// Single source of truth for daily hadith seed calculation.
// All screens must import from here — never inline the hash.

/**
 * Returns a stable UTC date string for today (YYYY-M-D format matching
 * the existing hash implementations). Using UTC eliminates web/mobile
 * timezone mismatch near midnight.
 */
export function getUTCDateString(date?: Date): string {
  const d = date ?? new Date()
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`
}

/**
 * Returns a non-negative integer seed for a given date.
 * Stable for the same UTC calendar day regardless of device timezone.
 */
export function getDailySeed(date?: Date): number {
  const dateStr = getUTCDateString(date)
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Returns the 0-based index into a collection of `max` items for today.
 */
export function getDailyIndex(max: number, date?: Date): number {
  return getDailySeed(date) % max
}
