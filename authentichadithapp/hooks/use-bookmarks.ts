import { useQuery } from '@tanstack/react-query'
import { BookmarkService } from '../lib/services/bookmark-service'

export function useBookmarks(userId: string | undefined) {
  return useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: async () => {
      if (!userId) return []
      return await BookmarkService.getAll(userId)
    },
    enabled: !!userId,
  })
}
