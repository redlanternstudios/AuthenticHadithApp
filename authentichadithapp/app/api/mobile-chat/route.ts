/**
 * POST /api/mobile-chat
 *
 * Server-side AI chat endpoint for the Authentic Hadith mobile app.
 *
 * Named `route.ts` (not `route.web.ts`) so it is included in the full
 * server build and reachable at /api/mobile-chat on the deployed host.
 * The `.web.ts` variant at /api/chat is web-only; this route handles
 * requests from the React Native client.
 *
 * Requires server-side env var:
 *   GROQ_API_KEY — Groq API key (never shipped in the client bundle)
 *
 * Includes ISLAMIC_ETHICS_ADDENDUM injected into the system prompt so the
 * model is bound to Islamic scholarly ethics on every mobile request.
 */

import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { checkInputSafety, ISLAMIC_ETHICS_ADDENDUM } from '../../../lib/islamic-safety-filter'

// IMPORTANT: do NOT throw at module-load time.
//
// Expo Router bundles every file under `app/` into the JS bundle that ships
// to the mobile client, including server route files like this one. Throwing
// when GROQ_API_KEY is missing crashes the entire app at startup on any
// device that does not have the server-only secret in its environment
// (i.e. every device — EXPO_PUBLIC_* vars are the only ones in client JS).
//
// Move all env-dependent work inside the request handler so it only runs
// when this route is actually invoked on the server.

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
    // Server-side env check — runs only when route is invoked, never at module load.
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return Response.json(
        {
          error: 'AI assistant unavailable',
          details: 'The AI assistant is temporarily unavailable. Please try again later.',
        },
        { status: 503 },
      )
    }

    const groq = createGroq({ apiKey })

    const body = await request.json()
    const { messages } = body

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'Invalid request: messages must be a non-empty array' },
        { status: 400 },
      )
    }

    // Islamic safety filter — blocks prompt injection, haram facilitation, etc.
    const safetyResult = checkInputSafety(messages)
    if (!safetyResult.allowed) {
      if (__DEV__) {
        console.info(`[HadithChat Mobile] Blocked message (${safetyResult.category})`) // __DEV__
      }
      return Response.json({ response: safetyResult.blockedResponse })
    }

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      maxTokens: 1024,
      temperature: 0.7,
    })

    return Response.json({ response: text })
  } catch (error) {
    if (__DEV__) {
      console.error('Error in mobile-chat API:', error) // __DEV__
    }
    return Response.json(
      {
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
