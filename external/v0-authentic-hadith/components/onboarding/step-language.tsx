"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const LANGUAGES = [
  { 
    id: "english", 
    label: "English", 
    sublabel: "Primary language",
    icon: "EN",
    description: "Hadith text displayed in English first"
  },
  { 
    id: "arabic", 
    label: "العربية", 
    sublabel: "Arabic first",
    icon: "ع",
    description: "Hadith text displayed in Arabic first"
  },
  { 
    id: "both", 
    label: "Both", 
    sublabel: "Side by side",
    icon: "EN/ع",
    description: "View Arabic and English together"
  },
]

interface StepLanguageProps {
  language: string
  onUpdate: (language: string) => void
}

export function StepLanguage({ language, onUpdate }: StepLanguageProps) {
  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Choose your language</h2>
        <p className="text-muted-foreground">Select how you prefer to read hadith texts</p>
      </div>

      {/* Language Options */}
      <div className="space-y-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            type="button"
            onClick={() => onUpdate(lang.id)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
              "hover:-translate-y-0.5 text-left",
              language === lang.id
                ? "border-[#C5A059] bg-muted"
                : "border-border bg-card hover:border-[#d4d4d8]",
            )}
          >
            {/* Icon */}
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold",
              language === lang.id
                ? "bg-[#C5A059] text-white"
                : "bg-muted text-muted-foreground"
            )}>
              {lang.icon}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground">{lang.label}</span>
                <span className="text-xs text-muted-foreground">({lang.sublabel})</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{lang.description}</p>
            </div>

            {/* Check indicator */}
            {language === lang.id && (
              <div className="w-6 h-6 rounded-full gold-checkbox flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Info note */}
      <p className="text-xs text-muted-foreground text-center">
        You can change this anytime in Settings
      </p>
    </div>
  )
}
