import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'

interface Props {
  message?: string
  onRetry?: () => void
}

export function QueryErrorBanner({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: Props) {
  const { isDark } = useTheme()
  const colors = getColors(isDark)

  return (
    <View style={[styles.container, { backgroundColor: colors.error + '14', borderColor: colors.error + '40' }]}>
      <View style={styles.row}>
        <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
        <Text style={[styles.message, { color: colors.error }]}>{message}</Text>
      </View>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryBtn, { borderColor: colors.error + '60' }]}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={14} color={colors.error} />
          <Text style={[styles.retryText, { color: colors.error }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  message: {
    fontSize: FONT_SIZES.sm,
    flex: 1,
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: SPACING.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
})
