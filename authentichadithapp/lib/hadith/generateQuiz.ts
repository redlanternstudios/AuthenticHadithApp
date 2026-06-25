/**
 * Quiz question generation — extracted from app/quiz.tsx for testability.
 *
 * HARD-001 ALPHA: FIX-069 null-guard regression tests depend on this export.
 * The generateQuestions function must be importable without a React/RN runtime.
 */
import { Hadith } from '@/types/hadith'
import { isHiddenCollection } from '@/lib/hadith/visibleCollections'

export interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export const COLLECTION_DISPLAY: Record<string, string> = {
  'sahih-bukhari': 'Sahih al-Bukhari',
  'sahih-muslim': 'Sahih Muslim',
  'sunan-abu-dawud': 'Sunan Abu Dawud',
  'jami-tirmidhi': 'Jami at-Tirmidhi',
  'sunan-nasai': "Sunan an-Nasa'i",
  'sunan-ibn-majah': 'Sunan Ibn Majah',
  'muwatta-malik': 'Muwatta Malik',
  'musnad-ahmad': 'Musnad Ahmad',
}

// Narrator names arrive from the DB with transliteration marks ("Ibn `Umar",
// "Abu Hurayrah's") while the decoy list is plain ASCII. Compare on a
// normalized form so the same companion never appears twice as an option.
export function normalizeNarratorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[`'''ʿʾ.]/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Excerpt the hadith for the question card: cut at a word boundary near
// EXCERPT_MAX chars and append an ellipsis ONLY when text was actually
// truncated — never a mid-word cut like "(he meant garl...".
const EXCERPT_MAX = 300
export function excerptHadith(text: string): string {
  const t = text.trim()
  if (t.length <= EXCERPT_MAX) return t
  const cut = t.slice(0, EXCERPT_MAX)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '') + '\u2026'
}

/**
 * Generate up to 10 quiz questions from a pool of hadiths.
 *
 * FIX-069 null guard: hadiths with blank or missing `english_text` are skipped
 * one-by-one. A pool of 0 eligible hadiths returns [] without throwing.
 * A pool where all 212 blank-text rows are passed in also returns [] without throwing.
 */
export function generateQuestions(hadiths: Hadith[]): QuizQuestion[] {
  const questions: QuizQuestion[] = []

  for (const hadith of hadiths.slice(0, 10)) {
    // FIX-038 / FIX-069 defense-in-depth: even though the query already filters
    // out empty english_text / narrator, skip any row that still arrives blank
    // rather than emitting an unanswerable question.
    if (!hadith.english_text || !hadith.english_text.trim()) continue

    const type = Math.floor(Math.random() * 3)

    if (type === 0 && hadith.narrator && hadith.narrator.trim().length > 0) {
      // Narrator question
      const correctNarrator = normalizeNarratorName(hadith.narrator)
      const wrongNarrators = ['Abu Hurairah', 'Aisha', 'Ibn Umar', 'Anas bin Malik', 'Jabir', 'Ibn Abbas']
        .filter((n) => normalizeNarratorName(n) !== correctNarrator)
      const shuffled = wrongNarrators.sort(() => Math.random() - 0.5).slice(0, 3)
      const options = [...shuffled, hadith.narrator].sort(() => Math.random() - 0.5)
      questions.push({
        question: `Who narrated this hadith?\n\n"${excerptHadith(hadith.english_text || '')}"`,
        options,
        correctIndex: options.indexOf(hadith.narrator),
        explanation: `This hadith was narrated by ${hadith.narrator}.`,
      })
    } else if (type === 1) {
      // Collection question
      const correct = COLLECTION_DISPLAY[hadith.collection_slug] || hadith.collection_slug
      // Exclude release-hidden collections from the decoys so a hidden
      // collection name (e.g. "Musnad Ahmad") never shows as a quiz option.
      const wrongCollections = Object.entries(COLLECTION_DISPLAY)
        .filter(([slug, name]) => !isHiddenCollection(slug) && name !== correct)
        .map(([, name]) => name)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
      const options = [...wrongCollections, correct].sort(() => Math.random() - 0.5)
      questions.push({
        question: `Which collection contains this hadith?\n\n"${excerptHadith(hadith.english_text || '')}"`,
        options,
        correctIndex: options.indexOf(correct),
        explanation: `This hadith is from ${correct}.`,
      })
    } else {
      // Grade question
      const gradeDisplay: Record<string, string> = {
        sahih: 'Sahih (Authentic)',
        hasan: 'Hasan (Good)',
        daif: "Da'if (Weak)",
      }
      // Skip grade question when hadith.grade is null/undefined or not in
      // gradeDisplay — avoids silently reporting 'Sahih (Authentic)' as
      // the correct answer for a da'if or ungraded hadith.
      if (!hadith.grade || !gradeDisplay[hadith.grade]) {
        continue
      }
      const correct = gradeDisplay[hadith.grade]
      const options = Object.values(gradeDisplay).sort(() => Math.random() - 0.5)
      questions.push({
        question: `What is the grade of this hadith?\n\n"${excerptHadith(hadith.english_text || '')}"`,
        options,
        correctIndex: options.indexOf(correct),
        explanation: `This hadith is graded as ${correct}.`,
      })
    }
  }

  return questions.slice(0, 10)
}
