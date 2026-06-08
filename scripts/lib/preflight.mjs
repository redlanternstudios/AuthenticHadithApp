#!/usr/bin/env node
/**
 * preflight.mjs — Rule 033 enforcement: "Prove the Pipe Before You Fill It."
 *
 * Reusable guards for any at-scale or paid batch operation (mass DB writes,
 * LLM inference loops, paid-API fan-out). The job of this module is to make it
 * IMPOSSIBLE to spend money/tokens generating output that can never land.
 *
 * THE INCIDENT THIS PREVENTS (FIX-059, 2026-06-05):
 *   The AI-summary script generated Groq output for 31,476 hadiths and PATCHed
 *   each into `enriched_hadiths` — which is a NON-UPDATABLE VIEW. Every write
 *   returned HTTP 500 "cannot update view". Zero rows landed. Hundreds of paid
 *   Groq calls were spent on output with nowhere to go. The pilot "passed"
 *   because pilot mode never wrote — it only printed.
 *
 * THE TWO GUARDS:
 *   1. assertWritableTarget() — a zero-row canary PATCH that proves the target
 *      object EXISTS and ACCEPTS writes, WITHOUT mutating any real data. Run it
 *      BEFORE any generation/inference. If the target is a view, missing, or
 *      RLS-blocked, this throws and the batch never starts.
 *   2. CircuitBreaker — trips after N consecutive failures so a broken pipeline
 *      dies after a handful of items instead of grinding the whole batch.
 */

/**
 * Prove a PostgREST target accepts writes via a zero-row canary PATCH.
 *
 * HOW IT IS SAFE: we PATCH with a filter that matches ZERO rows (an impossible
 * key). PostgREST/Postgres still evaluates write-ability of the target during
 * query rewrite — a non-updatable view raises 55000 "cannot update view" before
 * any row is touched; a missing table 404s; an RLS-blocked write 401/403s. A
 * real, writable table returns 2xx (0 rows updated). No real row is ever changed.
 *
 * @param {object} o
 * @param {string} o.urlBase        e.g. https://<ref>.supabase.co
 * @param {string} o.target         table/view name, e.g. "enriched_hadiths"
 * @param {object} o.headers        write headers (service-role apikey+Authorization+Content-Type)
 * @param {string} [o.probeColumn]  a column that exists on the target (default "id")
 * @param {string} [o.impossibleKey] a value guaranteed to match nothing
 * @returns {Promise<true>} resolves true if writable; throws a clear error otherwise
 */
export async function assertWritableTarget({
  urlBase, target, headers,
  probeColumn = 'id',
  impossibleKey = '00000000-0000-0000-0000-000000000000',
}) {
  const url = `${urlBase}/rest/v1/${target}?${probeColumn}=eq.${encodeURIComponent(impossibleKey)}`
  // Body sets the probe column to itself-ish; with 0 rows matched it is inert.
  const body = JSON.stringify({ [probeColumn]: impossibleKey })
  let r
  try {
    r = await fetch(url, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body,
      signal: AbortSignal.timeout(20000),
    })
  } catch (e) {
    throw new Error(`PREFLIGHT FAILED: could not reach write target "${target}": ${e.message}`)
  }
  if (r.ok) return true // 2xx, 0 rows updated — target is a writable table
  const text = (await r.text()).slice(0, 200)
  // Make the most common cause loud and specific.
  if (/cannot update view|not.*automatically updatable|55000/i.test(text)) {
    throw new Error(
      `PREFLIGHT FAILED: "${target}" is a NON-UPDATABLE VIEW — writes will 500. ` +
      `Find the underlying base table (or add an INSTEAD OF trigger) before any batch write. ` +
      `Server said: ${text}`)
  }
  if (r.status === 404) throw new Error(`PREFLIGHT FAILED: target "${target}" does not exist (404).`)
  if (r.status === 401 || r.status === 403) {
    throw new Error(`PREFLIGHT FAILED: write to "${target}" blocked by RLS/auth (HTTP ${r.status}). Check the key has write rights.`)
  }
  throw new Error(`PREFLIGHT FAILED: write canary to "${target}" returned HTTP ${r.status}: ${text}`)
}

/**
 * Circuit breaker. Call .ok() on each success, .fail() on each failure.
 * When `threshold` consecutive failures occur with zero successes in between,
 * .tripped() returns true so the caller can abort the whole batch.
 */
export class CircuitBreaker {
  constructor(threshold = 10) {
    this.threshold = threshold
    this.consecutiveFails = 0
    this.totalOk = 0
    this.totalFail = 0
  }
  ok() { this.consecutiveFails = 0; this.totalOk++ }
  fail() { this.consecutiveFails++; this.totalFail++ }
  tripped() { return this.consecutiveFails >= this.threshold }
  reason() {
    return `CIRCUIT BREAKER TRIPPED: ${this.consecutiveFails} consecutive failures ` +
      `(${this.totalOk} ok, ${this.totalFail} failed total). Aborting batch to stop the burn.`
  }
}

/**
 * Convenience: confirm a candidate fetch actually returned rows BEFORE spending
 * on generation. A silent 0-row fetch is a no-op disguised as success.
 */
export function assertNonEmpty(rows, label = 'candidate rows') {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`PREFLIGHT FAILED: fetched 0 ${label}. Refusing to "succeed" on an empty batch — check filters/connectivity.`)
  }
  return rows.length
}
