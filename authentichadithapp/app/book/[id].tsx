import React from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { HadithList } from '@/components/hadith/HadithList'
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner'
import { Hadith } from '@/types/hadith'

export default function BookDetailScreen() {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const { id, slug, book_number } = useLocalSearchParams<{ id: string; slug?: string; book_number?: string }>()
  const router = useRouter()

  const bookNum = book_number ? parseInt(book_number, 10) : null
  const collectionSlug = slug || null
  const title = `Book ${bookNum ?? id}`

  // Fetch hadiths for this book directly from hadiths table
  const { data: hadiths = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['book-hadiths', collectionSlug, bookNum, id],
    queryFn: async () => {
      if (collectionSlug && bookNum != null) {
        // Query by collection_slug + book_number (primary path)
        const { data, error } = await supabase
          .from('hadiths')
          .select('*')
          .eq('collection_slug', collectionSlug)
          .eq('book_number', bookNum)
          .order('hadith_number', { ascending: true })
          .limit(500)
        if (error) throw error
        return (data as Hadith[]) || []
      }
      // Fallback: try books table by id
      const { data: bookRow } = await supabase
        .from('books')
        .select('collection_slug, book_number')
        .eq('id', id)
        .maybeSingle()
      if (!bookRow?.collection_slug) return []
      const { data, error } = await supabase
        .from('hadiths')
        .select('*')
        .eq('collection_slug', bookRow.collection_slug)
        .eq('book_number', bookRow.book_number)
        .order('hadith_number', { ascending: true })
        .limit(500)
      if (error) throw error
      return (data as Hadith[]) || []
    },
    enabled: !!id,
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (isError) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title, headerShown: true }} />
        <QueryErrorBanner onRetry={refetch} />
      </View>
    )
  }

  // H-3: Not-found / empty guard — renders a safe fallback instead of a blank list
  if (!isLoading && hadiths.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title, headerShown: true }} />
        <Text style={[styles.emptyText, { color: colors.mutedText }]}>
          No hadiths found for this book.
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.emptyBackButton}
        >
          <Text style={[styles.emptyBackText, { color: colors.bronzeText }]}>Go Back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title,
          headerShown: true,
        }}
      />
      {isError && <QueryErrorBanner onRetry={refetch} />}

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.bronzeText }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          {hadiths.length} hadiths
        </Text>
      </View>

      <HadithList
        hadiths={hadiths}
        isLoading={isLoading}
        onHadithPress={(hadith) => router.push(`/hadith/${hadith.id}`)}
        emptyMessage="No hadiths found in this book."
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    marginTop: SPACING.xs,
  },
  chapterCard: {
    marginBottom: SPACING.sm,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  chapterNumberContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  chapterInfo: {
    flex: 1,
  },
  chapterLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chapterNameEn: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginTop: 2,
  },
  chapterNameAr: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  chapterHadithCount: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  chevron: {
    fontSize: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  emptyBackButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
  },
  emptyBackText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
})
