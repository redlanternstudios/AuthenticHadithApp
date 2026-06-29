// Shared progress state for seed operations
// This is NOT a server action file -- it's a shared module imported by both
// the server action and the SSE route handler.

export type SeedProgress = {
  collectionSlug: string
  phase: "fetching" | "books" | "hadiths" | "backfill" | "totals" | "done" | "error"
  message: string
  booksTotal: number
  booksProcessed: number
  hadithsTotal: number
  hadithsInserted: number
  hadithsUpdated: number
  errors: string[]
  startedAt: number
}

const progressMap = new Map<string, SeedProgress>()

export function getProgress(slug: string): SeedProgress | undefined {
  return progressMap.get(slug)
}

export function getAllProgress(): Record<string, SeedProgress> {
  return Object.fromEntries(progressMap)
}

export function setProgress(slug: string, progress: SeedProgress) {
  progressMap.set(slug, progress)
}

export function createProgress(slug: string): SeedProgress {
  const progress: SeedProgress = {
    collectionSlug: slug,
    phase: "fetching",
    message: `Starting ${slug}...`,
    booksTotal: 0,
    booksProcessed: 0,
    hadithsTotal: 0,
    hadithsInserted: 0,
    hadithsUpdated: 0,
    errors: [],
    startedAt: Date.now(),
  }
  progressMap.set(slug, progress)
  return progress
}
