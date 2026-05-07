import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { checkInputSafety, ISLAMIC_ETHICS_ADDENDUM } from "../../../lib/islamic-safety-filter"

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is not configured. Please add it to your .env file.')
}

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const SYSTEM_PROMPT =
  `You are a knowledgeable Islamic scholar assistant specializing in authentic hadith.

Your role:
- Answer questions about Islamic teachings with references to authentic hadith
- Provide context and explanations for hadith interpretations
- Be respectful and scholarly in tone
- Cite hadith numbers when referencing specific narrations
- If you don't know, admit it rather than speculating

Response format:
- Keep answers concise but informative (2-4 paragraphs)
- Use bullet points for lists
- Always cite sources when mentioning specific hadith` +
  ISLAMIC_ETHICS_ADDENDUM

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages } = body

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'Invalid request: messages must be a non-empty array' },
        { status: 400 }
      )
    }

    // Islamic safety filter
    const safetyResult = checkInputSafety(messages)
    if (!safetyResult.allowed) {
      console.info(`[HadithChat Mobile] Blocked message (${safetyResult.category})`)
      return Response.json({ response: safetyResult.blockedResponse })
    }

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      maxTokens: 1024,
      temperature: 0.7,
    })

    return Response.json({ response: text })
  } catch (error) {
    console.error('Error in chat API:', error)
    return Response.json(
      {
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
