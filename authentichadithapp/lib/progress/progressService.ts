/**
 * Unified progress service — single source of truth for completion state
 * across stories, lessons, Sunnah practices, courses, and daily hadith.
 *
 * Architecture (FIX-032):
 *
 * 1. Local-first: AsyncStorage is the canonical store. Always works,
 *    works offline, works for unauthenticated users.
 * 2. Best-effort sync: When the user is authenticated AND the relevant
 *    Supabase table exists, completion is mirrored. Sync failure does
 *    NOT block the local write or surface as a redbox.
 * 3. Stable IDs: callers pass slugs, lessonIds, practiceIds — never
 *    display titles. IDs are namespaced by type to avoid collisions.
 * 4. Crash-proof reads: every accessor returns a safe default if the
 *    store is missing, corrupted, or empty. No screen should ever
 *    crash because of progress data shape.
 *
 * This module is consumed via hooks in `hooks/useProgress.ts`. Screens
 * should never read AsyncStorage or query progress tables directly.
 *
 * Extended (Section B#2): per-part progress for stories.
 * StoryPartProgress tracks current_part + parts_completed[] per sahabi/prophet.
 * Local-first; best-effort upsert to sahaba_reading_progress /
 * prophet_reading_progress on advance.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

// ─── Types ─────────────────────────────────────────────────────────

export type CompletionType =
  | 'story'
  | 'lesson'
  | 'sunnah_practice'
  | 'course'
  | 'daily_hadith'

export interface CompletionRecord {
  /** Type of content completed. */
  type: CompletionType
  /** Stable identifier for the item (slug, lessonId, practiceId, etc). */
  id: string
  /** ISO 8601 timestamp of completion (first time marked complete). */
  completedAt: string
  /** Optional metadata captured at completion time. */
  metadata?: Record<string, unknown>
}

export interface ProgressSummary {
  /** Total number of completed items. */
  totalCompleted: number
  /** Per-type breakdown. */
  byType: Record<CompletionType, number>
  /** Most recent completion record, if any. */
  lastCompleted: CompletionRecord | null
  /** Distinct days the user completed something (ISO date strings). */
  activeDays: string[]
}

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  /** Predicate evaluated against the current summary. */
  unlocked: boolean
  /** Optional progress fraction (0-1) for locked badges. */
  progress?: number
}

interface ProgressStoreV1 {
  version: 1
  records: CompletionRecord[]
  lastUpdated: string
}

// ─── Per-part story progress (B#2) ─────────────────────────────────

/**
 * Per-part reading progress for a single story (companion or prophet).
 * Stored separately from the boolean completion records so we never
 * break the existing completion flow.
 */
export interface StoryPartProgress {
  /** 'sahaba' | 'prophet' — matches the Supabase FK column prefix */
  entityKind: 'sahaba' | 'prophet'
  /** Supabase UUID of the sahabi / prophet row (for Supabase sync) */
  entityId: string
  /** Which part the user is currently reading (1-based) */
  currentPart: number
  /** Array of part numbers the user has visited / advanced past */
  partsCompleted: number[]
  /** Whether the whole story is fully done */
  isCompleted: boolean
  /** Whether bookmarked */
  isBookmarked: boolean
  /** Total seconds spent reading (accumulated on each advance) */
  totalTimeSpentSeconds: number
  /** ISO timestamp of last read */
  lastReadAt: string
}

const PART_PROGRESS_KEY = '@authentic_hadith/story_part_progress/v1'

// In-memory cache for part progress: keyed by `${entityKind}::${entityId}`
let partProgressCache: Record<string, StoryPartProgress> | null = null

function partKey(entityKind: 'sahaba' | 'prophet', entityId: string) {
  return `${entityKind}::${entityId}`
}

async function loadPartProgress(): Promise<Record<string, StoryPartProgress>> {
  if (partProgressCache) return partProgressCache
  try {
    const raw = await AsyncStorage.getItem(PART_PROGRESS_KEY)
    if (!raw) {
      partProgressCache = {}
      return partProgressCache
    }
    const parsed = JSON.parse(raw)
    partProgressCache =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, StoryPartProgress>)
        : {}
    return partProgressCache
  } catch {
    partProgressCache = {}
    return partProgressCache
  }
}

async function persistPartProgress(
  store: Record<string, StoryPartProgress>
): Promise<void> {
  try {
    await AsyncStorage.setItem(PART_PROGRESS_KEY, JSON.stringify(store))
  } catch (err) {
    __DEV__ && console.warn('[progressService] persistPartProgress failed:', err)
  }
}

/**
 * Read per-part progress for a story. Returns null if none recorded yet.
 */
