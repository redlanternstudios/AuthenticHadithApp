import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Card } from '@/components/ui/Card'
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { Achievement, AchievementTier } from '@/types/gamification'

const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#B9F2FF',
}

const CATEGORY_ICONS: Record<string, string> = {
  learning: '📚',
  streaks: '🔥',
  social: '🤝',
  mastery: '🏆',
  milestones: '⭐',
}

interface AchievementCardProps {
  achievement: Achievement
  isUnlocked: boolean
  unlockedAt?: string
}

export function AchievementCard({ achievement, isUnlocked, unlockedAt }: AchievementCardProps) {
  const tierColor = TIER_COLORS[achievement.tier]

  return (
    <Card variant="elevated" style={[styles.card, !isUnlocked && styles.locked]}>
      <View style={[styles.iconContainer, { borderColor: tierColor }]}>
        <Text style={styles.icon}>
          {isUnlocked
            ? (CATEGORY_ICONS[achievement.category] || '⭐')
            : '🔒'}
        </Text>
      </View>
      <Text style={[styles.name, !isUnlocked && styles.lockedText]} numberOfLines={1}>
        {achievement.name}
      </Text>
      <Text style={[styles.description, !isUnlocked && styles.lockedText]} numberOfLines={2}>
        {achievement.description}
      </Text>
      <View style={styles.footer}>
        <View style={[styles.tierBadge, { backgroundColor: tierColor + '20' }]}>
          <Text style={[styles.tierText, { color: tierColor }]}>
            {achievement.tier.charAt(0).toUpperCase() + achievement.tier.slice(1)}
          </Text>
        </View>
        <Text style={styles.xpText}>+{achievement.xp_reward} XP</Text>
      </View>
      {isUnlocked && unlockedAt && (
        <Text style={styles.unlockedText}>
          Unlocked {new Date(unlockedAt).toLocaleDateString()}
        </Text>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    padding: SPACING.md,
    width: '48%',
    marginBottom: SPACING.md,
  },
  locked: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  icon: {
    fontSize: 24,
  },
  name: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.bronzeText,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedText,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 16,
  },
  lockedText: {
    color: COLORS.mutedText,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tierBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  tierText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  xpText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.goldMid,
    fontWeight: '600',
  },
  unlockedText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    marginTop: SPACING.xs,
  },
})
