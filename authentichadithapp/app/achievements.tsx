import React, { useState } from 'react'
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native'
import { Stack } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { AchievementCard } from '@/components/gamification/AchievementCard'
import { LevelProgressBar } from '@/components/gamification/LevelProgressBar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { getLevelInfo } from '@/lib/gamification/level-calculator'
import { AchievementCategory } from '@/types/gamification'

const CATEGORIES: { key: AchievementCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'learning', label: 'Learning' },
  { key: 'streaks', label: 'Streaks' },
  { key: 'social', label: 'Social' },
  { key: 'mastery', label: 'Mastery' },
  { key: 'milestones', label: 'Milestones' },
]

export default function AchievementsScreen() {
  const { user } = useAuth()
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all')

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: async () => {
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('tier', { ascending: true })

      if (!allAchievements) return { achievements: [], unlocked: new Map() }

      let unlockedMap = new Map<string, string>()
      if (user) {
        const { data: userAchievements } = await supabase
          .from('user_achievements')
          .select('achievement_id, unlocked_at')
          .eq('user_id', user.id)

        if (userAchievements) {
          for (const ua of userAchievements) {
            unlockedMap.set(ua.achievement_id, ua.unlocked_at)
          }
        }
      }

      return { achievements: allAchievements, unlocked: unlockedMap }
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()
      return data
    },
    enabled: !!user,
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  const allAchievements = achievements?.achievements || []
  const unlockedMap = achievements?.unlocked || new Map()
  const xp = stats?.xp || 0
  const levelInfo = getLevelInfo(xp)

  const filtered = activeCategory === 'all'
    ? allAchievements
    : allAchievements.filter((a) => a.category === activeCategory)

  const unlockedCount = unlockedMap.size
  const totalCount = allAchievements.length

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Achievements', headerShown: true }} />

      <Text style={styles.title}>Achievements</Text>
      <Text style={styles.subtitle}>
        {unlockedCount} of {totalCount} unlocked
      </Text>

      {/* Level Progress */}
      <Card variant="elevated" style={styles.levelCard}>
        <LevelProgressBar levelInfo={levelInfo} />
      </Card>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            style={[styles.filterChip, activeCategory === cat.key && styles.filterChipActive]}
            onPress={() => setActiveCategory(cat.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeCategory === cat.key && styles.filterChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Achievement Grid */}
      <View style={styles.grid}>
        {filtered.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            isUnlocked={unlockedMap.has(achievement.id)}
            unlockedAt={unlockedMap.get(achievement.id)}
          />
        ))}
      </View>

      {filtered.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No achievements in this category yet.</Text>
        </View>
      )}
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
  levelCard: {
    marginBottom: SPACING.md,
  },
  filtersScroll: {
    marginBottom: SPACING.md,
  },
  filtersContent: {
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.emeraldMid,
    borderColor: COLORS.emeraldMid,
  },
  filterChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedText,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
  },
})
