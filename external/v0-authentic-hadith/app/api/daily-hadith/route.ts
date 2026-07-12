import { getSupabaseServerClient } from "@/lib/supabase/server"
import { SAHIHAYN } from "@/lib/api/hadith-grounding"

/**
 * GET /api/daily-hadith
 *
 * Returns a deterministic "hadith of the day" based on the current date.
 * Uses a hash of the date string to pick a consistent hadith for the entire day.
 * Only returns sahih-graded hadiths for maximum authenticity.
 */
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    // Create a deterministic seed from the date
    const today = new Date()
    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`

    // Simple hash function for the date
    let hash = 0
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash |= 0
    }
    const seed = Math.abs(hash)

    // Get total count of sahih hadiths. Scoped to the Sahihayn so the daily
    // pick is always a hadith the assistant can resolve and the app's "2
    // collections / 14,444" story stays consistent.
    const { count } = await supabase
      .from("hadiths")
      .select("id", { count: "exact", head: true })
      .eq("grade", "sahih")
      .in("collection", SAHIHAYN as unknown as string[])

    if (!count || count === 0) {
      return Response.json({ error: "No hadiths available" }, { status: 404 })
    }

    // Use the seed to pick an offset
    const offset = seed % count

    const { data: hadith, error } = await supabase
      .from("hadiths")
      .select("id, hadith_number, collection, book_number, arabic_text, english_translation, narrator, grade, reference")
      .eq("grade", "sahih")
      .in("collection", SAHIHAYN as unknown as string[])
      .range(offset, offset)
      .single()

    if (error || !hadith) {
      // Fallback: just get a random one
      const { data: fallback } = await supabase
        .from("hadiths")
        .select("id, hadith_number, collection, book_number, arabic_text, english_translation, narrator, grade, reference")
        .eq("grade", "sahih")
        .in("collection", SAHIHAYN as unknown as string[])
        .limit(1)
        .single()

      if (!fallback) {
        return Response.json({ error: "Could not fetch daily hadith" }, { status: 500 })
      }

      return Response.json({ hadith: cleanHadith(fallback), date: dateString })
    }

    return Response.json({ hadith: cleanHadith(hadith), date: dateString })
  } catch (error) {
    console.error("[DailyHadith] Error:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

function cleanHadith(h: any) {
  let text = h.english_translation || ""
  let narrator = h.narrator || ""

  // Parse JSON-encoded translations
  if (text.startsWith("{") && text.includes('"text"')) {
    try {
      const parsed = JSON.parse(text)
      text = (parsed.text || text).replace(/\\n/g, "\n").replace(/\\"/g, '"').trim()
      if (!narrator && parsed.narrator) {
        narrator = parsed.narrator.replace(/^Narrated\s+/i, "").replace(/:$/, "").trim()
      }
    } catch {
      // keep original
    }
  }

  // Map slug to display name
  const collectionNames: Record<string, string> = {
    "sahih-bukhari": "Sahih al-Bukhari",
    "sahih-muslim": "Sahih Muslim",
  }

  return {
    ...h,
    english_translation: text,
    narrator,
    collection_display: collectionNames[h.collection] || h.collection,
  }
}
