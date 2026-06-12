import React from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { getColors } from '../../lib/styles/colors'
import { useTheme } from '../../lib/theme/ThemeProvider'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  color?: string
}

export function LoadingSpinner({ size = 'large', color }: LoadingSpinnerProps) {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  // Default to the theme-aware brand emerald (Rule 017) — light/dark differ.
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color ?? colors.emeraldMid} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
})
