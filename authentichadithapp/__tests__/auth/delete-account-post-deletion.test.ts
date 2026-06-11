/**
 * FIX-065 — Delete account auth contract + post-deletion state regression
 *
 * Complements __tests__/delete-account.test.ts (which covers 401/200/429).
 * This file focuses specifically on:
 *
 *  1. Auth contract: unauthenticated request → 401, no DB calls made.
 *  2. Auth contract: valid session → 200.
 *  3. Post-deletion state: profile row archived (RPC called with correct user_id).
 *  4. Post-deletion state: auth user hard-deleted (deleteUser called).
 *  5. Auth token unusable after deletion: a subsequent getUser with the old token
 *     returns no user (mocked — simulates the token being invalidated).
 *
 * RULE 035: Every delete-account endpoint must require authenticated session.
 *           401 on unauthenticated request is mandatory. Failing = SUBMISSION_BLOCKER.
 * HARD-001 ALPHA: regression guard for FIX-065.
 */

process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

const mockGetUser = jest.fn()
const mockRpc = jest.fn()
const mockDeleteUser = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
      admin: {
        deleteUser: mockDeleteUser,
      },
    },
    rpc: mockRpc,
  })),
}))

import { POST } from '@/app/api/auth/delete-account/route'

function makeReq(opts: { authorization?: string; ip?: string } = {}): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.authorization) headers['Authorization'] = opts.authorization
  if (opts.ip) headers['x-forwarded-for'] = opts.ip
  return new Request('https://authentichadith.app/api/auth/delete-account', {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  })
}

beforeEach(() => {
  mockGetUser.mockReset()
  mockRpc.mockReset()
  mockDeleteUser.mockReset()
})

// ─────────────────────────────────────────────────────────────────────────────
describe('FIX-065 — delete account auth contract (Rule 035)', () => {
  it('returns 401 with no Authorization header — no DB calls made', async () => {
    const res = await POST(makeReq({ ip: '10.1.1.1' }))
    expect(res.status).toBe(401)
    // Auth contract: unauthenticated request must never reach the database.
    expect(mockGetUser).not.toHaveBeenCalled()
    expect(mockRpc).not.toHaveBeenCalled()
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })

  it('returns 401 when the Bearer token is rejected — no DB calls made', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'invalid JWT' },
    })
    const res = await POST(makeReq({ authorization: 'Bearer bad-token', ip: '10.1.1.2' }))
    expect(res.status).toBe(401)
    // RPC and deleteUser must not be called if auth fails.
    expect(mockRpc).not.toHaveBeenCalled()
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })

  it('returns 200 when the session is valid', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'valid-user-uuid' } },
      error: null,
    })
    mockRpc.mockResolvedValueOnce({ error: null })
    mockDeleteUser.mockResolvedValueOnce({ error: null })

    const res = await POST(makeReq({ authorization: 'Bearer valid-token', ip: '10.1.1.3' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('FIX-065 — post-deletion state assertions', () => {
  const USER_ID = 'post-deletion-user-uuid'

  it('profile row archived: delete_user_account RPC called with the correct user_id', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: USER_ID } },
      error: null,
    })
    mockRpc.mockResolvedValueOnce({ error: null })
    mockDeleteUser.mockResolvedValueOnce({ error: null })

    await POST(makeReq({ authorization: 'Bearer valid-token', ip: '10.2.1.1' }))

    // The delete_user_account RPC archives all user-scoped rows in profiles,
    // saved_hadiths, etc. Verifying it was called with the right user_id is
    // the unit-test equivalent of "profile row absent post-deletion".
    expect(mockRpc).toHaveBeenCalledTimes(1)
    expect(mockRpc).toHaveBeenCalledWith('delete_user_account', { p_user_id: USER_ID })
  })

  it('auth user hard-deleted: auth.admin.deleteUser called with the correct user_id', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: USER_ID } },
      error: null,
    })
    mockRpc.mockResolvedValueOnce({ error: null })
    mockDeleteUser.mockResolvedValueOnce({ error: null })

    await POST(makeReq({ authorization: 'Bearer valid-token', ip: '10.2.1.2' }))

    // auth.admin.deleteUser removes the row from auth.users.
    // This is the unit-test equivalent of "auth user absent post-deletion".
    expect(mockDeleteUser).toHaveBeenCalledTimes(1)
    expect(mockDeleteUser).toHaveBeenCalledWith(USER_ID)
  })

  it('token invalidated post-deletion: getUser with old token returns null user', async () => {
    // Simulate what happens when a client tries to use the old token after deletion:
    // Supabase returns no user because the auth record no longer exists.
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'User not found' },
    })

    const res = await POST(makeReq({ authorization: 'Bearer stale-token-post-deletion', ip: '10.2.1.3' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized|invalid|expired/i)
  })

  it('RPC failure returns 500 — deleteUser is not called when RPC fails', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: USER_ID } },
      error: null,
    })
    mockRpc.mockResolvedValueOnce({ error: { message: 'function not found' } })

    const res = await POST(makeReq({ authorization: 'Bearer valid-token', ip: '10.2.1.4' }))
    expect(res.status).toBe(500)
    // Hard-delete must not be attempted if archiving failed.
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })

  it('deleteUser failure does not break the 200 response — data was archived', async () => {
    // When the RPC succeeds but the hard-delete fails, the user is effectively
    // locked out (their auth record still exists but data is archived). The route
    // swallows this error and returns 200 so the client can sign out cleanly.
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: USER_ID } },
      error: null,
    })
    mockRpc.mockResolvedValueOnce({ error: null })
    mockDeleteUser.mockResolvedValueOnce({ error: { message: 'internal error' } })

    const res = await POST(makeReq({ authorization: 'Bearer valid-token', ip: '10.2.1.5' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
