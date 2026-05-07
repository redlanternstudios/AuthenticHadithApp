import React from 'react'
import { View, StyleSheet } from 'react-native'
import RevenueCatUI from 'react-native-purchases-ui'
import { COLORS } from '../../lib/styles/colors'

interface CustomerCenterScreenProps {
  onDismiss?: () => void
}

/**
 * Renders the RevenueCat Customer Center UI.
 * Allows users to manage their subscriptions (cancel, change plan, request refund).
 * Configure Customer Center paths in the RevenueCat Dashboard.
 */
export function CustomerCenterScreen({ onDismiss }: CustomerCenterScreenProps) {
  return (
    <View style={styles.container}>
      <RevenueCatUI.CustomerCenterView
        onDismiss={onDismiss}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
})
