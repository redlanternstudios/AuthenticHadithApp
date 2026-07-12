"use server"

import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { COLLECTION_MAPPING, type CollectionConfig } from "@/lib/hadith-cdn-mapping"
import {
  fetchEdition,
  cleanText,
  parseNarrator,
  extractGrade,
  buildReference,
  calculateGradeDistribution,
  chunk,
  sleep,
  type CdnHadith,
} from "@/lib/seed-helpers"
import { createProgress, type SeedProgress } from "@/lib/seed-progress"

// ── Seed a single collection ────────────────────────────────
export async function seedCollection(collectionSlug: string) {
  const config = COLLECTION_MAPPING[collectionSlug]
  if (!config) return { success: false, message: `Unknown collection: ${collectionSlug}` }

  const progress = createProgress(collectionSlug)
  progress.message = `Fetching ${config.name_en} from CDN...`

  const supabase = getSupabaseAdmin()

  try {
    // 1. Fetch English edition
    progress.message = `Fetching English edition (${config.editions.english})...`
    const engData = await fetchEdition(config.editions.english)

    // 2. Fetch Arabic edition
    progress.message = `Fetching Arabic edition (${config.editions.arabic})...`
    let araData
    try {
      araData = await fetchEdition(config.editions.arabic)
    } catch {
      progress.errors.push(`Arabic edition fetch failed, will use English only`)
      araData = null
    }

    // 3. Build Arabic lookup by hadith number
    const arabicMap = new Map<number, string>()
    if (araData?.hadiths) {
      for (const h of araData.hadiths) {
        arabicMap.set(h.hadithnumber, cleanText(h.text))
      }
    }

    // 4. Ensure collection exists
    progress.phase = "books"
    progress.message = "Ensuring collection record..."
    const collectionId = await ensureCollection(supabase, config)

    // 5. Extract books from sections metadata
    const sections = engData.metadata?.sections || {}
    const bookEntries = Object.entries(sections)
      .map(([num, name]) => ({ number: Number(num), name: String(name) }))
      .filter((b) => !Number.isNaN(b.number))
      .sort((a, b) => a.number - b.number)

    progress.booksTotal = bookEntries.length
    progress.message = `Processing ${bookEntries.length} books...`

    // 6. Ensure all books exist and get ID map
    const bookIdMap = new Map<number, string>()
    for (const bookEntry of bookEntries) {
      const bookId = await ensureBook(supabase, collectionId, bookEntry, config, arabicMap)
      bookIdMap.set(bookEntry.number, bookId)
      progress.booksProcessed++
    }

    // 7. Group CDN hadiths by book
    const hadithsByBook = new Map<number, CdnHadith[]>()
    for (const h of engData.hadiths) {
      const bookNum = h.reference?.book ?? 0
      if (!hadithsByBook.has(bookNum)) hadithsByBook.set(bookNum, [])
      hadithsByBook.get(bookNum)!.push(h)
    }

    progress.hadithsTotal = engData.hadiths.length
    progress.phase = "hadiths"
    progress.message = `Inserting/updating ${engData.hadiths.length} hadiths...`

    // 8. Load existing hadith numbers for this collection to detect duplicates
    const { data: existingHadiths } = await supabase
      .from("hadiths")
      .select("id, hadith_number")
      .eq("collection", config.slug)
    const existingMap = new Map<number, string>()
    if (existingHadiths) {
      for (const eh of existingHadiths) {
        if (eh.hadith_number != null) existingMap.set(eh.hadith_number, eh.id)
      }
    }

    // 9. Process hadiths in batches
    const allGrades: string[] = []
    const allCdnHadiths = engData.hadiths
    const batches = chunk(allCdnHadiths, 100)

    for (const batch of batches) {
      const toInsert: Array<Record<string, unknown>> = []
      const toUpdate: Array<{ id: string; data: Record<string, unknown> }> = []

      for (const cdnH of batch) {
        const englishText = cleanText(cdnH.text)
        const arabicText = arabicMap.get(cdnH.hadithnumber) || ""
        const grade = extractGrade(cdnH.grades)
        const narrator = parseNarrator(englishText)
        const bookNum = cdnH.reference?.book ?? 0
        const ref = buildReference(config.slug, bookNum, cdnH.hadithnumber)
        allGrades.push(grade)

        const existingId = existingMap.get(cdnH.hadithnumber)

        if (existingId) {
          // Update only if we have better data
          const updates: Record<string, unknown> = {}
          if (arabicText) updates.arabic_text = arabicText
          if (englishText) updates.english_translation = englishText
          if (narrator) updates.narrator = narrator
          if (grade && grade !== "Unknown") updates.grade = grade
          updates.book_number = bookNum
          updates.reference = ref
          if (Object.keys(updates).length > 0) {
            toUpdate.push({ id: existingId, data: updates })
          }
        } else {
          toInsert.push({
            arabic_text: arabicText,
            english_translation: englishText,
            narrator,
            grade,
            reference: ref,
            collection: config.slug,
            hadith_number: cdnH.hadithnumber,
            book_number: bookNum,
          })
        }
      }

      // Batch insert new hadiths
      if (toInsert.length > 0) {
        const { data: inserted, error } = await supabase
          .from("hadiths")
          .insert(toInsert)
          .select("id, hadith_number")
        if (error) {
          progress.errors.push(`Insert batch error: ${error.message}`)
        } else if (inserted) {
          // Create collection_hadiths junction records
          const junctions = inserted.map((h) => ({
            collection_id: collectionId,
            book_id: bookIdMap.get(
              allCdnHadiths.find((c) => c.hadithnumber === h.hadith_number)?.reference?.book ?? 0
            ) || null,
            hadith_id: h.id,
            hadith_number: h.hadith_number,
          }))
          const { error: jErr } = await supabase.from("collection_hadiths").insert(junctions)
          if (jErr) progress.errors.push(`Junction insert error: ${jErr.message}`)
          progress.hadithsInserted += inserted.length
          // Add newly inserted to existingMap so we don't try again
          for (const ih of inserted) {
            existingMap.set(ih.hadith_number, ih.id)
          }
        }
      }

      // Batch update existing hadiths (one by one -- Supabase doesn't support batch update)
      for (const upd of toUpdate) {
        const { error } = await supabase.from("hadiths").update(upd.data).eq("id", upd.id)
        if (error) progress.errors.push(`Update error for ${upd.id}: ${error.message}`)
        else progress.hadithsUpdated++
      }

      await sleep(50) // Small delay between batches to avoid rate limits
    }

    // 10. Backfill Arabic text for existing hadiths that still have empty arabic_text
    progress.phase = "backfill"
    progress.message = "Backfilling empty Arabic text..."
    if (arabicMap.size > 0) {
      const { data: emptyArabic } = await supabase
        .from("hadiths")
        .select("id, hadith_number")
        .eq("collection", config.slug)
        .or("arabic_text.is.null,arabic_text.eq.")
      if (emptyArabic && emptyArabic.length > 0) {
        for (const batch of chunk(emptyArabic, 50)) {
          for (const h of batch) {
            const araText = arabicMap.get(h.hadith_number)
            if (araText) {
              await supabase.from("hadiths").update({ arabic_text: araText }).eq("id", h.id)
              progress.hadithsUpdated++
            }
          }
          await sleep(50)
        }
      }
    }

    // 11. Update collection totals
    progress.phase = "totals"
    progress.message = "Updating collection totals..."
    const gradeDist = calculateGradeDistribution(allGrades)

    const { count: hadithCount } = await supabase
      .from("collection_hadiths")
      .select("id", { count: "exact", head: true })
      .eq("collection_id", collectionId)

    const { count: bookCount } = await supabase
      .from("books")
      .select("id", { count: "exact", head: true })
      .eq("collection_id", collectionId)

    await supabase
      .from("collections")
      .update({
        total_hadiths: hadithCount || 0,
        total_books: bookCount || 0,
        grade_distribution: gradeDist,
      })
      .eq("id", collectionId)

    // Update each book's total_hadiths
    for (const [bookNum, bookId] of bookIdMap) {
      const hadithsForBook = hadithsByBook.get(bookNum)
      if (hadithsForBook) {
        await supabase.from("books").update({ total_hadiths: hadithsForBook.length }).eq("id", bookId)
      }
    }

    progress.phase = "done"
    progress.message = `Completed ${config.name_en}: ${progress.hadithsInserted} inserted, ${progress.hadithsUpdated} updated`

    return {
      success: true,
      message: progress.message,
      stats: {
        totalBooks: bookEntries.length,
        totalHadiths: engData.hadiths.length,
        inserted: progress.hadithsInserted,
        updated: progress.hadithsUpdated,
        timeElapsed: Date.now() - progress.startedAt,
      },
      errors: progress.errors,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    progress.phase = "error"
    progress.message = `Error: ${msg}`
    progress.errors.push(msg)
    return { success: false, message: msg, errors: progress.errors }
  }
}

// ── Seed all collections sequentially ───────────────────────
export async function seedAllCollections() {
  const results: Array<{
    collection: string
    success: boolean
    stats?: Record<string, unknown>
    error?: string
  }> = []

  for (const slug of Object.keys(COLLECTION_MAPPING)) {
    const result = await seedCollection(slug)
    results.push({
      collection: slug,
      success: result.success,
      stats: result.success ? (result as Record<string, unknown>).stats as Record<string, unknown> : undefined,
      error: result.success ? undefined : result.message,
    })
  }

  return { success: results.every((r) => r.success), results }
}

// ── Helper: ensure collection record exists ─────────────────
async function ensureCollection(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  config: CollectionConfig,
): Promise<string> {
  const { data: existing } = await supabase
    .from("collections")
    .select("id")
    .eq("slug", config.slug)
    .single()

  if (existing) return existing.id

  const { data: inserted, error } = await supabase
    .from("collections")
    .insert({
      slug: config.slug,
      name_en: config.name_en,
      name_ar: config.name_ar,
      scholar: config.scholar,
      scholar_dates: config.scholar_dates,
      is_featured: config.is_featured,
      total_hadiths: 0,
      total_books: 0,
    })
    .select("id")
    .single()

  if (error) throw new Error(`Failed to create collection ${config.slug}: ${error.message}`)
  return inserted!.id
}

// ── Helper: ensure book record exists ───────────────────────
async function ensureBook(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  collectionId: string,
  bookEntry: { number: number; name: string },
  config: CollectionConfig,
  arabicMap: Map<number, string>,
): Promise<string> {
  const { data: existing } = await supabase
    .from("books")
    .select("id")
    .eq("collection_id", collectionId)
    .eq("number", bookEntry.number)
    .single()

  if (existing) return existing.id

  // Try to find an Arabic name from the Arabic edition metadata
  const arabicName = `\u0627\u0644\u0643\u062a\u0627\u0628 ${bookEntry.number}`

  const { data: inserted, error } = await supabase
    .from("books")
    .insert({
      collection_id: collectionId,
      number: bookEntry.number,
      name_en: bookEntry.name || `Book ${bookEntry.number}`,
      name_ar: arabicName,
      sort_order: bookEntry.number,
      total_hadiths: 0,
      total_chapters: 0,
    })
    .select("id")
    .single()

  if (error) throw new Error(`Failed to create book ${bookEntry.number}: ${error.message}`)
  return inserted!.id
}