export async function getStoryPartProgress(
  entityKind: 'sahaba' | 'prophet',
  entityId: string
): Promise<StoryPartProgress | null> {
  const store = await loadPartProgress()
  return store[partKey(entityKind, entityId)] ?? null
}

/**
 * Advance to a new part (or update bookmarking/completion). Persists locally
 * and fires a best-effort Supabase upsert in the background.
 *
 * @param entityKind  'sahaba' | 'prophet'
 * @param entityId    Supabase UUID of the row
 * @param totalParts  Total part count — used to set is_completed
 * @param nextPart    The part number being navigated TO
 * @param completedPart  The part number just READ (may differ from nextPart on init)
 * @param isBookmarked  Current bookmark state
 */
export async function advanceStoryPart(opts: {
  entityKind: 'sahaba' | 'prophet'
  entityId: string
  totalParts: number
  nextPart: number
  completedPart?: number
  isBookmarked?: boolean
}): Promise<StoryPartProgress> {
  const {
    entityKind,
    entityId,
    totalParts,
    nextPart,
    completedPart,
    isBookmarked = false,
  } = opts
  const store = await loadPartProgress()
  const key = partKey(entityKind, entityId)
  const existing: StoryPartProgress = store[key] ?? {
    entityKind,
    entityId,
    currentPart: 1,
    partsCompleted: [],
    isCompleted: false,
    isBookmarked: false,
    totalTimeSpentSeconds: 0,
    lastReadAt: new Date().toISOString(),
  }

  const partsCompleted = [...existing.partsCompleted]
  if (completedPart !== undefined && !partsCompleted.includes(completedPart)) {
    partsCompleted.push(completedPart)
  }

  const updated: StoryPartProgress = {
    ...existing,
    currentPart: nextPart,
    partsCompleted,
    isCompleted: partsCompleted.length >= totalParts,
    isBookmarked,
    lastReadAt: new Date().toISOString(),
  }

  store[key] = updated
  partProgressCache = store
  await persistPartProgress(store)
  notify()

  // Best-effort Supabase sync — does not block caller
  void syncPartProgressToSupabase(updated)

  return updated
}

/**
 * Toggle the bookmark for a story without changing the current part.
 */
export async function toggleStoryBookmark(
  entityKind: 'sahaba' | 'prophet',
  entityId: string
): Promise<boolean> {
  const store = await loadPartProgress()
  const key = partKey(entityKind, entityId)
  const existing = store[key]
  const newVal = existing ? !existing.isBookmarked : true

  if (existing) {
    store[key] = { ...existing, isBookmarked: newVal }
  } else {
    store[key] = {
      entityKind,
      entityId,
      currentPart: 1,
      partsCompleted: [],
      isCompleted: false,
      isBookmarked: newVal,
      totalTimeSpentSeconds: 0,
      lastReadAt: new Date().toISOString(),
    }
  }
  partProgressCache = store
  await persistPartProgress(store)
  notify()

  void syncPartProgressToSupabase(store[key])
  return newVal
}

async function syncPartProgressToSupabase(progress: StoryPartProgress): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabase/client')
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData?.session?.user?.id
    if (!userId) return

    const table =
      progress.entityKind === 'sahaba'
        ? 'sahaba_reading_progress'
        : 'prophet_reading_progress'
    const fkColumn =
      progress.entityKind === 'sahaba' ? 'sahabi_id' : 'prophet_id'
    const conflictCol =
      progress.entityKind === 'sahaba'
        ? 'user_id,sahabi_id'
        : 'user_id,prophet_id'

    await supabase
      .from(table)
      .upsert(
        {
          user_id: userId,
          [fkColumn]: progress.entityId,
          current_part: progress.currentPart,
          parts_completed: progress.partsCompleted,
          is_completed: progress.isCompleted,
          is_bookmarked: progress.isBookmarked,
          total_time_spent_seconds: progress.totalTimeSpentSeconds,
          last_read_at: progress.lastReadAt,
        },
        { onConflict: conflictCol }
      )
  } catch (err) {
    __DEV__ &&
      console.warn(
        '[progressService] syncPartProgressToSupabase failed (non-fatal):',
        err instanceof Error ? err.message : String(err)
      )
  }
}

// ─── Storage (existing) ────────────────────────────────────────────

const STORAGE_KEY = '@authentic_hadith/progress/v1'

let cachedStore: ProgressStoreV1 | null = null
let loadPromise: Promise<ProgressStoreV1> | null = null

/** In-memory subscribers so hooks can reactively re-render on changes. */
type Listener = () => void
const listeners = new Set<Listener>()

