/**
 * useNotifications.ts
 *
 * React hook that surfaces notification state and controls to UI components.
 * Handles:
 *   - Permission status polling on mount
 *   - Streak and lesson toggle state with AsyncStorage persistence
 *   - Reminder time read/write
 *   - Notification response listener (tap routing via expo-router)
 *
 * UPSTREAM REQUIREMENT: expo-notifications must be installed.
 * Run: npx expo install expo-notifications expo-device
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Linking } from 'react-native'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import {
  NOTIF_KEYS,
  getPermissionStatus,
  requestPermission,
  getStreakReminderEnabled,
  setStreakReminderEnabled,
  getLessonReminderEnabled,
  setLessonReminderEnabled,
  getStreakReminderTime,
  scheduleStreakReminder,
} from './NotificationService'

export interface NotificationState {
  /** Current iOS permission status */
  permissionStatus: 'granted' | 'denied' | 'undetermined' | 'loading'
  /** Whether the streak daily reminder is on */
  streakEnabled: boolean
  /** Whether the lesson 24-hour reminder is on */
  lessonEnabled: boolean
  /** Current streak reminder time */
  reminderTime: { hour: number; minute: number }
  /** true while any async operation is in-flight */
  isUpdating: boolean
  /** Request iOS permission — call from Settings pre-prompt tap */
  requestPermission: () => Promise<boolean>
  /** Open iOS Settings > Notifications if permission was denied */
  openSystemSettings: () => void
  /** Toggle the streak daily reminder on/off */
  toggleStreak: (enabled: boolean) => Promise<void>
  /** Toggle the lesson 24-hour reminder on/off */
  toggleLesson: (enabled: boolean) => Promise<void>
  /** Update the time at which the streak reminder fires */
  setReminderTime: (hour: number, minute: number) => Promise<void>
}

export function useNotifications(): NotificationState {
  const router = useRouter()

  const [permissionStatus, setPermissionStatus] = useState<NotificationState['permissionStatus']>('loading')
  const [streakEnabled, setStreakEnabledState] = useState(false)
  const [lessonEnabled, setLessonEnabledState] = useState(false)
  const [reminderTime, setReminderTimeState] = useState<{ hour: number; minute: number }>({ hour: 8, minute: 0 })
  const [isUpdating, setIsUpdating] = useState(false)

  // Ref so the tap listener closure always has the current router reference
  // without being added to the effect dependency array (avoids re-subscribing).
  const routerRef = useRef(router)
  useEffect(() => { routerRef.current = router }, [router])

  // -------------------------------------------------------------------------
  // Load state from AsyncStorage + permissions on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    let mounted = true

    async function load() {
      const [status, streakOn, lessonOn, time] = await Promise.all([
        getPermissionStatus(),
        getStreakReminderEnabled(),
        getLessonReminderEnabled(),
        getStreakReminderTime(),
      ])
      if (!mounted) return
      setPermissionStatus(status)
      setStreakEnabledState(streakOn)
      setLessonEnabledState(lessonOn)
      setReminderTimeState(time)
    }

    load().catch((err) => {
      __DEV__ && console.warn('[useNotifications] load error:', err)
    })

    return () => { mounted = false }
  }, [])

  // -------------------------------------------------------------------------
  // Notification tap listener — routes to the correct screen
  // Must be set up inside a mounted component (not at module level) because
  // expo-router's router is only available inside the navigation context.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined

      if (!data?.screen) return

      // Upstream risk: router may not be ready on the very first cold-launch
      // tap. Wrapping in requestAnimationFrame gives the navigation tree one
      // more render cycle to settle before pushing.
      requestAnimationFrame(() => {
        const r = routerRef.current
        try {
          if (data.screen === 'collection' && data.slug) {
            r.push(`/collection/${data.slug}` as never)
          } else if (data.screen === 'lesson') {
            r.push('/learn' as never)
          } else if (data.screen === 'streak') {
            r.push('/(tabs)' as never)
          }
        } catch (err) {
          __DEV__ && console.warn('[useNotifications] tap routing failed:', err)
        }
      })
    })

    return () => subscription.remove()
  }, []) // empty — routerRef.current is stable

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleRequestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestPermission()
    const status = await getPermissionStatus()
    setPermissionStatus(status)
    return granted
  }, [])

  const openSystemSettings = useCallback(() => {
    Linking.openSettings().catch(() => {
      __DEV__ && console.warn('[useNotifications] openSettings() failed')
    })
  }, [])

  const toggleStreak = useCallback(async (enabled: boolean) => {
    setIsUpdating(true)
    try {
      const { hour, minute } = reminderTime
      await setStreakReminderEnabled(enabled, hour, minute)
      setStreakEnabledState(enabled)
    } catch (err) {
      // Scheduling failed — revert AsyncStorage so persisted state stays consistent
      // with the UI toggle (which stays at its prior position because setStreakEnabledState
      // was never called).
      await AsyncStorage.setItem(
        NOTIF_KEYS.STREAK_REMINDER_ENABLED,
        enabled ? 'false' : 'true',
      ).catch(() => {})
      __DEV__ && console.warn('[useNotifications] toggleStreak failed:', err)
    } finally {
      setIsUpdating(false)
    }
  }, [reminderTime])

  const toggleLesson = useCallback(async (enabled: boolean) => {
    setIsUpdating(true)
    try {
      await setLessonReminderEnabled(enabled)
      setLessonEnabledState(enabled)
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const handleSetReminderTime = useCallback(async (hour: number, minute: number) => {
    setIsUpdating(true)
    try {
      setReminderTimeState({ hour, minute })
      // If streak reminder is currently on, reschedule at the new time immediately
      if (streakEnabled) {
        await scheduleStreakReminder(hour, minute)
      }
    } finally {
      setIsUpdating(false)
    }
  }, [streakEnabled])

  return {
    permissionStatus,
    streakEnabled,
    lessonEnabled,
    reminderTime,
    isUpdating,
    requestPermission: handleRequestPermission,
    openSystemSettings,
    toggleStreak,
    toggleLesson,
    setReminderTime: handleSetReminderTime,
  }
}
