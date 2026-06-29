"use client"

import { Shield, Bot, BookOpen, Users, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

const SAFETY_POINTS = [
  {
    icon: Bot,
    title: "AI assistant filters inappropriate queries",
    description: "Our AI assistant is trained to provide only authentic Islamic knowledge from verified sources.",
  },
  {
    icon: BookOpen,
    title: "Scholarly sources only",
    description: "All hadiths are sourced from authenticated collections by recognized Islamic scholars.",
  },
  {
    icon: Users,
    title: "Respectful community standards",
    description: "We maintain a respectful environment for learning and spiritual growth.",
  },
]

interface StepSafetyProps {
  data: {
    safetyAgreed: boolean
    termsAgreed: boolean
  }
  onUpdate: (data: Partial<StepSafetyProps["data"]>) => void
}

export function StepSafety({ data, onUpdate }: StepSafetyProps) {
  return (
    <div className="space-y-8">
      {/* Shield Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full gold-icon-bg flex items-center justify-center">
          <Shield className="w-8 h-8 text-[#C5A059]" />
        </div>
      </div>

      {/* Heading */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Safety & Community Guidelines</h2>
        <p className="text-muted-foreground">
          Authentic Hadith maintains the highest standards of Islamic scholarship and community respect.
        </p>
      </div>

      {/* Safety Points */}
      <div className="space-y-4">
        {SAFETY_POINTS.map((point, index) => (
          <div key={index} className="flex gap-4 p-4 rounded-lg bg-muted border border-border">
            <div className="w-10 h-10 rounded-full bg-card flex-shrink-0 flex items-center justify-center border border-[#C5A059]/30">
              <point.icon className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">{point.title}</h3>
              <p className="text-sm text-muted-foreground">{point.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Agreement Checkboxes */}
      <div className="space-y-4 pt-4 border-t border-border">
        {/* Safety Guidelines Agreement */}
        <button
          type="button"
          onClick={() => onUpdate({ safetyAgreed: !data.safetyAgreed })}
          className="flex items-start gap-3 w-full text-left group"
        >
          <div
            className={cn(
              "w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5 transition-all",
              data.safetyAgreed ? "gold-checkbox" : "border-2 border-[#d4d4d8] group-hover:border-[#C5A059]",
            )}
          >
            {data.safetyAgreed && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-[15px] text-foreground">I understand and agree to the safety guidelines</span>
        </button>

        {/* Terms Agreement */}
        <button
          type="button"
          onClick={() => onUpdate({ termsAgreed: !data.termsAgreed })}
          className="flex items-start gap-3 w-full text-left group"
        >
          <div
            className={cn(
              "w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5 transition-all",
              data.termsAgreed ? "gold-checkbox" : "border-2 border-[#d4d4d8] group-hover:border-[#C5A059]",
            )}
          >
            {data.termsAgreed && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-[15px] text-foreground">
            I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[#C5A059] hover:underline inline-flex items-center gap-1"
            >
              Terms of Service
              <ExternalLink className="w-3 h-3" />
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[#C5A059] hover:underline inline-flex items-center gap-1"
            >
              Privacy Policy
              <ExternalLink className="w-3 h-3" />
            </a>
          </span>
        </button>
      </div>
    </div>
  )
}
