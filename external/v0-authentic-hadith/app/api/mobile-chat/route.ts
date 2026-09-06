import { generateText } from "ai"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { retrieveGrounding, buildGroundedSystem } from "@/lib/api/hadith-grounding"
import { getAssistantModel } from "@/lib/api/assistant-model"

// Mobile chat endpoint consumed by the native app (lib/api/groq.ts).
// Contract: POST { messages: [{ role, content }] } -> { response: string }.
// Non-streaming on purpose so the existing app build keeps working with no rebuild.
//
// Brain: env-configurable (Groq / Anthropic / OpenAI — see lib/api/assistant-model.ts)
// + STRICT RAG grounding over the hadith database + server-side safety guardrails.
//
// STRICT GROUNDING (provenance is non-negotiable for an authentic-hadith app):
// the model may ONLY cite hadiths that this route actually retrieved from the
// hadiths table. Retrieval + grounding rules live in lib/api/hadith-grounding.ts
// so the web chat and the native app ground identically.

export const maxDuration = 30

const SYSTEM_PROMPT = `You are the Authentic Hadith assistant, a knowledgeable and respectful Islamic study companion specializing in hadith.

Your role:
- Help users understand the meaning, context, and chain of narration (isnad) of hadiths.
- Explain authenticity grades (Sahih, Hasan) when they are provided to you.
- Answer questions about Islamic teachings grounded ONLY in the narrations provided to you below.

Critical content safety rules (you MUST also follow these):
- You are NOT a mufti. NEVER issue fatwas or definitive religious rulings. Say "scholars have said..." or "according to [scholar/school]..." and recommend the user consult a qualified local scholar for personal rulings.
- NEVER provide medical, legal, financial, or psychological advice. Direct users to qualified professionals.
- NEVER encourage self-harm, violence, extremism, or hatred toward any group. If a user expresses distress, gently encourage them to seek help from a qualified counselor or a crisis helpline.
- For sensitive topics (slavery, warfare, gender), provide full historical context and note how classical scholars understood the text within its time period.
- NEVER claim that one school of thought (madhab) is the only correct interpretation.
- Stay within the domain of Islamic knowledge. Politely decline questions unrelated to Islamic teachings.

Keep answers clear and concise (2-4 paragraphs). Use accessible language while staying scholarly and accurate.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages = body?.messages

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Invalid request: messages must be a non-empty array" },
        { status: 400 },
      )
    }

    const lastUser = [...messages].reverse().find((m: any) => m?.role === "user")?.content ?? ""

    // RAG grounding — keyword + by-reference retrieval, scoped to the Sahihayn.
    let hadiths: Awaited<ReturnType<typeof retrieveGrounding>> = []
    try {
      const supabase = await getSupabaseServerClient()
      hadiths = await retrieveGrounding(supabase as any, String(lastUser))
    } catch (retrievalError) {
      console.error("[mobile-chat] hadith retrieval failed:", retrievalError)
    }

    const system = buildGroundedSystem(SYSTEM_PROMPT, hadiths)

    let text = ""
    try {
      const result = await generateText({
        model: getAssistantModel(),
        system,
        messages,
        maxOutputTokens: 1024,
        maxRetries: 2,
      })
      text = result.text
    } catch (primaryError) {
      console.warn("[mobile-chat] Primary model generation failed, falling back to Vercel AI Gateway:", primaryError)
      const fallbackResult = await generateText({
        model: "openai/gpt-4o-mini" as any,
        system,
        messages,
        maxOutputTokens: 1024,
        maxRetries: 2,
      })
      text = fallbackResult.text
    }

    return Response.json({ response: text })
  } catch (error) {
    console.error("[mobile-chat] error:", error)
    return Response.json(
      {
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
