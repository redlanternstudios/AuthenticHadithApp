import { anthropic } from "@ai-sdk/anthropic"
import { groq } from "@ai-sdk/groq"
import type { LanguageModel } from "ai"

/**
 * Single source of truth for the hadith assistant's model, shared by the web
 * chat (app/api/chat) and the native app's chat (app/api/mobile-chat).
 *
 * Configurable by env so cost-at-scale can be tuned WITHOUT code changes:
 *   ASSISTANT_AI_PROVIDER = "groq" | "anthropic" | "openai"   (default: "groq")
 *   ASSISTANT_AI_MODEL    = provider-specific model id (optional override)
 *
 * Required key per provider:
 *   groq      → GROQ_API_KEY
 *   anthropic → ANTHROPIC_API_KEY
 *   openai    → routed through the Vercel AI Gateway (AI_GATEWAY_API_KEY / OIDC),
 *               same path the rest of the app already uses.
 *
 * TRUTH NOTE: hallucinated citations (UAT BUG 11) are prevented by the STRICT
 * pre-retrieval grounding in hadith-grounding.ts — the model only ever sees
 * hadiths we retrieved from the DB and is told to cite nothing else. That
 * safeguard holds across providers, which is why a cheaper model is viable.
 * Stronger instruction-followers (Claude) adhere to the grounding more
 * reliably; if you see the assistant drifting off the retrieved set at scale,
 * set ASSISTANT_AI_PROVIDER=anthropic. Verify adherence before scaling a new
 * provider — this is a hadith-authenticity product; truth before cost.
 */

const DEFAULT_MODEL: Record<string, string> = {
  groq: "llama-3.3-70b-versatile",
  anthropic: "claude-opus-4-8",
  openai: "openai/gpt-4o-mini",
}

export function getAssistantModel(): LanguageModel {
  const provider = (process.env.ASSISTANT_AI_PROVIDER || "groq").toLowerCase()
  const modelId = process.env.ASSISTANT_AI_MODEL

  switch (provider) {
    case "anthropic":
      return anthropic(modelId || DEFAULT_MODEL.anthropic)
    case "openai":
      // Plain "provider/model" string → resolved by the Vercel AI Gateway,
      // exactly as the other routes (enrich/quiz/summarize) already do.
      return (modelId || DEFAULT_MODEL.openai) as LanguageModel
    case "groq":
    default:
      return groq(modelId || DEFAULT_MODEL.groq)
  }
}

/** Human-readable label of the active provider/model, for logs/debug. */
export function activeAssistantModelLabel(): string {
  const provider = (process.env.ASSISTANT_AI_PROVIDER || "groq").toLowerCase()
  const modelId = process.env.ASSISTANT_AI_MODEL || DEFAULT_MODEL[provider] || DEFAULT_MODEL.groq
  return `${provider}:${modelId}`
}
