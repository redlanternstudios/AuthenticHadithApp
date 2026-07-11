/**
 * Shared learning-path data hooks. Both the path detail screen and the lesson
 * detail screen consume `usePathLessons` so the lesson ORDER is identical
 * everywhere — the Prev/Next sequence can never disagree with the list the user
 * saw. Same queryKey as the path screen, so the lesson screen reuses the cached
 * result with no extra network round-trip.
 *
 * V2: lessons come from Supabase (`learning_modules` -> `learning_lessons`),
 * ordered by module sort_order then lesson sort_order, and flattened so the
 * Prev/Next walk is a single linear sequence across the whole path.
 */
import { useQuery } from '@tanstack/react-query'
import { Lesson } from '@/types/hadith'
import { supabase } from '@/lib/supabase/client'
import { sanitizeLessonForSahihayn } from '@/lib/learning/sahihaynContentGuard'

/** Ordered lessons for a path, served from Supabase (modules -> lessons). */
export function usePathLessons(pathId: string | null | undefined) {
  return useQuery({
    queryKey: ['path-lessons', pathId],
    queryFn: async (): Promise<Lesson[]> => {
      if (!pathId) return []

      const { data: modules, error: modErr } = await supabase
        .from('learning_modules')
        .select('id, title, sort_order')
        .eq('path_id', pathId)
        .order('sort_order', { ascending: true })
      if (modErr) {
        __DEV__ && console.error('[useLearning] modules query failed:', modErr)
        throw modErr
      }
      if (!modules?.length) return []

      const moduleOrder = new Map<string, number>(modules.map((m, i) => [m.id, i]))
      const moduleTitle = new Map<string, string>(modules.map((m) => [m.id, m.title]))

      const { data: rows, error: lesErr } = await supabase
        .from('learning_lessons')
        .select('id, module_id, title, description, content_markdown, estimated_minutes, sort_order, has_quiz')
        .in('module_id', modules.map((m) => m.id))
        .order('sort_order', { ascending: true })
      if (lesErr) {
        __DEV__ && console.error('[useLearning] lessons query failed:', lesErr)
        throw lesErr
      }

      const ordered = (rows ?? []).slice().sort((a, b) => {
        const mo = (moduleOrder.get(a.module_id) ?? 0) - (moduleOrder.get(b.module_id) ?? 0)
        return mo !== 0 ? mo : (a.sort_order ?? 0) - (b.sort_order ?? 0)
      })

      return ordered.map((r, i) => sanitizeLessonForSahihayn({
        id: r.id,
        title: r.title,
        description: r.description ?? '',
        content: r.content_markdown ?? undefined,
        order_index: i,
        estimated_minutes: r.estimated_minutes ?? 0,
        created_at: '',
        module_id: r.module_id,
        module_title: moduleTitle.get(r.module_id) ?? '',
        has_quiz: r.has_quiz ?? false,
      }))
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
