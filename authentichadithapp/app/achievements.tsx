/**
 * Badges / Achievements screen — local-first, crash-proof.
 *
 * Reads from the unified progress service (lib/progress/progressService.ts)
 * via useBadges() + useProgressSummary(). Does NOT query Supabase tables
 * that may not exist; cannot crash on missing schema, missing auth, or
 * empty progress.
 *
 * Migrated in FIX-032. Replaces the prior implementation that called
 * supabase.from('achievements').select(...) on tables that aren't in
 * any committed migration — that path would crash or hang silently
 * depending on PostgREST behavior.
 */

import React, { useMemo, useState } from 'react'
import { StyleSheet, View, ScrollView, Text, Pressable, Share } from 'react-native'
import { Stack } from 'expo-router'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LevelProgressBar } from '@/components/gamification/LevelProgressBar'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { getLevelInfo } from '@/lib/gamification/level-calculator'
import { useBadges, useProgressSummary } from '@/hooks/useProgress'
import { BadgeDefinition } from '@/lib/progress/progressService'
import { FONT_FAMILY } from '@/constants/theme'
import { buildBadgeShareText } from '@/lib/share/shareContent'

type Filter = 'all' | 'unlocked' | 'locked'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unlocked', label: 'Unlocked' },
  { key: 'locked', label: 'Locked' },
]

/**
 * XP from local progress. We award the same XP per type as the existing
 * track-activity helper so the level math stays consistent whether or
 * not Supabase write succeeded.
 */
const XP_PER_TYPE: Record<string, number> = {
  story: 25,
  lesson: 15,
  quiz: 10,
  sunnah_practice: 10,
  course: 50,
  daily_hadith: 5,
}

export default function AchievementsScreen() {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const [filter, setFilter] = useState<Filter>('all')

  const { badges, isLoading: badgesLoading } = useBadges()
  const { summary, isLoading: summaryLoading } = useProgressSummary()

  // Derive XP from local progress so the badges screen is fully self-sufficient.
  const xp = useMemo(() => {
    let total = 0
    for (const [type, count] of Object.entries(summary.byType)) {
      total += (XP_PER_TYPE[type] || 0) * count
    }
    return total
  }, [summary])

  const levelInfo = getLevelInfo(xp)

  const filtered = badges.filter((b) => {
    if (filter === 'unlocked') return b.unlocked
    if (filter === 'locked') return !b.unlocked
    return true
  })

  const unlockedCount = badges.filter((b) => b.unlocked).length
  const totalCount = badges.length

  // Render even on the very first launch with empty progress. The
  // service returns a stable badge list; loading flags only delay the
  // first paint by one frame in practice.
  const isLoading = badgesLoading || summaryLoading

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ title: 'Badges', headerShown: true }} />

      <Text style={[styles.title, { color: colors.bronzeText }]}>Badges</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        {totalCount === 0
          ? 'Complete lessons, stories, and Sunnah practices to unlock badges.'
          : `${unlockedCount} of ${totalCount} unlocked`}
      </Text>

      <Button
        title="Share Progress"
        variant="outline"
        onPress={async () => {
          const message = [
            `Authentic Hadith progress`,
            `Completed: ${summary.totalCompleted}`,
            `Lessons: ${summary.byType.lesson}`,
            `Quizzes: ${summary.byType.quiz}`,
            `Stories: ${summary.byType.story}`,
          ].join('\n')
          try {
            await Share.share({ message, title: 'Authentic Hadith Progress' })
          } catch (err) {
            __DEV__ && console.warn('[Achievements] share progress failed:', err)
          }
        }}
      />

      {/* Level Progress */}
      <Card variant="elevated" style={styles.levelCard}>
        <LevelProgressBar levelInfo={levelInfo} />
      </Card>

      {/* Quick stats from local progress */}
      <View style={styles.statsRow}>
        <StatPill colors={colors} label="Stories" value={summary.byType.story} />
        <StatPill colors={colors} label="Lessons" value={summary.byType.lesson} />
        <StatPill colors={colors} label="Quizzes" value={summary.byType.quiz} />
        <StatPill colors={colors} label="Sunnah" value={summary.byType.sunnah_practice} />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <Pressable
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.emeraldMid : colors.card,
                  borderColor: active ? colors.emeraldMid : colors.border,
                },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: active ? colors.white : colors.mutedText },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Badge grid */}
      <View style={styles.grid}>
        {filtered.map((badge) => (
          <BadgeTile key={badge.id} badge={badge} colors={colors} />
        ))}
      </View>

      {filtered.length === 0 && !isLoading && (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.mutedText }]}>
            {filter === 'unlocked'
              ? 'No badges earned yet. Complete a story, lesson, or Sunnah practice to unlock your first badge.'
              : filter === 'locked'
              ? 'All badges unlocked. Masha Allah.'
              : 'No badges yet.'}
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

