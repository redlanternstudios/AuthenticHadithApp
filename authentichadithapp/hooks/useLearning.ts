/**
 * Shared learning-path data hooks. Both the path detail screen and the lesson
 * detail screen consume `usePathLessons` so the lesson ORDER is identical
 * everywhere — the Prev/Next sequence can never disagree with the list the user
 * saw. Same queryKey as the path screen, so the lesson screen reuses the cached
 * result with no extra network round-trip.
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Lesson } from '@/types/hadith'
import { getStaticLessonsForPath } from '@/lib/learning/staticLearningContent'

/** Ordered lessons for a path. Falls back to bundled static content. */
export function usePathLessons(pathId: string | null | undefined) {
  return useQuery({
    queryKey: ['path-lessons', pathId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          path_lessons!inner(learning_path_id)
        `)
        .eq('path_lessons.learning_path_id', pathId!)
        .order('order_index')

      if (error) {
        __DEV__ && console.warn('[usePathLessons] embed fetch failed (non-fatal):', error.message)
        return getStaticLessonsForPath(pathId)
      }
      return (data?.length ? data : getStaticLessonsForPath(pathId)) as Lesson[]
    },
    enabled: !!pathId,
  })
}

export interface LessonNeighbors {
  index: number
  total: number
  prev: Lesson | null
  next: Lesson | null
  isFirst: boolean
  isLast: boolean
}

/**
 * Pure resolver for a lesson's position within its path. Returns a safe,
 * all-null neighborhood when the lesson isn't found in the sequence (e.g. a
 * deep-link with no path context) so callers never index out of bounds.
 */
export function getLessonNeighbors(
  lessons: Lesson[] | undefined,
  lessonId: string | null | undefined,
): LessonNeighbors {
  const empty: LessonNeighbors = {
    index: -1,
    total: lessons?.length ?? 0,
    prev: null,
    next: null,
    isFirst: false,
    isLast: false,
  }
  if (!lessons?.length || !lessonId) return empty

  const index = lessons.findIndex((l) => l.id === lessonId)
  if (index === -1) return empty

  return {
    index,
    total: lessons.length,
    prev: index > 0 ? lessons[index - 1] : null,
    next: index < lessons.length - 1 ? lessons[index + 1] : null,
    isFirst: index === 0,
    isLast: index === lessons.length - 1,
  }
}
