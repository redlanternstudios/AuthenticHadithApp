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

/**
 * Parses hadiths from the WebFetch text content of sunnah.com.
 * The WebFetch tool returns cleaned text (not raw HTML), so we parse text patterns.
 */
function parseHadithsFromText(text: string, collectionName: string): { hadiths: ParsedHadith[], chapters: ParsedChapter[] } {
  const hadiths: ParsedHadith[] = []
  const chapters: ParsedChapter[] = []

  // Split by hadith reference patterns like "Sahih al-Bukhari 1" or "Sahih Muslim 8 a"
  // The text from WebFetch has patterns like:
  // Sahih al-Bukhari 1\nNarrated 'Umar bin Al-Khattab:\n...
  // Then Arabic text
  // Then **Reference**|:[Sahih al-Bukhari 1]

  // Extract chapter info - patterns like:
  // (1)\nChapter: How the Divine Revelation started...\n(1)\nباب...
  const chapterRegex = /\((\d+)\)\s*\nChapter:\s*([^\n]+)\s*\n\(\d+\)\s*\n(باب[^\n]*)/g
  let chapterMatch
  while ((chapterMatch = chapterRegex.exec(text)) !== null) {
    chapters.push({
      number: parseInt(chapterMatch[1]),
      nameEn: chapterMatch[2].trim(),
      nameAr: chapterMatch[3].trim(),
    })
  }

  // Also try simpler chapter pattern without explicit "Chapter:" label
  const simpleChapterRegex = /\((\d+)\)\s*\nChapter:\s*([^\n]+)/g
  let simpleMatch
  while ((simpleMatch = simpleChapterRegex.exec(text)) !== null) {
    const num = parseInt(simpleMatch[1])
    if (!chapters.find(c => c.number === num)) {
      chapters.push({
        number: num,
        nameEn: simpleMatch[2].trim(),
        nameAr: "",
      })
    }
  }

  // Parse hadith blocks - look for the reference pattern to identify each hadith
  // Pattern: "Sahih al-Bukhari 123" or "Sahih Muslim 8 a" followed by content
  const collectionPatterns: Record<string, string> = {
    "bukhari": "Sahih al-Bukhari",
    "muslim": "Sahih Muslim",
    "abudawud": "Sunan Abi Dawud",
    "tirmidhi": "Jami` at-Tirmidhi",
    "nasai": "Sunan an-Nasa'i",
    "ibnmajah": "Sunan Ibn Majah",
    "malik": "Muwatta Malik",
    "ahmad": "Musnad Ahmad",
  }

  const sunnahSlug = Object.entries(COLLECTION_MAP).find(([, v]) => v === collectionName)?.[1] || collectionName
  const collPattern = collectionPatterns[sunnahSlug] || collectionName

  // Split text by reference blocks
  // Each hadith starts with something like "Sahih al-Bukhari 5\nNarrated..."
  const hadithBlockRegex = new RegExp(
    `${escapeRegex(collPattern)}\\s+(\\d+)(?:\\s+[a-z])?\\s*\\n([\\s\\S]*?)(?=\\*\\*Reference\\*\\*\\|:\\[${escapeRegex(collPattern)}\\s+\\d+)`,
    "g"
  )

  let blockMatch
  while ((blockMatch = hadithBlockRegex.exec(text)) !== null) {
    const hadithNum = parseInt(blockMatch[1])
    const content = blockMatch[2].trim()

    // Split English from Arabic - Arabic text usually starts with حدثنا or similar
    // and is separated from English by a blank line or specific pattern
    let englishText = ""
    let arabicText = ""
    let narrator = ""
    let grade = ""

    // The content has English first, then Arabic
    // Split by looking for the first Arabic character block
    const lines = content.split("\n")
    let foundArabic = false
    const englishLines: string[] = []
    const arabicLines: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Check if line is primarily Arabic
      const arabicCharCount = (trimmed.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length
      const totalCharCount = trimmed.replace(/\s/g, "").length

      if (totalCharCount > 0 && arabicCharCount / totalCharCount > 0.5) {
        foundArabic = true
        arabicLines.push(trimmed)
      } else if (!foundArabic) {
        englishLines.push(trimmed)
      }
    }

    englishText = englishLines.join(" ").trim()
    arabicText = arabicLines.join(" ").trim()

    // Extract narrator from English text
    const narratorMatch = englishText.match(/^(?:Narrated|It is narrated on the authority of|It was narrated (?:from|that)|It is reported on the authority of)\s+([^:]+?)(?:\s*:|\s+that\b)/i)
    if (narratorMatch) {
      narrator = narratorMatch[1].trim()
      // Clean up narrator name
      narrator = narrator.replace(/\(.*?\)/g, "").trim()
      if (narrator.length > 60) narrator = narrator.substring(0, 60)
    }

    // Extract grade if present
    const gradeMatch = content.match(/Grade\s*:\s*(Sahih|Hasan|Da['']?if|Maudu)/i)
    if (gradeMatch) {
      const g = gradeMatch[1].toLowerCase()
      if (g.includes("hasan")) grade = "hasan"
      else if (g.includes("da") || g.includes("maudu")) grade = "daif"
      else grade = "sahih"
    }

    if (englishText.length > 10 || arabicText.length > 10) {
      // Check if this hadith number already exists (sub-narrations like 8a, 8b)
      const existing = hadiths.find(h => h.hadithNumber === hadithNum)
      if (!existing) {
        hadiths.push({
          hadithNumber: hadithNum,
          arabicText: arabicText || "",
          englishText: englishText || "",
          narrator: narrator || "",
          grade: grade || "sahih",
          reference: `${collPattern} ${hadithNum}`,
        })
      }
    }
  }

  // If the regex didn't catch everything, try a simpler split approach
  if (hadiths.length === 0) {
    // Try splitting by **Reference** blocks
    const refBlocks = text.split(/\*\*Reference\*\*/)
    for (let i = 0; i < refBlocks.length - 1; i++) {
      const block = refBlocks[i]
      const nextBlock = refBlocks[i + 1]

      // Get hadith number from the reference
      const refNumMatch = nextBlock?.match(/\[.*?(\d+)(?:\s*[a-z])?\s*\]/)
      if (!refNumMatch) continue
      const hadithNum = parseInt(refNumMatch[1])

      // Already have this number?
      if (hadiths.find(h => h.hadithNumber === hadithNum)) continue

      // Extract text from the block
      const lines = block.split("\n")
      const englishLines: string[] = []
      const arabicLines: string[] = []

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("Report Error") || trimmed.startsWith("In-book reference") || trimmed.startsWith("USC-MSA")) continue

        const arabicCharCount = (trimmed.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length
        const totalCharCount = trimmed.replace(/\s/g, "").length

        if (totalCharCount > 0 && arabicCharCount / totalCharCount > 0.5) {
          arabicLines.push(trimmed)
        } else if (trimmed.length > 5 && !trimmed.startsWith("(") && !trimmed.startsWith("*")) {
          englishLines.push(trimmed)
        }
      }

      const englishText = englishLines.join(" ").trim()
      const arabicText = arabicLines.join(" ").trim()

      if (englishText.length > 10 || arabicText.length > 10) {
        let narrator = ""
        const narratorMatch = englishText.match(/^(?:Narrated|It is narrated on the authority of|It was narrated (?:from|that))\s+([^:]+?)(?:\s*:|\s+that\b)/i)
        if (narratorMatch) {
          narrator = narratorMatch[1].replace(/\(.*?\)/g, "").trim()
          if (narrator.length > 60) narrator = narrator.substring(0, 60)
        }

        hadiths.push({
          hadithNumber: hadithNum,
          arabicText,
          englishText,
          narrator,
          grade: "sahih",
          reference: `${collPattern} ${hadithNum}`,
        })
      }
    }
  }

  return { hadiths, chapters }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Fetch a single book page from sunnah.com and parse hadiths
 */
