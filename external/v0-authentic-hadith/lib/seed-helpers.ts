/**
 * Helpers for fetching, transforming, and inserting hadith data from the CDN.
 */

// ── CDN types ────────────────────────────────────────────────
export interface CdnHadith {
  hadithnumber: number
  text: string
  grades: Array<{ name: string; grade: string }>
  reference: { book: number; hadith: number }
}

export interface CdnEdition {
  metadata: {
    name: string
    sections: Record<string, string>
    section_details?: Record<string, { hadiths_start_number: number; hadiths_end_number: number }>
  }
  hadiths: CdnHadith[]
}

// ── Fetch with retry ────────────────────────────────────────
export async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      return res
    } catch (err) {
      if (attempt === retries) throw err
      await sleep(1000 * Math.pow(2, attempt - 1)) // 1s, 2s, 4s
    }
  }
  throw new Error("Unreachable")
}

export async function fetchEdition(editionKey: string): Promise<CdnEdition> {
  const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${editionKey}.json`
  const res = await fetchWithRetry(url)
  return res.json()
}

// ── Text cleaning ───────────────────────────────────────────
export function cleanText(text: string | undefined | null): string {
  if (!text) return ""
  return text
    .replace(/<[^>]*>/g, "")        // strip HTML
    .replace(/\s+/g, " ")           // collapse whitespace
    .trim()
}

export function parseNarrator(englishText: string): string | null {
  // Common patterns: "Narrated Abu Huraira:", "Abu Huraira reported:", etc.
  const patterns = [
    /^Narrated\s+(.+?):/i,
    /^(.+?)\s+reported\s+that/i,
    /^(.+?)\s+narrated\s+that/i,
    /^It was narrated from\s+(.+?)\s+that/i,
    /^It was narrated that\s+(.+?)\s+said/i,
  ]
  for (const p of patterns) {
    const m = englishText.match(p)
    if (m) return m[1].trim()
  }
  return null
}

export function extractGrade(grades: Array<{ name: string; grade: string }>): string {
  if (!grades || grades.length === 0) return "Unknown"
  // Priority: Darussalam > Al-Albani > first available
  const priority = ["darussalam", "al-albani", "albani"]
  for (const p of priority) {
    const found = grades.find(g => g.name.toLowerCase().includes(p))
    if (found) return normalizeGrade(found.grade)
  }
  return normalizeGrade(grades[0].grade)
}

function normalizeGrade(raw: string): string {
  const lower = raw.toLowerCase().trim()
  if (lower.includes("sahih") && !lower.includes("da'if")) return "Sahih"
  if (lower.includes("hasan") && lower.includes("sahih")) return "Hasan Sahih"
  if (lower.includes("hasan")) return "Hasan"
  if (lower.includes("da'if") || lower.includes("daif") || lower.includes("weak")) return "Da'if"
  if (lower.includes("maudu") || lower.includes("fabricated")) return "Maudu"
  return raw.trim() || "Unknown"
}

export function buildReference(collectionSlug: string, book: number, hadith: number): string {
  const nameMap: Record<string, string> = {
    "sahih-bukhari": "Bukhari",
    "sahih-muslim": "Muslim",
    "jami-tirmidhi": "Tirmidhi",
    "sunan-abu-dawud": "Abu Dawud",
    "sunan-nasai": "Nasai",
    "sunan-ibn-majah": "Ibn Majah",
    "muwatta-malik": "Malik",
    "musnad-ahmad": "Ahmad",
  }
  const name = nameMap[collectionSlug] || collectionSlug
  return `${name} ${hadith}`
}

export function calculateGradeDistribution(
  grades: string[],
): Record<string, number> {
  const dist: Record<string, number> = {}
  for (const g of grades) {
    const key = g || "Unknown"
    dist[key] = (dist[key] || 0) + 1
  }
  return dist
}

// ── Batching ────────────────────────────────────────────────
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
