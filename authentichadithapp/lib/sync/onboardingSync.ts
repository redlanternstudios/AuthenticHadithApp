import AsyncStorage from "@react-native-async-storage/async-storage"

export interface OnboardingProfileData {
  name: string
  schoolOfThought?: string | null
  collections: string[]
  learningLevel: string
  safetyAgreed?: boolean
  termsAgreed?: boolean
}

export interface PostgrestErrorShape {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
}

export interface PendingSyncRecord {
  userId: string
  data: OnboardingProfileData
  status: "sync_pending"
  attempts: number
  lastAttemptAt: string
  lastError?: PostgrestErrorShape | null
}

export const ONBOARDING_STORAGE_KEYS = {
  ONBOARDED: "onboarded",
  LOCAL_PROFILE: "cached_onboarding_profile",
  SYNC_PENDING: "onboarding_sync_pending",
} as const

/**
 * Persists onboarding data locally immediately so the user is never blocked.
 */
export async function persistOnboardingLocally(data: OnboardingProfileData): Promise<void> {
  await AsyncStorage.multiSet([
    [ONBOARDING_STORAGE_KEYS.ONBOARDED, "true"],
    [ONBOARDING_STORAGE_KEYS.LOCAL_PROFILE, JSON.stringify(data)],
  ])
}

/**
 * Attempts to sync onboarding profile and preferences to Supabase.
 * If server-side persistence encounters an RLS/constraint error,
 * the failure is recorded in onboarding_sync_pending for subsequent background retries
 * rather than silently discarded or blocking navigation.
 */
export async function syncOnboardingProfile(
  supabase: any,
  user: { id: string } | null | undefined,
  data: OnboardingProfileData
): Promise<{ success: boolean; pending?: boolean; error?: PostgrestErrorShape | null }> {
  // Always ensure local persistence is established
  await persistOnboardingLocally(data)

  if (!user?.id) {
    return { success: true }
  }

  let capturedError: PostgrestErrorShape | null = null

  try {
    // 1. Attempt profile update/upsert.
    // Try UPDATE first by user_id to avoid touching primary key constraints on existing rows.
    let { error: profileError } = await supabase
      .from("profiles")
      .update({
        name: data.name.trim(),
        school_of_thought: data.schoolOfThought || null,
      })
      .eq("user_id", user.id)

    // If update fails or table requires upsert, attempt upsert without passing primary key `id`
    if (profileError) {
      const upsertResult = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          name: data.name.trim(),
          school_of_thought: data.schoolOfThought || null,
        }, { onConflict: "user_id" })
      profileError = upsertResult.error
    }

    if (profileError) {
      capturedError = {
        code: profileError.code ?? null,
        message: profileError.message ?? null,
        details: profileError.details ?? null,
        hint: profileError.hint ?? null,
      }
      console.warn("[OnboardingSync] Profile persistence error captured:", capturedError)
    }

    // 2. Attempt user_preferences upsert
    const { error: prefError } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        learning_level: data.learningLevel.toLowerCase(),
        collections_of_interest: data.collections,
        onboarded: true,
        safety_agreed_at: new Date().toISOString(),
      }, { onConflict: "user_id" })

    if (prefError && !capturedError) {
      capturedError = {
        code: prefError.code ?? null,
        message: prefError.message ?? null,
        details: prefError.details ?? null,
        hint: prefError.hint ?? null,
      }
      console.warn("[OnboardingSync] Preferences persistence error captured:", capturedError)
    }

    if (capturedError) {
      // Record pending retry payload — do not silently discard
      const pendingRecord: PendingSyncRecord = {
        userId: user.id,
        data,
        status: "sync_pending",
        attempts: 1,
        lastAttemptAt: new Date().toISOString(),
        lastError: capturedError,
      }
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.SYNC_PENDING, JSON.stringify(pendingRecord))
      return { success: false, pending: true, error: capturedError }
    }

    // Success — clear any pending sync record
    await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEYS.SYNC_PENDING)
    return { success: true }
  } catch (err: any) {
    const fallbackError: PostgrestErrorShape = {
      code: err?.code ?? "UNKNOWN",
      message: err?.message ?? String(err),
      details: err?.details ?? null,
      hint: err?.hint ?? null,
    }
    console.warn("[OnboardingSync] Unhandled exception during onboarding sync:", fallbackError)
    const pendingRecord: PendingSyncRecord = {
      userId: user.id,
      data,
      status: "sync_pending",
      attempts: 1,
      lastAttemptAt: new Date().toISOString(),
      lastError: fallbackError,
    }
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.SYNC_PENDING, JSON.stringify(pendingRecord))
    return { success: false, pending: true, error: fallbackError }
  }
}

/**
 * Background retry mechanism: if an onboarding sync is pending for the active user,
 * attempts server sync and clears pending state upon resolution.
 */
export async function retryPendingOnboardingSync(
  supabase: any,
  user: { id: string } | null | undefined
): Promise<void> {
  if (!user?.id) return

  try {
    const rawPending = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.SYNC_PENDING)
    if (!rawPending) return

    const pendingRecord: PendingSyncRecord = JSON.parse(rawPending)
    if (pendingRecord.userId !== user.id) return

    // Re-attempt sync
    const res = await syncOnboardingProfile(supabase, user, pendingRecord.data)
    if (res.success) {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEYS.SYNC_PENDING)
      console.log("[OnboardingSync] Pending onboarding sync resolved successfully")
    } else {
      pendingRecord.attempts = (pendingRecord.attempts || 1) + 1
      pendingRecord.lastAttemptAt = new Date().toISOString()
      pendingRecord.lastError = res.error
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.SYNC_PENDING, JSON.stringify(pendingRecord))
    }
  } catch (err) {
    console.warn("[OnboardingSync] Background retry attempt encountered error:", err)
  }
}
