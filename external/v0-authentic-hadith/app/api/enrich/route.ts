import { generateText, Output } from "ai"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

// Schema for what the LLM must return per hadith
const enrichmentSchema = z.object({
  summary_line: z
    .string()
    .min(5)
    .max(80)
    .describe("A concise 5-12 word summary capturing the core teaching. No quotes, no hadith number."),
  category_slug: z
    .enum([
      "worship",
      "character",
      "family",
      "daily-life",
      "knowledge",
      "community",
      "afterlife",
    ])
    .describe("The single best-fit category for this hadith"),
  tag_slugs: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe(
      "1-4 tag slugs from the controlled vocabulary: prayer, fasting, charity, pilgrimage, remembrance, patience, truthfulness, kindness, forgiveness, humility, anger, parents, marriage, children, relatives, neighbors, work, food, speech, cleanliness, greetings, seeking-knowledge, intention, faith, quran, justice, leadership, rights, brotherhood, death, judgment, paradise, hellfire",
    ),
  key_teaching_en: z
    .string()
    .min(20)
    .max(600)
    .describe(
      "2-4 sentence key teaching note. First sentence: plain-language accessible explanation anyone can understand. Remaining sentences: scholarly context referencing relevant fiqh rulings, scholars (Ibn Hajar, Al-Nawawi, etc.), or related Quran verses when applicable. Do NOT repeat the hadith text.",
    ),
  key_teaching_ar: z
    .string()
    .min(10)
    .max(800)
    .describe(
      "Arabic translation of key_teaching_en. Same two-layer structure: accessible explanation first, then scholarly context. Must be fluent Modern Standard Arabic.",
    ),
  summary_ar: z
    .string()
    .min(3)
    .max(120)
    .describe("Arabic translation of summary_line. Concise, 3-10 words in Modern Standard Arabic."),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score 0-1. Use 0.9+ for clear single-topic hadiths, 0.6-0.8 for ambiguous ones."),
  rationale: z
    .string()
    .max(200)
    .describe("Brief explanation of why this category and these tags were chosen"),
})

const BATCH_SIZE = 5 // Process 5 hadiths per request to stay within Groq rate limits

