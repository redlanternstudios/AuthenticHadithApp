/**
 * app/settings/notifications.tsx
 *
 * Notifications settings screen.
 *
 * Permission strategy (enforced here):
 *   - NEVER asks for permission on cold launch or during onboarding.
 *   - Shows a plain-language pre-prompt explaining value before calling requestPermissionsAsync.
 *   - If denied, shows "Enable in iOS Settings" link — no dark pattern re-asks.
 *
 * Reminder time UX:
 *   - Simple +/- hour/minute controls inside an inline picker section.
 *   - Avoids DateTimePicker dependency to stay within the approved package set.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES, getColors } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { FONT_FAMILY } from '@/constants/theme';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsItem } from '@/components/settings/SettingsItem';
import { useNotifications } from '@/lib/notifications';

// ---------------------------------------------------------------------------
// Time picker sub-component — avoids external DateTimePicker dependency
// ---------------------------------------------------------------------------
interface TimePickerProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  disabled?: boolean;
}

function TimePicker({ hour, minute, onChange, disabled }: TimePickerProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const adjustHour = (delta: number) => {
    const next = (hour + delta + 24) % 24;
    onChange(next, minute);
  };

  const adjustMinute = (delta: number) => {
    // Snap to :00 or :30 only — keeps the UX simple
    const options = [0, 15, 30, 45];
    const currentIdx = options.indexOf(minute);
    const nextIdx = (currentIdx + delta + options.length) % options.length;
    onChange(hour, options[nextIdx] ?? 0);
  };

  const label = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const display12 = hour % 12 === 0 ? 12 : hour % 12;

  return (
    <View style={[timeStyles.container, { borderColor: colors.border, backgroundColor: colors.card }]}>
      {/* Hour */}
      <TouchableOpacity
        onPress={() => adjustHour(-1)}
        disabled={disabled}
        style={timeStyles.btn}
        accessibilityLabel="Decrease hour"
      >
        <Ionicons name="chevron-back" size={18} color={disabled ? colors.mutedText : colors.emeraldMid} />
      </TouchableOpacity>

      <Text style={[timeStyles.timeLabel, { color: colors.bronzeText }]}>
        {`${String(display12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`}
      </Text>

      <TouchableOpacity
        onPress={() => adjustHour(1)}
        disabled={disabled}
        style={timeStyles.btn}
        accessibilityLabel="Increase hour"
      >
        <Ionicons name="chevron-forward" size={18} color={disabled ? colors.mutedText : colors.emeraldMid} />
      </TouchableOpacity>

      {/* Minute (coarser: :00 / :15 / :30 / :45) */}
      <View style={[timeStyles.divider, { backgroundColor: colors.border }]} />
      <TouchableOpacity
        onPress={() => adjustMinute(-1)}
        disabled={disabled}
        style={timeStyles.btn}
        accessibilityLabel="Decrease minutes"
      >
        <Ionicons name="remove-circle-outline" size={18} color={disabled ? colors.mutedText : colors.emeraldMid} />
      </TouchableOpacity>
      <Text style={[timeStyles.minuteHint, { color: colors.mutedText }]}>min</Text>
      <TouchableOpacity
        onPress={() => adjustMinute(1)}
        disabled={disabled}
        style={timeStyles.btn}
        accessibilityLabel="Increase minutes"
      >
        <Ionicons name="add-circle-outline" size={18} color={disabled ? colors.mutedText : colors.emeraldMid} />
      </TouchableOpacity>
    </View>
  );
}

const timeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    gap: SPACING.xs,
  },
  btn: { padding: 4 },
  timeLabel: {
    fontFamily: FONT_FAMILY.bodyMedium,
    fontSize: FONT_SIZES.md,
    flex: 1,
    textAlign: 'center',
  },
  minuteHint: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.xs,
  },
  divider: {
    width: 1,
    height: 20,
    marginHorizontal: SPACING.xs,
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function NotificationsScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const {
    permissionStatus,
    streakEnabled,
    lessonEnabled,
    reminderTime,
    isUpdating,
    requestPermission,
    openSystemSettings,
    toggleStreak,
    toggleLesson,
    setReminderTime,
  } = useNotifications();

  // Tracks whether the user has tapped "Enable Notifications" in the pre-prompt
  // section so we can show a spinner inline rather than blocking the whole screen.
  const [permissionRequesting, setPermissionRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setPermissionRequesting(true);
    try {
      await requestPermission();
    } finally {
      setPermissionRequesting(false);
    }
  };

  const isGranted = permissionStatus === 'granted';
  const isDenied = permissionStatus === 'denied';

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ----------------------------------------------------------------
            Header
        ---------------------------------------------------------------- */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.bronzeText }]}>
            Notification Settings
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            Gentle reminders to keep your daily hadith practice going.
          </Text>
        </View>

        {/* ----------------------------------------------------------------
            Permission status / pre-prompt
        ---------------------------------------------------------------- */}
        {permissionStatus === 'loading' ? (
          <View style={styles.permissionLoading}>
            <ActivityIndicator color={colors.emeraldMid} />
          </View>
        ) : isGranted ? (
          // Granted — show green pill
          <View style={[styles.permissionBanner, { backgroundColor: colors.emeraldMid + '18', borderColor: colors.emeraldMid + '40' }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.emeraldMid} />
            <Text style={[styles.permissionBannerText, { color: colors.emeraldMid }]}>
              Notifications enabled
            </Text>
          </View>
        ) : isDenied ? (
          // Denied — show "open settings" nudge
          <View style={[styles.permissionBanner, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '40' }]}>
            <Ionicons name="notifications-off-outline" size={18} color={colors.warning} />
            <View style={{ flex: 1, marginLeft: SPACING.xs }}>
              <Text style={[styles.permissionBannerText, { color: colors.bronzeText }]}>
                Notifications are blocked
              </Text>
              <Text style={[styles.permissionBannerSub, { color: colors.mutedText }]}>
                Go to iOS Settings to re-enable them.
              </Text>
            </View>
            <TouchableOpacity onPress={openSystemSettings} accessibilityLabel="Open iOS Settings">
              <Text style={[styles.settingsLink, { color: colors.emeraldMid }]}>Open Settings →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Undetermined — show the pre-prompt value card
          <View style={[styles.prePromptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="notifications-outline" size={24} color={colors.emeraldMid} style={{ marginBottom: SPACING.sm }} />
            <Text style={[styles.prePromptTitle, { color: colors.bronzeText }]}>
              Stay consistent with your practice
            </Text>
            <Text style={[styles.prePromptBody, { color: colors.mutedText }]}>
              Authentic Hadith can send you a gentle daily reminder to maintain your streak
              and let you know when a new lesson is ready — nothing spammy, just a nudge at
              the time you choose.
            </Text>
            <TouchableOpacity
              style={[styles.enableBtn, { backgroundColor: colors.emeraldMid }]}
              onPress={handleRequestPermission}
              disabled={permissionRequesting}
              accessibilityLabel="Enable notifications"
            >
              {permissionRequesting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.enableBtnText}>Enable Notifications</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ----------------------------------------------------------------
            Streak Reminder
        ---------------------------------------------------------------- */}
        <SettingsSection title="Daily Streak Reminder">
          <SettingsItem
            icon="flame-outline"
            title="Streak Reminder"
            subtitle={
              streakEnabled
                ? `Fires daily at ${String(reminderTime.hour % 12 === 0 ? 12 : reminderTime.hour % 12).padStart(2, '0')}:${String(reminderTime.minute).padStart(2, '0')} ${reminderTime.hour < 12 ? 'AM' : 'PM'}`
                : "Get a daily nudge if you haven't opened the app"
            }
            showSwitch
            switchValue={streakEnabled}
            onSwitchChange={(val) => { void toggleStreak(val); }}
            disabled={!isGranted || isUpdating}
            isFirst
            isLast={!streakEnabled}
          />
          {streakEnabled && (
            <TimePicker
              hour={reminderTime.hour}
              minute={reminderTime.minute}
              onChange={(h, m) => { void setReminderTime(h, m); }}
              disabled={!isGranted || isUpdating}
            />
          )}
        </SettingsSection>

        {/* ----------------------------------------------------------------
            Lesson Reminder
        ---------------------------------------------------------------- */}
        <SettingsSection title="Lesson Reminder">
          <SettingsItem
            icon="book-outline"
            title="Lesson Reminder"
            subtitle="Reminds you 24 hours after completing a lesson if you haven't started another"
            showSwitch
            switchValue={lessonEnabled}
            onSwitchChange={(val) => { void toggleLesson(val); }}
            disabled={!isGranted || isUpdating}
            isFirst
            isLast
          />
        </SettingsSection>

        {/* ----------------------------------------------------------------
            Push collections note
        ---------------------------------------------------------------- */}
        <SettingsSection title="New Collections">
          <SettingsItem
            icon="library-outline"
            title="Collection Announcements"
            subtitle="Sent automatically when new content is published — no toggle needed"
            disabled
            isFirst
            isLast
          />
        </SettingsSection>

        {/* ----------------------------------------------------------------
            Footer info
        ---------------------------------------------------------------- */}
        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoText, { color: colors.mutedText }]}>
            All reminders are delivered on-device. No personal data is shared. Push notifications
            for new collections are sent through Expo's free notification service.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xxl ?? SPACING.xl },

  header: { marginBottom: SPACING.lg },
  headerTitle: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
  },

  permissionLoading: { alignItems: 'center', paddingVertical: SPACING.md },

  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  permissionBannerText: {
    fontFamily: FONT_FAMILY.bodyMedium,
    fontSize: FONT_SIZES.sm,
    flex: 1,
  },
  permissionBannerSub: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  settingsLink: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.sm,
  },

  prePromptCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  prePromptTitle: {
    fontFamily: FONT_FAMILY.headingMedium,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xs,
  },
  prePromptBody: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  enableBtn: {
    alignSelf: 'stretch',
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  enableBtnText: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#ffffff',
  },

  infoBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  infoText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
});
