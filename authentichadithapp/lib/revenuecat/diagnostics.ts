/**
 * RevenueCat in-app diagnostics singleton.
 *
 * Build #17 visibility scaffold. Captures the RC lifecycle in a safe,
 * production-readable form so failure modes that previously hid behind
 * __DEV__-gated logs become visible from Settings → RC Diagnostics.
 *
 * SAFETY CONTRACT:
 *   - Never store full API keys, JWTs, Supabase session objects, or full UUIDs.
 *   - Key prefixes are limited to first 5 chars (e.g. 'appl_'), which is a
 *     public structure marker by RevenueCat design.
 *   - User IDs are masked to first 4 + last 4 chars.
 *   - Error payloads carry only name / code / message — never the raw error
 *     object (avoids accidental serialization of secret-carrying props).
 *
 * REMOVAL: Build #18 strips this module + the rc-diagnostics screen +
 * the tap-counter in app/settings/index.tsx once RC stabilizes.
 */

export type RcDiagStatus = 'info' | 'ok' | 'fail'

export type RcDiagEvent = {
  ts: string
  name: string
  status: RcDiagStatus
  payload: Record<string, unknown>
}

export type RcDiagSnapshot = {
  events: RcDiagEvent[]
  startedAt: string
}

type Listener = (snapshot: RcDiagSnapshot) => void

const MAX_EVENTS = 50

const startedAt = new Date().toISOString()
const events: RcDiagEvent[] = []
const listeners = new Set<Listener>()

function emit(): void {
  const snap: RcDiagSnapshot = { events: events.slice(), startedAt }
  for (const fn of listeners) {
    try {
      fn(snap)
    } catch {
      // Listener errors are not allowed to corrupt the diag stream.
    }
  }
}

export const rcDiag = {
  record(name: string, status: RcDiagStatus, payload: Record<string, unknown>): void {
    events.push({
      ts: new Date().toISOString(),
      name,
      status,
      payload,
    })
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS)
    }
    emit()
  },

  getSnapshot(): RcDiagSnapshot {
    return { events: events.slice(), startedAt }
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}

/**
 * Mask a user identifier for safe logging. Returns first 4 + last 4 chars
 * with an ellipsis separator. Strings of 8 or fewer chars become '****'.
 */
export function maskUserId(id: string | null | undefined): string | null {
  if (!id) return null
  if (id.length <= 8) return '****'
  return `${id.slice(0, 4)}...${id.slice(-4)}`
}
