import React from 'react'
import { useRouter } from 'expo-router'
import { Text, StyleSheet, Pressable, ActivityIndicator, View } from 'react-native'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { getColors, COLORS, SPACING, FONT_SIZES } from '../../lib/styles/colors'
import { useTheme } from '../../lib/theme/ThemeProvider'
import { FONT_FAMILY } from '../../constants/theme'
import { usePremiumStatus } from '../../hooks/usePremiumStatus'

interface PremiumGateProps {
  feature: string
  description?: string
  children: React.ReactNode
}

export function PremiumGate({ feature, description, children }: PremiumGateProps) {
  const { isPremium, isLoading } = usePremiumStatus()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const router = useRouter()

  if (isLoading) {
    // FIX-070: Brand skeleton — theme-aware background prevents white flash on
    // dark mode while RC entitlement resolves (network drop degrades gracefully).
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.emeraldMid} />
      </View>
    )
  }

  if (isPremium) {
    return <>{children}</>
  }

  return (
    <Pressable onPress={() => router.push('/paywall')}>
      <Card style={styles.lockedCard}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.lockTitle}>Premium Feature</Text>
        <Text style={styles.lockDescription}>
          {description || `Unlock ${feature} with a premium subscription`}
        </Text>
        <Button
          title="View Plans"
          variant="primary"
          onPress={() => router.push('/paywall')}
          style={styles.upgradeButton}
        />
      </Card>
    </Pressable>
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
    fontFamily: FONT_FAMILY.bodySemiBold,
    color: COLORS.bronzeText,
    marginBottom: SPACING.sm,
  },
  lockDescription: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.mutedText,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  upgradeButton: {
    marginTop: SPACING.sm,
  },
})
