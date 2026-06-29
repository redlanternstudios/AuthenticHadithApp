import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * STRICT RAG grounding for the Authentic Hadith assistants (web + native).
 *
 * Provenance is non-negotiable for an authentic-hadith product: the model may
 * ONLY cite hadiths that this module actually retrieved from the `hadiths`
 * table. This is the single source of truth for retrieval so the web chat
 * (app/api/chat) and the native app's chat (app/api/mobile-chat) ground
 * identically.
 *
 * CONTENT INTEGRITY: the assistant is restricted to the Sahihayn
 * (Sahih al-Bukhari + Sahih Muslim) — the only two collections whose grades the
 * product surfaces. 14,444 hadiths. Daily picks and search are scoped the same
 * way (see app/api/daily-hadith) so the assistant can always resolve anything
 * the app shows the user.
 */

export const SAHIHAYN = ["sahih-bukhari", "sahih-muslim"] as const

// Words a user types when *asking about* a reference, e.g. "what is Sahih
// al-Bukhari 998 about". Mapped to collection slugs so a citation the app
// displayed (BUG 12: "Today's Sunnah cites Bukhari 998") is resolvable.
const COLLECTION_ALIASES: Record<string, string> = {
  bukhari: "sahih-bukhari",
  "al-bukhari": "sahih-bukhari",
  bukari: "sahih-bukhari",
  muslim: "sahih-muslim",
}

// Generic/meta words that carry no hadith-topic signal. Stripped before keyword
// search so retrieval keys on real content (e.g. "kindness"), not filler.
const STOPWORDS = new Set(
  (
    "the a an of to in on at by it its is are am was were be been being and or but for nor so yet with about into from over under " +
    "what when how why who whom which that this these those there here then than as if not no yes do does did done has have had " +
    "tell me give show explain please can could would should will shall may might must want need know find get see read share " +
    "you your yours i my me mine we us our ours they them their he she his her hadith hadith's hadiths narration narrations " +
    "authentic authenticity source sources reference references grade graded grading sahih hasan daif weak chain isnad collection " +
    "regarding related topic example examples something anything everything please kindly thanks thank also more most some any " +
    "say said says according mention mentioned talk speak speaks about list quote cite citing number"
  ).split(/\s+/),
)

export interface GroundedHadith {
  id: number | string
  hadith_number: number
  collection: string
  arabic_text?: string | null
  english_text?: string | null
  english_translation?: string | null
  narrator?: string | null
  grade?: string | null
  reference?: string | null
}

export function extractKeywords(text: string): string[] {
  const words = (text.toLowerCase().match(/[a-z]{3,}/g) || []).filter((w) => !STOPWORDS.has(w))
  return Array.from(new Set(words)).slice(0, 6)
}

/**
 * Parse explicit hadith references out of a question so the assistant can fetch
 * a cited hadith by number instead of only keyword-searching its text.
 * Matches "Bukhari 998", "Sahih al-Bukhari #998", "muslim 234", etc.
 */
export function parseReferences(text: string): Array<{ collection: string; number: number }> {
  const refs: Array<{ collection: string; number: number }> = []
  const lower = text.toLowerCase()
  const re = /(al-bukhari|bukhari|bukari|muslim)\b[^0-9]{0,12}?#?\s*(\d{1,5})/g
  let m: RegExpExecArray | null
  while ((m = re.exec(lower)) !== null) {
    const collection = COLLECTION_ALIASES[m[1]]
    const number = Number.parseInt(m[2], 10)
    if (collection && Number.isFinite(number)) {
      refs.push({ collection, number })
    }
  }
  return refs
}

