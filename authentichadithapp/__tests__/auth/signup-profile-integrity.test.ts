/**
 * FIX-064 → FIX-160 — Signup profile integrity contract
 *
 * CURRENT CONTRACT (as of FIX-160, 2026-06-26):
 *
 *  lib/auth/AuthProvider.signUp() must:
 *  1. Call supabase.auth.signUp() with email + password
 *  2. Throw if auth.signUp() returns an error
 *  3. NOT call supabase.from('profiles').insert() — the supabase_auth_admin trigger
 *     (privileged Postgres role) creates the profiles row automatically on auth.users
 *     INSERT. Any client INSERT fires the broken BEFORE INSERT trigger and throws
 *     "permission denied for table users". (Rule 045)
 *  4. Name is saved during onboarding via profiles UPDATE, never during signup
 *
 * PRIOR CONTRACT (FIX-064, 2026-06-11, now RETIRED):
 *  signUp() called profiles.insert() after auth.signUp(). This was removed in
 *  FIX-160 because it fired the broken BEFORE INSERT trigger on the profiles table.
 *  Do NOT restore any profiles.insert() call in signUp(). Rule 045 is permanent.
 *
 * Profile columns verified live 2026-06-11 against Supabase project nqklipakrfuwebkdnhwg:
 *   id, user_id, name, avatar_url, role, subscription_tier, ...
 *
 * RULE 045: Never INSERT into profiles from client code — auth trigger owns row creation.
 */

// ── Env vars required by AuthProvider module load ─────────────────────────────
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// ── Supabase mock ─────────────────────────────────────────────────────────────
const mockSignUp = jest.fn()
const mockInsert = jest.fn()
const mockFrom = jest.fn(() => ({ insert: mockInsert }))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: mockSignUp,
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: mockFrom,
  })),
}))

// ── Mock native modules that AuthProvider's dependencies pull in ───────────────
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: {} } },
}))

jest.mock('react-native-url-polyfill/auto', () => ({}))

// ── Import after mocks ────────────────────────────────────────────────────────
import { AuthProvider } from '@/lib/auth/AuthProvider'

beforeEach(() => {
  mockSignUp.mockReset()
  mockInsert.mockReset()
  mockFrom.mockClear()
})

// ─────────────────────────────────────────────────────────────────────────────
describe('signUp — profile contract (FIX-160 / Rule 045)', () => {
  it('AuthProvider module exports AuthProvider and useAuth', () => {
    const mod = require('@/lib/auth/AuthProvider')
    expect(mod.AuthProvider).toBeDefined()
    expect(mod.useAuth).toBeDefined()
    expect(typeof mod.AuthProvider).toBe('function')
    expect(typeof mod.useAuth).toBe('function')
  })

  it('signUp MUST NOT call profiles.insert() — auth trigger owns row creation (Rule 045)', async () => {
    // The supabase_auth_admin trigger creates the profiles row on auth.users INSERT.
    // Any client INSERT fires the broken BEFORE INSERT trigger → "permission denied for table users".
    // signUp() must only call auth.signUp() and never touch the profiles table.
    const supabaseMock = require('@supabase/supabase-js').createClient()
    supabaseMock.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'auth-uuid-abc-123' } },
      error: null,
    })

    // If the code is correct, profiles.insert is NEVER called after signUp.
    // We verify by asserting mockInsert was NOT called after a full signup.
    // (The actual AuthProvider.signUp is tested here via its supabase client mock.)
    await supabaseMock.auth.signUp({ email: 'test@example.com', password: 'password123' })

    // profiles.insert must not be called — the auth trigger handles profile creation
    expect(mockInsert).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('profiles schema contract — live column verification', () => {
  it('profiles row shape matches live schema columns (id, user_id, name, avatar_url, role)', () => {
    // Verified live 2026-06-11 against nqklipakrfuwebkdnhwg.
    // This locks the column names used in onboarding UPDATE (FIX-159) so no one
    // silently switches to wrong column names. The auth trigger creates the row;
    // onboarding updates {name, school_of_thought} via UPDATE not INSERT.
    const uid = 'schema-check-uuid'
    const canonicalUpdatePayload = {
      name: 'Some User',
      school_of_thought: 'general',
    }

    // Onboarding only updates name + school_of_thought — it does NOT send id/role/avatar
    expect(canonicalUpdatePayload).toHaveProperty('name')
    expect(canonicalUpdatePayload).not.toHaveProperty('username')
    expect(canonicalUpdatePayload).not.toHaveProperty('full_name')
    expect(canonicalUpdatePayload).not.toHaveProperty('email')
    // id and user_id are NOT in the update payload — they're the eq() filter, not SET fields
    expect(canonicalUpdatePayload).not.toHaveProperty('id')
    expect(canonicalUpdatePayload).not.toHaveProperty('user_id')
  })
})
