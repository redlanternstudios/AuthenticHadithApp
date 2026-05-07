import React from 'react'
import { View, StyleSheet } from 'react-native'
import RevenueCatUI from 'react-native-purchases-ui'
import { COLORS, SPACING } from '../../lib/styles/colors'

interface PaywallScreenProps {
  onDismiss?: () => void
  onPurchaseCompleted?: () => void
  onRestoreCompleted?: () => void
}

/**
 * Renders the RevenueCat paywall configured in the RevenueCat Dashboard.
 * Make sure to configure a Paywall template in the RevenueCat Dashboard first.
 */
export function PaywallScreen({ onDismiss, onPurchaseCompleted, onRestoreCompleted }: PaywallScreenProps) {
  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        onDismiss={onDismiss}
        onPurchaseCompleted={({ customerInfo }) => {
          onPurchaseCompleted?.()
        }}
        onRestoreCompleted={({ customerInfo }) => {
          onRestoreCompleted?.()
        }}
      />
    </View>
  )
}

/**
 * Presents the paywall conditionally — only if the user does NOT have
 * the "RedLantern Studios Pro" entitlement.
 * If the user already has it, `children` are rendered instead.
 */
export function PaywallGate({ children }: { children: React.ReactNode }) {
  return (
    <RevenueCatUI.Paywall>
      {children}
    </RevenueCatUI.Paywall>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
})
