import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { getColors, BORDER_RADIUS, SPACING, FONT_SIZES } from '../../lib/styles/colors'
import { useTheme } from '../../lib/theme/ThemeProvider'
import { HadithGrade } from '../../types/hadith'

interface GradeBadgeProps {
  grade: HadithGrade | null | undefined
  size?: 'small' | 'medium'
}

const GRADE_LABELS: Record<HadithGrade, string> = {
  sahih: 'Sahih',
  hasan: 'Hasan',
  daif: 'Daif',
}

export function GradeBadge({ grade, size = 'medium' }: GradeBadgeProps) {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  // Grade colors are theme-aware (Rule 017) — sahih/hasan/daif each shift
  // between light and dark palettes for contrast.
  const gradeColors: Record<HadithGrade, string> = {
    sahih: colors.sahih,
    hasan: colors.hasan,
    daif: colors.daif,
  }

  const isKnown = grade === 'sahih' || grade === 'hasan' || grade === 'daif'
  const bg = isKnown ? gradeColors[grade as HadithGrade] : colors.mutedText
  const label = isKnown ? GRADE_LABELS[grade as HadithGrade] : 'Ungraded'

  return (
    <View style={[
      styles.badge,
      { backgroundColor: bg },
      size === 'small' && styles.badgeSmall,
    ]}>
      <Text style={[
        styles.text,
        { color: colors.white },
        size === 'small' && styles.textSmall,
      ]}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  text: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: FONT_SIZES.xs,
  },
})