function BadgeTile({
  badge,
  colors,
}: {
  badge: BadgeDefinition
  colors: ReturnType<typeof getColors>
}) {
  const progressPct = badge.progress != null ? Math.round(badge.progress * 100) : 0
  return (
    <Card
      variant="elevated"
      style={[
        styles.badgeTile,
        { opacity: badge.unlocked ? 1 : 0.65 },
      ]}
    >
      <View
        style={[
          styles.badgeIconWrap,
          {
            backgroundColor: badge.unlocked
              ? colors.emeraldMid + '20'
              : colors.border,
          },
        ]}
      >
        <Text style={styles.badgeIcon}>{badge.unlocked ? badge.icon : '🔒'}</Text>
      </View>
      <Text style={[styles.badgeName, { color: colors.bronzeText }]} numberOfLines={1}>
        {badge.name}
      </Text>
      <Text
        style={[styles.badgeDescription, { color: colors.mutedText }]}
        numberOfLines={2}
      >
        {badge.description}
      </Text>
      {badge.unlocked && (
        <Pressable
          onPress={async () => {
            const message = buildBadgeShareText({
              name: badge.name,
              description: badge.description,
            })
            try {
              await Share.share({ message, title: badge.name })
            } catch (err) {
              __DEV__ && console.warn('[Achievements] share badge failed:', err)
            }
          }}
          style={[styles.shareButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.shareButtonText, { color: colors.emeraldMid }]}>Share</Text>
        </Pressable>
      )}
      {!badge.unlocked && badge.progress != null && (
        <View style={[styles.badgeProgressBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.badgeProgressFill,
              { width: `${progressPct}%`, backgroundColor: colors.goldMid },
            ]}
          />
        </View>
      )}
    </Card>
  )
}

function StatPill({
  colors,
  label,
  value,
}: {
  colors: ReturnType<typeof getColors>
  label: string
  value: number
}) {
  return (
    <View
      style={[
        styles.statPill,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.statValue, { color: colors.bronzeText }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    fontFamily: FONT_FAMILY.heading,
    paddingTop: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONT_FAMILY.body,
    marginBottom: SPACING.lg,
  },
  levelCard: { marginBottom: SPACING.md },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  statPill: {
    width: '48%',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONT_FAMILY.heading,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_FAMILY.body,
  },
  filtersScroll: { marginBottom: SPACING.md },
  filtersContent: { gap: SPACING.sm },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  badgeTile: {
    width: '48%',
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badgeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  badgeIcon: { fontSize: 28 },
  badgeName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    fontFamily: FONT_FAMILY.heading,
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_FAMILY.body,
    textAlign: 'center',
    minHeight: 32,
    marginBottom: SPACING.xs,
  },
  badgeProgressBg: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  shareButton: {
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  shareButtonText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_FAMILY.bodySemiBold,
    textAlign: 'center',
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONT_FAMILY.body,
    textAlign: 'center',
    lineHeight: 22,
  },
})
