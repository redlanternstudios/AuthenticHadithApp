import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { PurchasesPackage } from 'react-native-purchases'
import { purchasePackage as safePurchasePackage } from '../lib/purchases/revenuecat'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { FONT_FAMILY } from '@/constants/theme'
import { Button } from '@/components/ui/Button'
import { useRevenueCat } from '@/lib/revenuecat/RevenueCatProvider'
import { ENTITLEMENT_ID } from '@/lib/revenuecat/config'
import { VISIBLE_COLLECTION_COUNT, VISIBLE_HADITH_TOTAL } from '@/lib/hadith/visibleCollections'

// ─── Value Props ──────────────────────────────────────────────────────────────
const VALUE_PROPS = [
  {
    icon: '📚',
    title: 'Sahihayn Library',
    desc: `${VISIBLE_HADITH_TOTAL.toLocaleString()} hadiths from ${VISIBLE_COLLECTION_COUNT} collections: Sahih Bukhari and Sahih Muslim`,
  },
  {
    icon: '🤖',
    title: 'AI Hadith Assistant',
    desc: 'Ask questions with guidance rooted in the available Sahihayn sources',
  },
  {
    icon: '📈',
    title: 'Learn & Track',
    desc: 'Structured learning with progress tracking across topics',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPlanLabel(packageType: string): string {
  switch (packageType) {
    case 'ANNUAL':
      return 'Annual'
    case 'MONTHLY':
      return 'Monthly'
    case 'LIFETIME':
      return 'Lifetime'
    default:
      return packageType.charAt(0) + packageType.slice(1).toLowerCase()
  }
}

function getAnnualPackage(packages: PurchasesPackage[]): PurchasesPackage | null {
  return packages.find((p) => p.packageType === 'ANNUAL') ?? null
}

function getMonthlyPackage(packages: PurchasesPackage[]): PurchasesPackage | null {
  return packages.find((p) => p.packageType === 'MONTHLY') ?? null
}

function getPlanDescription(packageType: string): string {
  switch (packageType) {
    case 'MONTHLY':
      return 'Start with a 7 day free trial, then monthly premium access. Cancel anytime.'
    case 'ANNUAL':
      return 'Annual premium access for deeper study tools and continued app development.'
    case 'LIFETIME':
      return 'One-time support for premium tools without a recurring subscription.'
    default:
      return 'Full access to Authentic Hadith and all features.'
  }
}

function getPlanPrice(pkg: PurchasesPackage): string {
  const cadence = PACKAGE_CADENCE[pkg.packageType] !== undefined ? PACKAGE_CADENCE[pkg.packageType] : ''
  if (pkg.packageType === 'MONTHLY') {
    return `7 days free, then ${pkg.product.priceString}${cadence}`
  }
  return `${pkg.product.priceString}${cadence}`
}

// ─── Billing cadence map (Apple 3.1.2 — billing term must appear next to price) ──
const PACKAGE_CADENCE: Record<string, string> = {
  MONTHLY: ' / month',
  ANNUAL: ' / year',
  LIFETIME: '',
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PaywallScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const { currentOffering, isLoading, restorePurchases } = useRevenueCat()

  const packages = currentOffering?.availablePackages ?? []

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [restoring, setRestoring] = useState(false)

  // Auto-select MONTHLY on mount so the seven day trial is the default path.
  useEffect(() => {
    if (packages.length > 0 && selectedPackage === null) {
      const monthly = getMonthlyPackage(packages)
      const annual = getAnnualPackage(packages)
      setSelectedPackage(monthly ?? annual ?? packages[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packages])

  // ─── Purchase ───────────────────────────────────────────────────────────────
  const handlePurchase = async () => {
    if (!selectedPackage) return
    setPurchasing(true)
    try {
      const success = await safePurchasePackage(selectedPackage)
      if (success) {
        router.replace('/(tabs)')
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setPurchasing(false)
    }
  }

  // ─── Restore ────────────────────────────────────────────────────────────────
  const handleRestore = async () => {
    setRestoring(true)
    try {
      const info = await restorePurchases()
      if (info === null) {
        Alert.alert('Connection Error', 'Unable to connect to the App Store. Check your connection and try again.')
      } else if (info.entitlements.active[ENTITLEMENT_ID]?.isActive) {
        router.replace('/(tabs)')
      } else {
        Alert.alert('No Subscription Found', 'No active subscription found for this Apple ID.')
      }
    } catch {
      Alert.alert('Restore Failed', 'Could not restore purchases. Please try again.')
    } finally {
      setRestoring(false)
    }
  }

  // ─── Loading state ──────────────────────────────────────────────────────────
  const handleDismiss = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)')
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Pressable
          style={styles.closeButton}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Close paywall"
        >
          <Text style={[styles.closeButtonText, { color: colors.mutedText }]}>✕</Text>
        </Pressable>
        <ActivityIndicator size="large" color={colors.goldMid} />
      </View>
    )
  }

  // ─── No offerings state ─────────────────────────────────────────────────────
  if (!currentOffering || packages.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Pressable
          style={styles.closeButton}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Close paywall"
        >
          <Text style={[styles.closeButtonText, { color: colors.mutedText }]}>✕</Text>
        </Pressable>
        <Text style={[styles.unavailableTitle, { color: colors.bronzeText }]}>
          Plans Temporarily Unavailable
        </Text>
        <Text style={[styles.unavailableDesc, { color: colors.mutedText }]}>
          Subscription plans could not be loaded. Please try again later.
        </Text>
        <Pressable
          onPress={handleRestore}
          disabled={restoring}
          style={styles.restoreButton}
          accessibilityRole="button"
          accessibilityLabel="Restore previous purchases"
        >
          <Text style={[styles.restoreText, { color: colors.goldMid }]}>
            {restoring ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </Pressable>
      </View>
    )
  }

  // ─── Full paywall UI ─────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Dismiss button ── */}
      <Pressable
        style={styles.closeButton}
        onPress={handleDismiss}
        accessibilityRole="button"
        accessibilityLabel="Close paywall"
      >
        <Text style={[styles.closeButtonText, { color: colors.mutedText }]}>✕</Text>
      </Pressable>

      {/* ── Header ── */}
      <View style={styles.headerSection}>
        <View style={[styles.iconCircle, { backgroundColor: colors.goldMid + '20', borderColor: colors.goldMid + '40' }]}>
          <Text style={styles.iconEmoji}>📖</Text>
        </View>
        <Text style={[styles.title, { color: colors.bronzeText }]}>
          Support Authentic Hadith
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Start with a 7 day free trial to enter the Sahihayn study experience.
        </Text>
      </View>

      {/* ── Value Props ── */}
      <View style={[styles.valuePropsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {VALUE_PROPS.map((prop, index) => (
          <View key={prop.title}>
            <View style={styles.valuePropRow}>
              <View style={[styles.valuePropIconWrap, { backgroundColor: colors.goldMid + '18' }]}>
                <Text style={styles.valuePropIcon}>{prop.icon}</Text>
              </View>
              <View style={styles.valuePropText}>
                <Text style={[styles.valuePropTitle, { color: colors.bronzeText }]}>
                  {prop.title}
                </Text>
                <Text style={[styles.valuePropDesc, { color: colors.mutedText }]}>
                  {prop.desc}
                </Text>
              </View>
            </View>
            {index < VALUE_PROPS.length - 1 && (
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            )}
          </View>
        ))}
      </View>

      {/* ── Plan Cards ── */}
      <View style={styles.plansSection}>
        <Text style={[styles.plansLabel, { color: colors.bronzeText }]}>Choose Your Plan</Text>
        {packages.map((pkg) => {
          const isSelected = selectedPackage?.identifier === pkg.identifier
          const isAnnual = pkg.packageType === 'ANNUAL'
          return (
            <Pressable
              key={pkg.identifier}
              style={[
                styles.planCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                isSelected && {
                  borderColor: colors.goldMid,
                  backgroundColor: colors.goldMid + '10',
                },
              ]}
              onPress={() => setSelectedPackage(pkg)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`Select ${getPlanLabel(pkg.packageType)} plan`}
            >
              {/* Best Value badge */}
              {isAnnual && (
                <View style={[styles.badge, { backgroundColor: colors.emeraldMid }]}>
                  <Text style={[styles.badgeText, { color: colors.white }]}>Best Value</Text>
                </View>
              )}

              <View style={styles.planCardInner}>
                {/* Top row: radio + label + price */}
                <View style={styles.planCardRow}>
                  <View style={styles.planCardLeft}>
                    <View
                      style={[
                        styles.radioCircle,
                        { borderColor: isSelected ? colors.goldMid : colors.border },
                        isSelected && { backgroundColor: colors.goldMid },
                      ]}
                    >
                      {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.white }]} />}
                    </View>
                    <Text style={[styles.planName, { color: isSelected ? colors.goldMid : colors.bronzeText }]}>
                      {getPlanLabel(pkg.packageType)}
                    </Text>
                  </View>
                  <Text style={[styles.planPrice, { color: isSelected ? colors.goldMid : colors.bronzeText }]}>
                    {getPlanPrice(pkg)}
                  </Text>
                </View>
                {/* Description — full text, no truncation */}
                <Text style={[styles.planDescription, { color: colors.mutedText }]}>
                  {getPlanDescription(pkg.packageType)}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View>

      {/* ── CTA Button ── */}
      <View style={styles.ctaSection}>
        <Button
          title={purchasing ? 'Processing...' : 'Continue'}
          variant="primary"
          size="large"
          onPress={handlePurchase}
          disabled={!selectedPackage || purchasing}
          isLoading={purchasing}
        />

        {/* ── Restore Link ── */}
        <Pressable
          onPress={handleRestore}
          disabled={restoring}
          style={styles.restoreButton}
          accessibilityRole="button"
          accessibilityLabel="Restore previous purchases"
        >
          <Text style={[styles.restoreText, { color: colors.goldMid }]}>
            {restoring ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </Pressable>

        {/* ── Legal ── */}
        <View style={styles.legalRow}>
          <Text
            style={[styles.legalLink, { color: colors.mutedText }]}
            onPress={() => Linking.openURL('https://byredllc.com/terms')}
          >
            Terms of Service
          </Text>
          <Text style={[styles.legalDot, { color: colors.mutedText }]}> · </Text>
          <Text
            style={[styles.legalLink, { color: colors.mutedText }]}
            onPress={() => Linking.openURL('https://byredllc.com/privacy')}
          >
            Privacy Policy
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },

  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Value props card
  valuePropsContainer: {
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  valuePropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  valuePropIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valuePropIcon: {
    fontSize: 22,
  },
  valuePropText: {
    flex: 1,
  },
  valuePropTitle: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  valuePropDesc: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: SPACING.md + 44 + SPACING.md,
  },

  // Plans
  plansSection: {
    marginBottom: SPACING.xl,
  },
  plansLabel: {
    fontFamily: FONT_FAMILY.headingMedium,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: SPACING.md,
    letterSpacing: -0.1,
  },
  planCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  planCardInner: {
    flexDirection: 'column',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  planCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  planCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-end',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderBottomLeftRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  planDescription: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginTop: SPACING.xs,
    paddingLeft: 30,
  },
  planPrice: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },

  // CTA section
  ctaSection: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  restoreButton: {
    paddingVertical: SPACING.xs,
  },
  restoreText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
  },
  legalLink: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.xs,
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.xs,
  },

  // Close / dismiss button
  closeButton: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    zIndex: 10,
    padding: SPACING.sm,
  },
  closeButtonText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.xl,
    lineHeight: 24,
  },

  // Unavailable state
  unavailableTitle: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  unavailableDesc: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
})
