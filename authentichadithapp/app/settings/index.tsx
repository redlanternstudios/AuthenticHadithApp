import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { SPACING, FONT_SIZES , getColors } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsItem } from '@/components/settings/SettingsItem';

/**
 * Main settings screen
 * Navigation hub for all app settings and preferences
 */
export default function SettingsScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  // Build #17 visibility scaffold: hidden tap counter on the settings header
  // reveals the RC Diagnostics row after 7 taps within a single screen visit.
  // Resets on unmount. Strip in Build #18.
  const [headerTaps, setHeaderTaps] = useState(0);
  const diagnosticsUnlocked = headerTaps >= 7;

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
          <Pressable onPress={() => setHeaderTaps((n) => n + 1)}>
            <Text style={[styles.headerTitle, { color: colors.bronzeText }]}>⚙️ Settings</Text>
          </Pressable>
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
            icon="language"
            title="Language"
            subtitle="App language and translations"
            showArrow
            onPress={() => router.push('/settings/language')}
          />
          <SettingsItem
            icon="notifications"
            title="Notifications"
            subtitle="Push notifications and reminders"
            showArrow
            onPress={() => router.push('/settings/notifications')}
            isLast
          />
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

        {diagnosticsUnlocked && (
          <SettingsSection title="Diagnostics">
            <SettingsItem
              icon="bug"
              title="RC Diagnostics"
              subtitle="Build #17 visibility — internal only"
              showArrow
              onPress={() => router.push('/settings/rc-diagnostics')}
              isFirst
              isLast
            />
          </SettingsSection>
        )}
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
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.base,
  },
});