async function fetchBookFromSunnah(collectionSlug: string, bookNumber: number): Promise<{ hadiths: ParsedHadith[], chapters: ParsedChapter[] }> {
  const sunnahSlug = COLLECTION_MAP[collectionSlug]
  if (!sunnahSlug) return { hadiths: [], chapters: [] }

  const url = `https://sunnah.com/${sunnahSlug}/${bookNumber}`

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      console.log(`[seed] HTTP ${response.status} for ${url}`)
      return { hadiths: [], chapters: [] }
    }

    const html = await response.text()

    // Parse from raw HTML using improved regex
    return parseFromRawHtml(html, sunnahSlug, collectionSlug)
  } catch (err) {
    console.error(`[seed] Fetch error for ${url}:`, err)
    return { hadiths: [], chapters: [] }
  }
}

/**
 * Parse hadiths directly from raw HTML (more reliable than text)
 */
function parseFromRawHtml(html: string, sunnahSlug: string, collectionSlug: string): { hadiths: ParsedHadith[], chapters: ParsedChapter[] } {
  const hadiths: ParsedHadith[] = []
  const chapters: ParsedChapter[] = []

  const collectionPatterns: Record<string, string> = {
    "bukhari": "Sahih al-Bukhari",
    "muslim": "Sahih Muslim",
    "abudawud": "Sunan Abi Dawud",
    "tirmidhi": "Jami` at-Tirmidhi",
    "nasai": "Sunan an-Nasa'i",
    "ibnmajah": "Sunan Ibn Majah",
    "malik": "Muwatta Malik",
    "ahmad": "Musnad Ahmad",
  }
  const collPattern = collectionPatterns[sunnahSlug] || sunnahSlug

  // Parse chapter titles from HTML
  const chapterTitleRegex = /class="chapter(?:Title|_title)[^"]*"[^>]*>[\s\S]*?class="englishchapter[^"]*"[^>]*>([\s\S]*?)<\/div/gi
  let chapterMatch
  let chapterNum = 0
  while ((chapterMatch = chapterTitleRegex.exec(html)) !== null) {
    chapterNum++
    const nameEn = chapterMatch[1].replace(/<[^>]+>/g, "").trim()
    if (nameEn) {
      chapters.push({ number: chapterNum, nameEn, nameAr: "" })
    }
  }

  // Also try alternate chapter pattern
  if (chapters.length === 0) {
    const altChapterRegex = /class="achaptertitle[^"]*"[^>]*>([\s\S]*?)<\/div/gi
    let altMatch
    chapterNum = 0
    while ((altMatch = altChapterRegex.exec(html)) !== null) {
      chapterNum++
      const nameAr = altMatch[1].replace(/<[^>]+>/g, "").trim()
      if (nameAr) {
        chapters.push({ number: chapterNum, nameEn: "", nameAr })
      }
    }
  }

  // Parse hadiths from HTML - sunnah.com wraps each hadith in specific divs
  // Look for hadith containers with class patterns
  const hadithContainerRegex = /class="(?:actualHadithContainer|hadithFull)"([\s\S]*?)(?=class="(?:actualHadithContainer|hadithFull)"|class="bottomItems"|$)/gi
  const containers = html.match(hadithContainerRegex) || []

  // Alternative: split by hadith reference numbers
  // Pattern: class="hadith_reference_number">123</
  const refNumRegex = /class="[^"]*hadith_reference[^"]*"[^>]*>\s*(\d+)\s*</gi
  const allRefNums: number[] = []
  let refMatch
  while ((refMatch = refNumRegex.exec(html)) !== null) {
    allRefNums.push(parseInt(refMatch[1]))
  }

  // Split HTML by the main hadith containers
  const hadithSections = html.split(/class="actualHadithContainer"/)

  for (let i = 1; i < hadithSections.length; i++) {
    const section = hadithSections[i]

    // Find the hadith number - look for reference number
    const numPatterns = [
      /class="[^"]*hadith_reference[^"]*"[^>]*>\s*(\d+)\s*</i,
      /class="[^"]*hadithNarrated[^"]*"[^>]*>.*?(\d+)/is,
    ]

    let hadithNum = 0
    for (const pattern of numPatterns) {
      const match = section.match(pattern)
      if (match) {
        hadithNum = parseInt(match[1])
        break
      }
    }

    // If still no number, try the broader reference section
    if (!hadithNum) {
      const broadRefMatch = section.match(/In-book reference[^:]*:[^,]*Hadith\s+(\d+)/i)
      if (broadRefMatch) hadithNum = parseInt(broadRefMatch[1])
    }

    if (!hadithNum) {
      // Try extracting from the full reference like "Sahih al-Bukhari 123"
      const fullRefMatch = section.match(new RegExp(`${escapeRegex(collPattern)}\\s+(\\d+)`, "i"))
      if (fullRefMatch) hadithNum = parseInt(fullRefMatch[1])
    }

    if (!hadithNum) continue

    // Skip sub-narrations if we already have this number
    if (hadiths.find(h => h.hadithNumber === hadithNum)) continue

    // Extract English text
    let englishText = ""
    const englishPatterns = [
      /class="[^"]*english_hadith_full[^"]*"[^>]*>([\s\S]*?)<\/div/i,
      /class="[^"]*text_details[^"]*"[^>]*>([\s\S]*?)<\/div/i,
      /class="[^"]*hadith_narrated[^"]*"[^>]*>([\s\S]*?)<\/div[\s\S]*?class="[^"]*hadithText[^"]*"[^>]*>([\s\S]*?)<\/div/i,
    ]
    for (const pattern of englishPatterns) {
      const match = section.match(pattern)
      if (match) {
        englishText = (match[1] + (match[2] || "")).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        if (englishText.length > 10) break
      }
    }

    // If no structured match, try getting all text between english markers
    if (englishText.length < 10) {
      const engBlockMatch = section.match(/class="[^"]*englishcontainer[^"]*"[^>]*>([\s\S]*?)<\/div\s*>\s*<\/div/i)
      if (engBlockMatch) {
        englishText = engBlockMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      }
    }

    // Extract Arabic text
    let arabicText = ""
    const arabicPatterns = [
      /class="[^"]*arabic_hadith_full[^"]*"[^>]*>([\s\S]*?)<\/div/i,
      /class="[^"]*arabic[^"]*hadith[^"]*"[^>]*>([\s\S]*?)<\/div/i,
      /class="[^"]*arabictext[^"]*"[^>]*>([\s\S]*?)<\/div/i,
    ]
    for (const pattern of arabicPatterns) {
      const match = section.match(pattern)
      if (match) {
        arabicText = match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        if (arabicText.length > 10) break
      }
    }

    // If no structured match, extract any substantial Arabic text
    if (arabicText.length < 10) {
      const arabicBlockMatch = section.match(/class="[^"]*arabiccontainer[^"]*"[^>]*>([\s\S]*?)<\/div\s*>\s*<\/div/i)
      if (arabicBlockMatch) {
        arabicText = arabicBlockMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      }
    }

    // Extract narrator
    let narrator = ""
    const narratorPatterns = [
      /(?:Narrated|It is narrated on the authority of|It was narrated (?:from|that)|reported on the authority of)\s+([^:]+?)(?:\s*:|\s+that\b)/i,
      /class="[^"]*hadithNarrated[^"]*"[^>]*>([\s\S]*?)<\/div/i,
    ]
    for (const pattern of narratorPatterns) {
      const match = (englishText || section).match(pattern)
      if (match) {
        narrator = match[1].replace(/<[^>]+>/g, "").replace(/\(.*?\)/g, "").trim()
        if (narrator.length > 60) narrator = narrator.substring(0, 60)
        break
      }
    }

    // Extract grade
    let grade = ""
    const gradePatterns = [
      /class="[^"]*hadith[-_]?grade[^"]*"[^>]*>([\s\S]*?)<\/t/i,
      /class="[^"]*grade[^"]*"[^>]*>([\s\S]*?)<\//i,
    ]
    for (const pattern of gradePatterns) {
      const match = section.match(pattern)
      if (match) {
        const g = match[1].replace(/<[^>]+>/g, "").toLowerCase().trim()
        if (g.includes("hasan") && g.includes("sahih")) grade = "sahih"
        else if (g.includes("sahih")) grade = "sahih"
        else if (g.includes("hasan")) grade = "hasan"
        else if (g.includes("da") || g.includes("weak") || g.includes("maudu")) grade = "daif"
        break
      }
    }

    if (englishText.length > 10 || arabicText.length > 10) {
      hadiths.push({
        hadithNumber: hadithNum,
        arabicText,
        englishText,
        narrator,
        grade: grade || (collectionSlug.includes("sahih") ? "sahih" : "hasan"),
        reference: `${collPattern} ${hadithNum}`,
      })
    }
  }

  return { hadiths, chapters }
}

