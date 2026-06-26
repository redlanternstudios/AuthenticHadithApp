import React from 'react'
import { View, StyleSheet, ViewProps } from 'react-native'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, BORDER_RADIUS, SHADOWS } from '@/lib/styles/colors'

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
        // Web parity A#3: elevated cards get a gold left accent border
        // (hadith-card-condensed.tsx:141 border-l-4 border-l-[#C5A059])
        variant === 'elevated' && { borderLeftWidth: 4, borderLeftColor: colors.goldMid },
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
    // A#5: 16px radius matches web rounded-2xl (daily-hadith-card.tsx, hadith-card-condensed.tsx)
    borderRadius: BORDER_RADIUS.card,
    // A#4: 20px padding matches web p-5 / daily-hadith-card.tsx roomier cards (up from 16px SPACING.md)
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
})
