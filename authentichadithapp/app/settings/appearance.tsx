import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getColors } from '@/lib/styles/colors';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsItem } from '@/components/settings/SettingsItem';

/**
 * Appearance settings screen
 * Allows users to manually toggle dark mode (not system-based)
 */
export default function AppearanceScreen() {
  const { isDark, toggleTheme } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Appearance',
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
          <Text style={[styles.headerTitle, { color: colors.bronzeText }]}>Display Settings</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            Customize the appearance of the app
          </Text>
        </View>

        <SettingsSection title="Theme">
          <SettingsItem
            icon="moon"
            title="Dark Mode"
            subtitle="Use dark theme for the app"
            showSwitch
            switchValue={isDark}
            onSwitchChange={toggleTheme}
            isFirst
            isLast
          />
        </SettingsSection>

        <View style={styles.infoBox}>
          <Text style={[styles.infoText, { color: colors.mutedText }]}>
            ℹ️ Dark mode is manually controlled and does not follow your system settings. The app
            defaults to light mode unless you enable dark mode here.
          </Text>
        </View>
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
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.base,
  },
  infoBox: {
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.md,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
});
