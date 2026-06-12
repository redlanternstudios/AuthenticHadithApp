import React from 'react'
import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useFolders } from '@/hooks/useMyHadith'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner'

export default function MyHadithScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const { data: folders, isLoading, isError, refetch } = useFolders()

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPromptContainer}>
          <Text style={[styles.authPrompt, { color: colors.mutedText }]}>Sign in to save and organize hadiths</Text>
          <Button
            title="Sign In"
            onPress={() => router.push('/auth/login')}
            variant="primary"
          />
        </View>
      </View>
    )
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isError && <QueryErrorBanner onRetry={refetch} />}
      <ScreenHeader
        title="My Hadith"
        right={
          <Button
            title="+ New Folder"
            onPress={() => router.push('/my-hadith/create-folder')}
            variant="primary"
            size="small"
          />
        }
      />

      <FlatList
        data={folders}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <Pressable
            style={styles.folderCard}
            onPress={() => router.push(`/my-hadith/folder/${item.id}`)}
          >
            <Card variant="elevated">
              <View style={styles.cardContent}>
                <Text style={styles.folderIcon}>{item.icon}</Text>
                <Text style={[styles.folderName, { color: colors.bronzeText }]}>{item.name}</Text>
                <Text style={[styles.folderCount, { color: colors.mutedText }]}>
                  {item.saved_hadiths_count || 0} hadiths
                </Text>
                {item.privacy === 'public' && (
                  <Text style={[styles.publicBadge, { color: colors.emeraldMid }]}>{'\u{1F310}'} Public</Text>
                )}
              </View>
            </Card>
          </Pressable>
        )}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.bronzeText }]}>No folders yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.mutedText }]}>Create your first folder to organize hadiths</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  grid: {
    padding: SPACING.sm,
  },
  folderCard: {
    flex: 1,
    margin: SPACING.sm,
    minWidth: 150,
  },
  cardContent: {
    padding: SPACING.md,
  },
  folderIcon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  folderName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  folderCount: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  publicBadge: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  authPrompt: {
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
})
