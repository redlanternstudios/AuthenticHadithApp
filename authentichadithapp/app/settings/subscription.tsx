import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { SPACING, FONT_SIZES , getColors } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  getSubscriptionStatus,
  isRevenueCatConfigured,
  type SubscriptionStatus,
} from '@/lib/purchases/revenuecat';
import { useRevenueCat } from '@/lib/revenuecat/RevenueCatProvider';
import { isReviewerEmail } from '@/lib/revenuecat/config';
import { useAuth } from '@/lib/auth/AuthProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// RevenueCat purchase errors expose richer fields than `.message`. Prefer them
// so users see something actionable instead of a catch-all fallback.
function extractPurchaseError(err: any, fallback: string): string {
  if (!err) return fallback;
  if (err.userCancelled) return ''; // signal: do not alert
  const readable = err.readableErrorCode || err.userInfo?.readableErrorCode;
  const underlying = err.underlyingErrorMessage || err.userInfo?.NSUnderlyingError?.message;
  const msg = typeof err.message === 'string' ? err.message.trim() : '';
  if (msg) return underlying ? `${msg} (${underlying})` : msg;
  if (readable) return `${readable.replace(/_/g, ' ').toLowerCase()}.`.replace(/^./, (c: string) => c.toUpperCase());
  if (underlying) return underlying;
  if (typeof err.code !== 'undefined') return `${fallback} (code ${err.code})`;
  return fallback;
}

// FIX-089 lockdown — Apple 2.3.2 / 3.1.2: paywall titles + prices are HARDCODED
// per product identifier, exactly matching the App Store Connect Display Name
// and Price for each IAP. Dynamic StoreKit fetching can surface a locale-shifted
// title ("LifetimePremium" camelCase leak — see FIX-088) or a bare price string
// with no billing cadence ($49.99 with no "/year" — Apple 3.1.2 rejection
// 2026-06-16). Pinning the strings here removes reviewer drift entirely. Unknown
// product identifiers fall back to the StoreKit values so the screen never
// renders blank if a new package is added to the RC offering later.
function getHardcodedDisplay(pkg: any): { title: string; price: string } {
  const id = pkg?.product?.identifier as string | undefined;
  switch (id) {
    case 'ah_monthly_premium':
      return { title: 'Premium Monthly',  price: '$9.99 / month' };
    case 'ah_annual_premium':
      return { title: 'Premium Annual',   price: '$49.99 / year' };
    case 'ah_lifetime_premium':
      return { title: 'Lifetime Premium', price: '$99.99' };
    default:
      return {
        title: (pkg?.product?.title ?? '').replace(/([a-z])([A-Z])/g, '$1 $2'),
        price: pkg?.product?.priceString ?? '',
      };
  }
}

