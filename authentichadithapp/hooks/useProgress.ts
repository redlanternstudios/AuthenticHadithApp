/**
 * React hooks over the progress service. All progress-aware screens
 * should consume these — never read AsyncStorage or query Supabase
 * progress tables directly.
 *
 * Pattern: each hook subscribes to the service's notify() so a write
 * from any screen propagates to every other screen on the next render.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  CompletionType,
  CompletionRecord,
  ProgressSummary,
  BadgeDefinition,
  isComplete as svcIsComplete,
  markComplete as svcMarkComplete,
  getCompleted as svcGetCompleted,
  getProgressSummary,
  getBadges,
  subscribe,
} from '@/lib/progress/progressService'

/**
 * Tracks completion status for a single item. Returns the current state
 * and a `markComplete` function that flips it. Idempotent: calling
 * markComplete twice is a no-op after the first.
 */
export function useCompletionStatus(type: CompletionType, id: string | null | undefined) {
  const [isComplete, setIsComplete] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isMarking, setIsMarking] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      if (!id) {
        setIsComplete(false)
        setIsLoading(false)
        return
      }
      try {
        const result = await svcIsComplete(type, id)
        if (!cancelled) setIsComplete(result)
      } catch (err) {
        __DEV__ && console.warn('[useCompletionStatus] read failed:', err)
        if (!cancelled) setIsComplete(false)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    refresh()
    const unsubscribe = subscribe(refresh)

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [type, id])

  const markComplete = useCallback(
    async (metadata?: Record<string, unknown>) => {
      if (!id) return
      setIsMarking(true)
      try {
        await svcMarkComplete(type, id, metadata)
        setIsComplete(true) // optimistic; the subscribe() callback also fires
      } catch (err) {
        __DEV__ && console.warn('[useCompletionStatus] markComplete failed:', err)
      } finally {
        setIsMarking(false)
      }
    },
    [type, id]
  )

  return { isComplete, isLoading, isMarking, markComplete }
}

/** All completion records, optionally filtered by type. Reactive to writes. */
export function useCompletedItems(type?: CompletionType) {
  const [records, setRecords] = useState<CompletionRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      try {
        const result = await svcGetCompleted(type)
        if (!cancelled) setRecords(result)
      } catch (err) {
        __DEV__ && console.warn('[useCompletedItems] read failed:', err)
        if (!cancelled) setRecords([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    refresh()
    const unsubscribe = subscribe(refresh)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [type])

  return { records, isLoading }
}

/** Aggregate progress summary. Reactive. */
export function useProgressSummary() {
  const [summary, setSummary] = useState<ProgressSummary>({
    totalCompleted: 0,
    byType: { story: 0, lesson: 0, sunnah_practice: 0, course: 0, daily_hadith: 0 },
    lastCompleted: null,
    activeDays: [],
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      try {
        const result = await getProgressSummary()
        if (!cancelled) setSummary(result)
      } catch (err) {
        __DEV__ && console.warn('[useProgressSummary] read failed:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    refresh()
    const unsubscribe = subscribe(refresh)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return { summary, isLoading }
}

/** Calculated badges from local progress. Always renders something. */
export function useBadges() {
  const [badges, setBadges] = useState<BadgeDefinition[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      try {
        const result = await getBadges()
        if (!cancelled) setBadges(result)
      } catch (err) {
        __DEV__ && console.warn('[useBadges] read failed:', err)
        if (!cancelled) setBadges([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    refresh()
    const unsubscribe = subscribe(refresh)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return { badges, isLoading }
}
