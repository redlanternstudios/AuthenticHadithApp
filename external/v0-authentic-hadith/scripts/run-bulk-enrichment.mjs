// Bulk enrichment runner - calls the /api/enrich/bulk-process endpoint in a loop
// Usage: This is designed to be triggered from v0's script runner

const API_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/enrich/bulk-process`
  : "http://localhost:3000/api/enrich/bulk-process"

// Use first 20 chars of service role key as auth secret
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20)
if (!SECRET) {
  console.log("ERROR: SUPABASE_SERVICE_ROLE_KEY not available")
  process.exit(1)
}

const BATCH_SIZE = 25
const MAX_ROUNDS = 40 // 40 rounds x 25 = 1000 hadiths per script run
const DELAY_MS = 1000 // 1s between batches to avoid rate limits

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runBatch(offset) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: SECRET, offset, batch_size: BATCH_SIZE }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  return res.json()
}

async function main() {
  console.log(`Starting bulk enrichment: ${BATCH_SIZE} per batch, up to ${MAX_ROUNDS} rounds`)
  console.log(`API: ${API_URL}`)

  let offset = 0
  let totalSuccess = 0
  let totalFailed = 0
  let round = 0

  while (round < MAX_ROUNDS) {
    round++
    console.log(`\n--- Round ${round}/${MAX_ROUNDS} (offset: ${offset}) ---`)

    try {
      const result = await runBatch(offset)
      console.log(`  Processed: ${result.processed}, Success: ${result.success}, Failed: ${result.failed}`)

      if (result.errors?.length > 0) {
        console.log(`  Errors: ${result.errors.slice(0, 3).join("; ")}`)
      }

      totalSuccess += result.success || 0
      totalFailed += result.failed || 0

      if (result.processed === 0 || !result.next_offset) {
        console.log("\nNo more hadiths to process!")
        break
      }

      offset = result.next_offset
      console.log(`  Total enriched so far: ~${result.total_enriched_set_size}`)
    } catch (err) {
      console.log(`  ERROR: ${err.message}`)
      // Continue to next offset on error
      offset += BATCH_SIZE * 4
    }

    await sleep(DELAY_MS)
  }

  console.log(`\n=== COMPLETE ===`)
  console.log(`Total success: ${totalSuccess}`)
  console.log(`Total failed: ${totalFailed}`)
  console.log(`Rounds completed: ${round}`)
}

main().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
