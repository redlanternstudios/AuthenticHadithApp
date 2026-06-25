import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const CHUNK_SIZE = 100

// Collections hidden from V1 — announcements MUST NOT fire for these.
// KEEP IN SYNC WITH: lib/hadith/visibleCollections.ts → HIDDEN_COLLECTION_SLUGS
// Last verified: 2026-06-25 against commit in authentichadithapp repo.
const HIDDEN_COLLECTION_SLUGS: readonly string[] = [
  'musnad-ahmad',
  'sunan-abu-dawud',
  'jami-tirmidhi',
  'sunan-nasai',
  'sunan-ibn-majah',
  'muwatta-malik',
]

interface RequestBody {
  slug: string
  title: string
  body: string
}

interface ExpoTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: {
    error?: string
  }
}

interface ExpoTicketResponse {
  data: ExpoTicket[]
}

// Split an array into chunks of at most `size` elements.
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

serve(async (req: Request) => {
  // ------------------------------------------------------------------
  // 1. Auth gate — Bearer token must match ANNOUNCEMENT_SECRET env var.
  //    This prevents any public internet caller from blasting push to all users.
  // ------------------------------------------------------------------
  const announcementSecret = Deno.env.get('ANNOUNCEMENT_SECRET')
  if (!announcementSecret) {
    console.error('[announce] ANNOUNCEMENT_SECRET env var not set — function misconfigured')
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration: secret not set' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const providedToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (providedToken !== announcementSecret) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // ------------------------------------------------------------------
  // 2. Parse and validate body.
  // ------------------------------------------------------------------
  let body: RequestBody
  try {
    body = await req.json() as RequestBody
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const { slug, title, body: notifBody } = body

  if (!slug || typeof slug !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid field: slug' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }
  if (!title || typeof title !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid field: title' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }
  if (!notifBody || typeof notifBody !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid field: body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // ------------------------------------------------------------------
  // 3. Hidden collection guard.
  //    Do not announce collections that aren't visible in the V1 app.
  //    Mirrors isHiddenCollection() from lib/hadith/visibleCollections.ts.
  // ------------------------------------------------------------------
  if (HIDDEN_COLLECTION_SLUGS.includes(slug)) {
    return new Response(
      JSON.stringify({ error: 'Collection not visible — announcement blocked', slug }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // ------------------------------------------------------------------
  // 4. Create Supabase admin client.
  //    SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically
  //    by the Supabase Edge Function runtime. Never hardcode these.
  //    UPSTREAM RISK: if SUPABASE_SERVICE_ROLE_KEY is not set, the createClient
  //    call will succeed but every DB operation will fail with RLS errors.
  // ------------------------------------------------------------------
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[announce] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration: Supabase env vars not set' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  // ------------------------------------------------------------------
  // 5. Fetch all non-null push tokens from the profiles table.
  //    UPSTREAM RISK: expo_push_token column must exist (migration required).
  //    See the migration SQL in the README before running this function.
  // ------------------------------------------------------------------
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('user_id, expo_push_token')
    .not('expo_push_token', 'is', null)

  if (fetchError) {
    console.error('[announce] Failed to fetch push tokens:', fetchError.message)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch push tokens', detail: fetchError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Extract token strings, filtering out any unexpected nulls defensively.
  const allTokens: string[] = (profiles ?? [])
    .map((p: { expo_push_token: string | null }) => p.expo_push_token)
    .filter((t): t is string => typeof t === 'string' && t.length > 0)

  if (allTokens.length === 0) {
    console.log('[announce] No push tokens found — nothing to send')
    return new Response(
      JSON.stringify({ sent: 0, failed: 0, cleaned: 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }

  console.log(`[announce] Sending to ${allTokens.length} tokens for slug: ${slug}`)

  // ------------------------------------------------------------------
  // 6. Chunk tokens and send to Expo Push API.
  //    DOWNSTREAM RISK: Expo returns "tickets" on send, not final delivery receipts.
  //    We handle DeviceNotRegistered from tickets only. For guaranteed delivery
  //    confirmation in a future V2, poll /--/api/v2/push/getReceipts with ticket IDs.
  // ------------------------------------------------------------------
  const tokenChunks = chunk(allTokens, CHUNK_SIZE)
  let totalSent = 0
  let totalFailed = 0
  const staleTokens: string[] = []

  for (const tokenChunk of tokenChunks) {
    const messages = tokenChunk.map((token) => ({
      to: token,
      title,
      body: notifBody,
      data: { screen: 'collection', slug },
      sound: 'default',
      priority: 'normal',
    }))

    let ticketResponse: ExpoTicketResponse
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
      })

      if (!res.ok) {
        // Non-200 from Expo — log and count entire chunk as failed.
        const errText = await res.text()
        console.error(`[announce] Expo API HTTP ${res.status}: ${errText}`)
        totalFailed += tokenChunk.length
        continue
      }

      ticketResponse = (await res.json()) as ExpoTicketResponse
    } catch (err) {
      // Network error sending this chunk — count as failed, keep going.
      console.error('[announce] Fetch to Expo API failed:', err)
      totalFailed += tokenChunk.length
      continue
    }

    // Parse per-ticket results.
    const tickets = ticketResponse.data ?? []
    tickets.forEach((ticket, i) => {
      if (ticket.status === 'ok') {
        totalSent++
      } else {
        totalFailed++
        // Collect stale tokens for cleanup.
        if (ticket.details?.error === 'DeviceNotRegistered') {
          staleTokens.push(tokenChunk[i])
        } else {
          console.warn(`[announce] Ticket error for token index ${i}:`, ticket.message)
        }
      }
    })
  }

  // ------------------------------------------------------------------
  // 7. Clean up stale / DeviceNotRegistered tokens.
  //    Set expo_push_token = null for each stale token so they are not
  //    queried again on the next announcement.
  //    DOWNSTREAM RISK: if a token appears in multiple profiles (should not happen
  //    but is defensively handled), all matching rows get nulled — correct behavior.
  // ------------------------------------------------------------------
  let cleaned = 0
  if (staleTokens.length > 0) {
    const { error: cleanError, count } = await supabase
      .from('profiles')
      .update({ expo_push_token: null })
      .in('expo_push_token', staleTokens)

    if (cleanError) {
      // Non-fatal — log and report, but don't fail the whole response.
      console.error('[announce] Failed to clean stale tokens:', cleanError.message)
    } else {
      cleaned = count ?? staleTokens.length
      console.log(`[announce] Cleaned ${cleaned} stale token(s)`)
    }
  }

  console.log(`[announce] Done — sent: ${totalSent}, failed: ${totalFailed}, cleaned: ${cleaned}`)

  return new Response(
    JSON.stringify({ sent: totalSent, failed: totalFailed, cleaned }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
