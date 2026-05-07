import React from 'react'
import { View, StyleSheet, ViewProps } from 'react-native'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, BORDER_RADIUS, SPACING, SHADOWS } from '@/lib/styles/colors'

interface CardProps extends ViewProps {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'ghost'
}

export function Card({ children, variant = 'default', style, ...props }: CardProps) {
  const { isDark } = useTheme()
  const colors = getColors(isDark)

  const shadowStyle = variant === 'elevated'
    ? (isDark ? SHADOWS.cardDark : SHADOWS.card)
    : variant === 'default'
    ? SHADOWS.subtle
    : {}

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        variant === 'ghost' && styles.ghost,
        shadowStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,  // 20 — premium iOS card radius
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
})
