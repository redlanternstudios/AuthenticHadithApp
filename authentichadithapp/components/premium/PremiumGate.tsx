import React from 'react'
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native'
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
    return null
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
