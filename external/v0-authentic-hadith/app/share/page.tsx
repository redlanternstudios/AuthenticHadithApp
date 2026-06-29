"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ChevronLeft, Download, Share2, Palette, Type, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Hadith {
  id: string
  arabic_text: string
  english_translation: string
  collection: string
  reference: string
  grade: string
  narrator: string
}

const THEMES = [
  {
    id: "gold",
    label: "Gold",
    bg: "linear-gradient(135deg, #1a1f36 0%, #2c2416 100%)",
    text: "#f8f6f2",
    accent: "#C5A059",
    arabic: "#E8C77D",
    border: "#C5A059",
  },
  {
    id: "emerald",
    label: "Emerald",
    bg: "linear-gradient(135deg, #0a2a1f 0%, #1B5E43 100%)",
    text: "#f8f6f2",
    accent: "#4a9973",
    arabic: "#E8C77D",
    border: "#2D7A5B",
  },
  {
    id: "marble",
    label: "Marble",
    bg: "linear-gradient(135deg, #F8F6F2 0%, #ebe7e0 100%)",
    text: "#1a1f36",
    accent: "#C5A059",
    arabic: "#1a1f36",
    border: "#d4cfc7",
  },
  {
    id: "midnight",
    label: "Midnight",
    bg: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    text: "#e2e8f0",
    accent: "#C5A059",
    arabic: "#E8C77D",
    border: "#334155",
  },
]

const SIZES = [
  { id: "square", label: "Square", width: 600, height: 600 },
  { id: "story", label: "Story", width: 540, height: 960 },
  { id: "wide", label: "Wide", width: 800, height: 450 },
]

