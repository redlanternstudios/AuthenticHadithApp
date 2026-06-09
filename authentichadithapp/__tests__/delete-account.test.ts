/**
 * Tests for POST /api/auth/delete-account
 *
 * Covers:
 *  - 401 when no Authorization header
 *  - 401 when token is present but Supabase rejects it
 *  - 200 on a valid delete (RPC + auth.admin.deleteUser succeed)
 *  - 429 when the same IP exceeds 3 requests in 15 minutes
 *
 * Supabase admin client is fully mocked — no network calls.
 */

// ── Server env vars required by makeAdminClient() ────────────────────────────
// Must be set before the route module is imported so the env guard does not
// throw during makeAdminClient(). These are fake values — createClient is
// mocked below so no real Supabase connection is made.
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// ── Supabase mock ─────────────────────────────────────────────────────────────
// We need fine-grained control per-test, so the factory returns a jest.fn()
// object whose behaviour each test can override via mockResolvedValueOnce.

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

// ── Import route AFTER mocks are registered ──────────────────────────────────
// Dynamic require inside each test group ensures the module cache is warm with
// the mocked supabase client.
import { POST } from '@/app/api/auth/delete-account/route'

// ── Helper: build a minimal Request ──────────────────────────────────────────
function makeRequest(opts: {
  authorization?: string
  ip?: string
} = {}): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (opts.authorization) {
    headers['Authorization'] = opts.authorization
  }
  if (opts.ip) {
    headers['x-forwarded-for'] = opts.ip
  }
  return new Request('https://authentichadith.app/api/auth/delete-account', {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  })
}

// ── Reset mocks and the rate-limit map between tests ─────────────────────────
// The rate-limit map is module-level state. We use jest.isolateModules in the
// rate-limit test to get a fresh module instance rather than trying to reach
// into private state from here.
beforeEach(() => {
  mockGetUser.mockReset()
  mockRpc.mockReset()
  mockDeleteUser.mockReset()
})

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE ACCOUNT — authentication', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const req = makeRequest({ ip: '10.0.0.1' })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/missing|invalid authorization/i)
  })

  it('returns 401 when the Bearer token is rejected by Supabase', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'invalid JWT' },
    })
    const req = makeRequest({ authorization: 'Bearer bad-token', ip: '10.0.0.2' })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized|invalid|expired/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE ACCOUNT — successful deletion', () => {
  it('returns 200 { success: true } when token is valid and both DB calls succeed', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-uuid-123' } },
      error: null,
    })
    mockRpc.mockResolvedValueOnce({ error: null })
    mockDeleteUser.mockResolvedValueOnce({ error: null })

    const req = makeRequest({ authorization: 'Bearer valid-token', ip: '10.0.0.3' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)

    // Confirm RPC was called with the resolved user ID
    expect(mockRpc).toHaveBeenCalledWith('delete_user_account', { p_user_id: 'user-uuid-123' })

    // Confirm hard-delete was attempted
    expect(mockDeleteUser).toHaveBeenCalledWith('user-uuid-123')
  })

  it('still returns 200 when hard-delete (auth.admin.deleteUser) fails — data was archived', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-uuid-456' } },
      error: null,
    })
    mockRpc.mockResolvedValueOnce({ error: null })
    // Simulate a partial failure on the auth hard-delete
    mockDeleteUser.mockResolvedValueOnce({ error: { message: 'user already deleted' } })

    const req = makeRequest({ authorization: 'Bearer valid-token', ip: '10.0.0.4' })
    const res = await POST(req)
    // Route should swallow deleteUser errors and still return 200
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE ACCOUNT — rate limiting', () => {
  // This test uses a unique IP (192.168.99.99) not used anywhere else in the
  // suite, so there is no cross-test rate-limit state bleed. All 4 calls run
  // within a single test (no beforeEach reset between them), which is correct:
  // the rate-limit map is module-level state and persists across calls.
  it('returns 429 after 3 requests from the same IP within the 15-minute window', async () => {
    const IP = '192.168.99.99'

    // Configure mocks for all 4 calls upfront
    for (let i = 0; i < 3; i++) {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: `user-uuid-rate-${i}` } },
        error: null,
      })
      mockRpc.mockResolvedValueOnce({ error: null })
      mockDeleteUser.mockResolvedValueOnce({ error: null })
    }

    // First 3 calls from this IP should succeed (200)
    for (let i = 0; i < 3; i++) {
      const req = makeRequest({ authorization: 'Bearer valid-token', ip: IP })
      const res = await POST(req)
      expect(res.status).toBe(200)
    }

    // 4th call from the same IP must be rate-limited — no mock setup needed
    // because the rate-limit check fires before any Supabase call
    const req4 = makeRequest({ authorization: 'Bearer valid-token', ip: IP })
    const res4 = await POST(req4)
    expect(res4.status).toBe(429)
    const body = await res4.json()
    expect(body.error).toMatch(/too many requests/i)
  })
})
