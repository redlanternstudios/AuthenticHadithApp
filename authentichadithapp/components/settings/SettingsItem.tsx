import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getColors } from '@/lib/styles/colors';

interface SettingsItemProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value?: string;
  showArrow?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  onPress?: () => void;
  onSwitchChange?: (value: boolean) => void;
  isFirst?: boolean;
  isLast?: boolean;
  disabled?: boolean;
}

/**
 * Individual settings item component
 * Can display as a navigation item, toggle switch, or value display
 */
export function SettingsItem({
  icon,
  title,
  subtitle,
  value,
  showArrow = false,
  showSwitch = false,
  switchValue = false,
  onPress,
  onSwitchChange,
  isFirst = false,
  isLast = false,
  disabled = false,
}: SettingsItemProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card },
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled || (!onPress && !showSwitch)}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        {icon && (
          <Ionicons
            name={icon}
            size={22}
            color={disabled ? colors.mutedText : colors.emeraldMid}
            style={styles.icon}
          />
        )}
        <View style={styles.textContent}>
          <Text style={[styles.title, { color: disabled ? colors.mutedText : colors.bronzeText }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>{subtitle}</Text>
          )}
        </View>
      </View>

      <View style={styles.rightContent}>
        {value && (
          <Text style={[styles.value, { color: colors.mutedText }]} numberOfLines={1}>
            {value}
          </Text>
        )}
        {showSwitch && (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: colors.border, true: colors.emeraldMid }}
            thumbColor={colors.white}
            disabled={disabled}
          />
        )}
        {showArrow && !showSwitch && (
          <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    minHeight: 60,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: SPACING.md,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  value: {
    fontSize: FONT_SIZES.md,
    marginRight: SPACING.sm,
    maxWidth: 150,
  },
  disabled: {
    opacity: 0.5,
  },
});
