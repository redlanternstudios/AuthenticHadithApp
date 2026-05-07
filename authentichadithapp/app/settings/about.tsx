import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Stack } from 'expo-router';
import Constants from 'expo-constants';
import { SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getColors } from '@/lib/styles/colors';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsItem } from '@/components/settings/SettingsItem';

/**
 * About screen showing app information and version
 */
export default function AboutScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || '1';

  const handleOpenWebsite = () => {
    Linking.openURL('https://authentichadith.app');
  };

  const handleOpenSupport = () => {
    Linking.openURL('mailto:support@authentichadith.app');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'About',
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
          <Text style={styles.appIcon}>📖</Text>
          <Text style={[styles.appName, { color: colors.bronzeText }]}>
            Authentic Hadith
          </Text>
          <Text style={[styles.appTagline, { color: colors.mutedText }]}>
            Truth through authenticated narrations
          </Text>
        </View>

        <SettingsSection title="App Information">
          <SettingsItem
            icon="information-circle"
            title="Version"
            value={appVersion}
            isFirst
          />
          <SettingsItem
            icon="code-slash"
            title="Build Number"
            value={buildNumber}
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Resources">
          <SettingsItem
            icon="globe"
            title="Website"
            subtitle="Visit our website"
            showArrow
            onPress={handleOpenWebsite}
            isFirst
          />
          <SettingsItem
            icon="mail"
            title="Support"
            subtitle="Get help and support"
            showArrow
            onPress={handleOpenSupport}
            isLast
          />
        </SettingsSection>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedText }]}>
            © 2024 Authentic Hadith App
          </Text>
          <Text style={[styles.footerText, { color: colors.mutedText }]}>
            Built with ❤️ for the Muslim community
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
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.lg,
  },
  appIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  appTagline: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
});
