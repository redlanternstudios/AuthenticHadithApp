import React from 'react'
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  PressableProps,
  ViewStyle,
} from 'react-native'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, BORDER_RADIUS, SPACING, FONT_SIZES, LAYOUT } from '@/lib/styles/colors'

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  isLoading?: boolean
  style?: ViewStyle
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { isDark } = useTheme()
  const colors = getColors(isDark)

  const containerStyle: ViewStyle = {
    ...(variant === 'primary' && { backgroundColor: colors.emeraldMid }),
    ...(variant === 'secondary' && { backgroundColor: colors.goldMid }),
    ...(variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.emeraldMid,
    }),
    ...(variant === 'ghost' && { backgroundColor: 'transparent' }),
  }

  const textColor =
    variant === 'primary' || variant === 'secondary'
      ? colors.white
      : variant === 'outline'
      ? colors.emeraldMid
      : colors.emeraldMid

  const sizeStyles: { container: ViewStyle; fontSize: number } =
    size === 'small'
      ? { container: { minHeight: LAYOUT.buttonHeightSm, paddingHorizontal: SPACING.md }, fontSize: FONT_SIZES.sm }
      : size === 'large'
      ? { container: { minHeight: LAYOUT.buttonHeightLg, paddingHorizontal: SPACING.xl }, fontSize: FONT_SIZES.md }
      : { container: { minHeight: LAYOUT.buttonHeightMd, paddingHorizontal: SPACING.lg }, fontSize: FONT_SIZES.base }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        containerStyle,
        sizeStyles.container,
        (disabled || isLoading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'secondary' ? colors.white : colors.emeraldMid}
        />
      ) : (
        <Text style={[styles.text, { color: textColor, fontSize: sizeStyles.fontSize }]}>
          {title}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.lg,  // 14 — rounds without becoming a pill
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
})
