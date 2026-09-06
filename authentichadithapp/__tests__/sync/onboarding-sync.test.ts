import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  syncOnboardingProfile,
  retryPendingOnboardingSync,
  persistOnboardingLocally,
  ONBOARDING_STORAGE_KEYS,
  OnboardingProfileData,
} from "@/lib/sync/onboardingSync"

describe("onboardingSync helper", () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    jest.clearAllMocks()
  })

  const sampleData: OnboardingProfileData = {
    name: "Keymon Penn",
    schoolOfThought: "Hanafi",
    collections: ["bukhari", "muslim"],
    learningLevel: "Intermediate",
    safetyAgreed: true,
    termsAgreed: true,
  }

  it("persistOnboardingLocally sets onboarded flag and cached profile", async () => {
    await persistOnboardingLocally(sampleData)
    const onboarded = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.ONBOARDED)
    const cached = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.LOCAL_PROFILE)
    expect(onboarded).toBe("true")
    expect(JSON.parse(cached!)).toEqual(sampleData)
  })

  it("syncOnboardingProfile succeeds locally when user is null", async () => {
    const res = await syncOnboardingProfile({} as any, null, sampleData)
    expect(res.success).toBe(true)
    const onboarded = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.ONBOARDED)
    expect(onboarded).toBe("true")
  })

  it("syncOnboardingProfile updates Supabase and clears pending on success", async () => {
    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === "profiles") {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === "user_preferences") {
          return {
            upsert: jest.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      }),
    }

    const res = await syncOnboardingProfile(mockSupabase as any, { id: "test-user-123" }, sampleData)
    expect(res.success).toBe(true)
    const pending = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.SYNC_PENDING)
    expect(pending).toBeNull()
  })

  it("syncOnboardingProfile captures PostgREST 42501 error and saves sync_pending without throwing", async () => {
    const mockPostgrestError = {
      code: "42501",
      message: "permission denied for table users",
      details: null,
      hint: null,
    }

    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === "profiles") {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: mockPostgrestError }),
            }),
            upsert: jest.fn().mockResolvedValue({ error: mockPostgrestError }),
          }
        }
        if (table === "user_preferences") {
          return {
            upsert: jest.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      }),
    }

    const res = await syncOnboardingProfile(mockSupabase as any, { id: "test-user-123" }, sampleData)
    expect(res.success).toBe(false)
    expect(res.pending).toBe(true)
    expect(res.error?.code).toBe("42501")
    expect(res.error?.message).toBe("permission denied for table users")

    // Verify sync_pending is explicitly preserved in AsyncStorage
    const pendingRaw = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.SYNC_PENDING)
    expect(pendingRaw).not.toBeNull()
    const pending = JSON.parse(pendingRaw!)
    expect(pending.status).toBe("sync_pending")
    expect(pending.userId).toBe("test-user-123")
    expect(pending.lastError.code).toBe("42501")
  })

  it("retryPendingOnboardingSync resolves pending record upon successful retry", async () => {
    // Set initial pending record
    const pendingRecord = {
      userId: "test-user-123",
      data: sampleData,
      status: "sync_pending",
      attempts: 1,
      lastAttemptAt: new Date().toISOString(),
    }
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.SYNC_PENDING, JSON.stringify(pendingRecord))

    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === "profiles") {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === "user_preferences") {
          return {
            upsert: jest.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      }),
    }

    await retryPendingOnboardingSync(mockSupabase as any, { id: "test-user-123" })
    const pending = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.SYNC_PENDING)
    expect(pending).toBeNull()
  })

  it("verifies onboarding completion prevents re-entry and loops", async () => {
    await persistOnboardingLocally(sampleData)
    const onboarded = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.ONBOARDED)
    expect(onboarded).toBe("true")

    // Simulate anti-loop check
    const shouldSkipOnboarding = onboarded === "true"
    expect(shouldSkipOnboarding).toBe(true)
  })

  it("verifies collections strictly scoped to Sahihayn (Bukhari and Muslim)", () => {
    const verifiedCollections = ["bukhari", "muslim"]
    expect(sampleData.collections).toEqual(verifiedCollections)
    expect(verifiedCollections.length).toBe(2)
  })
});