/**
 * Update existing hadiths in the database with real content from sunnah.com
 */
async function seedBook(
  supabase: ReturnType<typeof createClient>,
  collectionSlug: string,
  bookNumber: number,
) {
  // Get collection
  const { data: collection } = await supabase
    .from("collections")
    .select("id, name_en")
    .eq("slug", collectionSlug)
    .single()

  if (!collection) throw new Error(`Collection not found: ${collectionSlug}`)

  // Get book
  const { data: book } = await supabase
    .from("books")
    .select("id, name_en, total_hadiths, total_chapters")
    .eq("collection_id", collection.id)
    .eq("number", bookNumber)
    .single()

  if (!book) throw new Error(`Book not found: ${collectionSlug} #${bookNumber}`)

  // Get existing hadiths for this book via collection_hadiths
  const { data: existingLinks } = await supabase
    .from("collection_hadiths")
    .select("hadith_id, hadith_number")
    .eq("book_id", book.id)
    .order("hadith_number")

  // Check if already has real content (not placeholder)
  if (existingLinks && existingLinks.length > 0) {
    const { data: sampleHadith } = await supabase
      .from("hadiths")
      .select("english_translation")
      .eq("id", existingLinks[0].hadith_id)
      .single()

    // If it already has substantial real content, skip
    if (sampleHadith?.english_translation &&
        sampleHadith.english_translation.length > 100 &&
        !sampleHadith.english_translation.includes("[Content pending") &&
        !sampleHadith.english_translation.includes("This is hadith number")) {
      return {
        status: "already_seeded",
        book: book.name_en,
        existing_hadiths: existingLinks.length,
      }
    }
  }

  // Fetch from sunnah.com
  console.log(`[seed] Fetching ${collectionSlug} book ${bookNumber} from sunnah.com...`)
  const { hadiths: fetchedHadiths, chapters: fetchedChapters } = await fetchBookFromSunnah(collectionSlug, bookNumber)

  console.log(`[seed] Parsed ${fetchedHadiths.length} hadiths, ${fetchedChapters.length} chapters for ${collectionSlug}/${bookNumber}`)

  let updatedCount = 0
  let insertedCount = 0
  let chaptersUpdated = 0

  // Update chapter names if we got them
  if (fetchedChapters.length > 0) {
    const { data: existingChapters } = await supabase
      .from("chapters")
      .select("id, number, name_en")
      .eq("book_id", book.id)
      .order("number")

    if (existingChapters) {
      for (const chapter of fetchedChapters) {
        const existing = existingChapters.find(c => c.number === chapter.number)
        if (existing && chapter.nameEn && (existing.name_en.startsWith("Chapter ") || existing.name_en.length < 5)) {
          const updateData: Record<string, string> = { name_en: chapter.nameEn }
          if (chapter.nameAr) updateData.name_ar = chapter.nameAr
          await supabase.from("chapters").update(updateData).eq("id", existing.id)
          chaptersUpdated++
        }
      }
    }
  }

  // Update existing hadiths with real content
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
          const { error } = await supabase
            .from("hadiths")
            .update(updateData)
            .eq("id", link.hadith_id)

          if (!error) updatedCount++
          else console.error(`[seed] Update error for hadith ${link.hadith_number}:`, error.message)
        }
      }
    }
  }

  // If no existing links (empty book), insert new hadiths
  if ((!existingLinks || existingLinks.length === 0) && fetchedHadiths.length > 0) {
    const { data: chapters } = await supabase
      .from("chapters")
      .select("id, number, total_hadiths")
      .eq("book_id", book.id)
      .order("number")

    for (let i = 0; i < fetchedHadiths.length; i += 25) {
      const batch = fetchedHadiths.slice(i, i + 25).map(h => ({
        arabic_text: h.arabicText || `حديث رقم ${h.hadithNumber}`,
        english_translation: h.englishText || `Hadith ${h.hadithNumber}`,
        collection: collection.name_en,
        book_number: bookNumber,
        hadith_number: h.hadithNumber,
        reference: h.reference,
        grade: h.grade || "sahih",
        narrator: h.narrator || "",
      }))

      const { data: inserted, error } = await supabase
        .from("hadiths")
        .insert(batch)
        .select("id, hadith_number")

      if (error) {
        console.error(`[seed] Insert error:`, error.message)
        continue
      }

      if (inserted && chapters && chapters.length > 0) {
        // Create collection_hadiths links
        let chapterIdx = 0
        let hadithsInCurrentChapter = 0
        const links = inserted.map(h => {
          if (chapters[chapterIdx] && hadithsInCurrentChapter >= (chapters[chapterIdx].total_hadiths || 1)) {
            chapterIdx = Math.min(chapterIdx + 1, chapters.length - 1)
            hadithsInCurrentChapter = 0
          }
          hadithsInCurrentChapter++
          return {
            collection_id: collection.id,
            hadith_id: h.id,
            book_id: book.id,
            chapter_id: chapters[Math.min(chapterIdx, chapters.length - 1)].id,
            hadith_number: h.hadith_number,
          }
        })

        await supabase.from("collection_hadiths").insert(links)
        insertedCount += inserted.length
      }
    }
  }

  return {
    status: "seeded",
    book: book.name_en,
    fetched_from_sunnah: fetchedHadiths.length,
    updated: updatedCount,
    inserted: insertedCount,
    chapters_updated: chaptersUpdated,
    chapters_found: fetchedChapters.length,
  }
}

