import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config"

function getAdminClient() {
  return createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  )
}

const COLLECTION_MAP: Record<string, string> = {
  "sahih-bukhari": "bukhari",
  "sahih-muslim": "muslim",
  "sunan-abu-dawud": "abudawud",
  "jami-tirmidhi": "tirmidhi",
  "sunan-nasai": "nasai",
  "sunan-ibn-majah": "ibnmajah",
  "muwatta-malik": "malik",
  "musnad-ahmad": "ahmad",
}

const COLLECTION_DISPLAY: Record<string, string> = {
  "bukhari": "Sahih al-Bukhari",
  "muslim": "Sahih Muslim",
  "abudawud": "Sunan Abi Dawud",
  "tirmidhi": "Jami` at-Tirmidhi",
  "nasai": "Sunan an-Nasa'i",
  "ibnmajah": "Sunan Ibn Majah",
  "malik": "Muwatta Malik",
  "ahmad": "Musnad Ahmad",
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

interface ParsedHadith {
  hadithNumber: number
  arabicText: string
  englishText: string
  narrator: string
  grade: string
  reference: string
}

interface ParsedChapter {
  number: number
  nameEn: string
  nameAr: string
}

function parseFromRawHtml(html: string, sunnahSlug: string): { hadiths: ParsedHadith[], chapters: ParsedChapter[] } {
  const hadiths: ParsedHadith[] = []
  const chapters: ParsedChapter[] = []
  const collDisplay = COLLECTION_DISPLAY[sunnahSlug] || sunnahSlug

  // Strategy 1: Split by hadith reference pattern (most reliable for sunnah.com SSR)
  // The SSR HTML contains patterns like "Sahih al-Bukhari 1\nNarrated..."
  // Let's try multiple splitting strategies

  // Parse chapter headings - look for "Chapter:" patterns
  const chapterPattern = /Chapter:\s*([^\n]+)/gi
  let chMatch
  let chNum = 0
  while ((chMatch = chapterPattern.exec(html)) !== null) {
    chNum++
    const name = chMatch[1].replace(/<[^>]+>/g, "").trim()
    if (name && name.length > 2) {
      chapters.push({ number: chNum, nameEn: name, nameAr: "" })
    }
  }

  // Try parsing by splitting on the hadith reference markers
  // sunnah.com SSR includes patterns like: "Sahih al-Bukhari 1\nNarrated 'Umar..."
  const refPattern = new RegExp(`${escapeRegex(collDisplay)}\\s+(\\d+)`, "gi")
  const allRefs: Array<{ num: number; index: number }> = []
  let rMatch
  while ((rMatch = refPattern.exec(html)) !== null) {
    const num = parseInt(rMatch[1])
    if (!allRefs.find(r => r.num === num)) {
      allRefs.push({ num, index: rMatch.index })
    }
  }

  // For each reference, extract the text block around it
  for (let i = 0; i < allRefs.length; i++) {
    const ref = allRefs[i]
    const nextRef = allRefs[i + 1]
    const startIdx = Math.max(0, ref.index - 200) // Look back a bit for narrator line
    const endIdx = nextRef ? nextRef.index : Math.min(html.length, ref.index + 10000)
    const block = html.substring(startIdx, endIdx)

    // Extract English - look for "Narrated..." pattern
    let englishText = ""
    const narrMatch = block.match(/(?:Narrated\s+[^\n:]+:\s*\n?)([\s\S]*?)(?=\n\s*(?:حَدَّثَنَا|حَدَّثَنِي|أَخْبَرَنَا|عَنْ\s|قَالَ\s|Reference|Report Error|Share|$))/i)
    if (narrMatch) {
      englishText = narrMatch[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    }
    if (!englishText) {
      // Try alternate: look for text between "Sahih al-Bukhari N" line and Arabic
      const altMatch = block.match(new RegExp(`${escapeRegex(collDisplay)}\\s+${ref.num}\\s*\\n([\\s\\S]*?)(?=\\n\\s*[\\u0600-\\u06FF])`, "i"))
      if (altMatch) {
        englishText = altMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      }
    }

    // Extract Arabic
    let arabicText = ""
    // Match continuous Arabic text blocks
    const arabicMatch = block.match(/([\u0600-\u06FF][\u0600-\u06FF\s\u064B-\u065F\u0670\u0640،.:\-\(\)]+[\u0600-\u06FF])/g)
    if (arabicMatch) {
      // Take the longest Arabic block as the hadith text
      arabicText = arabicMatch.reduce((a, b) => a.length > b.length ? a : b, "").trim()
    }

    // Extract narrator from English
    let narrator = ""
    const narratorMatch = englishText.match(/^(?:Narrated|It is narrated on the authority of|It was narrated (?:from|that)|reported on the authority of)\s+([^:]+?)(?:\s*:)/i)
    if (narratorMatch) {
      narrator = narratorMatch[1].replace(/\(.*?\)/g, "").replace(/'/g, "'").trim()
      if (narrator.length > 80) narrator = narrator.substring(0, 80)
    }

    // Grade
    let grade = ""
    const gradeMatch = block.match(/(?:Grade|Grading)[:\s]*([^\n<]+)/i)
    if (gradeMatch) {
      const g = gradeMatch[1].toLowerCase().trim()
      if (g.includes("sahih")) grade = "sahih"
      else if (g.includes("hasan")) grade = "hasan"
      else if (g.includes("da") || g.includes("weak")) grade = "daif"
    }

    if (englishText.length > 20 || arabicText.length > 20) {
      hadiths.push({
        hadithNumber: ref.num,
        arabicText,
        englishText: englishText.substring(0, 10000),
        narrator,
        grade: grade || (sunnahSlug === "bukhari" || sunnahSlug === "muslim" ? "sahih" : "hasan"),
        reference: `${collDisplay} ${ref.num}`,
      })
    }
  }

  // Fallback: try splitting by "actualHadithContainer" class (original approach)
  if (hadiths.length === 0) {
    const sections = html.split(/class="actualHadithContainer"/)
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i]
      let hadithNum = 0
      const hRefMatch = section.match(new RegExp(`${escapeRegex(collDisplay)}\\s+(\\d+)`, "i"))
      if (hRefMatch) hadithNum = parseInt(hRefMatch[1])
      if (!hadithNum) {
        const inBookMatch = section.match(/In-book reference[^:]*:[^,]*Hadith\s+(\d+)/i)
        if (inBookMatch) hadithNum = parseInt(inBookMatch[1])
      }
      if (!hadithNum || hadiths.find(h => h.hadithNumber === hadithNum)) continue

      let englishText = ""
      const engMatch = section.match(/class="[^"]*(?:english_hadith_full|text_details|hadithText)[^"]*"[^>]*>([\s\S]*?)<\/div/i)
      if (engMatch) englishText = engMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

      let arabicText = ""
      const arMatch = section.match(/class="[^"]*(?:arabic_hadith_full|arabictext)[^"]*"[^>]*>([\s\S]*?)<\/div/i)
      if (arMatch) arabicText = arMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

      let narrator = ""
      const nMatch = englishText.match(/^(?:Narrated|It is narrated)\s+([^:]+?)(?:\s*:)/i)
      if (nMatch) narrator = nMatch[1].replace(/\(.*?\)/g, "").trim()

      if (englishText.length > 15 || arabicText.length > 15) {
        hadiths.push({
          hadithNumber: hadithNum,
          arabicText,
          englishText: englishText.substring(0, 10000),
          narrator: narrator.substring(0, 80),
          grade: sunnahSlug === "bukhari" || sunnahSlug === "muslim" ? "sahih" : "hasan",
          reference: `${collDisplay} ${hadithNum}`,
        })
      }
    }
  }

  return { hadiths, chapters }
}

export async function POST(request: Request) {
  const adminSecret = request.headers.get("x-admin-secret")
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { collection, bookNumber } = await request.json()
    if (!collection || !bookNumber) {
      return NextResponse.json({ error: "collection and bookNumber required" }, { status: 400 })
    }

    const supabase = getAdminClient()
    const sunnahSlug = COLLECTION_MAP[collection]
    if (!sunnahSlug) {
      return NextResponse.json({ error: `Unknown collection: ${collection}` }, { status: 400 })
    }

    // Get collection and book from DB
    const { data: coll } = await supabase.from("collections").select("id, name_en").eq("slug", collection).single()
    if (!coll) return NextResponse.json({ error: `Collection not found: ${collection}` }, { status: 404 })

    const { data: book } = await supabase.from("books").select("id, name_en, total_hadiths").eq("collection_id", coll.id).eq("number", bookNumber).single()
    if (!book) return NextResponse.json({ error: `Book not found: ${collection} #${bookNumber}` }, { status: 404 })

    // Check if already seeded with real content
    const { data: existingLinks } = await supabase
      .from("collection_hadiths")
      .select("hadith_id, hadith_number")
      .eq("book_id", book.id)
      .order("hadith_number")

    if (existingLinks && existingLinks.length > 0) {
      const { data: sample } = await supabase.from("hadiths").select("english_translation").eq("id", existingLinks[0].hadith_id).single()
      const isPlaceholder = !sample?.english_translation || 
        sample.english_translation.includes("narrated a hadith.") ||
        sample.english_translation.includes("[Content pending") ||
        sample.english_translation.includes("This is hadith number") ||
        sample.english_translation.length < 80
      if (!isPlaceholder) {
        return NextResponse.json({
          status: "already_seeded",
          book: book.name_en,
          count: existingLinks.length,
        })
      }
    }

    // Fetch from sunnah.com
    const url = `https://sunnah.com/${sunnahSlug}/${bookNumber}`
    let fetchedHadiths: ParsedHadith[] = []
    let fetchedChapters: ParsedChapter[] = []

    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(30000),
      })
      if (resp.ok) {
        const html = await resp.text()
        const parsed = parseFromRawHtml(html, sunnahSlug)
        fetchedHadiths = parsed.hadiths
        fetchedChapters = parsed.chapters
      }
    } catch (err) {
      console.error(`[seed-book] Fetch error:`, err)
    }

    let updatedCount = 0
    let chaptersUpdated = 0

    // Update chapter names
    if (fetchedChapters.length > 0) {
      const { data: existingChapters } = await supabase
        .from("chapters")
        .select("id, number, name_en")
        .eq("book_id", book.id)
        .order("number")

      if (existingChapters) {
        for (const ch of fetchedChapters) {
          const existing = existingChapters.find(c => c.number === ch.number)
          if (existing && ch.nameEn && (existing.name_en.startsWith("Chapter ") || existing.name_en.length < 5)) {
            const updateData: Record<string, string> = { name_en: ch.nameEn }
            if (ch.nameAr) updateData.name_ar = ch.nameAr
            await supabase.from("chapters").update(updateData).eq("id", existing.id)
            chaptersUpdated++
          }
        }
      }
    }

    // Update existing hadiths
    if (existingLinks && existingLinks.length > 0 && fetchedHadiths.length > 0) {
      for (const link of existingLinks) {
        const fetched = fetchedHadiths.find(h => h.hadithNumber === link.hadith_number)
        if (fetched) {
          const updateData: Record<string, string> = {}
          if (fetched.englishText) updateData.english_translation = fetched.englishText
          if (fetched.arabicText) updateData.arabic_text = fetched.arabicText
          if (fetched.narrator) updateData.narrator = fetched.narrator
          if (fetched.grade) updateData.grade = fetched.grade
          if (fetched.reference) updateData.reference = fetched.reference

          if (Object.keys(updateData).length > 0) {
            const { error } = await supabase.from("hadiths").update(updateData).eq("id", link.hadith_id)
            if (!error) updatedCount++
          }
        }
      }
    }

    return NextResponse.json({
      status: "seeded",
      book: book.name_en,
      collection: coll.name_en,
      fetched: fetchedHadiths.length,
      updated: updatedCount,
      chapters_updated: chaptersUpdated,
      total_in_book: existingLinks?.length || 0,
    })
  } catch (error) {
    console.error("[seed-book] Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export const maxDuration = 120