export function cleanText(raw: unknown): string {
  let text = typeof raw === "string" ? raw : ""
  if (text.startsWith("{") && text.includes('"text"')) {
    try {
      text = JSON.parse(text).text || text
    } catch {
      // keep original
    }
  }
  return text.replace(/\\n/g, "\n").replace(/\\"/g, '"').trim()
}

const SELECT_COLS =
  "id, hadith_number, collection, arabic_text, english_text, english_translation, narrator, grade, reference"

/**
 * Retrieve the hadiths the assistant is allowed to cite for a given question.
 * Combines exact reference lookups (high priority) with specificity-weighted
 * keyword search, all scoped to the Sahihayn. Returns at most `limit` rows.
 */
export async function retrieveGrounding(
  supabase: SupabaseClient,
  userText: string,
  limit = 5,
): Promise<GroundedHadith[]> {
  const text = String(userText || "")
  const references = parseReferences(text)
  const keywords = extractKeywords(text)

  const byId = new Map<GroundedHadith["id"], GroundedHadith>()

  // 1) Exact reference lookups — a hadith the user names by number must resolve.
  if (references.length) {
    const refResults = await Promise.all(
      references.map((ref) =>
        supabase
          .from("hadiths")
          .select(SELECT_COLS)
          .eq("collection", ref.collection)
          .eq("hadith_number", ref.number)
          .limit(1)
          .then((r) => r.data || []),
      ),
    )
    for (const rows of refResults) for (const h of rows as GroundedHadith[]) byId.set(h.id, h)
  }

  // 2) Keyword search. Each keyword gets its own query + quota so a common word
  // can't crowd out the rare topic word, then rank by specificity.
  if (keywords.length) {
    const perKeyword = await Promise.all(
      keywords.map((k) =>
        supabase
          .from("hadiths")
          .select(SELECT_COLS)
          .in("collection", SAHIHAYN as unknown as string[])
          .or(`english_text.ilike.%${k}%,english_translation.ilike.%${k}%,narrator.ilike.%${k}%`)
          .limit(10)
          .then((r) => r.data || []),
      ),
    )
    for (const rows of perKeyword) for (const h of rows as GroundedHadith[]) if (!byId.has(h.id)) byId.set(h.id, h)
  }

  const scored = Array.from(byId.values())
    .map((h) => {
      const text = cleanText(h.english_text || h.english_translation)
      const hay = `${text} ${h.narrator || ""}`.toLowerCase()
      // Reference matches always rank first; otherwise specificity-weighted.
      const isRef = references.some((r) => r.collection === h.collection && r.number === h.hadith_number)
      const score = isRef ? 1000 : keywords.reduce((n, k) => (hay.includes(k) ? n + k.length : n), 0)
      return { h, score }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored.map((s) => s.h)
}

const COLLECTION_DISPLAY: Record<string, string> = {
  "sahih-bukhari": "Sahih al-Bukhari",
  "sahih-muslim": "Sahih Muslim",
}

/** Render retrieved hadiths into the block the model is told it may cite from. */
export function formatRetrieved(hadiths: GroundedHadith[]): string {
  return hadiths
    .map((h, i) => {
      const display = COLLECTION_DISPLAY[h.collection] || h.collection
      const grade = h.grade ? `, ${h.grade}` : ""
      const text = cleanText(h.english_text || h.english_translation) || "(no translation available)"
      const narrator = (h.narrator || "—").replace(/^Narrated\s+/i, "").replace(/:$/, "").trim()
      return `${i + 1}. [${display} #${h.hadith_number}${grade}] Narrated ${narrator}: ${text}`
    })
    .join("\n\n")
}

/** Shared strict-grounding rules appended to both assistants' system prompts. */
export const STRICT_GROUNDING_RULES = `STRICT GROUNDING RULES (you MUST follow these — they are the most important rules):
- You may ONLY cite, quote, reference, or attribute a hadith that appears in the "RETRIEVED HADITHS" block below.
- NEVER state a hadith number, collection name, narrator, chain, or authenticity grade that is not present in that block. Do not recall hadiths from your own training or memory.
- If the retrieved hadiths do not answer the question, or none are provided, say clearly that you could not find a specific authenticated narration for that in the collection and suggest the app's Search feature. You may then offer brief GENERAL thematic guidance, but you MUST NOT invent, recall, or cite any specific hadith, number, chain, or grade from outside the retrieved set.
- When you cite a retrieved hadith, include its collection, number, narrator, and grade exactly as given.`

export function buildGroundedSystem(basePrompt: string, hadiths: GroundedHadith[]): string {
  const block = hadiths.length
    ? `RETRIEVED HADITHS (the ONLY hadiths you may cite):\n${formatRetrieved(hadiths)}`
    : `RETRIEVED HADITHS: (none matched — do NOT cite any specific hadith; tell the user you could not find a specific narration and suggest the Search feature.)`
  return `${basePrompt}\n\n${STRICT_GROUNDING_RULES}\n\n${block}`
}
