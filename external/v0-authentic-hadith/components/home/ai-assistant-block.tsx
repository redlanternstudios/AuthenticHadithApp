"use client"

import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"

const promptChips = [
  { label: "Explain this hadith", prompt: "explain" },
  { label: "Find hadiths about", prompt: "find" },
  { label: "What is the chain of narration?", prompt: "chain" },
]

export function AIAssistantBlock() {
  const router = useRouter()

  const handleChipClick = (prompt: string) => {
    router.push(`/assistant?prompt=${encodeURIComponent(prompt)}`)
  }

  return (
    <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-[#1B5E43] to-[#2D7A5B] text-white">
      <div className="text-center">
        <Sparkles className="w-8 h-8 text-[#E8C77D] mx-auto mb-4" />
        <h3 className="text-xl sm:text-2xl font-bold mb-6">Have a question about hadith?</h3>
        <button
          onClick={() => router.push("/assistant")}
          className="w-full sm:w-auto px-8 py-4 bg-card text-[#1B5E43] rounded-xl font-semibold hover:scale-[1.02] hover:shadow-lg transition-all"
        >
          Ask the AI Assistant
        </button>
        <div className="mt-6">
          <p className="text-sm text-white/70 mb-3">Quick prompts:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {promptChips.map((chip) => (
              <button
                key={chip.prompt}
                onClick={() => handleChipClick(chip.prompt)}
                className="px-4 py-2 rounded-full bg-white/20 text-sm text-white hover:bg-white/30 transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