function emptyStore(): ProgressStoreV1 {
  return { version: 1, records: [], lastUpdated: new Date().toISOString() }
}

async function loadStore(): Promise<ProgressStoreV1> {
  if (cachedStore) return cachedStore
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (!raw) {
        cachedStore = emptyStore()
        return cachedStore
      }
      const parsed = JSON.parse(raw)
      // Defensive: any shape mismatch falls back to a fresh empty store
      // rather than crashing readers.
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        parsed.version !== 1 ||
        !Array.isArray(parsed.records)
      ) {
        __DEV__ &&
          console.warn( // __DEV__
            '[progressService] Stored progress shape unexpected; resetting to empty.'
          )
        cachedStore = emptyStore()
        return cachedStore
      }
      cachedStore = parsed as ProgressStoreV1
      return cachedStore
    } catch (err) {
      __DEV__ && console.warn('[progressService] loadStore failed:', err)
      cachedStore = emptyStore()
      return cachedStore
    } finally {
      loadPromise = null
    }
  })()

  return loadPromise
}

async function persistStore(store: ProgressStoreV1): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch (err) {
    __DEV__ && console.warn('[progressService] persistStore failed:', err)
  }
}

function notify() {
  for (const fn of listeners) {
    try {
      fn()
    } catch (err) {
      __DEV__ && console.warn('[progressService] listener threw:', err)
    }
  }
}

function makeKey(type: CompletionType, id: string): string {
  return `${type}::${id}`
}

// ─── Optional Supabase sync (best-effort) ───────────────────────────

/**
 * Mirror a completion to Supabase when possible. NEVER throws — caller
 * does not depend on this for correctness. Tables that may not exist
 * (e.g. `prophet_reading_progress` for guests) are skipped silently.
 */
async function syncCompletionToSupabase(
  record: CompletionRecord
): Promise<void> {
  try {
    // Lazy import to avoid pulling Supabase into modules that don't need it
    // and to keep this service usable in tests without auth context.
    const { supabase } = await import('@/lib/supabase/client')
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData?.session?.user?.id
    if (!userId) return // Guest user — local-only mode is the contract.

    // Fire-and-forget; we don't await the Supabase response on the
    // critical path beyond what's needed for this function.
    if (record.type === 'story') {
      // The schema has TWO progress tables (prophet / sahaba). The id format
      // we receive is a slug — we don't have the prophet/sahabi UUID without
      // a lookup. The legacy screens already write directly to those tables
      // when the user is authenticated, so we only mirror if we can resolve
      // the FK. Best-effort: if the lookup fails or table doesn't exist,
      // we drop the sync silently and rely on local progress.
      const meta = record.metadata as { entityKind?: string; entityId?: string } | undefined
      const entityKind = meta?.entityKind // 'prophet' | 'sahaba'
      const entityId = meta?.entityId
      if (!entityKind || !entityId) return

      const table =
        entityKind === 'prophet' ? 'prophet_reading_progress' : 'sahaba_reading_progress'
      const fkColumn = entityKind === 'prophet' ? 'prophet_id' : 'sahabi_id'

      await supabase
        .from(table)
        .upsert({
          user_id: userId,
          [fkColumn]: entityId,
          is_completed: true,
          updated_at: record.completedAt,
        })
    } else if (record.type === 'lesson') {
      await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: userId,
          lesson_id: record.id,
          is_completed: true,
          completed_at: record.completedAt,
        })
    }
    // sunnah_practice, course, daily_hadith — no canonical table yet.
    // When/if a schema is added, extend here. Local progress remains the
    // source of truth in the meantime.
  } catch (err) {
    // Swallow — sync is best-effort. Local store is canonical.
    __DEV__ &&
      console.warn( // __DEV__
        '[progressService] Supabase sync failed (non-fatal):',
        err instanceof Error ? err.message : String(err)
      )
  }
}

// ─── Public API ────────────────────────────────────────────────────

/**
 * Mark an item complete. Idempotent — calling twice does not duplicate
 * the record. Local write is synchronous-ish (one async storage write).
 * Supabase mirror happens in the background, never blocks the caller.
 */
export async function markComplete(
  type: CompletionType,
  id: string,
  metadata?: Record<string, unknown>
): Promise<CompletionRecord> {
  const store = await loadStore()
  const key = makeKey(type, id)

  // Idempotent: if already complete, return the existing record.
  const existing = store.records.find((r) => makeKey(r.type, r.id) === key)
  if (existing) {
    // Best-effort re-sync in case the prior local write never reached Supabase.
    void syncCompletionToSupabase(existing)
    return existing
  }

  const record: CompletionRecord = {
    type,
    id,
    completedAt: new Date().toISOString(),
    metadata,
  }
  store.records.push(record)
  store.lastUpdated = record.completedAt
  await persistStore(store)
  notify()

  // Background sync — non-blocking.
  void syncCompletionToSupabase(record)

  return record
}

