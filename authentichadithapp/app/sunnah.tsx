import React, { useState, useMemo } from 'react'
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native'
import { Stack } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import {
  FALLBACK_SUNNAH_CATEGORIES,
  FALLBACK_SUNNAH_PRACTICES,
} from '@/lib/sunnah/sunnahFallbackData'

interface SunnahCategory {
  id: string
  title: string
  title_ar: string
  description: string
  icon: string
  color: string
  bg_color: string
  sort_order: number
}

interface SunnahPractice {
  id: string
  category_id: string
  title: string
  description: string
  hadith_ref: string
  collection: string
  sort_order: number
  day_of_year: number
  title_ar: string
  description_ar: string
}

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

export default function SunnahScreen() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const dayOfYear = useMemo(() => getDayOfYear(), [])

  const { data: dbCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['sunnah-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sunnah_categories')
        .select('*')
        .order('sort_order')

      if (error) throw error
      return (data || []) as SunnahCategory[]
    },
  })

  const { data: dbPractices, isLoading: practicesLoading } = useQuery({
    queryKey: ['sunnah-practices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sunnah_practices')
        .select('*')
        .order('sort_order')

      if (error) throw error
      return (data || []) as SunnahPractice[]
    },
  })

  // Local-first fallback: when Supabase returns nothing (table empty, network
  // down, or schema not yet migrated), the app falls back to a curated bundled
  // dataset so users always see real Sunnah content with hadith references.
  // Live Supabase data wins whenever ≥1 category is returned.
  const liveCategoriesCount = dbCategories?.length ?? 0
  const usingFallback = !categoriesLoading && liveCategoriesCount === 0
  const categories = usingFallback ? FALLBACK_SUNNAH_CATEGORIES : (dbCategories || [])
  const effectivePractices: any[] = usingFallback
    ? FALLBACK_SUNNAH_PRACTICES
    : (dbPractices || [])
  const isLoading = categoriesLoading || practicesLoading

  // Today's sunnah practice — use whichever dataset the screen is rendering
  // so the highlight card is consistent with the categories below it.
  const todaysPractice = useMemo(() => {
    if (!effectivePractices || effectivePractices.length === 0) return null
    // Prefer an exact day-of-year match; otherwise rotate through deterministically.
    const exact = effectivePractices.find((p) => p.day_of_year === dayOfYear)
    if (exact) return exact
    return effectivePractices[dayOfYear % effectivePractices.length] || null
  }, [effectivePractices, dayOfYear])

  // Group practices by category for counts
  const practicesByCategory = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const p of effectivePractices) {
      if (!map[p.category_id]) map[p.category_id] = []
      map[p.category_id].push(p)
    }
    return map
  }, [effectivePractices])

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Sunnah Practices', headerShown: true }} />
        <LoadingSpinner />
      </>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Sunnah Practices', headerShown: true }} />

      <Text style={styles.title}>Sunnah Practices</Text>
      <Text style={styles.subtitle}>
        Daily practices from the life of the Prophet &#xFDFA;
      </Text>

      {/* Today's Sunnah Card */}
      {todaysPractice && (
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayLabel}>Today's Sunnah</Text>
            <Text style={styles.todayDay}>Day {dayOfYear}</Text>
          </View>
          <Text style={styles.todayTitle}>{todaysPractice.title}</Text>
          {todaysPractice.title_ar ? (
            <Text style={styles.todayTitleAr}>{todaysPractice.title_ar}</Text>
          ) : null}
          {todaysPractice.description ? (
            <Text style={styles.todayDescription}>
              {todaysPractice.description}
            </Text>
          ) : null}
          {todaysPractice.hadith_ref ? (
            <Text style={styles.todayRef}>{todaysPractice.hadith_ref}</Text>
          ) : null}
        </View>
      )}

      {/* Category list */}
      {categories.map((category) => {
        const isExpanded = expandedCategory === category.id
        const categoryPractices = practicesByCategory[category.id] || []
        return (
          <View key={category.id} style={styles.categoryContainer}>
            <Pressable
              style={styles.categoryHeader}
              onPress={() =>
                setExpandedCategory(isExpanded ? null : category.id)
              }
            >
              <View
                style={[
                  styles.categoryIcon,
                  {
                    backgroundColor:
                      (category.bg_color || category.color || COLORS.emeraldMid) + '20',
                  },
                ]}
              >
                <Text style={styles.categoryIconText}>
                  {category.icon || '📿'}
                </Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.title}</Text>
                <Text style={styles.categoryCount}>
                  {categoryPractices.length} practices
                </Text>
              </View>
              <Text
                style={[styles.chevron, isExpanded && styles.chevronExpanded]}
              >
                ›
              </Text>
            </Pressable>

            {isExpanded && (
              <View style={styles.practicesList}>
                {categoryPractices.map((practice) => (
                  <View key={practice.id} style={styles.practiceItem}>
                    <View style={styles.practiceDot} />
                    <View style={styles.practiceContent}>
                      <Text style={styles.practiceTitle}>
                        {practice.title}
                      </Text>
                      {practice.description ? (
                        <Text style={styles.practiceDescription}>
                          {practice.description}
                        </Text>
                      ) : null}
                      {practice.hadith_ref ? (
                        <Text style={styles.practiceRef}>
                          {practice.hadith_ref}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
                {categoryPractices.length === 0 && (
                  <Text style={styles.emptyPractices}>
                    No practices in this category yet.
                  </Text>
                )}
              </View>
            )}
          </View>
        )
      })}

      {categories.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No sunnah categories available yet. Check back soon.
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
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

  // Today's Sunnah card
  todayCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.goldMid,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  todayLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.goldMid,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  todayDay: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedText,
  },
  todayTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.bronzeText,
    lineHeight: 24,
  },
  todayTitleAr: {
    fontSize: FONT_SIZES.md,
    color: COLORS.mutedText,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  todayDescription: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  todayRef: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.emeraldMid,
    marginTop: SPACING.sm,
    fontWeight: '500',
  },

  // Category accordion
  categoryContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconText: { fontSize: 20 },
  categoryInfo: { flex: 1 },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.bronzeText,
  },
  categoryCount: { fontSize: FONT_SIZES.sm, color: COLORS.mutedText },
  chevron: {
    fontSize: 24,
    color: COLORS.mutedText,
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: { transform: [{ rotate: '90deg' }] },

  // Expanded practices list
  practicesList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  practiceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.goldMid,
    marginTop: 7,
  },
  practiceContent: { flex: 1 },
  practiceTitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.bronzeText,
    lineHeight: 20,
    fontWeight: '500',
  },
  practiceDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedText,
    lineHeight: 18,
    marginTop: 2,
  },
  practiceRef: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.emeraldMid,
    marginTop: 4,
    fontWeight: '500',
  },
  emptyPractices: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedText,
    paddingVertical: SPACING.sm,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    textAlign: 'center',
  },
})
