import { generateText, Output } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const quizQuestionSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      explanation: z.string(),
      difficulty: z.string(),
      relatedHadithRef: z.string().nullable(),
    })
  ),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { pathId, moduleId, lessonId, count = 5, mode = "learning_path" } = body

    const supabase = await createClient()

    let hadithContext: Array<{
      english_translation: string
      arabic_text: string
      collection: string
      reference: string
      grade: string
      narrator: string
    }> = []
    let lessonContext = ""

    if (mode === "learning_path" && (lessonId || moduleId || pathId)) {
      // Get lessons for the requested scope
      let lessonIds: string[] = []

      if (lessonId) {
        lessonIds = [lessonId]
      } else if (moduleId) {
        const { data } = await supabase
          .from("learning_lessons")
          .select("id")
          .eq("module_id", moduleId)
        lessonIds = (data || []).map((l) => l.id)
      } else if (pathId) {
        const { data: modules } = await supabase
          .from("learning_modules")
          .select("id")
          .eq("path_id", pathId)
        if (modules) {
          const { data } = await supabase
            .from("learning_lessons")
            .select("id")
            .in("module_id", modules.map((m) => m.id))
          lessonIds = (data || []).map((l) => l.id)
        }
      }

      // Get lesson content and hadith IDs
      if (lessonIds.length > 0) {
        const { data: lessons } = await supabase
          .from("learning_lessons")
          .select("title, description, content_markdown, hadith_ids, collection_slug")
          .in("id", lessonIds)

        if (lessons) {
          const allHadithIds: string[] = []
          const contextParts: string[] = []

          for (const lesson of lessons) {
            if (lesson.content_markdown) {
              contextParts.push(`Lesson: ${lesson.title}\n${lesson.content_markdown.substring(0, 500)}`)
            }
            if (lesson.hadith_ids) {
              allHadithIds.push(...lesson.hadith_ids)
            }
          }
          lessonContext = contextParts.join("\n\n")

          // Fetch referenced hadiths
          if (allHadithIds.length > 0) {
            const { data: hadiths } = await supabase
              .from("hadiths")
              .select("english_translation, arabic_text, collection, reference, grade, narrator")
              .in("collection", ["sahih-bukhari", "sahih-muslim"])
              .in("id", allHadithIds)
              .limit(20)
            if (hadiths) hadithContext = hadiths
          }
        }
      }
    }

    // If no specific context, grab random hadiths for a general quiz
    if (hadithContext.length === 0) {
      const { data: hadiths } = await supabase
        .from("hadiths")
        .select("english_translation, arabic_text, collection, reference, grade, narrator")
        .in("collection", ["sahih-bukhari", "sahih-muslim"])
        .not("narrator", "is", null)
        .not("english_translation", "is", null)
        .limit(100)

      if (hadiths) {
        // Shuffle and pick a subset
        const shuffled = hadiths.sort(() => Math.random() - 0.5)
        hadithContext = shuffled.slice(0, Math.min(15, shuffled.length))
      }
    }

    if (hadithContext.length === 0) {
      return Response.json({ error: "No hadith data available for quiz generation" }, { status: 400 })
    }

    // Build the hadith context string
    const hadithContextStr = hadithContext
      .map((h, i) => {
        const parts = []
        parts.push(`Hadith ${i + 1}:`)
        if (h.reference) parts.push(`Reference: ${h.reference}`)
        if (h.collection) parts.push(`Collection: ${h.collection}`)
        if (h.narrator) parts.push(`Narrator: ${h.narrator}`)
        if (h.grade) parts.push(`Grade: ${h.grade}`)
        if (h.english_translation) parts.push(`Translation: ${h.english_translation.substring(0, 300)}`)
        return parts.join("\n")
      })
      .join("\n\n")

    const systemPrompt = `You are a knowledgeable Islamic scholar creating educational quiz questions about hadith (prophetic traditions). 
Your questions should test understanding, not just memorization. Create questions that help students learn about:
- The meaning and lessons from specific hadiths
- Who narrated specific hadiths  
- Which collection a hadith belongs to
- The grade/authenticity classification of hadiths
- Islamic teachings and principles derived from the hadiths
- Context and application of hadith teachings

IMPORTANT RULES:
- Questions must be factually accurate based on the provided hadiths
- Each question must have exactly 4 options
- correctIndex must be 0, 1, 2, or 3
- The explanation should be educational and reference the actual hadith
- Mix question types: understanding, narrator identification, collection knowledge, practical application
- Questions should be respectful and educational in tone
- Do NOT make questions about controversial topics`

    const userPrompt = `Generate ${count} multiple-choice quiz questions based on the following hadith content:

${lessonContext ? `LEARNING CONTEXT:\n${lessonContext}\n\n` : ""}HADITH DATA:
${hadithContextStr}

Generate exactly ${count} questions with varying difficulty levels. Focus on testing genuine understanding of the teachings.`

    const { output } = await generateText({
      model: "openai/gpt-4o-mini",
      output: Output.object({ schema: quizQuestionSchema }),
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    })

    return Response.json({ questions: output?.questions || [] })
  } catch (error) {
    console.error("Quiz generation error:", error)
    return Response.json({ error: "Failed to generate quiz questions" }, { status: 500 })
  }
}
