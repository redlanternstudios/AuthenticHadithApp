import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config"

function getAdminClient() {
  return createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  )
}

export async function GET() {
  try {
    const supabase = getAdminClient()

    // Get all collections with their declared totals
    const { data: collections } = await supabase
      .from("collections")
      .select("id, name_en, slug, total_books, total_hadiths")
      .order("slug")

    if (!collections) return NextResponse.json({ error: "No collections" }, { status: 404 })

    // Count actual hadiths per collection_slug directly from hadiths table
    // (the primary insert target — collection_hadiths is a secondary join table)
    const { data: slugCounts } = await supabase
      .from("hadiths")
      .select("collection_slug")

    const countBySlug: Record<string, number> = {}
    for (const row of slugCounts || []) {
      countBySlug[row.collection_slug] = (countBySlug[row.collection_slug] || 0) + 1
    }

    const result = collections.map((coll) => {
      const hadithCount = countBySlug[coll.slug] || 0
      return {
        slug: coll.slug,
        name: coll.name_en,
        expected_hadiths: coll.total_hadiths,
        hadith_count: hadithCount,
        missing: Math.max(0, coll.total_hadiths - hadithCount),
        expected_books: coll.total_books,
      }
    })

    // Also include slugs present in hadiths but not in collections table
    const knownSlugs = new Set(collections.map((c) => c.slug))
    for (const [slug, count] of Object.entries(countBySlug)) {
      if (!knownSlugs.has(slug)) {
        result.push({
          slug,
          name: slug,
          expected_hadiths: 0,
          hadith_count: count,
          missing: 0,
          expected_books: 0,
        })
      }
    }

    const totalActual = Object.values(countBySlug).reduce((sum, n) => sum + n, 0)
    const totalExpected = result.reduce((sum, c) => sum + c.expected_hadiths, 0)

    return NextResponse.json({
      collections: result,
      total_hadiths: totalActual,
      total_expected: totalExpected,
      total_missing: Math.max(0, totalExpected - totalActual),
    })
  } catch (error) {
    console.error("[seed-status] Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
