import Constants from 'expo-constants'
import { API_CONFIG } from '@/lib/supabase/client'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

/**
 * Send a chat message to the AI assistant
 * This calls the web app's mobile-chat API endpoint
 */
export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(`${API_CONFIG.baseUrl}/api/mobile-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error || `Failed to get AI response: ${response.status} ${response.statusText}`
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return data.response
}
