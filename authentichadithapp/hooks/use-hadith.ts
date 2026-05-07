import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import { BookmarkService } from '../lib/services/bookmark-service'

export function useHadith(id: string, userId: string | undefined) {
  const queryClient = useQueryClient()

  // Fetch hadith details
  const hadithQuery = useQuery({
    queryKey: ['hadith', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hadiths')
        .select(`
          *,
          collection:collections(*),
          book:books(*)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  // Check if hadith is bookmarked
  const bookmarkQuery = useQuery({
    queryKey: ['bookmark', id, userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('saved_hadiths')
        .select('*')
        .eq('hadith_id', id)
        .eq('user_id', userId)
        .maybeSingle()
      
      return !!data
    },
    enabled: !!userId,
  })

  // Toggle bookmark mutation with optimistic update
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User not authenticated')
      
      const isCurrentlyBookmarked = bookmarkQuery.data

      if (isCurrentlyBookmarked) {
        await BookmarkService.remove(id, userId)
      } else {
        await BookmarkService.add(id, userId)
      }
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['bookmark', id, userId] })

      // Snapshot previous value
      const previousValue = queryClient.getQueryData(['bookmark', id, userId])

      // Optimistically update - handle undefined case
      queryClient.setQueryData(['bookmark', id, userId], (old: boolean | undefined) => !old)

      return { previousValue }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousValue !== undefined) {
        queryClient.setQueryData(['bookmark', id, userId], context.previousValue)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['bookmark', id, userId] })
      queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] })
    },
  })

  return {
    hadith: hadithQuery.data,
    isLoading: hadithQuery.isLoading,
    isBookmarked: bookmarkQuery.data ?? false,
    toggleBookmark: bookmarkMutation.mutate,
    isTogglingBookmark: bookmarkMutation.isPending,
  }
}
