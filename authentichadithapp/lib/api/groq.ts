import { API_CONFIG } from '@/lib/supabase/client'
import { checkInputSafety } from '@/lib/islamic-safety-filter'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// User-facing error string. Raw server/network errors must never reach the
// chat UI — they can leak token/model/url details and confuse users. The
// caller surfaces this exact text in the red banner.
export const AI_REQUEST_FAILED = 'Could not generate a response. Please try again.'

// Hard ceiling on a single chat request. Vercel cold start + Groq inference
// fits comfortably under 5s; 12s is generous enough for a slow tower while
// guaranteeing the UI never spins forever (see FIX-043).
const REQUEST_TIMEOUT_MS = 12_000

/**
 * Send a chat message to the AI assistant. Runs the Islamic safety filter
 * client-side before any network call so the assistant has a guardrail even
 * when the backend route is down or the server-side filter regresses.
 */
export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const safety = checkInputSafety(
    messages.map(m => ({ role: m.role, content: m.content })),
  )
  if (!safety.allowed && safety.blockedResponse) {
    return safety.blockedResponse
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const primaryUrl = `${API_CONFIG.baseUrl}/api/mobile-chat`
  const fallbackUrl = 'https://v0-authentic-hadith-git-ctp-authentic-ab795c-redlantern-studios.vercel.app/api/mobile-chat'

  const targetUrls = [primaryUrl]
  if (primaryUrl !== fallbackUrl) {
    targetUrls.push(fallbackUrl)
  }

  let lastError: unknown = null

  try {
    for (const url of targetUrls) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: controller.signal,
        })

        if (response.ok) {
          const data = await response.json().catch(() => null)
          if (data && typeof data.response === 'string') {
            return data.response
          }
        } else {
          if (__DEV__) {
            const errorData = await response.clone().json().catch(() => ({}))
            console.warn(`[groq] Endpoint ${url} returned status ${response.status}:`, errorData)
          }
        }
      } catch (err) {
        lastError = err
        if (__DEV__) {
          console.warn(`[groq] Failed to reach ${url}:`, err)
        }
      }
    }
  } finally {
    clearTimeout(timeoutId)
  }

  if (__DEV__) {
    console.error('[groq] All chat endpoints failed', lastError)
  }
  throw new Error(AI_REQUEST_FAILED)
}
