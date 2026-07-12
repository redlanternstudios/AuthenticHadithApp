import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const tag = searchParams.get("tag") || ""

  if (query.length < 2 && !category && !tag) {
    return Response.json({ results: [] })
  }

  const supabase = await getSupabaseServerClient()

  // If searching by tag, find hadith IDs tagged with it first
  if (tag) {
    const { data: tagRow } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", tag)
      .single()

    if (!tagRow) return Response.json({ results: [] })

    // Use hadith_tag_weights (bulk data) as primary source, fall back to hadith_tags
    const { data: weightedIds } = await supabase
      .from("hadith_tag_weights")
      .select("hadith_id")
      .eq("tag_id", tagRow.id)
      .order("weight", { ascending: false })
      .limit(30)

    let ids = (weightedIds || []).map((t: { hadith_id: string }) => t.hadith_id)

    // Fall back to hadith_tags if no weighted results
    if (ids.length === 0) {
      const { data: taggedIds } = await supabase
        .from("hadith_tags")
        .select("hadith_id")
        .eq("tag_id", tagRow.id)
        .eq("status", "published")
        .limit(30)
      ids = (taggedIds || []).map((t: { hadith_id: string }) => t.hadith_id)
    }

    if (ids.length === 0) return Response.json({ results: [] })

    const { data: hadiths } = await supabase
      .from("hadiths")
      .select("id, hadith_number, collection, book_number, arabic_text, english_translation, narrator, grade")
      .in("collection", ["sahih-bukhari", "sahih-muslim"])
      .in("id", ids)

    const enriched = await attachEnrichments(supabase, hadiths || [])
    return Response.json({ results: enriched })
  }

  // If searching by category, find hadith IDs in that category
  if (category) {
    const { data: catRow } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single()

    if (!catRow) return Response.json({ results: [] })

    const { data: enrichments } = await supabase
      .from("hadith_enrichment")
      .select("hadith_id")
      .eq("category_id", catRow.id)
      .eq("status", "published")
      .limit(30)

    if (!enrichments || enrichments.length === 0) return Response.json({ results: [] })

    const ids = enrichments.map((e: { hadith_id: string }) => e.hadith_id)
    let hadithQuery = supabase
      .from("hadiths")
      .select("id, hadith_number, collection, book_number, arabic_text, english_translation, narrator, grade")
      .in("collection", ["sahih-bukhari", "sahih-muslim"])
      .in("id", ids)

    // Further filter by text query if provided
    if (query.length >= 2) {
      hadithQuery = hadithQuery.or(
        `english_translation.ilike.%${query}%,narrator.ilike.%${query}%`,
      )
    }

    const { data: hadiths } = await hadithQuery
    const enriched = await attachEnrichments(supabase, hadiths || [])
    return Response.json({ results: enriched })
  }

  // Standard text search: search hadiths + summary_lines (Sahihayn only)
  const { data: directResults, error } = await supabase
    .from("hadiths")
    .select("id, hadith_number, collection, book_number, arabic_text, english_translation, narrator, grade")
    .in("collection", ["sahih-bukhari", "sahih-muslim"])
    .or(`english_translation.ilike.%${query}%,narrator.ilike.%${query}%,arabic_text.ilike.%${query}%`)
    .limit(20)

  if (error) {
    return Response.json({ results: [], error: error.message }, { status: 500 })
  }

  // Also search by summary_line in enrichments
  const { data: summaryMatches } = await supabase
    .from("hadith_enrichment")
    .select("hadith_id")
    .eq("status", "published")
    .ilike("summary_line", `%${query}%`)
    .limit(10)

  const directIds = new Set((directResults || []).map((h: { id: string }) => h.id))
  const extraIds = (summaryMatches || [])
    .map((e: { hadith_id: string }) => e.hadith_id)
    .filter((id: string) => !directIds.has(id))

  let allResults = directResults || []

  // Fetch additional hadiths found via summary search (Sahihayn only)
  if (extraIds.length > 0) {
    const { data: extras } = await supabase
      .from("hadiths")
      .select("id, hadith_number, collection, book_number, arabic_text, english_translation, narrator, grade")
      .in("collection", ["sahih-bukhari", "sahih-muslim"])
      .in("id", extraIds)

    if (extras) {
      allResults = [...allResults, ...extras]
    }
  }

  const enriched = await attachEnrichments(supabase, allResults)

  // Build tag facets from results
  const facetMap = new Map<string, { slug: string; name_en: string; count: number }>()
  for (const h of enriched) {
    const tags = (h as Record<string, unknown>).tags as Array<{ slug: string; name_en: string }> | undefined
    if (tags) {
      for (const t of tags) {
        const existing = facetMap.get(t.slug)
        if (existing) {
          existing.count++
        } else {
          facetMap.set(t.slug, { slug: t.slug, name_en: t.name_en, count: 1 })
        }
      }
    }
  }
  const facets = [...facetMap.values()].sort((a, b) => b.count - a.count).slice(0, 10)

  return Response.json({ results: enriched, facets })
}

