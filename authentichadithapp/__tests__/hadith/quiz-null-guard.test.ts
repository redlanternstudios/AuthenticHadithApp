/**
 * FIX-069 — Quiz null guard regression
 *
 * generateQuestions() in lib/hadith/generateQuiz.ts must:
 *  - Return [] when passed 0 hadiths — no throw.
 *  - Return [] when every hadith in the pool has a blank english_text — no throw.
 *  - Skip blank-text rows silently and only emit questions for rows with real text.
 *
 * HARD-001 ALPHA: these are the canonical regression tests for the null-guard
 * introduced in FIX-038 and hardened in FIX-069. If generateQuestions ever
 * regresses to throw on empty input, this suite catches it.
 */

import { generateQuestions } from '@/lib/hadith/generateQuiz'
import { Hadith } from '@/types/hadith'

// ── Minimal Hadith factory ────────────────────────────────────────────────────
// Production columns verified 2026-06-11 against nqklipakrfuwebkdnhwg:
// id, english_text, collection_slug, narrator, grade, arabic_text, ...
function makeHadith(overrides: Partial<Hadith> = {}): Hadith {
  return {
    id: 'test-id-001',
    hadith_number: '1',
    arabic_text: 'arabic',
    english_text: 'The Prophet (peace be upon him) said: Actions are by intentions.',
    grade: 'sahih',
    collection_slug: 'sahih-bukhari',
    narrator: 'Umar ibn al-Khattab',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
describe('generateQuestions — FIX-069 null guard', () => {
  // ── Empty pool ──────────────────────────────────────────────────────────────
  it('returns [] without throwing when passed an empty array (0 eligible hadiths)', () => {
    expect(() => generateQuestions([])).not.toThrow()
    const result = generateQuestions([])
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  // ── All-blank pool (the 212-row scenario) ───────────────────────────────────
  it('returns [] without throwing when all 212 hadiths have blank english_text', () => {
    // Simulate the 212 blank-text hadiths that exist in production Sahihayn corpus.
    // generateQuestions must silently skip every one and return [].
    const blankPool: Hadith[] = Array.from({ length: 212 }, (_, i) =>
      makeHadith({ id: `blank-${i}`, english_text: '' }),
    )

    expect(() => generateQuestions(blankPool)).not.toThrow()
    const result = generateQuestions(blankPool)
    expect(result).toHaveLength(0)
  })

  it('returns [] without throwing when english_text is whitespace-only', () => {
    const whitespacePool = [
      makeHadith({ english_text: '   ' }),
      makeHadith({ english_text: '\t\n' }),
      makeHadith({ english_text: '  \n  ' }),
    ]
    expect(() => generateQuestions(whitespacePool)).not.toThrow()
    expect(generateQuestions(whitespacePool)).toHaveLength(0)
  })

  // ── Mixed pool — blank rows must be skipped ─────────────────────────────────
  it('skips blank-text rows and only generates questions for hadiths with real text', () => {
    const mixed: Hadith[] = [
      makeHadith({ id: 'blank-1', english_text: '' }),
      makeHadith({ id: 'blank-2', english_text: '  ' }),
      makeHadith({
        id: 'real-1',
        english_text: 'The Prophet said: Cleanliness is half of faith.',
        narrator: 'Abu Hurairah',
        collection_slug: 'sahih-muslim',
        grade: 'sahih',
      }),
    ]

    // Run multiple times because generateQuestions uses Math.random() for question type.
    // At least one run must produce >= 1 question from the single valid hadith.
    let producedQuestion = false
    for (let i = 0; i < 20; i++) {
      const result = generateQuestions(mixed)
      expect(result.length).toBeLessThanOrEqual(1) // only 1 valid hadith in pool
      if (result.length === 1) producedQuestion = true
    }
    expect(producedQuestion).toBe(true)
  })

  // ── Output shape guard ──────────────────────────────────────────────────────
  it('every returned QuizQuestion has required fields with valid types', () => {
    const validPool = [
      makeHadith({
        id: 'valid-1',
        english_text: 'The Prophet (peace be upon him) said: Actions are by intentions.',
        narrator: 'Umar ibn al-Khattab',
        collection_slug: 'sahih-bukhari',
        grade: 'sahih',
      }),
    ]

    // Run several times so different question types are exercised.
    for (let i = 0; i < 15; i++) {
      const result = generateQuestions(validPool)
      for (const q of result) {
        expect(typeof q.question).toBe('string')
        expect(q.question.length).toBeGreaterThan(0)
        expect(Array.isArray(q.options)).toBe(true)
        expect(q.options.length).toBeGreaterThanOrEqual(2)
        expect(typeof q.correctIndex).toBe('number')
        expect(q.correctIndex).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex).toBeLessThan(q.options.length)
        expect(typeof q.explanation).toBe('string')
        expect(q.explanation.length).toBeGreaterThan(0)
      }
    }
  })

  // ── Pool capped at 10 ───────────────────────────────────────────────────────
  it('never returns more than 10 questions regardless of pool size', () => {
    const largePool: Hadith[] = Array.from({ length: 50 }, (_, i) =>
      makeHadith({
        id: `hadith-${i}`,
        english_text: `The Prophet said: This is hadith number ${i}.`,
        narrator: 'Abu Hurairah',
        grade: 'sahih',
        collection_slug: 'sahih-bukhari',
      }),
    )
    const result = generateQuestions(largePool)
    expect(result.length).toBeLessThanOrEqual(10)
  })
})
