"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"

interface SuccessAnimationProps {
  onComplete: () => void
}

export function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(true)
    const timer = setTimeout(() => {
      onComplete()
    }, 1500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div
        className={`flex flex-col items-center gap-4 transition-all duration-500 ${
          show ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        <div className="w-24 h-24 rounded-full gold-success-icon flex items-center justify-center">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold gold-text text-center">Welcome to Authentic Hadith!</h2>
        <p className="text-muted-foreground text-center">Your journey begins now</p>
      </div>
    </div>
  )
}
