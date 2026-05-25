import React from 'react'
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner'

interface Tag {
  id: string
  slug: string
  name_en: string
  name_ar: string
  usage_count: number
  is_active: boolean
  category_id: string
}

export default function TopicsScreen() {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const router = useRouter()

  const { data: tags, isLoading, isError, refetch } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
      if (error) throw error
      return (data as Tag[]) || []
    },
  })

  const totalHadiths = tags?.reduce((sum, tag) => sum + (tag.usage_count || 0), 0) || 0

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Topics', headerShown: true }} />
      {isError && <QueryErrorBanner onRetry={refetch} />}

      <Text style={[styles.title, { color: colors.bronzeText }]}>Browse by Topic</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        {totalHadiths.toLocaleString()} tagged hadiths across {tags?.length || 0} topics
      </Text>

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
            <Text style={[styles.tagCount, { color: colors.mutedText }]}>{tag.usage_count} hadiths</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
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
