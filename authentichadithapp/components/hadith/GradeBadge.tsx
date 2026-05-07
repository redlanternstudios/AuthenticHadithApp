import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZES } from '../../lib/styles/colors'
import { HadithGrade } from '../../types/hadith'

interface GradeBadgeProps {
  grade: HadithGrade
  size?: 'small' | 'medium'
}

export function GradeBadge({ grade, size = 'medium' }: GradeBadgeProps) {
  const gradeColors = {
    sahih: COLORS.sahih,
    hasan: COLORS.hasan,
    daif: COLORS.daif,
  }

  const gradeLabels = {
    sahih: 'Sahih',
    hasan: 'Hasan',
    daif: 'Daif',
  }

  return (
    <View style={[
      styles.badge, 
      { backgroundColor: gradeColors[grade] },
      size === 'small' && styles.badgeSmall,
    ]}>
      <Text style={[
        styles.text,
        size === 'small' && styles.textSmall,
      ]}>
        {gradeLabels[grade]}
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
