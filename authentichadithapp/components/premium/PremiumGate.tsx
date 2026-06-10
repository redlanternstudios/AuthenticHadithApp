import React from 'react'
import { Text, StyleSheet, Modal, Pressable, ActivityIndicator, View } from 'react-native'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { COLORS, SPACING, FONT_SIZES } from '../../lib/styles/colors'
import { usePremiumStatus } from '../../hooks/usePremiumStatus'
import { PaywallScreen } from './PaywallScreen'

interface PremiumGateProps {
  feature: string
  description?: string
  children: React.ReactNode
}

export function PremiumGate({ feature, description, children }: PremiumGateProps) {
  const { isPremium, isLoading } = usePremiumStatus()
  const [showPaywall, setShowPaywall] = React.useState(false)

  if (isLoading) {
    // Visible loading state — a silent `return null` left the gated section as
    // blank space on slow networks (Rule 005: no silent null renders).
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.emeraldMid} />
      </View>
    )
  }

  if (isPremium) {
    return <>{children}</>
  }

  return (
    <>
      <Pressable onPress={() => setShowPaywall(true)}>
        <Card style={styles.lockedCard}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>Premium Feature</Text>
          <Text style={styles.lockDescription}>
            {description || `Unlock ${feature} with a premium subscription`}
          </Text>
          <Button
            title="View Plans"
            variant="primary"
            onPress={() => setShowPaywall(true)}
            style={styles.upgradeButton}
          />
        </Card>
      </Pressable>

      <Modal
        visible={showPaywall}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaywall(false)}
      >
        <PaywallScreen
          onDismiss={() => setShowPaywall(false)}
          onPurchaseCompleted={() => setShowPaywall(false)}
          onRestoreCompleted={() => setShowPaywall(false)}
        />
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  lockedCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    opacity: 0.8,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  lockTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.bronzeText,
    marginBottom: SPACING.sm,
  },
  lockDescription: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  upgradeButton: {
    marginTop: SPACING.sm,
  },
})
