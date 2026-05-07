import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors'
import { LevelInfo } from '@/types/gamification'

interface LevelProgressBarProps {
  levelInfo: LevelInfo
}

export function LevelProgressBar({ levelInfo }: LevelProgressBarProps) {
  const progressPercent = Math.min(levelInfo.progress * 100, 100)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={[styles.levelNumber, { color: levelInfo.tierColor }]}>
            Lv {levelInfo.level}
          </Text>
          <Text style={styles.levelTitle}>{levelInfo.title}</Text>
        </View>
        <Text style={styles.xpText}>
          {levelInfo.currentXp} / {levelInfo.xpForNextLevel} XP
        </Text>
      </View>
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            {
              width: `${progressPercent}%`,
              backgroundColor: levelInfo.tierColor,
            },
          ]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  levelNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  levelTitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.bronzeText,
    fontWeight: '600',
  },
  xpText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedText,
  },
  barBackground: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
})
