/**
 * RC Diagnostics — Build #17 visibility scaffold.
 *
 * Read-only view of the RevenueCat lifecycle for TestFlight debugging.
 * Renders rcDiag events and current provider state with no secrets, no full
 * UUIDs, no JWTs. Gated in app/settings/index.tsx behind a hidden tap counter
 * on the settings header so it does not appear in the normal user flow.
 *
 * REMOVAL: Strip this file + the tap-counter block + lib/revenuecat/diagnostics.ts
 * imports in Build #18 once RC stabilizes. See BUILD_FIX_LOG.md FIX-049.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native'
import { Stack } from 'expo-router'
import Constants from 'expo-constants'
import { SPACING, FONT_SIZES, BORDER_RADIUS, getColors } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { useRevenueCat } from '@/lib/revenuecat/RevenueCatProvider'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ENTITLEMENT_ID } from '@/lib/revenuecat/config'
import { rcDiag, maskUserId, type RcDiagSnapshot, type RcDiagEvent } from '@/lib/revenuecat/diagnostics'

function findLatest(events: RcDiagEvent[], name: string): RcDiagEvent | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].name === name) return events[i]
  }
  return undefined
}

export default function RcDiagnosticsScreen() {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const { user } = useAuth()
  const { isConfigured, isLoading, isPro, customerInfo } = useRevenueCat()

  const [snapshot, setSnapshot] = useState<RcDiagSnapshot>(() => rcDiag.getSnapshot())

  useEffect(() => {
    return rcDiag.subscribe(setSnapshot)
  }, [])

  const apiKeyIos = Constants.expoConfig?.extra?.revenueCatApiKeyIos as string | undefined
  const apiKeyFallback = Constants.expoConfig?.extra?.revenueCatApiKey as string | undefined
  const resolvedKey = apiKeyIos ?? apiKeyFallback
  const keyPresent = !!resolvedKey
  const keyPrefix = resolvedKey ? resolvedKey.slice(0, 5) : null

  const sdkRequireFail = useMemo(
    () => findLatest(snapshot.events, 'SDK_REQUIRE'),
    [snapshot.events],
  )
  const configureAttempt = useMemo(
    () => findLatest(snapshot.events, 'CONFIGURE_ATTEMPT'),
    [snapshot.events],
  )
  const configureSuccess = useMemo(
    () => findLatest(snapshot.events, 'CONFIGURE_SUCCESS'),
    [snapshot.events],
  )
  const configureFail = useMemo(
    () => findLatest(snapshot.events, 'CONFIGURE_FAIL'),
    [snapshot.events],
  )
  const loginAttempt = useMemo(
    () => findLatest(snapshot.events, 'LOGIN_ATTEMPT'),
    [snapshot.events],
  )
  const loginSuccess = useMemo(
    () => findLatest(snapshot.events, 'LOGIN_SUCCESS'),
    [snapshot.events],
  )
  const loginFail = useMemo(
    () => findLatest(snapshot.events, 'LOGIN_FAIL'),
    [snapshot.events],
  )
  const customerInfoFetch = useMemo(
    () => findLatest(snapshot.events, 'CUSTOMER_INFO_FETCH'),
    [snapshot.events],
  )

  const appUserIdMasked = maskUserId(customerInfo?.originalAppUserId ?? null)
  const lastFetchTs = customerInfo?.requestDate ?? null
  const ageSec = lastFetchTs
    ? Math.max(0, Math.round((Date.now() - new Date(lastFetchTs).getTime()) / 1000))
    : null

  const entitlementActive = customerInfo?.entitlements.active[ENTITLEMENT_ID]?.isActive === true

  const recent = snapshot.events.slice(-10).reverse()

  const dumpJson = useMemo(
    () =>
      JSON.stringify(
        {
          platform: Platform.OS,
          sdkLoaded: !sdkRequireFail,
          keyPresent,
          keyPrefix,
          isConfigured,
          isLoading,
          isPro,
          entitlementKey: ENTITLEMENT_ID,
          entitlementActive,
          supabaseUserIdPresent: !!user?.id,
          supabaseUserIdMasked: maskUserId(user?.id),
          appUserIdMasked,
          customerInfoLastFetch: lastFetchTs,
          customerInfoAgeSec: ageSec,
          latestConfigureAttempt: configureAttempt?.payload ?? null,
          latestConfigureSuccess: configureSuccess?.payload ?? null,
          latestConfigureFail: configureFail?.payload ?? null,
          latestLoginAttempt: loginAttempt?.payload ?? null,
          latestLoginSuccess: loginSuccess?.payload ?? null,
          latestLoginFail: loginFail?.payload ?? null,
          latestCustomerInfoFetch: customerInfoFetch?.payload ?? null,
          recentEvents: recent,
          diagStartedAt: snapshot.startedAt,
        },
        null,
        2,
      ),
    [
      sdkRequireFail,
      keyPresent,
      keyPrefix,
      isConfigured,
      isLoading,
      isPro,
      entitlementActive,
      user?.id,
      appUserIdMasked,
      lastFetchTs,
      ageSec,
      configureAttempt,
      configureSuccess,
      configureFail,
      loginAttempt,
      loginSuccess,
      loginFail,
      customerInfoFetch,
      recent,
      snapshot.startedAt,
    ],
  )

  const yes = (b: boolean) => (b ? 'yes' : 'no')

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'RC Diagnostics',
          headerShown: true,
          headerBackTitle: 'Settings',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.emeraldMid,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.bronzeText }]}>RC Diagnostics</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            Build #17 visibility scaffold. Will be removed in Build #18.
          </Text>
        </View>

        <SettingsSection title="Environment">
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Row label="Platform" value={Platform.OS} colors={colors} />
            <Row label="SDK module loaded" value={yes(!sdkRequireFail)} colors={colors} />
            <Row label="API key present" value={yes(keyPresent)} colors={colors} />
            <Row label="API key prefix" value={keyPrefix ?? '—'} colors={colors} />
          </View>
        </SettingsSection>

        <SettingsSection title="Lifecycle State">
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Row label="isLoading" value={yes(isLoading)} colors={colors} />
            <Row label="isConfigured (React)" value={yes(isConfigured)} colors={colors} />
            <Row label="isPro" value={yes(isPro)} colors={colors} />
            <Row
              label="Configure attempted"
              value={configureAttempt ? configureAttempt.ts : 'never'}
              colors={colors}
            />
            <Row
              label="Configure success"
              value={configureSuccess ? configureSuccess.ts : 'never'}
              colors={colors}
            />
            <Row
              label="Configure last error"
              value={(configureFail?.payload?.message as string) ?? '—'}
              colors={colors}
            />
          </View>
        </SettingsSection>

        <SettingsSection title="Identity">
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Row label="Supabase user.id present" value={yes(!!user?.id)} colors={colors} />
            <Row label="Supabase user.id (masked)" value={maskUserId(user?.id) ?? '—'} colors={colors} />
            <Row label="RC appUserID (masked)" value={appUserIdMasked ?? '—'} colors={colors} />
            <Row
              label="Login attempted"
              value={loginAttempt ? loginAttempt.ts : 'never'}
              colors={colors}
            />
            <Row
              label="Login success"
              value={loginSuccess ? loginSuccess.ts : 'never'}
              colors={colors}
            />
            <Row
              label="Login last error"
              value={(loginFail?.payload?.message as string) ?? '—'}
              colors={colors}
            />
          </View>
        </SettingsSection>

        <SettingsSection title="Entitlement">
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Row label="Entitlement key checked" value={ENTITLEMENT_ID} colors={colors} />
            <Row label="Entitlement active" value={yes(entitlementActive)} colors={colors} />
            <Row label="CustomerInfo last fetch" value={lastFetchTs ?? '—'} colors={colors} />
            <Row label="CustomerInfo age (sec)" value={ageSec !== null ? String(ageSec) : '—'} colors={colors} />
          </View>
        </SettingsSection>

        <SettingsSection title="Last 10 events">
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {recent.length === 0 ? (
              <Text style={[styles.eventEmpty, { color: colors.mutedText }]}>No events yet.</Text>
            ) : (
              recent.map((e, i) => (
                <View
                  key={`${e.ts}-${i}`}
                  style={[
                    styles.eventRow,
                    i < recent.length - 1 && {
                      borderBottomColor: colors.borderSubtle,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <Text style={[styles.eventTs, { color: colors.mutedText }]}>{e.ts}</Text>
                  <Text style={[styles.eventName, { color: colors.bronzeText }]}>
                    {e.name} · {e.status}
                  </Text>
                  <Text style={[styles.eventPayload, { color: colors.mutedText }]} selectable>
                    {JSON.stringify(e.payload)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </SettingsSection>

        <SettingsSection title="JSON dump (long-press to select)">
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dump, { color: colors.bronzeText }]} selectable>
              {dumpJson}
            </Text>
          </View>
        </SettingsSection>
      </ScrollView>
    </View>
  )
}

type RowProps = {
  label: string
  value: string
  colors: ReturnType<typeof getColors>
}

function Row({ label, value, colors }: RowProps) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.bronzeText }]} selectable>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  header: { marginBottom: SPACING.lg },
  headerTitle: { fontSize: FONT_SIZES.xxxl, fontWeight: '700', marginBottom: SPACING.xs },
  headerSubtitle: { fontSize: FONT_SIZES.sm },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  row: { paddingVertical: SPACING.sm },
  rowLabel: { fontSize: FONT_SIZES.xs, marginBottom: 2 },
  rowValue: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
  eventRow: { paddingVertical: SPACING.sm },
  eventTs: { fontSize: FONT_SIZES.xs, marginBottom: 2 },
  eventName: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: 2 },
  eventPayload: { fontSize: FONT_SIZES.xs, fontStyle: 'italic' },
  eventEmpty: { fontSize: FONT_SIZES.sm, fontStyle: 'italic' },
  dump: { fontSize: FONT_SIZES.xs, fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }) },
})
