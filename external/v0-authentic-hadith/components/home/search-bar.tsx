"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchSuggestion {
  id: string
  title: string
  collection: string
}

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Mock suggestions - in real app, fetch from API
  useEffect(() => {
    if (query.length > 1) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setSuggestions([
          { id: "1", title: `Hadith about ${query}...`, collection: "Sahih Bukhari" },
          { id: "2", title: `${query} in Islamic teachings`, collection: "Sahih Muslim" },
        ])
      }, 200)
    } else {
      setSuggestions([])
    }
    return () => clearTimeout(timeoutRef.current)
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    router.push(`/hadith/${suggestion.id}`)
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "flex items-center gap-3 px-5 py-3 rounded-full bg-background border transition-all",
            isFocused ? "border-[#C5A059] border-2 w-[400px] lg:w-[600px]" : "border-border w-[300px] lg:w-[400px]",
          )}
        >
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search hadiths..."
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isFocused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50 max-h-[300px] overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fef3c7] transition-colors text-left"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-foreground">{suggestion.title}</p>
                <p className="text-xs text-muted-foreground">{suggestion.collection}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
