import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getColors } from '@/lib/styles/colors';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

/**
 * Settings section component with a title and grouped settings items
 */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.mutedText }]}>{title}</Text>
      <View style={[styles.content, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginLeft: SPACING.md,
  },
  content: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
