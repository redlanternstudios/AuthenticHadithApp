import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { SPACING, FONT_SIZES , getColors } from '@/lib/styles/colors';
import { FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsItem } from '@/components/settings/SettingsItem';

/**
 * Privacy and data settings screen
 */
export default function PrivacyScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://byredllc.com/privacy');
  };

  const handleOpenTerms = () => {
    Linking.openURL('https://byredllc.com/terms');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Privacy & Data',
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
          <Text style={[styles.headerTitle, { color: colors.bronzeText }]}>
            🔒 Privacy & Data
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            Your privacy is important to us
          </Text>
        </View>

        <SettingsSection title="Legal">
          <SettingsItem
            icon="document-text"
            title="Privacy Policy"
            subtitle="How we handle your data"
            showArrow
            onPress={handleOpenPrivacyPolicy}
            isFirst
          />
          <SettingsItem
            icon="shield-checkmark"
            title="Terms of Service"
            subtitle="Terms and conditions"
            showArrow
            onPress={handleOpenTerms}
            isLast
          />
        </SettingsSection>

        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.bronzeText }]}>
            Your Data
          </Text>
          <Text style={[styles.infoText, { color: colors.mutedText }]}>
            • Your saved hadiths and notes are stored securely{'\n'}
            • We use encryption for sensitive data{'\n'}
            • You can export or delete your data anytime{'\n'}
            {"• We don't sell your information to third parties"}{'\n'}
            • Offline data is stored locally on your device
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
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
  },
  infoBox: {
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  infoTitle: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    lineHeight: 22,
  },
});
