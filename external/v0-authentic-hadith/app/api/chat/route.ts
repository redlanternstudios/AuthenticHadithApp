import { streamText, convertToModelMessages, UIMessage } from "ai"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { checkAIQuota, incrementAIUsage } from "@/lib/quotas/check"
import { retrieveGrounding, buildGroundedSystem } from "@/lib/api/hadith-grounding"
import { getAssistantModel } from "@/lib/api/assistant-model"

export const maxDuration = 30

const BASE_SYSTEM_PROMPT = `You are HadithChat, a knowledgeable Islamic scholar assistant specializing in hadith studies.

Your role:
1. Help users understand the meanings and context of hadiths
2. Explain the chain of narration (isnad) and authenticity grades
3. Provide scholarly interpretations from classical and contemporary scholars
4. Answer questions about Islamic teachings based on authentic sources

Guidelines:
- Be respectful and educational in your responses
- Acknowledge when there are scholarly differences of opinion
- Use clear, accessible language while maintaining scholarly accuracy
- When discussing hadith authenticity, reference the grading (Sahih, Hasan)

Critical content safety rules (you MUST follow these):
- You are NOT a mufti. NEVER issue fatwas or definitive religious rulings. Always say "scholars have said..." or "according to [scholar/school]..." and recommend users consult a qualified local scholar for personal rulings.
- NEVER provide medical, legal, financial, or psychological advice. If a user asks about health, mental health, or legal matters, direct them to qualified professionals.
- NEVER encourage self-harm, violence, extremism, or hatred toward any group. If a user expresses distress, gently encourage them to seek help from a qualified counselor or call a crisis helpline.
- If a hadith involves sensitive topics (slavery, warfare, gender), provide full historical context and note how classical scholars understood the text within its time period.
- NEVER claim to represent any specific school of thought (madhab) as the only correct interpretation.
- Stay within the domain of hadith scholarship. Politely decline questions unrelated to Islamic knowledge.`

const MADHAB_PROMPT_SECTION = (madhab: string) =>
  `\n\nUser's School of Thought: ${madhab}
When the user's question involves a fiqh ruling where the four schools of thought differ:
1. Present the positions of all relevant schools briefly.
2. Then clarify which position the ${madhab} school holds.
3. Never dismiss other schools or imply one is more correct than another.
4. Only reference the user's madhab when there is a genuine difference of opinion -- do not mention it when scholars are unanimous.
5. Always recommend consulting a qualified local scholar for personal rulings.`

const LEVEL_PROMPT_SECTIONS: Record<string, string> = {
  beginner: `\n\nUser's Learning Level: Beginner
Adapt your responses for someone new to Islamic studies:
- Use short, clear sentences. Avoid jargon.
- Define any Arabic term the first time you use it (e.g. "isnad (chain of narration)").
- Focus on practical application and spiritual benefit.
- Keep explanations warm, encouraging, and concise.`,

  intermediate: `\n\nUser's Learning Level: Intermediate
Adapt your responses for a practicing Muslim with foundational knowledge:
- You may use common Arabic terminology with brief definitions.
- You can mention scholarly disagreements and different opinions.
- Reference classical scholars when relevant (e.g. Imam al-Nawawi, Ibn Hajar).
- Provide moderate depth -- explain reasoning behind rulings, not just conclusions.`,

  advanced: `\n\nUser's Learning Level: Advanced
Adapt your responses for a student of knowledge:
- Use Arabic terminology freely; no need to define well-known terms.
- Cite specific scholars, books, and chains of narration when relevant.
- Discuss minority vs. majority scholarly opinions with nuance.`,
}

function buildBasePrompt(madhab?: string | null, level?: string | null): string {
  let prompt = BASE_SYSTEM_PROMPT
  if (madhab && madhab !== "Other / Prefer not to say") {
    prompt += MADHAB_PROMPT_SECTION(madhab)
  }
  const normalizedLevel = (level || "intermediate").toLowerCase()
  if (LEVEL_PROMPT_SECTIONS[normalizedLevel]) {
    prompt += LEVEL_PROMPT_SECTIONS[normalizedLevel]
  }
  return prompt
}

// Pull plain text out of the latest user UIMessage (v6 parts, or string content).
function lastUserText(messages: UIMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user")
  if (!last) return ""
  const anyMsg = last as any
  if (typeof anyMsg.content === "string") return anyMsg.content
  const parts = Array.isArray(anyMsg.parts) ? anyMsg.parts : []
  return parts
    .filter((p: any) => p?.type === "text" && typeof p.text === "string")
    .map((p: any) => p.text)
    .join(" ")
    .trim()
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages: UIMessage[] = body.messages

    // Auth check
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: "You must be logged in to use the AI assistant." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      )
    }

    // Quota check
    const quotaCheck = await checkAIQuota(user.id)

    if (!quotaCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "quota_exceeded",
          message: `Daily limit reached. ${quotaCheck.tier === "free" ? "Explorer accounts include 5 AI explanations per day. Upgrade to Pro for unlimited access." : quotaCheck.reason}`,
          quota: {
            daily_remaining: quotaCheck.daily_remaining,
            monthly_remaining: quotaCheck.monthly_remaining,
            daily_limit: quotaCheck.daily_limit,
            monthly_limit: quotaCheck.monthly_limit,
            tier: quotaCheck.tier,
          },
          upgrade_url: "/pricing",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      )
    }

    // Fetch user preferences for personalized system prompt
    const [{ data: prefs }, { data: profile }] = await Promise.all([
      supabase.from("user_preferences").select("learning_level").eq("user_id", user.id).single(),
      supabase.from("profiles").select("school_of_thought").eq("user_id", user.id).single(),
    ])

    // STRICT RAG: retrieve the only hadiths the model may cite, then ground.
    // Pre-retrieval (not an optional tool) guarantees the model can never
    // fabricate a citation — it only sees what we pulled from the DB.
    const hadiths = await retrieveGrounding(supabase as any, lastUserText(messages))
    const basePrompt = buildBasePrompt(profile?.school_of_thought, prefs?.learning_level)
    const systemPrompt = buildGroundedSystem(basePrompt, hadiths)

    const result = streamText({
      model: getAssistantModel(),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    })

    // Increment usage after streaming completes
    incrementAIUsage(user.id).catch((err) =>
      console.error("[v0] Failed to increment usage:", err),
    )

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to process your request. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
