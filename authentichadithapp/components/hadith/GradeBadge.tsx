import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZES } from '../../lib/styles/colors'
import { HadithGrade } from '../../types/hadith'

interface GradeBadgeProps {
  grade: HadithGrade | null | undefined
  size?: 'small' | 'medium'
}

const GRADE_COLORS: Record<HadithGrade, string> = {
  sahih: COLORS.sahih,
  hasan: COLORS.hasan,
  daif: COLORS.daif,
}

const GRADE_LABELS: Record<HadithGrade, string> = {
  sahih: 'Sahih',
  hasan: 'Hasan',
  daif: 'Daif',
}

const UNGRADED_COLOR = COLORS.mutedText ?? '#7B7B7B'

export function GradeBadge({ grade, size = 'medium' }: GradeBadgeProps) {
  const isKnown = grade === 'sahih' || grade === 'hasan' || grade === 'daif'
  const bg = isKnown ? GRADE_COLORS[grade as HadithGrade] : UNGRADED_COLOR
  const label = isKnown ? GRADE_LABELS[grade as HadithGrade] : 'Ungraded'

  return (
    <View style={[
      styles.badge,
      { backgroundColor: bg },
      size === 'small' && styles.badgeSmall,
    ]}>
      <Text style={[
        styles.text,
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
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: FONT_SIZES.xs,
  },
})
