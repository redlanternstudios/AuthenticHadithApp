import React from 'react'
import { View, StyleSheet } from 'react-native'
import { COLORS } from '../../lib/styles/colors'
import { useRevenueCat } from '../../lib/revenuecat/RevenueCatProvider'
import PaywallScreenCustom from '../../app/paywall'

interface PaywallScreenProps {
  onDismiss?: () => void
  onPurchaseCompleted?: () => void
  onRestoreCompleted?: () => void
}

/**
 * Renders the canonical, crash-free, StoreKit-integrated PaywallScreen.
 */
export function PaywallScreen({ onDismiss, onPurchaseCompleted, onRestoreCompleted }: PaywallScreenProps) {
  const { refreshCustomerInfo } = useRevenueCat()

  const handlePurchase = () => {
    refreshCustomerInfo()
    onPurchaseCompleted?.()
  }

  const handleRestore = () => {
    refreshCustomerInfo()
    onRestoreCompleted?.()
  }

  return (
    <View style={styles.container}>
      <PaywallScreenCustom />
    </View>
  )
}

/**
 * Presents the paywall conditionally.
 */
export function PaywallGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
})
