import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth/AuthProvider'
import * as api from '@/lib/api/my-hadith'
import type { HadithFolder } from '@/types/my-hadith'

export function useFolders() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['folders', user?.id],
    queryFn: () => api.getUserFolders(user!.id),
    enabled: !!user
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: api.createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', user?.id] })
    }
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<HadithFolder> }) =>
      api.updateFolder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', user?.id] })
    }
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: api.deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', user?.id] })
    }
  })
}

export function useFolderHadiths(folderId?: string) {
  return useQuery({
    queryKey: ['folder-hadiths', folderId],
    queryFn: () => api.getFolderHadiths(folderId!),
    enabled: !!folderId
  })
}

export function useSaveHadith() {
  const queryClient = useQueryClient()
  // FIX-119: pull userId from auth context here so saveHadithToFolder never
  // has to call getUser() itself (race condition when session is stale).
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ hadithId, folderId, notes }: {
      hadithId: string
      folderId?: string
      notes?: string
    }) => api.saveHadithToFolder(user!.id, hadithId, folderId, notes),
    onSuccess: (_, variables) => {
      // FIX-119: invalidate the exact bookmark key used by useHadith so the
      // bookmark icon flips to filled immediately after a folder-save.
      queryClient.invalidateQueries({ queryKey: ['bookmark', variables.hadithId, user?.id] })
      queryClient.invalidateQueries({ queryKey: ['bookmarks', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['folders', user?.id] })
      // FIX-138: also invalidate the folder-hadiths list so a hadith saved while
      // the folder screen is already open appears immediately. Previously this key
      // (used by useFolderHadiths) was never invalidated, so a save into the
      // currently-open folder did not refresh — looked like "it didn't save."
      queryClient.invalidateQueries({ queryKey: ['folder-hadiths'] })
    }
  })
}

export function useUpdateNotes() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.updateSavedHadithNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-hadiths'] })
    }
  })
}
