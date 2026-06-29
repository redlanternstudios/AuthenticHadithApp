"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { parseEnglishTranslation } from "@/lib/hadith-utils"

interface HadithRef {
  id: string
  arabic_text: string
  english_translation: string
  collection: string
  reference: string
  grade: string
}

interface LessonContentProps {
  markdown: string
  hadiths?: HadithRef[]
}

const gradeColors: Record<string, string> = {
  sahih: "bg-[#10b981]",
  hasan: "bg-[#3b82f6]",
  daif: "bg-[#6b7280]",
}

export function LessonContent({ markdown, hadiths = [] }: LessonContentProps) {
  const router = useRouter()

  // Simple markdown-to-JSX renderer
  const renderMarkdown = (md: string) => {
    const lines = md.split("\n")
    const elements: React.ReactNode[] = []
    let i = 0
    let listItems: string[] = []
    let listType: "ol" | "ul" | null = null
    let tableRows: string[][] = []
    let inTable = false

    const flushList = () => {
      if (listItems.length > 0 && listType) {
        const Tag = listType
        elements.push(
          <Tag key={`list-${elements.length}`} className={cn(
            "my-3 space-y-1.5",
            listType === "ol" ? "list-decimal list-inside" : "list-disc list-inside"
          )}>
            {listItems.map((item, idx) => (
              <li key={idx} className="text-sm leading-relaxed text-foreground/80">
                <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
              </li>
            ))}
          </Tag>
        )
        listItems = []
        listType = null
      }
    }

    const flushTable = () => {
      if (tableRows.length > 1) {
        const header = tableRows[0]
        const body = tableRows.slice(1).filter(r => !r.every(c => /^[-|:]+$/.test(c.trim())))
        elements.push(
          <div key={`table-${elements.length}`} className="my-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {header.map((cell, idx) => (
                    <th key={idx} className="px-3 py-2 text-left text-xs font-semibold text-foreground">
                      {cell.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, rIdx) => (
                  <tr key={rIdx} className="border-t border-border">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-xs text-foreground/80">
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      tableRows = []
      inTable = false
    }

    const formatInline = (text: string): string => {
      return text
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
        .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-xs font-mono">$1</code>')
    }

    while (i < lines.length) {
      const line = lines[i]

      // Table row
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        flushList()
        inTable = true
        const cells = line.split("|").filter(Boolean)
        tableRows.push(cells)
        i++
        continue
      } else if (inTable) {
        flushTable()
      }

      // Heading
      if (line.startsWith("# ")) {
        flushList()
        elements.push(
          <h1 key={i} className="text-xl font-bold text-foreground mt-6 mb-3" style={{ fontFamily: "Cinzel, serif" }}>
            {line.slice(2)}
          </h1>
        )
        i++
        continue
      }
      if (line.startsWith("## ")) {
        flushList()
        elements.push(
          <h2 key={i} className="text-lg font-bold text-foreground mt-5 mb-2" style={{ fontFamily: "Cinzel, serif" }}>
            {line.slice(3)}
          </h2>
        )
        i++
        continue
      }
      if (line.startsWith("### ")) {
        flushList()
        elements.push(
          <h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-2">
            {line.slice(4)}
          </h3>
        )
        i++
        continue
      }

      // Blockquote
      if (line.startsWith("> ")) {
        flushList()
        elements.push(
          <blockquote
            key={i}
            className="my-3 pl-4 border-l-4 border-[#C5A059]/40 bg-[#C5A059]/5 rounded-r-lg py-2 pr-3"
          >
            <p
              className="text-sm italic leading-relaxed text-foreground/80"
              dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }}
            />
          </blockquote>
        )
        i++
        continue
      }

      // Ordered list
      if (/^\d+\.\s/.test(line)) {
        if (listType !== "ol") {
          flushList()
          listType = "ol"
        }
        listItems.push(line.replace(/^\d+\.\s/, ""))
        i++
        continue
      }

      // Unordered list
      if (line.startsWith("- ") || line.startsWith("* ")) {
        if (listType !== "ul") {
          flushList()
          listType = "ul"
        }
        listItems.push(line.slice(2))
        i++
        continue
      }

      // Empty line
      if (line.trim() === "") {
        flushList()
        i++
        continue
      }

      // Regular paragraph
      flushList()
      elements.push(
        <p
          key={i}
          className="text-sm leading-relaxed text-foreground/80 my-2"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      )
      i++
    }

    flushList()
    if (inTable) flushTable()

    return elements
  }

  return (
    <article className="premium-card rounded-xl p-5 sm:p-6">
      {/* Rendered Markdown */}
      <div className="lesson-content">
        {renderMarkdown(markdown)}
      </div>

      {/* Referenced Hadiths */}
      {hadiths.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-[#C5A059] mb-4 uppercase tracking-wider">
            Referenced Hadiths
          </h3>
          <div className="flex flex-col gap-3">
            {hadiths.map((hadith) => {
              const { narrator, text } = parseEnglishTranslation(hadith.english_translation)
              return (
                <button
                  key={hadith.id}
                  onClick={() => router.push(`/hadith/${hadith.id}`)}
                  className="text-left p-4 rounded-xl border border-border hover:border-[#C5A059]/40 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {hadith.reference}
                    </span>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      gradeColors[hadith.grade] || "bg-muted"
                    )} />
                  </div>
                  {narrator && (
                    <p className="text-xs text-muted-foreground italic mb-1">
                      Narrated by {narrator}
                    </p>
                  )}
                  <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed">
                    {text}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </article>
  )
}
