import React from 'react'
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { Ionicons } from '@expo/vector-icons'
import {
  getCollectionDisplayName,
  useCollectionDisplayNames,
} from '@/lib/hadith/collectionDisplayName'
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner'

export default function BookmarksScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const { data: bookmarks, isLoading, isError, refetch } = useBookmarks(user?.id)
  const { data: collectionNames } = useCollectionDisplayNames()

  if (!user) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed" size={48} color={colors.mutedText} />
        <Text style={[styles.emptyText, { color: colors.bronzeText }]}>Please sign in to view bookmarks</Text>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.emeraldMid} />
      </View>
    )
  }

  if (isError) {
    return (
      <>
        <Stack.Screen options={{ title: 'Bookmarks' }} />
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <QueryErrorBanner onRetry={refetch} />
        </View>
      </>
    )
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: 'Bookmarks' }} />
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="bookmark-outline" size={48} color={colors.mutedText} />
          <Text style={[styles.emptyText, { color: colors.bronzeText }]}>No bookmarks yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedText }]}>Start bookmarking hadiths to see them here</Text>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: `Bookmarks (${bookmarks.length})` }} />
      <FlatList
        style={{ backgroundColor: colors.background }}
        data={bookmarks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/hadith/${item.hadith_id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.collection, { color: colors.emeraldMid }]}>{getCollectionDisplayName(item.hadith?.collection_slug, collectionNames) || 'Hadith'}</Text>
              <Ionicons name="bookmark" size={20} color={colors.emeraldMid} />
            </View>
            <Text style={[styles.hadithNumber, { color: colors.mutedText }]}>Hadith #{item.hadith?.hadith_number}</Text>
            <Text style={[styles.excerpt, { color: colors.bronzeText }]} numberOfLines={3}>
              {item.hadith?.english_text}
            </Text>
          </TouchableOpacity>
        )}
      />
    </>
  )
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.base,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  list: {
    padding: SPACING.md,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  collection: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  hadithNumber: {
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.sm,
  },
  excerpt: {
    fontSize: FONT_SIZES.base,
    lineHeight: 20,
  },
})
