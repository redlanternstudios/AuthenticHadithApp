import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config"

export const maxDuration = 300

function getAdminClient() {
  return createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  )
}

const EDITION_MAP: Record<string, { eng: string; ara: string }> = {
  "sahih-bukhari": { eng: "eng-bukhari", ara: "ara-bukhari" },
  "sahih-muslim": { eng: "eng-muslim", ara: "ara-muslim" },
  "sunan-abu-dawud": { eng: "eng-abudawud", ara: "ara-abudawud" },
  "jami-tirmidhi": { eng: "eng-tirmidhi", ara: "ara-tirmidhi" },
  "sunan-nasai": { eng: "eng-nasai", ara: "ara-nasai" },
  "sunan-ibn-majah": { eng: "eng-ibnmajah", ara: "ara-ibnmajah" },
  "muwatta-malik": { eng: "eng-malik", ara: "ara-malik" },
  "musnad-ahmad": { eng: "eng-ahmad", ara: "ara-ahmad" },
}

const DISPLAY_MAP: Record<string, string> = {
  "sahih-bukhari": "Sahih al-Bukhari",
  "sahih-muslim": "Sahih Muslim",
  "sunan-abu-dawud": "Sunan Abu Dawud",
  "jami-tirmidhi": "Jami at-Tirmidhi",
  "sunan-nasai": "Sunan an-Nasai",
  "sunan-ibn-majah": "Sunan Ibn Majah",
  "muwatta-malik": "Muwatta Malik",
  "musnad-ahmad": "Musnad Ahmad",
}

const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions"

interface CDNHadith {
  hadithnumber: number
  text: string
  grades: Array<{ name: string; grade: string }>
  reference: { book: number; hadith: number }
}

interface CDNSection {
  metadata: {
    name: string
    section: Record<string, string>
    section_detail: Record<string, { hadithnumber_first: number; hadithnumber_last: number }>
  }
  hadiths: CDNHadith[]
}

function determineGrade(grades: Array<{ name: string; grade: string }>, slug: string): string {
  if (slug === "sahih-bukhari" || slug === "sahih-muslim") return "sahih"
  if (!grades || grades.length === 0) return "hasan"
  for (const g of grades) {
    const gl = g.grade.toLowerCase()
    if (gl.includes("sahih")) return "sahih"
    if (gl.includes("hasan")) return "hasan"
    if (gl.includes("daif") || gl.includes("da'if") || gl.includes("weak")) return "daif"
  }
  return "hasan"
}

function extractNarrator(text: string): string {
  const m = text.match(/^(?:Narrated|It was narrated (?:from|that)|It is narrated on the authority of)\s+([^:]{3,80}):/i)
  if (m) return m[1].replace(/\(.*?\)/g, "").trim()
  return ""
}

/**
 * GET /api/seed-full?collection=sahih-bukhari&startSection=1&endSection=200
 * Downloads sections from CDN and inserts missing hadiths.
 */
export async function GET(request: Request) {
  const adminSecret = request.headers.get("x-admin-secret")
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("collection") || ""
  const startSection = Number(searchParams.get("startSection")) || 1
  const endSection = Number(searchParams.get("endSection")) || 200
  return seedCollection(slug, startSection, endSection)
}

/**
 * POST /api/seed-full
 * Body: { collection: "sahih-bukhari", startSection?: number, endSection?: number }
 * Downloads sections from CDN and inserts missing hadiths.
 */
export async function POST(request: Request) {
  const adminSecret = request.headers.get("x-admin-secret")
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json()
  const slug = body.collection as string
  const startSection = (body.startSection as number) || 1
  const endSection = (body.endSection as number) || 200
  return seedCollection(slug, startSection, endSection)
}

