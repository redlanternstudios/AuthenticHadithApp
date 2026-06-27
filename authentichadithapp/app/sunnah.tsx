import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native'
import { Stack } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { FONT_FAMILY } from '@/constants/theme'
import { useTheme } from '@/lib/theme/ThemeProvider'
import {
  FALLBACK_SUNNAH_CATEGORIES,
  FALLBACK_SUNNAH_PRACTICES,
} from '@/lib/sunnah/sunnahFallbackData'
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner'
import {
  markComplete as svcMarkComplete,
  getCompleted,
  subscribe,
} from '@/lib/progress/progressService'
import { trackActivity } from '@/lib/gamification/track-activity'

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

// The live sunnah_categories.icon column stores Lucide icon NAMES ("Moon",
// "HandHeart"), not emoji — rendering them raw clips to "Moo"/"Han" inside the
// 44px circle. Map every name in production to an emoji; values that are
// already emoji (bundled fallback data) pass through untouched.
const ICON_NAME_TO_EMOJI: Record<string, string> = {
  Clock: '🕐',
  HandHeart: '🤲',
  Heart: '❤️',
  Home: '🏠',
  MapPin: '📍',
  Moon: '🌙',
  Star: '⭐',
  Users: '👥',
  Utensils: '🍽️',
}

function resolveCategoryIcon(icon: string | null | undefined): string {
  if (!icon) return '📿'
  // Pure-ASCII value = an icon name from the DB, never a renderable emoji.
  if (/^[A-Za-z]+$/.test(icon)) return ICON_NAME_TO_EMOJI[icon] || '📿'
  return icon
}

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

