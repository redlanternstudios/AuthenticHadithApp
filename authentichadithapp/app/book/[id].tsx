import React from 'react'
import { StyleSheet, View, FlatList, Text, Pressable } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors'

interface Chapter {
  id: string
  book_id: string
  number: number
  name_en: string
  name_ar: string
  total_hadiths: number
  sort_order: number
}

interface Book {
  id: string
  name_en: string
  name_ar: string
  number: number
}

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Book
    },
    enabled: !!id,
  })

  const { data: chapters, isLoading: chaptersLoading } = useQuery({
    queryKey: ['chapters', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('book_id', id)
        .order('sort_order', { ascending: true })
        .order('number', { ascending: true })
      if (error) throw error
      return (data as Chapter[]) || []
    },
    enabled: !!id,
  })

  const isLoading = bookLoading || chaptersLoading

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Book', headerShown: true }} />
        <Text style={styles.errorText}>Book not found</Text>
      </View>
    )
  }

  const renderChapter = ({ item }: { item: Chapter }) => (
    <Pressable onPress={() => router.push(`/chapter/${item.id}`)}>
      <Card variant="elevated" style={styles.chapterCard}>
        <View style={styles.chapterRow}>
          <View style={styles.chapterNumberContainer}>
            <Text style={styles.chapterNumber}>{item.number}</Text>
          </View>
          <View style={styles.chapterInfo}>
            <Text style={styles.chapterLabel}>Chapter {item.number}</Text>
            <Text style={styles.chapterNameEn} numberOfLines={2}>{item.name_en}</Text>
            {item.name_ar && (
              <Text style={styles.chapterNameAr} numberOfLines={1}>{item.name_ar}</Text>
            )}
            <Text style={styles.chapterHadithCount}>{item.total_hadiths} hadiths</Text>
          </View>
          <Text style={styles.chevron}>&rsaquo;</Text>
        </View>
      </Card>
    </Pressable>
  )

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: book.name_en,
          headerShown: true,
        }}
      />

      <FlatList
        data={chapters}
        keyExtractor={(item) => item.id}
        renderItem={renderChapter}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{book.name_en}</Text>
            <Text style={styles.subtitle}>
              {chapters?.length || 0} chapters
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No chapters found</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.bronzeText,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
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
    backgroundColor: COLORS.emeraldMid + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.emeraldMid,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.emeraldMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chapterNameEn: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.bronzeText,
    marginTop: 2,
  },
  chapterNameAr: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.goldMid,
    marginTop: 2,
  },
  chapterHadithCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedText,
    marginTop: SPACING.xs,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.mutedText,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.mutedText,
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
    color: COLORS.mutedText,
    textAlign: 'center',
  },
})
