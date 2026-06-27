import React from 'react'
import { TextInput, StyleSheet, TextInputProps, View, Text } from 'react-native'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, BORDER_RADIUS, SPACING, FONT_SIZES, LAYOUT } from '@/lib/styles/colors'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, style, ...props }, ref) => {
    const { isDark } = useTheme()
    const colors = getColors(isDark)

    return (
      <View style={styles.container}>
        {label && (
          <Text style={[styles.label, { color: colors.bronzeText }]}>{label}</Text>
        )}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              backgroundColor: isDark ? colors.card : colors.white,
              borderColor: error ? colors.error : colors.border,
              color: colors.bronzeText,
            },
            style,
          ]}
          placeholderTextColor={colors.mutedText}
          {...props}
        />
        {error && (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        )}
      </View>
    )
  }
)

Input.displayName = 'Input'

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.lg,  // 14 — matches button radius
    paddingHorizontal: SPACING.md,
    paddingVertical: 0,
    fontSize: FONT_SIZES.base,
    minHeight: LAYOUT.inputHeight,   // 52 — generous tap target
  },
  error: {
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
})
