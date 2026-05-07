import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { HadithList } from '@/components/hadith/HadithList'
import { Hadith } from '@/types/hadith'
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors'

export default function TopicHadithsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()

  const { data: tag, isLoading: tagLoading } = useQuery({
    queryKey: ['tag', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('slug', slug)
        .single()
      if (error) throw error
      return data as { id: string; slug: string; name_en: string; name_ar: string; usage_count: number }
    },
    enabled: !!slug,
  })

  const { data: hadiths, isLoading: hadithsLoading } = useQuery({
    queryKey: ['topic-hadiths', tag?.id],
    queryFn: async () => {
      // Step 1: get hadith_ids from hadith_tags
      const { data: hadithTags, error: tagsError } = await supabase
        .from('hadith_tags')
        .select('hadith_id')
        .eq('tag_id', tag!.id)
        .limit(50)
      if (tagsError) throw tagsError
      if (!hadithTags || hadithTags.length === 0) return []

      const hadithIds = hadithTags.map((ht) => ht.hadith_id)

      // Step 2: fetch hadiths by ids
      const { data, error } = await supabase
        .from('hadiths')
        .select('*')
        .in('id', hadithIds)
      if (error) throw error
      return (data as Hadith[]) || []
    },
    enabled: !!tag?.id,
  })

  if (tagLoading) {
    return <LoadingSpinner />
  }

  if (!tag) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Topic', headerShown: true }} />
        <Text style={styles.errorText}>Topic not found</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: tag.name_en,
          headerShown: true,
        }}
      />

      <View style={styles.header}>
        <Text style={styles.title}>{tag.name_en}</Text>
        {tag.name_ar && <Text style={styles.arabic}>{tag.name_ar}</Text>}
        <Text style={styles.subtitle}>{tag.usage_count} hadiths</Text>
      </View>

      <HadithList
        hadiths={hadiths || []}
        isLoading={hadithsLoading}
        onHadithPress={(hadith) => router.push(`/hadith/${hadith.id}`)}
        emptyMessage="No hadiths found for this topic"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.bronzeText,
  },
  arabic: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.goldMid,
    marginTop: 2,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    marginTop: SPACING.xs,
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
})
