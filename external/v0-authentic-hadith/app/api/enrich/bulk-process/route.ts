import { generateText, Output } from "ai"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

export const maxDuration = 300

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://nqklipakrfuwebkdnhwg.supabase.co"

const enrichmentSchema = z.object({
  summary_line: z.string(),
  category_slug: z.string(),
  tag_slugs: z.array(z.string()),
  key_teaching_en: z.string(),
  key_teaching_ar: z.string(),
  summary_ar: z.string(),
  confidence: z.number(),
})

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!serviceKey || !anonKey) {
      return Response.json({ error: "Server config missing" }, { status: 500 })
    }

    const userClient = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user)
      return Response.json({ error: "Not authenticated" }, { status: 401 })

    const supabase = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()
    if (!profile || !["admin", "reviewer"].includes(profile.role)) {
      return Response.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await req.json()
    const batchSize = Math.min(body.batch_size || 10, 30)
    const offset = body.offset || 0

    // Lookups
    const { data: categories } = await supabase
      .from("categories")
      .select("id, slug")
    const { data: tags } = await supabase.from("tags").select("id, slug")
    const catMap = new Map(
      (categories || []).map((c: { id: string; slug: string }) => [c.slug, c.id])
    )
    const tagMap = new Map(
      (tags || []).map((t: { id: string; slug: string }) => [t.slug, t.id])
    )

    // Use RPC to get unenriched hadiths efficiently
    const { data: hadiths, error: rpcErr } = await supabase.rpc(
      "get_unenriched_hadiths",
      { lim: batchSize }
    )

    if (rpcErr || !hadiths || hadiths.length === 0) {
      return Response.json({
        processed: 0,
        success: 0,
        failed: 0,
        errors: rpcErr ? [rpcErr.message] : [],
        next_offset: offset,
      })
    }

    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    const catSlugs = Array.from(catMap.keys()).join(", ")
    const tagSlugs = Array.from(tagMap.keys()).join(", ")

    for (const hadith of hadiths) {
      try {
        let text = hadith.english_translation || ""
        if (text.length < 10) {
          failCount++
          continue
        }
        text = text.slice(0, 800)

        const { output: obj } = await generateText({
          model: "openai/gpt-4o-mini",
          output: Output.object({ schema: enrichmentSchema }),
          prompt: [
            "You are a hadith scholar. Analyze this hadith and return JSON.",
            "",
            "Hadith: " + text,
            "Narrator: " + (hadith.narrator || "Unknown"),
            "Grade: " + (hadith.grade || "Unknown"),
            "",
            "Fields:",
            "- summary_line: 5-12 word present-tense summary",
            "- key_teaching_en: 2-4 sentences. First: accessible. Rest: scholarly (Ibn Hajar, Al-Nawawi, Quran refs).",
            "- key_teaching_ar: Arabic MSA translation of key_teaching_en",
            "- summary_ar: 3-10 word Arabic summary",
            "- category_slug: one of: " + catSlugs,
            "- tag_slugs: 1-4 from: " + tagSlugs,
            "- confidence: 0.0 to 1.0",
          ].join("\n"),
        })

        if (!obj) {
          failCount++
          errors.push(hadith.id + ": no output")
          continue
        }

        const catSlug = catMap.has(obj.category_slug)
          ? obj.category_slug
          : "daily-life"
        const categoryId = catMap.get(catSlug)

        const { data: enrichment, error: insErr } = await supabase
          .from("hadith_enrichment")
          .insert({
            hadith_id: hadith.id,
            summary_line: (obj.summary_line || "").slice(0, 80),
            summary_ar: (obj.summary_ar || "").slice(0, 120),
            key_teaching_en: (obj.key_teaching_en || "").slice(0, 600),
            key_teaching_ar: (obj.key_teaching_ar || "").slice(0, 800),
            category_id: categoryId,
            status: "published",
            confidence: Math.min(1, Math.max(0, obj.confidence || 0.8)),
            suggested_by: "openai-gpt-4o-mini",
            methodology_version: "v1.1",
          })
          .select("id")
          .single()

        if (insErr) {
          failCount++
          errors.push(hadith.id + ": " + insErr.message)
          continue
        }

        // Insert tags
        const validTags = (obj.tag_slugs || [])
          .slice(0, 4)
          .filter((s: string) => tagMap.has(s))
        if (validTags.length > 0 && enrichment) {
          await supabase.from("hadith_tags").insert(
            validTags.map((s: string) => ({
              hadith_id: hadith.id,
              tag_id: tagMap.get(s),
              enrichment_id: enrichment.id,
              status: "published",
            }))
          )
        }

        successCount++
      } catch (err) {
        failCount++
        errors.push(
          hadith.id + ": " + (err instanceof Error ? err.message : "unknown")
        )
      }
    }

    return Response.json({
      processed: successCount + failCount,
      success: successCount,
      failed: failCount,
      errors: errors.slice(0, 10),
      next_offset: offset + batchSize * 4,
    })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
