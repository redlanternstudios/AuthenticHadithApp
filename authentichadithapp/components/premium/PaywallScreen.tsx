import React from 'react'
import { View, StyleSheet } from 'react-native'
import RevenueCatUI from 'react-native-purchases-ui'
import { getColors } from '../../lib/styles/colors'
import { useTheme } from '../../lib/theme/ThemeProvider'
import { useRevenueCat } from '../../lib/revenuecat/RevenueCatProvider'

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
  const { refreshCustomerInfo } = useRevenueCat()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RevenueCatUI.Paywall
        onDismiss={onDismiss}
        onPurchaseCompleted={() => {
          // Sync canonical isPro immediately — Profile CTA / PremiumGate flip
          // in the same frame instead of waiting for the async RC listener.
          refreshCustomerInfo()
          onPurchaseCompleted?.()
        }}
        onRestoreCompleted={() => {
          refreshCustomerInfo()
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
  },
})