/** Return true if the item has been marked complete locally. */
export async function isComplete(type: CompletionType, id: string): Promise<boolean> {
  const store = await loadStore()
  const key = makeKey(type, id)
  return store.records.some((r) => makeKey(r.type, r.id) === key)
}

/** Synchronous variant — only valid AFTER `loadStore()` has been awaited at least once. */
export function isCompleteSync(type: CompletionType, id: string): boolean {
  if (!cachedStore) return false
  const key = makeKey(type, id)
  return cachedStore.records.some((r) => makeKey(r.type, r.id) === key)
}

/** Return all completion records, optionally filtered by type. */
export async function getCompleted(type?: CompletionType): Promise<CompletionRecord[]> {
  const store = await loadStore()
  if (!type) return [...store.records]
  return store.records.filter((r) => r.type === type)
}

/** Aggregate progress summary used by the achievements / progress screens. */
export async function getProgressSummary(): Promise<ProgressSummary> {
  const store = await loadStore()
  const byType: Record<CompletionType, number> = {
    story: 0,
    lesson: 0,
    sunnah_practice: 0,
    course: 0,
    daily_hadith: 0,
  }
  const dayset = new Set<string>()
  let last: CompletionRecord | null = null

  for (const r of store.records) {
    byType[r.type] = (byType[r.type] || 0) + 1
    const day = r.completedAt.slice(0, 10)
    if (day) dayset.add(day)
    if (!last || r.completedAt > last.completedAt) last = r
  }

  return {
    totalCompleted: store.records.length,
    byType,
    lastCompleted: last,
    activeDays: Array.from(dayset).sort(),
  }
}

// ─── Calculated Badges ─────────────────────────────────────────────

/**
 * Badge eligibility computed entirely from local progress. No backend
 * required. Safe defaults so the badges screen never crashes.
 *
 * Badges escalate naturally as users complete more content. Add new
 * definitions here as the catalog grows.
 */
export async function getBadges(): Promise<BadgeDefinition[]> {
  const summary = await getProgressSummary()
  const stories = summary.byType.story
  const lessons = summary.byType.lesson
  const sunnah = summary.byType.sunnah_practice
  const days = summary.activeDays.length

  const def = (
    id: string,
    name: string,
    description: string,
    icon: string,
    unlocked: boolean,
    progress?: number
  ): BadgeDefinition => ({ id, name, description, icon, unlocked, progress })

  return [
    def('seeker', 'Seeker', 'Begin your journey of learning.', '🌱',
      summary.totalCompleted >= 1,
      Math.min(summary.totalCompleted / 1, 1)),
    def('first_story', 'First Story', 'Complete your first story.', '📖',
      stories >= 1,
      Math.min(stories / 1, 1)),
    def('first_lesson', 'First Lesson', 'Complete your first lesson.', '📚',
      lessons >= 1,
      Math.min(lessons / 1, 1)),
    def('first_sunnah', 'First Sunnah', 'Practice your first Sunnah.', '🕌',
      sunnah >= 1,
      Math.min(sunnah / 1, 1)),
    def('story_5', 'Storyteller', 'Complete 5 stories.', '📚',
      stories >= 5,
      Math.min(stories / 5, 1)),
    def('lesson_5', 'Student', 'Complete 5 lessons.', '🎓',
      lessons >= 5,
      Math.min(lessons / 5, 1)),
    def('sunnah_5', 'Devoted', 'Practice 5 Sunnah practices.', '🌟',
      sunnah >= 5,
      Math.min(sunnah / 5, 1)),
    def('streak_7', '7-Day Streak', 'Engage on 7 different days.', '🔥',
      days >= 7,
      Math.min(days / 7, 1)),
    def('total_25', 'Dedicated', 'Complete 25 items in total.', '🏆',
      summary.totalCompleted >= 25,
      Math.min(summary.totalCompleted / 25, 1)),
  ]
}

// ─── Subscription mechanism for hooks ──────────────────────────────

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Force a fresh read from AsyncStorage. Use this if the store could have
 * been mutated outside the service (rare). Hooks call this on first mount
 * to populate the cache.
 */
export async function refresh(): Promise<void> {
  cachedStore = null
  await loadStore()
  notify()
}

/**
 * Test-only / advanced: wipe local progress. Not exposed in normal UI.
 */
export async function _resetForTesting(): Promise<void> {
  cachedStore = emptyStore()
  await persistStore(cachedStore)
  notify()
}
