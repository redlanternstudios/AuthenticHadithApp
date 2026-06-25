import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { SPACING, FONT_SIZES , getColors } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsItem } from '@/components/settings/SettingsItem';
import { FONT_FAMILY } from '@/constants/theme';

/**
 * Main settings screen
 * Navigation hub for all app settings and preferences
 *
 * v1.0 note: Language (Arabic/i18n) row is intentionally hidden.
 * Full i18n is deferred to v1.1 — the settings/language screen and
 * LanguageProvider remain in the codebase for future use.
 */
export default function SettingsScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerShown: true,
          headerBackTitle: 'Back',
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
          <Text style={[styles.headerTitle, { color: colors.bronzeText }]}>⚙️ Settings</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            Manage your app preferences
          </Text>
        </View>

        <SettingsSection title="Preferences">
          <SettingsItem
            icon="moon"
            title="Appearance"
            subtitle="Dark mode and theme"
            showArrow
            onPress={() => router.push('/settings/appearance')}
            isFirst
          />
          <SettingsItem
            icon="notifications"
            title="Notifications"
            subtitle="Alerts and reminders"
            showArrow
            onPress={() => router.push('/settings/notifications')}
            isLast
          />
          {/* Language row hidden for v1.0 — Arabic/RTL i18n deferred to v1.1.
              Remove this comment and restore the SettingsItem when wiring t()
              across all screens in a future release. */}
        </SettingsSection>

        <SettingsSection title="Data & Sync">
          <SettingsItem
            icon="cloud-download"
            title="Offline & Sync"
            subtitle="Manage offline data and sync"
            showArrow
            onPress={() => router.push('/settings/sync')}
            isFirst
            isLast
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsItem
            icon="shield-checkmark"
            title="Privacy & Data"
            subtitle="Privacy policy and data usage"
            showArrow
            onPress={() => router.push('/settings/privacy')}
            isFirst
          />
          <SettingsItem
            icon="library"
            title="Credits & Sources"
            subtitle="Hadith collections, translations, AI"
            showArrow
            onPress={() => router.push('/settings/credits')}
          />
          <SettingsItem
            icon="information-circle"
            title="About"
            subtitle="App info and version"
            showArrow
            onPress={() => router.push('/settings/about')}
            isLast
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    fontFamily: FONT_FAMILY.heading,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONT_FAMILY.body,
  },
});