export default function SunnahScreen() {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const { user } = useAuth()
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [practicedIds, setPracticedIds] = useState<Set<string>>(new Set())
  const dayOfYear = useMemo(() => getDayOfYear(), [])

  // Load previously completed sunnah practices from local store and stay reactive.
  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      try {
        const records = await getCompleted('sunnah_practice')
        if (!cancelled) setPracticedIds(new Set(records.map((r) => r.id)))
      } catch {
        // non-fatal — local store failure never blocks the screen
      }
    }
    refresh()
    const unsub = subscribe(refresh)
    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  const handlePractice = useCallback(
    async (practiceId: string) => {
      if (practicedIds.has(practiceId)) return // idempotent
      setPracticedIds((prev) => new Set([...prev, practiceId]))
      await svcMarkComplete('sunnah_practice', practiceId)
      if (user) {
        try {
          await trackActivity(user.id, 'sunnah_practice')
        } catch {
          // non-fatal — XP write never blocks the primary action
        }
      }
    },
    [practicedIds, user]
  )

  const { data: dbCategories, isLoading: categoriesLoading, isError: categoriesError, refetch: refetchCategories } = useQuery({
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
  const effectivePractices = useMemo(
    () => (usingFallback ? FALLBACK_SUNNAH_PRACTICES : (dbPractices || [])),
    [usingFallback, dbPractices]
  )
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Sunnah Practices', headerShown: true }} />
      {categoriesError && <QueryErrorBanner onRetry={refetchCategories} />}

      <Text style={[styles.title, { color: colors.bronzeText }]}>Sunnah Practices</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        Daily practices from the life of the Prophet &#xFDFA;
      </Text>

      {/* Today's Sunnah Card */}
      {todaysPractice && (
        <View style={[styles.todayCard, { backgroundColor: colors.card, borderColor: colors.goldMid }]}>
          <View style={styles.todayHeader}>
            <Text style={[styles.todayLabel, { color: colors.goldMid }]}>{"Today's Sunnah"}</Text>
            <Text style={[styles.todayDay, { color: colors.mutedText }]}>Day {dayOfYear}</Text>
          </View>
          <Text style={[styles.todayTitle, { color: colors.bronzeText }]}>{todaysPractice.title}</Text>
          {todaysPractice.title_ar ? (
            <Text style={[styles.todayTitleAr, { color: colors.mutedText }]}>{todaysPractice.title_ar}</Text>
          ) : null}
          {todaysPractice.description ? (
            <Text style={[styles.todayDescription, { color: colors.mutedText }]}>
              {todaysPractice.description}
            </Text>
          ) : null}
          {todaysPractice.hadith_ref ? (
            <Text style={[styles.todayRef, { color: colors.emeraldMid }]}>{todaysPractice.hadith_ref}</Text>
          ) : null}
          <Pressable
            style={[
              styles.practiceBtn,
              practicedIds.has(todaysPractice.id)
                ? { backgroundColor: colors.emeraldMid + '20', borderColor: colors.emeraldMid }
                : { backgroundColor: colors.goldMid + '20', borderColor: colors.goldMid },
            ]}
            onPress={() => handlePractice(todaysPractice.id)}
            accessibilityRole="button"
            accessibilityLabel={
              practicedIds.has(todaysPractice.id) ? 'Practiced today' : 'Mark as practiced'
            }
          >
            <Text
              style={[
                styles.practiceBtnText,
                { color: practicedIds.has(todaysPractice.id) ? colors.emeraldMid : colors.goldMid },
              ]}
            >
              {practicedIds.has(todaysPractice.id) ? '✓ Practiced Today' : '🤲 Mark as Practiced'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Category list */}
      {categories.map((category) => {
        const isExpanded = expandedCategory === category.id
        const categoryPractices = practicesByCategory[category.id] || []
        return (
          <View key={category.id} style={[styles.categoryContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                      (category.bg_color || category.color || colors.emeraldMid) + '20',
                  },
                ]}
              >
                <Text style={styles.categoryIconText}>
                  {resolveCategoryIcon(category.icon)}
                </Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: colors.bronzeText }]}>{category.title}</Text>
                <Text style={[styles.categoryCount, { color: colors.mutedText }]}>
                  {categoryPractices.length} practices
                </Text>
              </View>
              <Text
                style={[styles.chevron, { color: colors.mutedText }, isExpanded && styles.chevronExpanded]}
              >
                ›
              </Text>
            </Pressable>

            {isExpanded && (
              <View style={[styles.practicesList, { borderTopColor: colors.border }]}>
                {categoryPractices.map((practice) => {
                  const practiced = practicedIds.has(practice.id)
                  return (
                    <View key={practice.id} style={styles.practiceItem}>
                      <View style={[styles.practiceDot, { backgroundColor: practiced ? colors.emeraldMid : colors.goldMid }]} />
                      <View style={styles.practiceContent}>
                        <Text style={[styles.practiceTitle, { color: colors.bronzeText }]}>
                          {practice.title}
                        </Text>
                        {practice.description ? (
                          <Text style={[styles.practiceDescription, { color: colors.mutedText }]}>
                            {practice.description}
                          </Text>
                        ) : null}
                        {practice.hadith_ref ? (
                          <Text style={[styles.practiceRef, { color: colors.emeraldMid }]}>
                            {practice.hadith_ref}
                          </Text>
                        ) : null}
                        <Pressable
                          style={[
                            styles.practiceBtnSmall,
                            practiced
                              ? { backgroundColor: colors.emeraldMid + '15', borderColor: colors.emeraldMid }
                              : { backgroundColor: colors.goldMid + '15', borderColor: colors.goldMid },
                          ]}
                          onPress={() => handlePractice(practice.id)}
                          accessibilityRole="button"
                          accessibilityLabel={practiced ? 'Practiced' : 'Mark as practiced'}
                        >
                          <Text
                            style={[
                              styles.practiceBtnSmallText,
                              { color: practiced ? colors.emeraldMid : colors.goldMid },
                            ]}
                          >
                            {practiced ? '✓ Practiced' : 'Mark as Practiced'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )
                })}
                {categoryPractices.length === 0 && (
                  <Text style={[styles.emptyPractices, { color: colors.mutedText }]}>
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
          <Text style={[styles.emptyText, { color: colors.mutedText }]}>
            No sunnah categories available yet. Check back soon.
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    paddingTop: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.lg,
  },

  // Today's Sunnah card
  todayCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 2,
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
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  todayDay: {
    fontSize: FONT_SIZES.xs,
  },
  todayTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    lineHeight: 24,
  },
  todayTitleAr: {
    fontSize: FONT_SIZES.md,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  todayDescription: {
    fontSize: FONT_SIZES.base,
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  todayRef: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.sm,
    fontWeight: '500',
  },

  // Category accordion
  categoryContainer: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
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
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontWeight: '600',
  },
  categoryCount: { fontSize: FONT_SIZES.sm, fontFamily: FONT_FAMILY.body },
  chevron: {
    fontSize: 24,
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: { transform: [{ rotate: '90deg' }] },

  // Expanded practices list
  practicesList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
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
    marginTop: 7,
  },
  practiceContent: { flex: 1 },
  practiceTitle: {
    fontSize: FONT_SIZES.base,
    lineHeight: 20,
    fontWeight: '500',
  },
  practiceDescription: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    marginTop: 2,
  },
  practiceRef: {
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
    fontWeight: '500',
  },
  emptyPractices: {
    fontSize: FONT_SIZES.sm,
    paddingVertical: SPACING.sm,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },

  // Practice completion buttons
  practiceBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  practiceBtnText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontWeight: '600',
  },
  practiceBtnSmall: {
    marginTop: SPACING.sm,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  practiceBtnSmallText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontWeight: '600',
  },
})
