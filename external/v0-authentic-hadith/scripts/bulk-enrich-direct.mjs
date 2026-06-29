// Direct bulk enrichment - calls OpenAI and Supabase REST APIs directly
// Processes hadiths that don't have enrichment yet

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nqklipakrfuwebkdnhwg.supabase.co"
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY

if (!SUPABASE_KEY) { console.log("ERROR: SUPABASE_SERVICE_ROLE_KEY not set"); process.exit(1) }
if (!OPENAI_KEY) { console.log("ERROR: OPENAI_API_KEY not set"); process.exit(1) }

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
}

const BATCH_SIZE = 20
const MAX_ROUNDS = 50 // 50 x 20 = 1000 per run

async function supaGet(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`GET ${table}: ${res.status} ${await res.text()}`)
  return res.json()
}

async function supaPost(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST", headers: HEADERS, body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`POST ${table}: ${res.status} ${await res.text()}`)
  return res.json()
}

async function callGPT(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1200,
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenAI ${res.status}: ${errText}`)
  }
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}

async function main() {
  console.log("Loading categories and tags...")
  const categories = await supaGet("categories", "select=id,slug")
  const tags = await supaGet("tags", "select=id,slug")
  const catMap = Object.fromEntries(categories.map(c => [c.slug, c.id]))
  const tagMap = Object.fromEntries(tags.map(t => [t.slug, t.id]))
  console.log(`  ${categories.length} categories, ${tags.length} tags loaded`)

  console.log("Loading already-enriched hadith IDs...")
  const enriched = await supaGet("hadith_enrichment", "select=hadith_id")
  const enrichedSet = new Set(enriched.map(e => e.hadith_id))
  console.log(`  ${enrichedSet.size} already enriched`)

  let offset = 0
  let totalSuccess = 0
  let totalFailed = 0

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    console.log(`\n--- Round ${round}/${MAX_ROUNDS} ---`)

    const candidates = await supaGet(
      "hadiths",
      `select=id,english_translation,narrator,grade,collection&english_translation=not.is.null&order=id.asc&offset=${offset}&limit=${BATCH_SIZE * 3}`
    )

    const batch = candidates.filter(h => !enrichedSet.has(h.id)).slice(0, BATCH_SIZE)
    offset += BATCH_SIZE * 3

    if (batch.length === 0) {
      console.log("No more unenriched hadiths!")
      break
    }

    console.log(`  Processing ${batch.length} hadiths...`)

    for (const hadith of batch) {
      try {
        let text = hadith.english_translation || ""
        if (text.startsWith("{") && text.includes('"text"')) {
          try { text = JSON.parse(text).text || text } catch {}
        }
        if (text.length < 10) { totalFailed++; continue }

        const result = await callGPT(`You are a hadith scholar with expertise in Islamic jurisprudence and classical hadith commentary. Return a JSON object with these exact fields:

{
  "summary_line": "5-12 word summary of the core teaching, present-tense",
  "category_slug": "one of: worship, character, family, daily-life, knowledge, community, afterlife",
  "tag_slugs": ["1-4 tags from: prayer, fasting, charity, pilgrimage, remembrance, patience, truthfulness, kindness, forgiveness, humility, anger, parents, marriage, children, relatives, neighbors, work, food, speech, cleanliness, greetings, seeking-knowledge, intention, faith, quran, justice, leadership, rights, brotherhood, death, judgment, paradise, hellfire"],
  "key_teaching_en": "2-4 sentences. First sentence: plain-language explanation anyone can understand. Remaining: scholarly context referencing classical scholars (Ibn Hajar, Al-Nawawi, Ibn Qayyim) or related Quran verses. Do NOT repeat the hadith text.",
  "key_teaching_ar": "Arabic translation of key_teaching_en. Same two-layer structure. Fluent Modern Standard Arabic.",
  "summary_ar": "Arabic translation of summary_line. 3-10 words MSA.",
  "confidence": 0.85,
  "rationale": "Brief why this category and tags"
}

Hadith Text: "${text.replace(/"/g, '\\"')}"
Narrator: ${hadith.narrator || "Unknown"}
Collection: ${hadith.collection}
Grade: ${hadith.grade}`)

        const categoryId = catMap[result.category_slug]
        if (!categoryId) { totalFailed++; console.log(`    SKIP ${hadith.id}: bad category`); continue }

        const [enrichRow] = await supaPost("hadith_enrichment", {
          hadith_id: hadith.id,
          summary_line: result.summary_line?.slice(0, 80),
          summary_ar: result.summary_ar?.slice(0, 120),
          key_teaching_en: result.key_teaching_en?.slice(0, 600),
          key_teaching_ar: result.key_teaching_ar?.slice(0, 800),
          category_id: categoryId,
          status: "published",
          confidence: Math.min(1, Math.max(0, result.confidence || 0.7)),
          rationale: result.rationale?.slice(0, 200),
          suggested_by: "openai-gpt-4o-mini",
          methodology_version: "v1.1",
          published_at: new Date().toISOString(),
        })

        // Insert tags
        const validTags = (result.tag_slugs || []).filter(s => tagMap[s]).slice(0, 4)
        if (validTags.length > 0 && enrichRow?.id) {
          await supaPost("hadith_tags", validTags.map(s => ({
            hadith_id: hadith.id,
            tag_id: tagMap[s],
            enrichment_id: enrichRow.id,
            status: "published",
          })))
        }

        enrichedSet.add(hadith.id)
        totalSuccess++
      } catch (err) {
        totalFailed++
        console.log(`    ERR ${hadith.id}: ${err.message?.slice(0, 80)}`)
      }
    }

    console.log(`  Running total: ${totalSuccess} success, ${totalFailed} failed, ${enrichedSet.size} total enriched`)
  }

  console.log(`\n=== DONE: ${totalSuccess} success, ${totalFailed} failed ===`)
}

main().catch(err => { console.error("Fatal:", err); process.exit(1) })
