import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

// EAS project ID — must match app.json and eas.json.
// Hardcoded here intentionally: this value is public-safe (not a secret) and
// must be stable. Do not read from env to avoid env-injection failures at runtime.
const EAS_PROJECT_ID = '66afcbbf-55c3-48fb-9bf1-29efc52d09eb'

/**
 * Registers the Android default notification channel.
 *
 * UPSTREAM RISK (Android): Expo requires a notification channel to be created
 * before any notification can be displayed on Android 8+. This is a no-op on iOS.
 * Call this once at app startup (e.g., in the root layout or App.tsx), not per-request.
 *
 * Safe to call on iOS — the call is guarded by Platform.OS check.
 */
export async function registerAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return

  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  })
}

/**
 * Requests notification permission from the OS and returns the current status.
 *
 * Returns:
 * - 'granted'   — permission already granted or just granted
 * - 'denied'    — user denied; do not re-request aggressively
 * - 'undetermined' — never asked; prompt the OS dialog
 */
export async function requestNotificationPermission(): Promise<
  'granted' | 'denied' | 'undetermined'
> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()

  if (existingStatus === 'granted') return 'granted'
  if (existingStatus === 'denied') return 'denied'

  // Status is 'undetermined' — prompt the system dialog.
  const { status } = await Notifications.requestPermissionsAsync()
  return status as 'granted' | 'denied' | 'undetermined'
}

/**
 * Gets the Expo push token for this device and returns it as a string.
 *
 * Returns null if:
 * - Running in a simulator/emulator (Expo push tokens require a physical device)
 * - Notification permission is not granted
 * - The token fetch fails for any reason (network, invalid projectId, etc.)
 *
 * UPSTREAM RISK: This function does NOT request permission — call
 * requestNotificationPermission() first and gate on 'granted' before calling this.
 *
 * UPSTREAM RISK: On Android, registerAndroidNotificationChannel() must be called
 * before push notifications can display, even if this function returns a token.
 *
 * DOWNSTREAM RISK: The returned token must be saved to Supabase profiles.expo_push_token
 * (via upsertPushToken below) for the send-collection-announcement Edge Function
 * to include this device in broadcasts. A token not saved to the DB is a dead token.
 */
export async function getExpoPushToken(): Promise<string | null> {
  // Expo push tokens only work on physical devices.
  if (!Device.isDevice) {
    if (__DEV__) {
      console.log('[pushService] Skipping push token — not a physical device (simulator)')
    }
    return null
  }

  // Check permission without re-prompting — caller is responsible for requesting.
  const { status } = await Notifications.getPermissionsAsync()
  if (status !== 'granted') {
    if (__DEV__) {
      console.log('[pushService] Skipping push token — permission not granted (status:', status, ')')
    }
    return null
  }

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    })
    return tokenResult.data
  } catch (err) {
    // Non-fatal — token fetch failures can happen if the device has no network
    // or if the EAS project ID is misconfigured. Log in dev only.
    if (__DEV__) {
      console.warn('[pushService] Failed to get Expo push token:', err)
    }
    return null
  }
}

/**
 * Full registration flow: channel setup → permission request → token fetch.
 *
 * Call this once after a user signs in (so the token can be linked to their account).
 * Returns the token string, or null if any step fails or is denied.
 *
 * Usage:
 * ```ts
 * const token = await registerForPushNotifications()
 * if (token) {
 *   await upsertPushToken(supabase, userId, token)
 * }
 * ```
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Android channel must exist before any notification shows.
  await registerAndroidNotificationChannel()

  const permissionStatus = await requestNotificationPermission()
  if (permissionStatus !== 'granted') {
    if (__DEV__) {
      console.log('[pushService] Push registration skipped — permission:', permissionStatus)
    }
    return null
  }

  return getExpoPushToken()
}

/**
 * Saves or updates the device push token for a user in Supabase profiles.
 *
 * Uses upsert on user_id to handle both first-time registration and
 * token rotation (tokens can change after app reinstall or OS update).
 *
 * DOWNSTREAM RISK: If this call is not made after registerForPushNotifications(),
 * the Edge Function cannot reach this device. Always pair token fetch with this save.
 *
 * @param supabaseClient — the initialized Supabase client from lib/supabase/client.ts
 * @param userId — the authenticated user's UUID
 * @param token — the Expo push token string from getExpoPushToken()
 */
export async function upsertPushToken(
  supabaseClient: {
    from: (table: string) => {
      upsert: (data: object, options: object) => Promise<{ error: { message: string } | null }>
    }
  },
  userId: string,
  token: string,
): Promise<void> {
  const { error } = await supabaseClient
    .from('profiles')
    .upsert(
      { user_id: userId, expo_push_token: token },
      { onConflict: 'user_id' },
    )

  if (error) {
    // Non-fatal on the client — push notifications are an enhancement, not core.
    // Log in dev so it doesn't silently disappear.
    if (__DEV__) {
      console.warn('[pushService] Failed to upsert push token:', error.message)
    }
  }
}
