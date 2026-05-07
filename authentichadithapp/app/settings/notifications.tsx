import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Stack } from 'expo-router';
import { SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getColors } from '@/lib/styles/colors';

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
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.title, { color: colors.bronzeText }]}>Daily Hadith</Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Receive a daily hadith notification
              </Text>
            </View>
            <Switch value={false} disabled />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.title, { color: colors.bronzeText }]}>Learning Reminders</Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Reminders to continue learning paths
              </Text>
            </View>
            <Switch value={false} disabled />
          </View>
        </View>
        <Text style={[styles.comingSoon, { color: colors.mutedText }]}>
          Push notifications coming soon. Stay tuned for updates.
        </Text>
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  rowText: { flex: 1, marginRight: SPACING.md },
  title: { fontSize: FONT_SIZES.md, fontWeight: '600', marginBottom: 2 },
  subtitle: { fontSize: FONT_SIZES.sm },
  divider: { height: 1 },
  comingSoon: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginTop: SPACING.lg,
    fontStyle: 'italic',
  },
});
