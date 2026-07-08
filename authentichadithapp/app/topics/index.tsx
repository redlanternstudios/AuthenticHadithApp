import React from 'react'
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner'
import { VISIBLE_COLLECTION_SLUGS } from '@/lib/hadith/visibleCollections'
import { IslamicPatternBackground } from '@/components/ui/IslamicPatternBackground'

interface Tag {
  id: string
  slug: string
  name_en: string
  name_ar: string
  usage_count: number
  is_active: boolean
  category_id: string
}

interface VisibleTag extends Tag {
  visible_count: number
}

export default function TopicsScreen() {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const router = useRouter()

  const { data: tags, isLoading, isError, refetch } = useQuery({
    queryKey: ['tags', 'visible-sahihayn'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('is_active', true)
        .gt('usage_count', 0)
        .order('usage_count', { ascending: false })
      if (error) throw error

      const activeTags = (data as Tag[]) || []
      const visibleTags = await Promise.all(activeTags.map(async (tag) => {
        const { data: links, error: linksError } = await supabase
          .from('hadith_tags')
          .select('hadith_id')
          .eq('tag_id', tag.id)
        if (linksError) throw linksError

        const hadithIds = (links || []).map((link) => link.hadith_id).filter(Boolean)
        if (hadithIds.length === 0) return { ...tag, visible_count: 0 }

        const { count, error: countError } = await supabase
          .from('hadiths')
          .select('id', { count: 'exact', head: true })
          .in('id', hadithIds)
          .in('collection_slug', VISIBLE_COLLECTION_SLUGS as string[])
        if (countError) throw countError

        return { ...tag, visible_count: count || 0 }
      }))

      return visibleTags
        .filter((tag) => tag.visible_count > 0)
        .sort((a, b) => b.visible_count - a.visible_count) as VisibleTag[]
    },
  })

  const totalHadiths = tags?.reduce((sum, tag) => sum + (tag.visible_count || 0), 0) || 0

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <IslamicPatternBackground isDark={isDark}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Stack.Screen options={{ title: 'Topics', headerShown: true }} />
        {isError && <QueryErrorBanner onRetry={refetch} />}

        <Text style={[styles.title, { color: colors.bronzeText }]}>Browse by Topic</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          {totalHadiths.toLocaleString()} Sahihayn links across {tags?.length || 0} topics
        </Text>

        {tags?.length === 0 && (
          <Text style={[styles.subtitle, { color: colors.mutedText, marginTop: SPACING.xl, textAlign: 'center' }]}>
            No topics with verified hadiths available yet.
          </Text>
        )}

        <View style={styles.grid}>
          {tags?.map((tag) => (
            <Pressable
              key={tag.id}
              style={[styles.tagCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/topics/${tag.slug}`)}
            >
              <View style={[styles.tagIconContainer, { backgroundColor: colors.emeraldMid + '20' }]}>
                <Text style={[styles.tagIcon, { color: colors.emeraldMid }]}>{tag.name_en.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={[styles.tagNameEn, { color: colors.bronzeText }]} numberOfLines={2}>{tag.name_en}</Text>
              {tag.name_ar && (
                <Text style={[styles.tagNameAr, { color: colors.goldMid }]} numberOfLines={1}>{tag.name_ar}</Text>
              )}
              <Text style={[styles.tagCount, { color: colors.mutedText }]}>{tag.visible_count} hadiths</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </IslamicPatternBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    paddingTop: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tagCard: {
    width: '48.5%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  tagIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  tagIcon: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  tagNameEn: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    textAlign: 'center',
  },
  tagNameAr: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginTop: 2,
  },
  tagCount: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
})
