import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Card } from '@/components/ui/Card'
import { SPACING, FONT_SIZES, BORDER_RADIUS, getColors } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { Achievement, AchievementTier } from '@/types/gamification'
import { FONT_FAMILY } from '@/constants/theme'

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

function makeStyles(colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
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
      backgroundColor: colors.background,
    },
    icon: {
      fontSize: 24,
    },
    name: {
      fontSize: FONT_SIZES.base,
      fontWeight: '700',
      fontFamily: FONT_FAMILY.heading,
      color: colors.bronzeText,
      textAlign: 'center',
      marginBottom: SPACING.xs,
    },
    description: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONT_FAMILY.body,
      color: colors.mutedText,
      textAlign: 'center',
      marginBottom: SPACING.sm,
      lineHeight: 16,
    },
    lockedText: {
      color: colors.mutedText,
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
      fontFamily: FONT_FAMILY.bodySemiBold,
    },
    xpText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONT_FAMILY.bodySemiBold,
      color: colors.goldMid,
      fontWeight: '600',
    },
    unlockedText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONT_FAMILY.body,
      color: colors.success,
      marginTop: SPACING.xs,
    },
  })
}

export function AchievementCard({ achievement, isUnlocked, unlockedAt }: AchievementCardProps) {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const styles = makeStyles(colors)
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
