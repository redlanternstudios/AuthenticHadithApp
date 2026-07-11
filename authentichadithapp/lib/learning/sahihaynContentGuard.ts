import { Lesson } from '@/types/hadith'

const EXCLUDED_COLLECTION_RE =
  /\b(four sunan|sunan abu dawud|abu dawud|jami at-tirmidhi|tirmidhi|sunan an-nasa'?i|nasai|nasa'i|sunan ibn majah|ibn majah)\b/i

const SAHIHAYN_LESSON_CONTENT = `# The Two Sahih Collections

## Why this app limits the library

Authentic Hadith is focused on the Sahihayn: Sahih al-Bukhari and Sahih Muslim. That gives the app a clear source boundary, a cleaner study path, and a corpus users can recognize without wondering which collections are included.

## Sahih al-Bukhari

Imam al-Bukhari's collection is one of the most trusted works of hadith. In this app it appears as Sahih al-Bukhari with 7,277 narrations.

## Sahih Muslim

Imam Muslim's collection is the second collection in the app. It appears as Sahih Muslim with 7,167 narrations.

## What the count means

Together, these two collections make up 14,444 narrations in the current app library. Learning content, quiz content, and discovery flows should guide users back into those two sources.

## Study rule

When a lesson explains hadith sciences, it can mention methodology in general terms, but examples and calls to action should stay anchored to Sahih al-Bukhari and Sahih Muslim.`

export function hasExcludedCollectionReference(value?: string | null) {
  return EXCLUDED_COLLECTION_RE.test(value ?? '')
}

export function sanitizeLessonForSahihayn(lesson: Lesson): Lesson {
  const haystack = [lesson.title, lesson.description, lesson.content].filter(Boolean).join('\n')

  if (!hasExcludedCollectionReference(haystack)) return lesson

  return {
    ...lesson,
    title: 'The Two Sahih Collections',
    description: 'Identify Sahih al-Bukhari and Sahih Muslim as the app source boundary.',
    content: SAHIHAYN_LESSON_CONTENT,
    estimated_minutes: Math.min(lesson.estimated_minutes || 8, 8),
    has_quiz: false,
  }
}

export function isSahihaynSafeQuizText(value: string) {
  return !hasExcludedCollectionReference(value)
}