// Helper: attach enrichment data to hadith results
async function attachEnrichments(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  hadiths: Array<Record<string, unknown>>,
) {
  if (hadiths.length === 0) return hadiths

  const ids = hadiths.map((h) => h.id as string)

  // Get enrichments
  const { data: enrichments } = await supabase
    .from("hadith_enrichment")
    .select("hadith_id, summary_line, category:categories!category_id(slug, name_en)")
    .eq("status", "published")
    .in("hadith_id", ids)

  // Get tags from hadith_tag_weights (primary) and hadith_tags (fallback)
  const { data: weightData } = await supabase
    .from("hadith_tag_weights")
    .select("hadith_id, tag_id, weight")
    .in("hadith_id", ids)
    .order("weight", { ascending: false })

  // Resolve tag_ids to tag details
  const uniqueTagIds = [...new Set((weightData || []).map((w: { tag_id: string }) => w.tag_id))]
  let tagLookup = new Map<string, { slug: string; name_en: string }>()
  if (uniqueTagIds.length > 0) {
    const { data: tagDetails } = await supabase
      .from("tags")
      .select("id, slug, name_en")
      .in("id", uniqueTagIds)
    for (const t of tagDetails || []) {
      tagLookup.set(t.id, { slug: t.slug, name_en: t.name_en })
    }
  }

  const enrichmentMap = new Map<string, Record<string, unknown>>()
  for (const e of enrichments || []) {
    enrichmentMap.set(e.hadith_id, e)
  }

  const tagMap = new Map<string, Array<{ slug: string; name_en: string }>>()
  for (const w of weightData || []) {
    const tag = tagLookup.get(w.tag_id)
    if (!tag) continue
    const existing = tagMap.get(w.hadith_id) || []
    // Deduplicate
    if (!existing.some((t) => t.slug === tag.slug)) {
      existing.push(tag)
    }
    tagMap.set(w.hadith_id, existing)
  }

  // Also check hadith_tags for any extras not in weights
  const { data: tagData } = await supabase
    .from("hadith_tags")
    .select("hadith_id, tag:tags!tag_id(slug, name_en)")
    .eq("status", "published")
    .in("hadith_id", ids)

  for (const t of tagData || []) {
    if (!t.tag) continue
    const tag = t.tag as { slug: string; name_en: string }
    const existing = tagMap.get(t.hadith_id) || []
    if (!existing.some((et) => et.slug === tag.slug)) {
      existing.push(tag)
    }
    tagMap.set(t.hadith_id, existing)
  }

  return hadiths.map((h) => {
    const enrichment = enrichmentMap.get(h.id as string)
    return {
      ...h,
      summary_line: enrichment?.summary_line || null,
      category: enrichment?.category || null,
      tags: tagMap.get(h.id as string) || [],
    }
  })
}
