import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { HadithList } from '@/components/hadith/HadithList'
import { Hadith } from '@/types/hadith'
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner'

interface ChapterDetail {
  id: string
  book_id: string
  number: number
  name_en: string
  name_ar: string
  total_hadiths: number
  sort_order: number
}

export default function ChapterDetailScreen() {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data: chapter, isLoading: chapterLoading, isError: chapterError, refetch: refetchChapter } = useQuery({
    queryKey: ['chapter', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data as ChapterDetail | null
    },
    enabled: !!id,
  })

  // Get the parent book to resolve collection + book_number for hadiths
  const { data: parentBook } = useQuery({
    queryKey: ['chapter-parent-book', chapter?.book_id],
    queryFn: async () => {
      const { data: book, error: bookErr } = await supabase
        .from('books')
        .select('number, collection_id')
        .eq('id', chapter!.book_id)
        .maybeSingle()
      if (bookErr) throw bookErr
      if (!book) return null

      const { data: col, error: colErr } = await supabase
        .from('collections')
        .select('slug')
        .eq('id', book.collection_id)
        .maybeSingle()
      if (colErr) throw colErr
      if (!col) return null

      return { bookNumber: book.number, collectionSlug: col.slug }
    },
    enabled: !!chapter?.book_id,
  })

  // Hadiths in production are linked to books via (collection_slug, book_number) only —
  // there is no chapter_id column on the hadiths table. Until that column is added,
  // this screen displays every hadith in the parent book. The 1000-row cap matches
  // PostgREST's default limit and is well above any single book's hadith count
  // (largest seen: ~260 in Bukhari book 10). The previous .limit(100) cap was
  // truncating content for larger books.
  const { data: hadiths, isLoading: hadithsLoading } = useQuery({
    queryKey: ['chapter-hadiths', parentBook?.collectionSlug, parentBook?.bookNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hadiths')
        .select('*')
        .eq('collection_slug', parentBook!.collectionSlug)
        .eq('book_number', parentBook!.bookNumber)
        .order('hadith_number', { ascending: true })
        .limit(1000)
      if (error) throw error
      return (data as Hadith[]) || []
    },
    enabled: !!parentBook,
  })

  if (chapterLoading) {
    return <LoadingSpinner />
  }

  if (!chapter) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Chapter', headerShown: true }} />
        <Text style={[styles.errorText, { color: colors.mutedText }]}>Chapter not found</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: `Chapter ${chapter.number}`,
          headerShown: true,
        }}
      />
      {chapterError && <QueryErrorBanner onRetry={refetchChapter} />}

      <View style={styles.header}>
        <Text style={[styles.chapterLabel, { color: colors.emeraldMid }]}>Chapter {chapter.number}</Text>
        <Text style={[styles.title, { color: colors.bronzeText }]}>{chapter.name_en}</Text>
        {chapter.name_ar && (
          <Text style={[styles.arabic, { color: colors.goldMid }]}>{chapter.name_ar}</Text>
        )}
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>{chapter.total_hadiths} hadiths</Text>
      </View>

      <HadithList
        hadiths={hadiths || []}
        isLoading={hadithsLoading}
        onHadithPress={(hadith) => router.push(`/hadith/${hadith.id}`)}
        emptyMessage="No hadiths found in this chapter"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  chapterLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  arabic: {
    fontSize: FONT_SIZES.lg,
    marginTop: 2,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    marginTop: SPACING.xs,
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
})