export async function POST(request: Request) {
  const adminSecret = request.headers.get("x-admin-secret")
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { collection, bookNumber, seedAll } = body

    const supabase = getAdminClient()

    if (seedAll) {
      // Get all books ordered by collection then book number
      const { data: allBooks } = await supabase
        .from("books")
        .select(`id, number, name_en, total_hadiths, collection_id, collections!inner(slug, name_en)`)
        .order("number")

      if (!allBooks) return NextResponse.json({ error: "No books found" }, { status: 404 })

      const results: Array<{
        collection: string
        book: number
        name: string
        result: Awaited<ReturnType<typeof seedBook>> | { status: string; error: string }
      }> = []

      for (const book of allBooks) {
        const collSlug = (book as unknown as { collections: { slug: string } }).collections.slug
        try {
          const result = await seedBook(supabase, collSlug, book.number)
          results.push({
            collection: collSlug,
            book: book.number,
            name: book.name_en,
            result,
          })
        } catch (err) {
          results.push({
            collection: collSlug,
            book: book.number,
            name: book.name_en,
            result: { status: "error", error: String(err) },
          })
        }

        // Small delay to avoid rate-limiting
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      return NextResponse.json({
        message: "Seeding complete",
        total_books: results.length,
        results,
      })
    }

    // Seed single book
    if (!collection || !bookNumber) {
      return NextResponse.json(
        { error: "Provide collection slug and bookNumber, or set seedAll: true" },
        { status: 400 },
      )
    }

    const result = await seedBook(supabase, collection, bookNumber)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[seed] Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    usage: "POST with { seedAll: true } to seed all, or { collection: 'sahih-bukhari', bookNumber: 1 } for one book",
    collections: Object.keys(COLLECTION_MAP),
  })
}

export const maxDuration = 300 // 5 minutes max for Vercel
