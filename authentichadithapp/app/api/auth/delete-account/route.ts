/**
 * POST /api/auth/delete-account
 *
 * App Store Review requirement 5.1.1(v) — users must be able to delete their
 * account from inside the app without emailing support.
 *
 * Flow:
 *   1. Verify the caller's Bearer token via Supabase admin.getUser()
 *   2. Call the SECURITY DEFINER function delete_user_account(uuid) to archive
 *      user-scoped rows and mark auth.users.raw_user_meta_data with deleted_at
 *   3. Call auth.admin.deleteUser(id) to hard-delete the auth record
 *   4. Return 200 { success: true }
 *
 * Requires server-side env vars (NOT EXPO_PUBLIC_*):
 *   SUPABASE_URL              — project URL
 *   SUPABASE_SERVICE_ROLE_KEY — secret service-role JWT (never shipped to client)
 */

import { createClient } from '@supabase/supabase-js'

export default function DeleteAccountRoute() {
  return null
}

// ── In-memory rate limiter ───────────────────────────────────────────────────
// Max 3 attempts per IP per 15-minute window. Stored in process memory so it
// resets on server restart (acceptable — this is a last-ditch DoS guard, not
// a billing control). A distributed store (Redis/Upstash) is the right call
// if this ever moves to a multi-instance deployment.
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

interface RateLimitEntry {
  count: number
  windowStart: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true
  }

  entry.count += 1
  return false
}

// Build a one-off admin client per request — service role key stays server-side only.
function makeAdminClient() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on server')
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: Request) {
  try {
    // ── 0. Rate limit check ──────────────────────────────────────────────────
    // Use X-Forwarded-For when behind a proxy/CDN; fall back to a sentinel so
    // the limiter still works in local dev even without a real IP header.
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'

    if (isRateLimited(ip)) {
      return Response.json(
        { error: 'Too many requests. Please wait 15 minutes before trying again.' },
        { status: 429 },
      )
    }

    // ── 1. Extract Bearer token ──────────────────────────────────────────────
    const authHeader = request.headers.get('Authorization') ?? ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return Response.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 },
      )
    }

    // ── 2. Validate the token and resolve the user ID ────────────────────────
    const admin = makeAdminClient()
    const { data: userData, error: userError } = await admin.auth.getUser(token)

    if (userError || !userData?.user) {
      return Response.json(
        { error: 'Unauthorized — token invalid or expired' },
        { status: 401 },
      )
    }

    const userId = userData.user.id

    // ── 3. Archive user data and soft-delete via SQL function ────────────────
    // delete_user_account is a SECURITY DEFINER function that snapshots
    // user-scoped rows into archived_user_data and marks deleted_at on the
    // auth record. It is safe to call even if some tables are absent.
    const { error: rpcError } = await admin.rpc('delete_user_account', {
      p_user_id: userId,
    })

    if (rpcError) {
      // Log server-side; do not expose DB internals to caller.
      console.error('[delete-account] RPC error:', rpcError.message)
      return Response.json(
        { error: 'Account deletion failed — please contact support.' },
        { status: 500 },
      )
    }

    // ── 4. Hard-delete the auth record ───────────────────────────────────────
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId)

    if (deleteError) {
      // RPC succeeded (data archived); log hard-delete failure and continue.
      // The user is effectively locked out; background cleanup can finish later.
      console.error('[delete-account] auth.admin.deleteUser error:', deleteError.message)
    }

    // ── 5. Return success ────────────────────────────────────────────────────
    return Response.json({ success: true }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    console.error('[delete-account] Unexpected error:', message)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
