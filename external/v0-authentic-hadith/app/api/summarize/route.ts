import { generateText, Output } from "ai"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: Request) {
  try {
    const { hadithId } = await req.json()
    if (!hadithId) {
      return Response.json({ error: "Missing hadithId" }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check if enrichment already exists
    const { data: existing } = await supabase
      .from("hadith_enrichment")
      .select("summary_line, key_teaching_en, key_teaching_ar")
      .eq("hadith_id", hadithId)
      .eq("status", "published")
      .single()

    if (existing?.key_teaching_en) {
      return Response.json({
        summary_line: existing.summary_line,
        key_teaching_en: existing.key_teaching_en,
        key_teaching_ar: existing.key_teaching_ar,
        cached: true,
      })
    }

    // Fetch the hadith
    const { data: hadith } = await supabase
      .from("hadiths")
      .select("id, english_translation, narrator, grade, collection")
      .eq("id", hadithId)
      .single()

    if (!hadith) {
      return Response.json({ error: "Hadith not found" }, { status: 404 })
    }

    const text = (hadith.english_translation || "").slice(0, 800)
    if (!text || text.length < 10) {
      return Response.json({ error: "Hadith text too short to summarize" }, { status: 400 })
    }

    const { output } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `You are a hadith scholar. Analyze this hadith and return JSON.

Hadith: "${text}"
Narrator: ${hadith.narrator || "Unknown"}
Grade: ${hadith.grade || "Unknown"}

Return JSON with these keys:
- summary_line: 5-12 word summary capturing the core teaching
- key_teaching_en: 2-4 sentences. First sentence is a plain accessible explanation. Remaining sentences provide scholarly context referencing relevant fiqh, scholars (Ibn Hajar, Al-Nawawi, etc.), or Quran verses. Do NOT repeat the hadith text.
- key_teaching_ar: Arabic translation of key_teaching_en in fluent MSA
- summary_ar: 3-10 word Arabic summary`,
      output: Output.object({
        schema: z.object({
          summary_line: z.string().nullable(),
          key_teaching_en: z.string().nullable(),
          key_teaching_ar: z.string().nullable(),
          summary_ar: z.string().nullable(),
        }),
      }),
    })

    if (!output) {
      return Response.json({ error: "AI returned no output" }, { status: 500 })
    }

    // Upsert into hadith_enrichment
    if (existing) {
      // Update existing row
      await supabase
        .from("hadith_enrichment")
        .update({
          summary_line: output.summary_line || existing.summary_line,
          summary_ar: output.summary_ar,
          key_teaching_en: output.key_teaching_en,
          key_teaching_ar: output.key_teaching_ar,
        })
        .eq("hadith_id", hadithId)
        .eq("status", "published")
    } else {
      // Insert new row
      await supabase.from("hadith_enrichment").insert({
        hadith_id: hadithId,
        summary_line: output.summary_line,
        summary_ar: output.summary_ar,
        key_teaching_en: output.key_teaching_en,
        key_teaching_ar: output.key_teaching_ar,
        status: "published",
        confidence: 0.85,
        suggested_by: "groq-llama-3.3-70b",
        methodology_version: "v1.1",
      })
    }

    return Response.json({
      summary_line: output.summary_line,
      key_teaching_en: output.key_teaching_en,
      key_teaching_ar: output.key_teaching_ar,
      cached: false,
    })
  } catch (err) {
    console.error("Summarize error:", err)
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    )
  }
}
