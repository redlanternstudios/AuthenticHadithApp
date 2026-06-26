import React from 'react'
import { View, StyleSheet } from 'react-native'
import RevenueCatUI from 'react-native-purchases-ui'
import { getColors } from '../../lib/styles/colors'
import { useTheme } from '../../lib/theme/ThemeProvider'

interface CustomerCenterScreenProps {
  onDismiss?: () => void
}

/**
 * Renders the RevenueCat Customer Center UI.
 * Allows users to manage their subscriptions (cancel, change plan, request refund).
 * Configure Customer Center paths in the RevenueCat Dashboard.
 */
export function CustomerCenterScreen({ onDismiss }: CustomerCenterScreenProps) {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RevenueCatUI.CustomerCenterView
        onDismiss={onDismiss}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