export default function SharePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hadith, setHadith] = useState<Hadith | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTheme, setActiveTheme] = useState(THEMES[0])
  const [activeSize, setActiveSize] = useState(SIZES[0])
  const [showArabic, setShowArabic] = useState(true)
  const [generating, setGenerating] = useState(false)

  const hadithId = searchParams.get("hadith")

  useEffect(() => {
    if (!hadithId) {
      setLoading(false)
      return
    }
    const fetch = async () => {
      const { data } = await supabase.from("hadiths").select("*").eq("id", hadithId).single()
      if (data) setHadith(data)
      setLoading(false)
    }
    fetch()
  }, [hadithId, supabase])

  const drawCard = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hadith) return

    const { width, height } = activeSize
    canvas.width = width * 2
    canvas.height = height * 2
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(2, 2)

    // Background
    const grad = ctx.createLinearGradient(0, 0, width, height)
    if (activeTheme.id === "gold") {
      grad.addColorStop(0, "#1a1f36")
      grad.addColorStop(1, "#2c2416")
    } else if (activeTheme.id === "emerald") {
      grad.addColorStop(0, "#0a2a1f")
      grad.addColorStop(1, "#1B5E43")
    } else if (activeTheme.id === "marble") {
      grad.addColorStop(0, "#F8F6F2")
      grad.addColorStop(1, "#ebe7e0")
    } else {
      grad.addColorStop(0, "#0f172a")
      grad.addColorStop(1, "#1e293b")
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    // Decorative border
    const borderPad = 16
    ctx.strokeStyle = activeTheme.border
    ctx.lineWidth = 1.5
    ctx.strokeRect(borderPad, borderPad, width - borderPad * 2, height - borderPad * 2)

    // Inner border with accent
    ctx.strokeStyle = `${activeTheme.accent}40`
    ctx.lineWidth = 0.5
    ctx.strokeRect(borderPad + 6, borderPad + 6, width - (borderPad + 6) * 2, height - (borderPad + 6) * 2)

    // Corner ornaments
    const cornerSize = 20
    ctx.strokeStyle = activeTheme.accent
    ctx.lineWidth = 2
    const corners = [
      [borderPad, borderPad],
      [width - borderPad, borderPad],
      [borderPad, height - borderPad],
      [width - borderPad, height - borderPad],
    ]
    for (const [cx, cy] of corners) {
      const dx = cx === borderPad ? 1 : -1
      const dy = cy === borderPad ? 1 : -1
      ctx.beginPath()
      ctx.moveTo(cx, cy + dy * cornerSize)
      ctx.lineTo(cx, cy)
      ctx.lineTo(cx + dx * cornerSize, cy)
      ctx.stroke()
    }

    const pad = 40
    let yPos = pad + 20

    // Bismillah
    ctx.font = "16px serif"
    ctx.fillStyle = activeTheme.accent
    ctx.textAlign = "center"
    ctx.fillText("- - -", width / 2, yPos)
    yPos += 30

    // Arabic text
    if (showArabic && hadith.arabic_text) {
      ctx.font = `22px serif`
      ctx.fillStyle = activeTheme.arabic
      ctx.textAlign = "right"
      const arabicLines = wrapText(ctx, hadith.arabic_text, width - pad * 2, 22)
      const maxArabicLines = activeSize.id === "story" ? 6 : 3
      const arabicSlice = arabicLines.slice(0, maxArabicLines)
      for (const line of arabicSlice) {
        ctx.fillText(line, width - pad, yPos)
        yPos += 32
      }
      if (arabicLines.length > maxArabicLines) {
        ctx.fillText("...", width - pad, yPos)
        yPos += 32
      }
      yPos += 10

      // Gold divider
      ctx.strokeStyle = activeTheme.accent
      ctx.lineWidth = 1
      ctx.beginPath()
      const dividerWidth = 80
      ctx.moveTo(width / 2 - dividerWidth / 2, yPos)
      ctx.lineTo(width / 2 + dividerWidth / 2, yPos)
      ctx.stroke()
      yPos += 20
    }

    // English translation
    ctx.font = `15px sans-serif`
    ctx.fillStyle = activeTheme.text
    ctx.textAlign = "left"
    const engLines = wrapText(ctx, hadith.english_translation, width - pad * 2, 15)
    const maxEngLines = activeSize.id === "story" ? 12 : showArabic ? 4 : 8
    const engSlice = engLines.slice(0, maxEngLines)
    for (const line of engSlice) {
      ctx.fillText(line, pad, yPos)
      yPos += 22
    }
    if (engLines.length > maxEngLines) {
      ctx.fillText("...", pad, yPos)
      yPos += 22
    }

    // Footer
    const footerY = height - pad
    ctx.font = "11px sans-serif"
    ctx.fillStyle = `${activeTheme.text}99`
    ctx.textAlign = "left"
    ctx.fillText(`${hadith.collection} | ${hadith.reference}`, pad, footerY)
    ctx.textAlign = "right"
    ctx.fillText("authentichadith.app", width - pad, footerY)

    // Grade badge
    ctx.font = "bold 10px sans-serif"
    ctx.textAlign = "left"
    const gradeText = hadith.grade.charAt(0).toUpperCase() + hadith.grade.slice(1)
    const gradeWidth = ctx.measureText(gradeText).width + 16
    const badgeX = pad
    const badgeY = footerY - 28
    ctx.fillStyle = `${activeTheme.accent}30`
    roundRect(ctx, badgeX, badgeY - 10, gradeWidth, 18, 4)
    ctx.fill()
    ctx.fillStyle = activeTheme.accent
    ctx.fillText(gradeText, badgeX + 8, badgeY + 2)
  }, [hadith, activeTheme, activeSize, showArabic])

  useEffect(() => {
    drawCard()
  }, [drawCard])

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(" ")
    const lines: string[] = []
    let current = ""
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      if (ctx.measureText(test).width > maxWidth) {
        if (current) lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
    return lines
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  const handleDownload = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setGenerating(true)
    try {
      const link = document.createElement("a")
      link.download = `hadith-${hadith?.reference?.replace(/\s/g, "-") || "card"}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } finally {
      setGenerating(false)
    }
  }

  const handleShare = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setGenerating(true)
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
      if (blob && navigator.share) {
        const file = new File([blob], "hadith-card.png", { type: "image/png" })
        await navigator.share({
          title: "Hadith Card",
          text: hadith?.english_translation?.substring(0, 100) + "...",
          files: [file],
        })
      } else {
        handleDownload()
      }
    } catch {
      handleDownload()
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hadith) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center px-4">
        <div className="text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground mb-4">No hadith selected for sharing</p>
          <button onClick={() => router.push("/saved")} className="gold-button px-6 py-2 rounded-lg">
            Go to Saved
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Create Sharing Card</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border hover:border-[#C5A059] transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={handleShare}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium gold-button disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Preview */}
          <div className="flex-1 flex items-center justify-center">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <canvas
                ref={canvasRef}
                style={{
                  width: `${Math.min(activeSize.width, 400)}px`,
                  height: `${Math.min(activeSize.height, (400 / activeSize.width) * activeSize.height)}px`,
                }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="lg:w-[280px] space-y-5">
            {/* Theme Picker */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <Palette className="w-4 h-4 text-[#C5A059]" />
                Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setActiveTheme(theme)}
                    className={cn(
                      "h-16 rounded-lg border-2 transition-all relative overflow-hidden",
                      activeTheme.id === theme.id ? "border-[#C5A059] ring-2 ring-[#C5A059]/30" : "border-border",
                    )}
                    style={{ background: theme.bg }}
                  >
                    <span
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ color: theme.text, backgroundColor: `${theme.accent}30` }}
                    >
                      {theme.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Picker */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                Size
              </label>
              <div className="flex gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setActiveSize(size)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                      activeSize.id === size.id
                        ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-[#2c2416] border-transparent"
                        : "border-border text-muted-foreground hover:border-[#C5A059]",
                    )}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Arabic */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <Type className="w-4 h-4 text-[#C5A059]" />
                Options
              </label>
              <button
                onClick={() => setShowArabic(!showArabic)}
                className={cn(
                  "w-full px-4 py-3 rounded-lg text-sm font-medium border transition-all text-left",
                  showArabic
                    ? "border-[#C5A059] bg-[#C5A059]/5 text-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {showArabic ? "Arabic text shown" : "Arabic text hidden"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
