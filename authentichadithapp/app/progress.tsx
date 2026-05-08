import React from 'react'
import { StyleSheet, View, ScrollView, Text } from 'react-native'
import { Stack } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { StreakCounter } from '@/components/gamification/StreakCounter'
import { LevelProgressBar } from '@/components/gamification/LevelProgressBar'
import { StatCard } from '@/components/gamification/StatCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { getLevelInfo } from '@/lib/gamification/level-calculator'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function ProgressScreen() {
  const { user } = useAuth()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      return data
    },
    enabled: !!user,
  })

  const { data: streak, isLoading: streakLoading } = useQuery({
    queryKey: ['user-streak', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      return data
    },
    enabled: !!user,
  })

  const { data: collectionProgress } = useQuery({
    queryKey: ['collection-progress', user?.id],
    queryFn: async () => {
      if (!user) return []
      // Get collections with their total counts and user's read counts
      const { data: collections } = await supabase
        .from('collections')
        .select('id, slug, name_en, total_hadiths')
        .order('name_en')

      if (!collections) return []

      const { data: readCounts } = await supabase
        .from('hadith_views')
        .select('hadith:hadiths(collection_slug)')
        .eq('user_id', user.id)

      const readByCollection: Record<string, number> = {}
      if (readCounts) {
        for (const rc of readCounts) {
          const slug = (rc.hadith as any)?.collection_slug
          if (slug) {
            readByCollection[slug] = (readByCollection[slug] || 0) + 1
          }
        }
      }

      return collections.map((c) => ({
        ...c,
        read: readByCollection[c.slug] || 0,
        percentage: c.total_hadiths > 0
          ? Math.round(((readByCollection[c.slug] || 0) / c.total_hadiths) * 100)
          : 0,
      }))
    },
    enabled: !!user,
  })

  if (statsLoading || streakLoading) {
    return <LoadingSpinner />
  }

  const xp = stats?.xp || 0
  const levelInfo = getLevelInfo(xp)

  // Build weekly activity from streak data
  const activeDays: string[] = streak?.active_days || []
  const today = new Date()
  const weekActivity = WEEKDAYS.map((day, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - today.getDay() + i)
    const dateStr = d.toISOString().split('T')[0]
    return {
      day,
      date: dateStr,
      active: activeDays.includes(dateStr),
      isToday: dateStr === today.toISOString().split('T')[0],
    }
  })

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Progress', headerShown: true }} />

      <Text style={styles.title}>Your Progress</Text>

      {/* Level Progress */}
      <Card variant="elevated" style={styles.section}>
        <LevelProgressBar levelInfo={levelInfo} />
      </Card>

      {/* Streak */}
      <StreakCounter
        currentStreak={streak?.current_streak || 0}
        longestStreak={streak?.longest_streak || 0}
      />

      {/* Weekly Activity */}
      <Card variant="elevated" style={styles.section}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weekRow}>
          {weekActivity.map((d) => (
            <View key={d.day} style={styles.weekDay}>
              <Text style={[styles.weekDayLabel, d.isToday && styles.weekDayToday]}>
                {d.day}
              </Text>
              <View
                style={[
                  styles.weekDot,
                  d.active && styles.weekDotActive,
                  d.isToday && styles.weekDotToday,
                ]}
              >
                {d.active && <Text style={styles.weekFlame}>🔥</Text>}
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard icon="📖" value={stats?.hadiths_read || 0} label="Hadiths Read" />
        <StatCard icon="📝" value={stats?.notes_count || 0} label="Notes" />
      </View>
      <View style={styles.statsGrid}>
        <StatCard icon="🔖" value={stats?.bookmarks_count || 0} label="Bookmarks" />
        <StatCard icon="📤" value={stats?.shares_count || 0} label="Shares" />
      </View>
      <View style={styles.statsGrid}>
        <StatCard icon="🧠" value={stats?.quizzes_completed || 0} label="Quizzes" />
        <StatCard icon="📚" value={stats?.lessons_completed || 0} label="Lessons" />
      </View>

      {/* Collection Reading Progress */}
      {collectionProgress && collectionProgress.length > 0 && (
        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Collection Progress</Text>
          {collectionProgress.map((c) => (
            <View key={c.id} style={styles.collectionRow}>
              <View style={styles.collectionHeader}>
                <Text style={styles.collectionName} numberOfLines={1}>{c.name_en}</Text>
                <Text style={styles.collectionCount}>
                  {c.read} / {c.total_hadiths}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${c.percentage}%`,
                      backgroundColor: c.percentage >= 50 ? COLORS.goldMid : COLORS.emeraldMid,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </Card>
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
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.bronzeText,
    marginBottom: SPACING.md,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  weekDayLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedText,
    fontWeight: '500',
  },
  weekDayToday: {
    color: COLORS.goldMid,
    fontWeight: '700',
  },
  weekDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotActive: {
    backgroundColor: COLORS.emeraldMid + '30',
  },
  weekDotToday: {
    borderWidth: 2,
    borderColor: COLORS.goldMid,
  },
  weekFlame: {
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  collectionRow: {
    marginBottom: SPACING.md,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  collectionName: {
    fontSize: FONT_SIZES.base,
    color: COLORS.bronzeText,
    fontWeight: '500',
    flex: 1,
  },
  collectionCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedText,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
})
