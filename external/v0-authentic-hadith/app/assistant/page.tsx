"use client"

import React, { Suspense, useRef, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Bot, ChevronLeft, Send, Sparkles, Loader2, Crown, AlertCircle } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useSubscription } from "@/hooks/use-subscription"
import { useQuota } from "@/hooks/use-quota"
import { UsageBanner } from "@/components/usage-banner"
import { isNativeApp, showNativePaywall } from "@/lib/native-bridge"

const promptTemplates = [
  { label: "Explain the hadith about intentions", icon: "📖" },
  { label: "Find hadiths about prayer", icon: "🤲" },
  { label: "What makes a hadith authentic?", icon: "🔗" },
  { label: "Who is Prophet Mohammed?", icon: "⚖️" },
]

function getMessageText(msg: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ""
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("")
}

function AssistantContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPrompt = searchParams.get("prompt") || ""
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState(initialPrompt)
  const [quotaExceeded, setQuotaExceeded] = useState(false)
  const { isPremium } = useSubscription()
  const { quota, refresh: refreshQuota } = useQuota()

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (err) => {
      // Detect quota exceeded from the API 429 response
      if (err.message?.includes("quota_exceeded") || err.message?.includes("limit reached")) {
        setQuotaExceeded(true)
      }
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleTemplateClick = (template: string) => {
    setInput(template)
  }

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage({ text: input })
      setInput("")
      // Refresh quota after a short delay so the counter updates
      setTimeout(() => refreshQuota(), 3000)
    }
  }

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B5E43] to-[#2D7A5B] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">HadithChat</h1>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-6 w-full overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1B5E43] to-[#2D7A5B] flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-[#E8C77D]" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2 text-balance">How can I help you today?</h2>
            <p className="text-muted-foreground mb-2">
              Ask me anything about hadiths, their meanings, or Islamic teachings.
            </p>
            <p className="text-xs text-muted-foreground/70 mb-8">
              I only answer using authenticated hadith. If none are found, I will say so.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
              {promptTemplates.map((template, i) => (
                <button
                  key={i}
                  onClick={() => handleTemplateClick(template.label)}
                  className="gold-border rounded-xl p-4 premium-card text-left hover:-translate-y-0.5 transition-transform"
                >
                  <span className="text-xl mb-2 block">{template.icon}</span>
                  <span className="text-sm text-foreground">{template.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const text = getMessageText(msg)
              const hasToolCalls = msg.parts?.some((p) => p.type === "tool-invocation")

              // Skip rendering empty assistant messages while streaming (tool calls in progress)
              if (!text && msg.role === "assistant") {
                // Show a "searching" indicator if the assistant is calling tools
                if (hasToolCalls && isLoading) {
                  return (
                    <div key={msg.id} className="flex justify-start">
                      <div className="gold-border premium-card rounded-2xl px-4 py-3 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                        <span className="text-sm text-muted-foreground">Searching hadiths...</span>
                      </div>
                    </div>
                  )
                }
                // If no text and not loading, skip rendering
                if (!text) return null
              }

              return (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-[#1B5E43] to-[#2D7A5B] text-white"
                        : "gold-border premium-card text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
                  </div>
                </div>
              )
            })}
            {isLoading && (!messages.length || messages[messages.length - 1]?.role === "user") && (
              <div className="flex justify-start">
                <div className="gold-border premium-card rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            {quotaExceeded && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-[#C5A059]/10 border border-[#C5A059]/30 max-w-[85%]">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#C5A059] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Daily limit reached</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Explorer accounts include 3 AI explanations per day.
                        Upgrade to Pro for unlimited access.
                      </p>
                      <button
                        onClick={async () => {
                          if (isNativeApp()) {
                            const success = await showNativePaywall()
                            if (success) window.location.reload()
                          } else {
                            router.push("/pricing")
                          }
                        }}
                        className="mt-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Crown className="w-3 h-3" />
                        View Pro Plans
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {error && !quotaExceeded && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-red-50 border border-red-200 text-red-700 max-w-[85%] dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
                  <p className="text-sm">Something went wrong. Please try again.</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input */}
      <div className="sticky bottom-20 md:bottom-0 bg-card border-t border-border p-4">
        {/* AI Usage counter for free users */}
        {quota && !quota.isPremium && (
          <div className="max-w-3xl mx-auto mb-3">
            <UsageBanner
              used={quota.usage.aiToday}
              limit={quota.usage.aiDailyLimit}
              label="Daily AI explanations"
            />
          </div>
        )}
        <form onSubmit={onFormSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={quotaExceeded ? "Daily limit reached -- upgrade for unlimited" : "Ask about hadiths..."}
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 outline-none transition-all text-foreground disabled:opacity-60"
            disabled={isLoading || quotaExceeded}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || quotaExceeded}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1B5E43] to-[#2D7A5B] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
            aria-label="Send message"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
        {!isPremium && !quotaExceeded && (
          <p className="max-w-3xl mx-auto text-center text-[10px] text-muted-foreground/60 mt-1.5">
            Explorer: 3 AI explanations per day.{" "}
            <button onClick={() => router.push("/pricing")} className="text-[#C5A059] hover:underline">Upgrade to Pro</button>{" "}
            for unlimited.
          </p>
        )}
      </div>
    </div>
  )
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen marble-bg flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AssistantContent />
    </Suspense>
  )
}
