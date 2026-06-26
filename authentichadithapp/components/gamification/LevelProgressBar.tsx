import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SPACING, FONT_SIZES, getColors } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { LevelInfo } from '@/types/gamification'
import { FONT_FAMILY } from '@/constants/theme'

interface LevelProgressBarProps {
  levelInfo: LevelInfo
}

function makeStyles(colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
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
      fontFamily: FONT_FAMILY.heading,
    },
    levelTitle: {
      fontSize: FONT_SIZES.base,
      fontFamily: FONT_FAMILY.bodySemiBold,
      color: colors.bronzeText,
      fontWeight: '600',
    },
    xpText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONT_FAMILY.body,
      color: colors.mutedText,
    },
    barBackground: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 4,
    },
  })
}

export function LevelProgressBar({ levelInfo }: LevelProgressBarProps) {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const styles = makeStyles(colors)
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