function SubscriptionScreenInner() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [offerings, setOfferings] = useState<any>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  // Canonical provider state — refreshed after purchase/restore so every other
  // isPro consumer (Profile CTA, PremiumGate) updates in the same frame.
  const { refreshCustomerInfo } = useRevenueCat();
  const { user } = useAuth();
  // Allowlisted (reviewer/internal lifetime) accounts display Lifetime here even
  // without an RC grant — same canonical rule as Profile, so the two screens
  // can never disagree (FIX-082 family).
  const allowlistLifetime = isReviewerEmail(user?.email);

  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [off, sub] = await Promise.all([getOfferings(), getSubscriptionStatus()]);
        // getOfferings / getSubscriptionStatus swallow errors and return
        // null / defaultStatus on degraded mode. Surface that explicitly so
        // the screen doesn't fall through to a misleading "No plans" message.
        if (!isRevenueCatConfigured()) {
          setInitError(
            Platform.OS === 'web'
              ? 'In-app purchases are available on iOS and Android.'
              : 'In-app purchases are unavailable right now. Please make sure you are signed in and online, then reopen this screen.'
          );
        } else if (!off || !off.availablePackages || off.availablePackages.length === 0) {
          setInitError(
            'No subscription plans are currently available from the App Store. This usually means in-app purchases are still being provisioned. Please try again in a few minutes.'
          );
        }
        setOfferings(off);
        setStatus(sub);
      } catch (err: any) {
        setInitError(err.message || 'Failed to load subscription info.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePurchase = async (pkg: any) => {
    setPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        const newStatus = await getSubscriptionStatus();
        setStatus(newStatus);
        await refreshCustomerInfo(); // sync canonical isPro (Profile/PremiumGate)
        Alert.alert('Welcome to Premium!', 'Your subscription is now active.');
      }
    } catch (err: any) {
      const message = extractPurchaseError(err, 'Something went wrong. Please try again.');
      if (message) Alert.alert('Purchase Failed', message);
    } finally {
      setPurchasing(false);
    }
  };

  // FIX-089 — Patch C: Apple 3.1.1 — Restore Purchases must show visible loading
  // state and a clear success/error alert verified against the canonical entitlement.
  // Three-step verify: restorePurchases (StoreKit) → refreshCustomerInfo (RC provider
  // sync) → getSubscriptionStatus (re-fetch to confirm entitlement post-sync).
  const handleRestore = async () => {
    // setRestoring(true) immediately swaps button text → ActivityIndicator (see render).
    setRestoring(true);
    try {
      await restorePurchases(); // contacts StoreKit and refreshes RC receipt
      await refreshCustomerInfo(); // syncs canonical isPro across all consumers
      // Re-verify entitlement post-provider-sync — do not rely on the snapshot
      // returned by restorePurchases() which may be stale on the first RC call.
      const verified = await getSubscriptionStatus();
      setStatus(verified);
      if (verified.isActive) {
        Alert.alert('Purchases Restored', 'Your Premium access has been restored successfully.');
      } else {
        Alert.alert('Nothing to Restore', 'No previous purchases were found for this Apple ID.');
      }
    } catch (err: any) {
      const message = extractPurchaseError(err, 'Restore failed. Please try again.');
      if (message) Alert.alert('Restore Failed', message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Subscription',
          headerShown: true,
          headerBackTitle: 'Settings',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.emeraldMid,
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.bronzeText} style={{ marginTop: 40 }} />
        ) : initError ? (
          <View style={styles.fallback}>
            <Text style={[styles.fallbackText, { color: colors.mutedText }]}>{initError}</Text>
          </View>
        ) : (
          <>
        {/* Current status */}
        <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statusLabel, { color: colors.mutedText }]}>Current Plan</Text>
          <Text style={[styles.statusTier, { color: colors.bronzeText }]}>
            {allowlistLifetime || status?.tier === 'lifetime' ? 'Lifetime' : status?.tier === 'free' ? 'Free' : 'Premium'}
          </Text>
          {allowlistLifetime || (status?.isActive && status.tier === 'lifetime') ? (
            <Text style={[styles.statusExpiry, { color: colors.mutedText }]}>
              Lifetime ♾️ — no renewal date
            </Text>
          ) : status?.isActive && status.expiresAt ? (
            <Text style={[styles.statusExpiry, { color: colors.mutedText }]}>
              {status.willRenew ? 'Renews' : 'Expires'}: {new Date(status.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </Text>
          ) : null}
        </View>

        {/* Packages */}
        {offerings?.availablePackages ? (
          <View style={styles.packages}>
            {offerings.availablePackages.map((pkg: any) => {
              // FIX-089 lockdown — pin title + price to ASC-matched literals.
              const display = getHardcodedDisplay(pkg);
              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[styles.packageCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handlePurchase(pkg)}
                  disabled={purchasing || (status?.isActive ?? false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.packageTitle, { color: colors.bronzeText }]}>
                    {display.title}
                  </Text>
                  <Text style={[styles.packagePrice, { color: colors.bronzeText }]}>
                    {display.price}
                  </Text>
                  <Text style={[styles.packageDesc, { color: colors.mutedText }]}>
                    {pkg.product.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.fallback}>
            <Text style={[styles.fallbackText, { color: colors.mutedText }]}>
              {Platform.OS === 'web'
                ? 'In-app purchases are available on iOS and Android.'
                : 'No subscription plans available right now. Please try again later.'}
            </Text>
          </View>
        )}

        {/* Restore Purchases button — Apple requires this */}
        <TouchableOpacity
          style={[styles.restoreButton, { borderColor: colors.border }]}
          onPress={handleRestore}
          disabled={restoring}
          activeOpacity={0.7}
        >
          {restoring ? (
            <ActivityIndicator size="small" color={colors.bronzeText} />
          ) : (
            <Text style={[styles.restoreText, { color: colors.bronzeText }]}>
              Restore Purchases
            </Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.legalText, { color: colors.mutedText }]}>
          Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions in your App Store account settings.
        </Text>

        {/* Apple 3.1.2(c): auto-renewable subscriptions must show functional links to
            Terms of Use (EULA) and Privacy Policy on the paywall itself. EULA uses
            Apple's standard Terms of Use; Privacy uses the app's canonical policy URL. */}
        <View style={styles.legalLinks}>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
            activeOpacity={0.7}
          >
            <Text style={[styles.legalLink, { color: colors.emeraldMid }]}>Terms of Use (EULA)</Text>
          </TouchableOpacity>
          <Text style={[styles.legalLinkSep, { color: colors.mutedText }]}>•</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://byredllc.com/privacy')}
            activeOpacity={0.7}
          >
            <Text style={[styles.legalLink, { color: colors.emeraldMid }]}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  statusCard: {
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statusLabel: { fontSize: FONT_SIZES.sm, marginBottom: 4 },
  statusTier: { fontSize: FONT_SIZES.xxl, fontWeight: '700' },
  statusExpiry: { fontSize: FONT_SIZES.sm, marginTop: 4 },
  packages: { gap: SPACING.sm },
  packageCard: {
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  packageTitle: { fontSize: FONT_SIZES.md, fontWeight: '600', marginBottom: 4 },
  packagePrice: { fontSize: FONT_SIZES.lg, fontWeight: '700', marginBottom: 4 },
  packageDesc: { fontSize: FONT_SIZES.sm },
  fallback: { alignItems: 'center', paddingVertical: 40 },
  fallbackText: { fontSize: FONT_SIZES.sm, textAlign: 'center' },
  restoreButton: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  restoreText: { fontSize: FONT_SIZES.base, fontWeight: '600' },
  legalText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  legalLink: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalLinkSep: {
    fontSize: 12,
  },
});

export default function SubscriptionScreen() {
  return (
    <ErrorBoundary>
      <SubscriptionScreenInner />
    </ErrorBoundary>
  );
}
