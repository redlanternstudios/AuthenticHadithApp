/**
 * NotificationService.ts
 *
 * Client-side notification layer for Authentic Hadith.
 *
 * UPSTREAM REQUIREMENT: expo-notifications and expo-device must be installed.
 * They are NOT in package.json as of the time this file was created.
 * KP must run: npx expo install expo-notifications expo-device
 * before this file can be used in a build.
 *
 * Three notification types:
 *   1. Streak reminder  — local, daily repeating at user's chosen time
 *   2. Lesson reminder  — local, one-shot 24 hours after last lesson completion
 *   3. Collection push  — server-sent via Expo Push; client receives + deeplinks
 */

import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ---------------------------------------------------------------------------
// AsyncStorage keys — all prefixed to avoid collisions with other subsystems
// ---------------------------------------------------------------------------
export const NOTIF_KEYS = {
  STREAK_REMINDER_ENABLED: 'notif_streak_reminder_enabled',
  STREAK_REMINDER_TIME: 'notif_streak_reminder_time', // stored as "HH:MM"
  LESSON_REMINDER_ENABLED: 'notif_lesson_reminder_enabled',
  LESSON_NOTIF_ID: 'notif_lesson_notif_id', // identifier of the pending one-shot
  STREAK_NOTIF_ID: 'notif_streak_notif_id', // identifier of the repeating daily
  PROMPT_SHOWN: 'notifications_prompt_shown', // true after the settings pre-prompt has appeared
  LAST_OPENED: 'notif_last_opened_date', // YYYY-MM-DD — used for streak-cancel logic
} as const

// ---------------------------------------------------------------------------
// Foreground behaviour: show alert, no sound, no badge mutation
// This must be called at module-evaluation time (not inside a hook) so the
// handler is registered before the first notification can arrive.
// ---------------------------------------------------------------------------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

// ---------------------------------------------------------------------------
// PERMISSIONS
// ---------------------------------------------------------------------------

/**
 * Returns the current iOS permission status without requesting anything.
 * Safe to call at any time — never triggers a system prompt.
 */
export async function getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync()
  return status as 'granted' | 'denied' | 'undetermined'
}

/**
 * Requests iOS push/local notification permission.
 * IMPORTANT: never call this on cold launch or onboarding.
 * Gate behind NOTIF_KEYS.PROMPT_SHOWN in the Settings screen pre-prompt.
 *
 * Returns true if granted, false if denied.
 */
export async function requestPermission(): Promise<boolean> {
  // Downstream risk: requesting on a simulator still works for local
  // notifications, but push token registration requires a physical device.
  const { status } = await Notifications.requestPermissionsAsync()
  await AsyncStorage.setItem(NOTIF_KEYS.PROMPT_SHOWN, 'true')
  return status === 'granted'
}

// ---------------------------------------------------------------------------
// PUSH TOKEN REGISTRATION
// ---------------------------------------------------------------------------

/**
 * Obtains the Expo push token (format: ExponentPushToken[xxxxx]).
 * Returns null if:
 *   - running on a simulator (Device.isDevice === false)
 *   - permission not granted
 *   - Android channel setup fails (Android-only guard)
 *
 * The caller (_layout.tsx) is responsible for upserting the token to
 * Supabase profiles.expo_push_token.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Guard: Expo push tokens require a physical device
  if (!Device.isDevice) {
    __DEV__ && console.log('[Notifications] Simulator — push token skipped')
    return null
  }

  // Android: create a notification channel before requesting the token.
  // On iOS this is a no-op; Platform.OS guard keeps the Android-only SDK
  // surface out of the iOS execution path.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1b5e43',
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    __DEV__ && console.log('[Notifications] Permission denied — push token skipped')
    return null
  }

  try {
    // FIX-115 B2: pass projectId explicitly — required in Expo SDK 50+ to avoid
    // deprecation warnings and potential silent failures in production builds.
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '66afcbbf-55c3-48fb-9bf1-29efc52d09eb',
    })
    return tokenData.data
  } catch (err) {
    __DEV__ && console.warn('[Notifications] getExpoPushTokenAsync failed:', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// STREAK REMINDER — daily repeating local notification
// ---------------------------------------------------------------------------

/**
 * Cancels any existing streak reminder then schedules a new one at the
 * given hour/minute (24-hour clock, device local time).
 *
 * IMPORTANT — trigger shape: expo-notifications daily repeat uses
 *   { hour, minute, repeats: true }
 * NOT { type: 'daily' } — that is NOT a valid trigger in this SDK version.
 */