async function seedCollection(slug: string, startSection: number, endSection: number) {
  const start = Date.now()
  try {

    if (!slug || !EDITION_MAP[slug]) {
      return NextResponse.json({ error: `Unknown collection: ${slug}` }, { status: 400 })
    }

    const supabase = getAdminClient()
    const edition = EDITION_MAP[slug]

    // Get collection from DB
    const { data: coll } = await supabase
      .from("collections")
      .select("id")
      .eq("slug", slug)
      .single()

    if (!coll) return NextResponse.json({ error: `Collection not found: ${slug}` }, { status: 404 })

    // Get existing hadith numbers to skip duplicates
    const { data: existingLinks } = await supabase
      .from("collection_hadiths")
      .select("hadith_number")
      .eq("collection_id", coll.id)
    
    const existingNumbers = new Set((existingLinks || []).map(l => l.hadith_number))

    let totalInserted = 0
    let totalSkipped = 0
    let sectionsProcessed = 0
    let consecutiveMisses = 0
    const errors: string[] = []

    for (let secNum = startSection; secNum <= endSection; secNum++) {
      // Stop if we've been running for > 250s (leave buffer)
      if (Date.now() - start > 250000) {
        errors.push(`Timeout at section ${secNum}. Resume with startSection=${secNum}`)
        break
      }

      // Fetch English section
      let engData: CDNSection
      try {
        const resp = await fetch(`${CDN}/${edition.eng}/${secNum}.min.json`, {
          signal: AbortSignal.timeout(15000),
        })
        if (resp.status === 404) {
          consecutiveMisses++
          if (consecutiveMisses >= 3) break // No more sections
          continue
        }
        if (!resp.ok) {
          errors.push(`Section ${secNum}: HTTP ${resp.status}`)
          continue
        }
        engData = await resp.json()
        consecutiveMisses = 0
      } catch {
        errors.push(`Section ${secNum}: fetch failed`)
        consecutiveMisses++
        if (consecutiveMisses >= 3) break
        continue
      }

      if (!engData.hadiths || engData.hadiths.length === 0) continue

      // Fetch Arabic section
      const arabicMap = new Map<number, string>()
      try {
        const araResp = await fetch(`${CDN}/${edition.ara}/${secNum}.min.json`, {
          signal: AbortSignal.timeout(15000),
        })
        if (araResp.ok) {
          const araData = await araResp.json() as CDNSection
          for (const h of araData.hadiths) {
            arabicMap.set(h.hadithnumber, h.text)
          }
        }
      } catch { /* Arabic is optional */ }

      // Ensure book exists
      const sectionName = engData.metadata?.section?.[String(secNum)] || `Book ${secNum}`
      const { data: existingBook } = await supabase
        .from("books")
        .select("id")
        .eq("collection_id", coll.id)
        .eq("number", secNum)
        .single()

      let bookId: string
      if (existingBook) {
        bookId = existingBook.id
        // Update name/count
        await supabase.from("books").update({
          name_en: sectionName,
          total_hadiths: engData.hadiths.length,
        }).eq("id", bookId)
      } else {
        const { data: newBook, error: bookErr } = await supabase
          .from("books")
          .insert({
            collection_id: coll.id,
            name_en: sectionName,
            name_ar: "",
            number: secNum,
            total_hadiths: engData.hadiths.length,
            total_chapters: 1,
            sort_order: secNum,
          })
          .select("id")
          .single()
        if (bookErr || !newBook) {
          errors.push(`Section ${secNum}: book create failed`)
          continue
        }
        bookId = newBook.id
      }

      // Ensure at least one chapter
      const { data: existingChapter } = await supabase
        .from("chapters")
        .select("id")
        .eq("book_id", bookId)
        .limit(1)
        .single()

      let chapterId: string
      if (existingChapter) {
        chapterId = existingChapter.id
      } else {
        const { data: newCh } = await supabase
          .from("chapters")
          .insert({
            book_id: bookId,
            name_en: sectionName,
            name_ar: "",
            number: 1,
            total_hadiths: engData.hadiths.length,
            sort_order: 1,
          })
          .select("id")
          .single()
        if (!newCh) {
          errors.push(`Section ${secNum}: chapter create failed`)
          continue
        }
        chapterId = newCh.id
      }

      // Filter out already existing hadiths
      const newHadiths = engData.hadiths.filter(h => !existingNumbers.has(h.hadithnumber))
      totalSkipped += engData.hadiths.length - newHadiths.length

      // Insert in batches of 100
      const BATCH = 100
      for (let i = 0; i < newHadiths.length; i += BATCH) {
        if (Date.now() - start > 260000) {
          errors.push(`Timeout mid-section ${secNum}. Resume with startSection=${secNum}`)
          break
        }

        const batch = newHadiths.slice(i, i + BATCH)
        const rows = batch.map(h => ({
          hadith_number: h.hadithnumber,
          book_number: secNum,
          arabic_text: arabicMap.get(h.hadithnumber) || "",
          english_translation: h.text,
          narrator: extractNarrator(h.text),
          grade: determineGrade(h.grades, slug),
          reference: `${DISPLAY_MAP[slug]} ${h.hadithnumber}`,
          collection: slug,
          is_featured: false,
        }))

        const { data: inserted, error: insErr } = await supabase
          .from("hadiths")
          .insert(rows)
          .select("id, hadith_number")

        if (insErr) {
          errors.push(`Section ${secNum} batch ${i}: ${insErr.message}`)
          continue
        }

        if (inserted && inserted.length > 0) {
          const links = inserted.map(h => ({
            collection_id: coll.id,
            book_id: bookId,
            chapter_id: chapterId,
            hadith_id: h.id,
            hadith_number: h.hadith_number,
          }))

          await supabase.from("collection_hadiths").insert(links)
          totalInserted += inserted.length

          // Track inserted numbers to avoid future duplicates within this run
          for (const h of inserted) {
            existingNumbers.add(h.hadith_number)
          }
        }
      }

      sectionsProcessed++
    }

    // Update collection total
    const { count } = await supabase
      .from("collection_hadiths")
      .select("id", { count: "exact", head: true })
      .eq("collection_id", coll.id)

    if (count !== null) {
      await supabase.from("collections").update({ total_hadiths: count }).eq("id", coll.id)
    }

    return NextResponse.json({
      results: {
        [slug]: {
          total_inserted: totalInserted,
          total_skipped: totalSkipped,
          sections: sectionsProcessed,
          errors,
          elapsed_ms: Date.now() - start,
          new_total: count,
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
