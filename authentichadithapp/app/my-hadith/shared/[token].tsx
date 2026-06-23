import React from 'react'
import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getFolderByShareToken } from '@/lib/api/my-hadith'
import { useAuth } from '@/lib/auth/AuthProvider'
import { HadithCard } from '@/components/hadith/HadithCard'
import { Button } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'
import type { HadithFolder, SavedHadithWithNotes } from '@/types/my-hadith'

// In-app viewer for a shared hadith folder. Mirrors the website route
// /my-hadith/shared/[token]. Reads through the EXISTING data function
// getFolderByShareToken (lib/api/my-hadith.ts:158) — no duplicate query.
// The data fn manages its own Supabase access; this screen consumes auth
// only to offer a Sign In affordance when a guest hits a permission error.
type SharedFolder = HadithFolder & { saved_hadiths?: SavedHadithWithNotes[] }

export default function SharedFolderScreen() {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const router = useRouter()
  const { isGuest } = useAuth()
  const { token } = useLocalSearchParams<{ token: string }>()

  const {
    data: folder,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<SharedFolder>({
    queryKey: ['sharedFolder', token],
    queryFn: () => getFolderByShareToken(token) as Promise<SharedFolder>,
    enabled: !!token,
    retry: false, // a bad/private token should fail fast into the error state, not retry-spin
  })

  // --- Loading ---
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Shared Folder" showBack />
        <LoadingSpinner />
      </View>
    )
  }

  // --- Error (invalid/expired token, private folder, or auth/permission denial) ---
  if (isError || !folder) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Shared Folder" showBack />
        <View style={styles.centered}>
          <Text style={[styles.errorTitle, { color: colors.bronzeText }]}>
            This shared folder could not be opened
          </Text>
          <Text style={[styles.errorBody, { color: colors.mutedText }]}>
            The link may be invalid or no longer shared
            {isGuest ? ', or this folder is private and requires you to sign in.' : '.'}
          </Text>
          <View style={styles.actions}>
            <Button
              title={isRefetching ? 'Retrying…' : 'Retry'}
              onPress={() => refetch()}
              variant="outline"
              size="small"
              disabled={isRefetching}
            />
            {isGuest && (
              <Button
                title="Sign In"
                onPress={() => router.push('/auth/login')}
                variant="primary"
                size="small"
              />
            )}
          </View>
        </View>
      </View>
    )
  }

  // --- Loaded ---
  const hadiths = folder.saved_hadiths ?? []
  const count = hadiths.length
  const subtitle = folder.description ?? `${count} ${count === 1 ? 'hadith' : 'hadiths'}`

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={folder.name ?? 'Shared Folder'} subtitle={subtitle} showBack />

      <FlatList
        data={hadiths}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => item.hadith && router.push(`/hadith/${item.hadith_id}`)}
            disabled={!item.hadith}
          >
            {item.hadith ? (
              <>
                <HadithCard hadith={item.hadith} />
                {item.notes && (
                  <View style={[styles.notes, { backgroundColor: colors.card, borderLeftColor: colors.emeraldMid }]}>
                    <Text style={[styles.notesLabel, { color: colors.emeraldMid }]}>Note:</Text>
                    <Text style={[styles.notesText, { color: colors.bronzeText }]}>{item.notes}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.notes, { backgroundColor: colors.card, borderLeftColor: colors.emeraldMid }]}>
                <Text style={[styles.notesText, { color: colors.mutedText }]}>Hadith not found</Text>
              </View>
            )}
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>
              This shared folder has no hadiths yet
            </Text>
          </View>
        )}
        contentContainerStyle={count === 0 ? styles.emptyContent : undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flexGrow: 1,
  },
  errorTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  errorBody: {
    fontSize: FONT_SIZES.base,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
  },
  notes: {
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  notesLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  notesText: {
    fontSize: FONT_SIZES.base,
    lineHeight: 20,
  },
})