export async function scheduleStreakReminder(hour: number, minute: number): Promise<void> {
  await cancelStreakReminder()

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Keep your streak alive',
      body: 'Open Authentic Hadith today — your streak is waiting.',
      data: { screen: 'streak' },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })

  await AsyncStorage.setItem(NOTIF_KEYS.STREAK_NOTIF_ID, id)
  await AsyncStorage.setItem(
    NOTIF_KEYS.STREAK_REMINDER_TIME,
    `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  )
}

/**
 * Cancels the pending streak reminder (if any) and removes its stored id.
 */
export async function cancelStreakReminder(): Promise<void> {
  const id = await AsyncStorage.getItem(NOTIF_KEYS.STREAK_NOTIF_ID)
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    await AsyncStorage.removeItem(NOTIF_KEYS.STREAK_NOTIF_ID)
  }
}

// ---------------------------------------------------------------------------
// LESSON REMINDER — one-shot 24 h after last lesson completion
// ---------------------------------------------------------------------------

/**
 * Cancels any existing lesson reminder then schedules a new one-shot
 * notification 24 hours from now. Call this whenever a lesson is completed.
 */
export async function scheduleLessonReminder(lessonTitle: string): Promise<void> {
  await cancelLessonReminder()

  const fireDate = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your next lesson is waiting',
      body: lessonTitle
        ? `Continue where you left off: "${lessonTitle}"`
        : 'Pick up your learning journey in Authentic Hadith.',
      data: { screen: 'lesson' },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
    },
  })

  await AsyncStorage.setItem(NOTIF_KEYS.LESSON_NOTIF_ID, id)
}

/**
 * Cancels the pending lesson reminder (if any).
 */
export async function cancelLessonReminder(): Promise<void> {
  const id = await AsyncStorage.getItem(NOTIF_KEYS.LESSON_NOTIF_ID)
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    await AsyncStorage.removeItem(NOTIF_KEYS.LESSON_NOTIF_ID)
  }
}

// ---------------------------------------------------------------------------
// BULK CANCEL — called on logout
// ---------------------------------------------------------------------------

/**
 * Cancels ALL scheduled local notifications and clears stored ids.
 * Call this from the logout handler — does NOT clear enabled/time prefs
 * so settings are restored when the user logs back in.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
  await AsyncStorage.multiRemove([
    NOTIF_KEYS.STREAK_NOTIF_ID,
    NOTIF_KEYS.LESSON_NOTIF_ID,
  ])
}

// ---------------------------------------------------------------------------
// APP OPEN TRACKING — streak reminder cancellation for same-day opens
// ---------------------------------------------------------------------------

/**
 * Records today's date and resets the repeating streak reminder so its
 * next fire is tomorrow (since the user opened the app today).
 * Call once per cold launch / foreground after auth resolves.
 *
 * For a repeats:true daily trigger, cancelling and re-scheduling with the
 * same time causes the OS to set "next fire" to the next occurrence of that
 * time after "now" — which is tomorrow if the time has already passed today.
 */
export async function markAppOpened(): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const lastOpened = await AsyncStorage.getItem(NOTIF_KEYS.LAST_OPENED)

  if (lastOpened === today) return // Already processed today's open

  await AsyncStorage.setItem(NOTIF_KEYS.LAST_OPENED, today)

  // If streak reminder is enabled, cancel-and-reschedule so the next fire
  // is tomorrow (the user opened the app today — no need to fire today).
  const streakEnabled = await getStreakReminderEnabled()
  if (streakEnabled) {
    const { hour, minute } = await getStreakReminderTime()
    await scheduleStreakReminder(hour, minute)
  }
}

// ---------------------------------------------------------------------------
// PREFERENCE ACCESSORS
// ---------------------------------------------------------------------------

export async function getStreakReminderEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIF_KEYS.STREAK_REMINDER_ENABLED)
  return val === 'true'
}

/**
 * Enable/disable the streak reminder. When enabling, schedules immediately
 * at the given time (defaults to 08:00 if not provided).
 */
export async function setStreakReminderEnabled(
  enabled: boolean,
  hour = 8,
  minute = 0,
): Promise<void> {
  await AsyncStorage.setItem(
    NOTIF_KEYS.STREAK_REMINDER_ENABLED,
    enabled ? 'true' : 'false',
  )
  if (enabled) {
    await scheduleStreakReminder(hour, minute)
  } else {
    await cancelStreakReminder()
  }
}

export async function getLessonReminderEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIF_KEYS.LESSON_REMINDER_ENABLED)
  return val === 'true'
}

export async function setLessonReminderEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(
    NOTIF_KEYS.LESSON_REMINDER_ENABLED,
    enabled ? 'true' : 'false',
  )
  if (!enabled) {
    await cancelLessonReminder()
  }
  // Enabling alone does NOT schedule — scheduling happens when a lesson is
  // completed. Call scheduleLessonReminder() from the lesson completion handler.
}

/**
 * Returns the stored reminder time as { hour, minute } or default 08:00.
 */
export async function getStreakReminderTime(): Promise<{ hour: number; minute: number }> {
  const val = await AsyncStorage.getItem(NOTIF_KEYS.STREAK_REMINDER_TIME)
  if (val) {
    const [h, m] = val.split(':').map((s) => parseInt(s, 10))
    if (!isNaN(h) && !isNaN(m)) return { hour: h, minute: m }
  }
  return { hour: 8, minute: 0 }
}
