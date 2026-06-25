import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SPACING, FONT_SIZES , getColors } from '@/lib/styles/colors';
import { FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';

export default function NotificationsScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerShown: true,
          headerBackTitle: 'Settings',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.emeraldMid,
          headerShadowVisible: false,
        }}
      />
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.rowText}>
            <Text style={[styles.title, { color: colors.bronzeText }]}>Stay connected</Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>
              Open Authentic Hadith any time for the daily hadith, your learning paths,
              and saved content — it&apos;s all ready inside the app.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    padding: SPACING.md,
  },
  rowText: { flex: 1 },
  title: { fontFamily: FONT_FAMILY.heading, fontSize: FONT_SIZES.md, fontWeight: '600', marginBottom: SPACING.xs },
  subtitle: { fontFamily: FONT_FAMILY.body, fontSize: FONT_SIZES.sm, lineHeight: 20 },
});
