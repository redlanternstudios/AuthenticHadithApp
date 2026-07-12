import { generateText, Output } from "ai"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const maxDuration = 300 // 5 minute timeout for large batches

const enrichmentSchema = z.object({
  summary_line: z
    .string()
    .min(5)
    .max(80)
    .describe("A concise 5-12 word summary capturing the core teaching. No quotes, no hadith number."),
  category_slug: z
    .enum(["worship", "character", "family", "daily-life", "knowledge", "community", "afterlife"])
    .describe("The single best-fit category for this hadith"),
  tag_slugs: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe(
      "1-4 tag slugs: prayer, fasting, charity, pilgrimage, remembrance, patience, truthfulness, kindness, forgiveness, humility, anger, parents, marriage, children, relatives, neighbors, work, food, speech, cleanliness, greetings, seeking-knowledge, intention, faith, quran, justice, leadership, rights, brotherhood, death, judgment, paradise, hellfire",
    ),
  key_teaching_en: z
    .string()
    .min(20)
    .max(600)
    .describe(
      "2-4 sentence key teaching note. First sentence: plain-language accessible explanation. Remaining: scholarly context referencing fiqh rulings, scholars (Ibn Hajar, Al-Nawawi, etc.), or Quran verses. Do NOT repeat the hadith text.",
    ),
  key_teaching_ar: z
    .string()
    .min(10)
    .max(800)
    .describe("Arabic translation of key_teaching_en. Same two-layer structure. Fluent Modern Standard Arabic."),
  summary_ar: z
    .string()
    .min(3)
    .max(120)
    .describe("Arabic translation of summary_line. 3-10 words in Modern Standard Arabic."),
  confidence: z.number().min(0).max(1).describe("Confidence 0-1. 0.9+ for clear topics, 0.6-0.8 for ambiguous."),
  rationale: z.string().max(200).describe("Brief explanation of category/tag choices."),
})

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Verify admin
    const { createClient } = await import("@supabase/supabase-js")
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import("@/lib/supabase/config")
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()
    if (!profile || !["admin", "reviewer"].includes(profile.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { collection_slug, batch_size = 10, auto_publish = true, mode = "new" } = body

    // mode: "new" = enrich hadiths without enrichment
    // mode: "backfill" = add key_teaching to existing enrichments that lack it

    // Fetch category and tag lookups
    const { data: categories } = await supabase.from("categories").select("id, slug")
    const { data: tags } = await supabase.from("tags").select("id, slug")
    const categoryMap = new Map((categories || []).map((c: { id: string; slug: string }) => [c.slug, c.id]))
    const tagMap = new Map((tags || []).map((t: { id: string; slug: string }) => [t.slug, t.id]))

    const limit = Math.min(batch_size, 50)

    if (mode === "backfill") {
      return await handleBackfill(supabase, limit, auto_publish)
    }

    // Get enriched hadith IDs to exclude
    const { data: enrichedIds } = await supabase.from("hadith_enrichment").select("hadith_id")
    const enrichedSet = new Set((enrichedIds || []).map((e: { hadith_id: string }) => e.hadith_id))

    // Fetch candidate hadiths
    let query = supabase
      .from("hadiths")
      .select("id, english_translation, arabic_text, narrator, grade, collection, reference")
      .not("english_translation", "is", null)
      .order("hadith_number", { ascending: true })
      .limit(limit * 3)

    if (collection_slug) {
      query = query.eq("collection", collection_slug)
    }

    const { data: candidates } = await query
    const hadiths = (candidates || []).filter((h: { id: string }) => !enrichedSet.has(h.id)).slice(0, limit)

    if (hadiths.length === 0) {
      return Response.json({ message: "No unenriched hadiths found", processed: 0, success: 0, failed: 0 })
    }

    const results: Array<{ hadithId: string; success: boolean; error?: string }> = []

    for (const hadith of hadiths) {
      try {
        let translationText = hadith.english_translation || ""
        if (translationText.startsWith("{") && translationText.includes('"text"')) {
          try {
            const parsed = JSON.parse(translationText)
            translationText = parsed.text || translationText
          } catch {
            // keep raw
          }
        }

        if (translationText.length < 10) {
          results.push({ hadithId: hadith.id, success: false, error: "Translation too short" })
          continue
        }

        const { output: object } = await generateText({
          model: "openai/gpt-4o-mini",
          output: Output.object({ schema: enrichmentSchema }),
          prompt: `You are a hadith scholar with expertise in Islamic jurisprudence and classical hadith commentary. Analyze this hadith and provide enrichment data.

Hadith Text: "${translationText}"
Narrator: ${hadith.narrator || "Unknown"}
Collection: ${hadith.collection}
Grade: ${hadith.grade}

Rules:
- summary_line: 5-12 words, present-tense, captures the core teaching
- key_teaching_en: 2-4 sentences. FIRST sentence: plain-language explanation. REMAINING: scholarly context with classical scholars and/or Quran refs. Do NOT repeat the hadith.
- key_teaching_ar: Arabic translation of key_teaching_en. Fluent MSA.
- summary_ar: Arabic translation of summary_line. 3-10 words MSA.
- category_slug: SINGLE best-fit category
- tag_slugs: 1-4 tags from the controlled list
- confidence: 0.9+ clear, 0.6-0.8 ambiguous`,
        })

        if (!object) {
          results.push({ hadithId: hadith.id, success: false, error: "No LLM output" })
          continue
        }

        const categoryId = categoryMap.get(object.category_slug)
        if (!categoryId) {
          results.push({ hadithId: hadith.id, success: false, error: `Unknown category: ${object.category_slug}` })
          continue
        }

        const status = auto_publish ? "published" : "suggested"
        const { data: enrichment, error: insertError } = await supabase
          .from("hadith_enrichment")
          .insert({
            hadith_id: hadith.id,
            summary_line: object.summary_line,
            summary_ar: object.summary_ar,
            key_teaching_en: object.key_teaching_en,
            key_teaching_ar: object.key_teaching_ar,
            category_id: categoryId,
            status,
            confidence: object.confidence,
            rationale: object.rationale,
            suggested_by: "openai-gpt-4o-mini",
            methodology_version: "v1.1",
            ...(auto_publish ? { published_at: new Date().toISOString() } : {}),
          })
          .select("id")
          .single()

        if (insertError) {
          results.push({ hadithId: hadith.id, success: false, error: insertError.message })
          continue
        }

        // Insert tags
        const validTagSlugs = object.tag_slugs.filter((slug: string) => tagMap.has(slug))
        if (validTagSlugs.length > 0 && enrichment) {
          const tagRows = validTagSlugs.map((slug: string) => ({
            hadith_id: hadith.id,
            tag_id: tagMap.get(slug),
            enrichment_id: enrichment.id,
            status: auto_publish ? ("published" as const) : ("suggested" as const),
          }))
          await supabase.from("hadith_tags").insert(tagRows)
        }

        results.push({ hadithId: hadith.id, success: true })
      } catch (err) {
        results.push({
          hadithId: hadith.id,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    return Response.json({
      processed: results.length,
      success: successCount,
      failed: results.length - successCount,
      auto_published: auto_publish,
      results,
    })
  } catch (error) {
    console.error("Batch enrichment error:", error)
    return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// Backfill key_teaching for existing enrichments that lack it
async function handleBackfill(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  limit: number,
  autoPublish: boolean,
) {
  const { data: existing } = await supabase
    .from("hadith_enrichment")
    .select("id, hadith_id, summary_line")
    .or("key_teaching_en.is.null,key_teaching_en.eq.")
    .limit(limit)

  if (!existing || existing.length === 0) {
    return Response.json({ message: "All enrichments already have key teachings", processed: 0, success: 0, failed: 0 })
  }

  const hadithIds = existing.map((e: { hadith_id: string }) => e.hadith_id)
  const { data: hadiths } = await supabase
    .from("hadiths")
    .select("id, english_translation, narrator, grade, collection")
    .in("id", hadithIds)

  const hadithMap = new Map((hadiths || []).map((h: { id: string; english_translation: string; narrator: string; grade: string; collection: string }) => [h.id, h]))

  const keyTeachingSchema = z.object({
    key_teaching_en: z
      .string()
      .min(20)
      .max(600)
      .describe(
        "2-4 sentence key teaching. First sentence: accessible explanation. Remaining: scholarly context with classical scholars/Quran refs.",
      ),
    key_teaching_ar: z
      .string()
      .min(10)
      .max(800)
      .describe("Arabic translation of key_teaching_en. Fluent MSA."),
    summary_ar: z
      .string()
      .min(3)
      .max(120)
      .describe("Arabic translation of the summary. 3-10 words MSA."),
  })

  const results: Array<{ enrichmentId: string; success: boolean; error?: string }> = []

  for (const enrichment of existing) {
    try {
      const hadith = hadithMap.get(enrichment.hadith_id)
      if (!hadith) {
        results.push({ enrichmentId: enrichment.id, success: false, error: "Hadith not found" })
        continue
      }

      let translationText = hadith.english_translation || ""
      if (translationText.startsWith("{") && translationText.includes('"text"')) {
        try {
          const parsed = JSON.parse(translationText)
          translationText = parsed.text || translationText
        } catch {
          // keep raw
        }
      }

      const { output: object } = await generateText({
        model: "openai/gpt-4o-mini",
        output: Output.object({ schema: keyTeachingSchema }),
        prompt: `You are a hadith scholar. Generate a key teaching note for this hadith.

Hadith Text: "${translationText}"
Summary: "${enrichment.summary_line || ""}"
Narrator: ${hadith.narrator || "Unknown"}
Collection: ${hadith.collection}
Grade: ${hadith.grade}

Rules:
- key_teaching_en: 2-4 sentences. FIRST sentence: plain-language explanation anyone can understand. REMAINING: scholarly context referencing classical scholars (Ibn Hajar, Al-Nawawi, etc.) or related Quran verses. Do NOT repeat the hadith text.
- key_teaching_ar: Arabic translation of key_teaching_en. Fluent MSA.
- summary_ar: Arabic translation of "${enrichment.summary_line || ""}". 3-10 words MSA.`,
      })

      if (!object) {
        results.push({ enrichmentId: enrichment.id, success: false, error: "No LLM output" })
        continue
      }

      const { error: updateError } = await supabase
        .from("hadith_enrichment")
        .update({
          key_teaching_en: object.key_teaching_en,
          key_teaching_ar: object.key_teaching_ar,
          summary_ar: object.summary_ar,
          methodology_version: "v1.1",
          updated_at: new Date().toISOString(),
        })
        .eq("id", enrichment.id)

      if (updateError) {
        results.push({ enrichmentId: enrichment.id, success: false, error: updateError.message })
        continue
      }

      results.push({ enrichmentId: enrichment.id, success: true })
    } catch (err) {
      results.push({
        enrichmentId: enrichment.id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  const successCount = results.filter((r) => r.success).length
  return Response.json({
    mode: "backfill",
    processed: results.length,
    success: successCount,
    failed: results.length - successCount,
    results,
  })
}