export async function POST(req: Request) {
  try {
    // Verify admin access via service role (this route is called from admin UI)
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Verify the calling user is admin/reviewer
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
      return Response.json({ error: "Forbidden: requires admin or reviewer role" }, { status: 403 })
    }

    const body = await req.json()
    const { collection_slug, limit: requestLimit } = body
    const batchLimit = Math.min(requestLimit || BATCH_SIZE, 20)

    // Fetch hadiths that don't have enrichment yet
    let query = supabase
      .from("hadiths")
      .select("id, english_translation, arabic_text, narrator, grade, collection, reference")
      .not(
        "id",
        "in",
        `(SELECT hadith_id FROM hadith_enrichment)`,
      )
      .not("english_translation", "is", null)
      .limit(batchLimit)

    if (collection_slug) {
      query = query.eq("collection", collection_slug)
    }

    // Use raw SQL to get hadiths without enrichments (subquery not supported in PostgREST)
    const { data: allHadiths, error: fetchError } = await supabase.rpc("get_unenriched_hadiths", {
      p_collection: collection_slug || null,
      p_limit: batchLimit,
    })

    // Fallback: if RPC doesn't exist yet, use a simpler approach
    let hadiths = allHadiths
    if (fetchError || !hadiths) {
      const { data: enrichedIds } = await supabase
        .from("hadith_enrichment")
        .select("hadith_id")

      const enrichedSet = new Set((enrichedIds || []).map((e: { hadith_id: string }) => e.hadith_id))

      let fallbackQuery = supabase
        .from("hadiths")
        .select("id, english_translation, arabic_text, narrator, grade, collection, reference")
        .not("english_translation", "is", null)
        .limit(batchLimit * 3) // Fetch extra to filter

      if (collection_slug) {
        fallbackQuery = fallbackQuery.eq("collection", collection_slug)
      }

      const { data: candidates } = await fallbackQuery
      hadiths = (candidates || []).filter((h: { id: string }) => !enrichedSet.has(h.id)).slice(0, batchLimit)
    }

    if (!hadiths || hadiths.length === 0) {
      return Response.json({
        message: "No unenriched hadiths found",
        processed: 0,
      })
    }

    // Fetch category and tag lookups
    const { data: categories } = await supabase.from("categories").select("id, slug")
    const { data: tags } = await supabase.from("tags").select("id, slug")
    const categoryMap = new Map((categories || []).map((c: { id: string; slug: string }) => [c.slug, c.id]))
    const tagMap = new Map((tags || []).map((t: { id: string; slug: string }) => [t.slug, t.id]))

    // Process each hadith through Groq
    const results: Array<{ hadithId: string; success: boolean; error?: string }> = []

    for (const hadith of hadiths) {
      try {
        // Clean the translation text
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
          output: Output.object({ schema: enrichmentSchema }),
          prompt: `You are a hadith scholar with expertise in Islamic jurisprudence and classical hadith commentary. Analyze this hadith and provide enrichment data.

Hadith Text: "${translationText}"
Narrator: ${hadith.narrator || "Unknown"}
Collection: ${hadith.collection}
Grade: ${hadith.grade}

Rules:
- summary_line: 5-12 words, present-tense, captures the core teaching. Example: "Kindness to animals earns divine reward"
- key_teaching_en: 2-4 sentences. FIRST sentence must be a plain-language explanation anyone can understand. REMAINING sentences should provide scholarly context -- reference relevant fiqh rulings, classical scholars (Ibn Hajar, Al-Nawawi, Ibn Qayyim, etc.), or related Quran verses when applicable. Do NOT simply repeat the hadith text.
- key_teaching_ar: Arabic translation of key_teaching_en with the same two-layer structure. Must be fluent Modern Standard Arabic.
- summary_ar: Arabic translation of summary_line. 3-10 words in Modern Standard Arabic.
- category_slug: Pick the SINGLE best-fit category
- tag_slugs: 1-4 tags from the controlled list that apply
- confidence: 0.9+ for clear topics, 0.6-0.8 for ambiguous`,
        })

        if (!object) {
          results.push({ hadithId: hadith.id, success: false, error: "LLM returned no structured output" })
          continue
        }

        // Map category slug to UUID
        const categoryId = categoryMap.get(object.category_slug)
        if (!categoryId) {
          results.push({ hadithId: hadith.id, success: false, error: `Unknown category: ${object.category_slug}` })
          continue
        }

        // Insert enrichment
        const { data: enrichment, error: insertError } = await supabase
          .from("hadith_enrichment")
          .insert({
            hadith_id: hadith.id,
            summary_line: object.summary_line,
            summary_ar: object.summary_ar,
            key_teaching_en: object.key_teaching_en,
            key_teaching_ar: object.key_teaching_ar,
            category_id: categoryId,
            status: "suggested",
            confidence: object.confidence,
            rationale: object.rationale,
            suggested_by: "openai-gpt-4o-mini",
            methodology_version: "v1.1",
          })
          .select("id")
          .single()

        if (insertError) {
          results.push({ hadithId: hadith.id, success: false, error: insertError.message })
          continue
        }

        // Insert tags
        const validTagSlugs = object.tag_slugs.filter((slug: string) => tagMap.has(slug))
        if (validTagSlugs.length > 0) {
          const tagRows = validTagSlugs.map((slug: string) => ({
            hadith_id: hadith.id,
            tag_id: tagMap.get(slug),
            enrichment_id: enrichment.id,
            status: "suggested" as const,
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
      results,
    })
  } catch (error) {
    console.error("Enrichment pipeline error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// GET: Check enrichment progress stats
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { count: totalHadiths } = await supabase
      .from("hadiths")
      .select("*", { count: "exact", head: true })
      .not("english_translation", "is", null)

    const { count: enrichedCount } = await supabase
      .from("hadith_enrichment")
      .select("*", { count: "exact", head: true })

    const { count: suggestedCount } = await supabase
      .from("hadith_enrichment")
      .select("*", { count: "exact", head: true })
      .eq("status", "suggested")

    const { count: approvedCount } = await supabase
      .from("hadith_enrichment")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")

    const { count: publishedCount } = await supabase
      .from("hadith_enrichment")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")

    const { count: rejectedCount } = await supabase
      .from("hadith_enrichment")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected")

    return Response.json({
      total_hadiths: totalHadiths || 0,
      enriched: enrichedCount || 0,
      remaining: (totalHadiths || 0) - (enrichedCount || 0),
      by_status: {
        suggested: suggestedCount || 0,
        approved: approvedCount || 0,
        published: publishedCount || 0,
        rejected: rejectedCount || 0,
      },
      coverage_percent:
        totalHadiths && totalHadiths > 0
          ? Math.round(((enrichedCount || 0) / totalHadiths) * 100)
          : 0,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
