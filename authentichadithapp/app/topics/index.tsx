import React from 'react'
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'

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
  const router = useRouter()

  const { data: tags, isLoading } = useQuery({
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Topics', headerShown: true }} />

      <Text style={styles.title}>Browse by Topic</Text>
      <Text style={styles.subtitle}>
        {totalHadiths.toLocaleString()} tagged hadiths across {tags?.length || 0} topics
      </Text>

      <View style={styles.grid}>
        {tags?.map((tag) => (
          <Pressable
            key={tag.id}
            style={styles.tagCard}
            onPress={() => router.push(`/topics/${tag.slug}`)}
          >
            <View style={styles.tagIconContainer}>
              <Text style={styles.tagIcon}>{tag.name_en.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.tagNameEn} numberOfLines={2}>{tag.name_en}</Text>
            {tag.name_ar && (
              <Text style={styles.tagNameAr} numberOfLines={1}>{tag.name_ar}</Text>
            )}
            <Text style={styles.tagCount}>{tag.usage_count} hadiths</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.bronzeText,
    paddingTop: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    marginBottom: SPACING.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tagCard: {
    width: '48.5%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.emeraldMid + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  tagIcon: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.emeraldMid,
  },
  tagNameEn: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.bronzeText,
    textAlign: 'center',
  },
  tagNameAr: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.goldMid,
    textAlign: 'center',
    marginTop: 2,
  },
  tagCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedText,
    marginTop: SPACING.xs,
  },
})
