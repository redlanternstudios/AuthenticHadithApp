"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ExternalLink, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

type ExportStatus = "idle" | "loading" | "success" | "error"

export default function NotionSettingsPage() {
  const router = useRouter()
  const [notionToken, setNotionToken] = useState("")
  const [pageId, setPageId] = useState("")
  const [status, setStatus] = useState<ExportStatus>("idle")
  const [message, setMessage] = useState("")
  const [exportUrl, setExportUrl] = useState("")
  const [exportCount, setExportCount] = useState(0)

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setMessage("")
    setExportUrl("")

    try {
      const response = await fetch("/api/notion/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notionToken: notionToken.trim(), pageId: pageId.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus("error")
        setMessage(data.error || "Export failed. Please try again.")
        return
      }

      setStatus("success")
      setExportUrl(data.url)
      setExportCount(data.count)
      setMessage(`Successfully exported ${data.count} of ${data.total} saved hadiths to Notion!`)
    } catch {
      setStatus("error")
      setMessage("Network error. Please check your connection and try again.")
    }
  }

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-[#F8F6F2]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#F8F6F2] border border-[#e5e7eb] flex items-center justify-center hover:border-[#C5A059] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#6b7280]" />
          </button>
          <h1 className="text-lg font-semibold text-[#1a1f36]">Connect to Notion</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Intro card */}
        <div className="gold-border rounded-xl p-5 premium-card">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg gold-icon-bg flex items-center justify-center shrink-0 mt-0.5">
              {/* Notion-style icon */}
              <svg className="w-5 h-5 text-[#C5A059]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-[#1a1f36] mb-1">Export Saved Hadiths to Notion</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Export all your saved hadiths into a Notion database. Each hadith is added as a page
                with its collection, grade, narrator, and full text.
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="gold-border rounded-xl p-5 premium-card space-y-3">
          <h3 className="font-semibold text-[#1a1f36] text-sm">Setup Instructions</h3>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>
              Go to{" "}
              <a
                href="https://www.notion.so/my-integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C5A059] hover:underline inline-flex items-center gap-1"
              >
                notion.so/my-integrations
                <ExternalLink className="w-3 h-3" />
              </a>{" "}
              and create a new integration. Copy the <strong>Internal Integration Token</strong>.
            </li>
            <li>
              Open (or create) the Notion page where you want the hadith database to appear.
            </li>
            <li>
              Click <strong>⋯</strong> → <strong>Add connections</strong> → select your integration.
            </li>
            <li>Copy the page link from your browser and paste it below.</li>
          </ol>
        </div>

        {/* Export form */}
        <form onSubmit={handleExport} className="gold-border rounded-xl p-5 premium-card space-y-4">
          <div>
            <label htmlFor="notion-token" className="block text-sm font-medium text-[#1a1f36] mb-1.5">
              Notion Integration Token
            </label>
            <input
              id="notion-token"
              type="password"
              value={notionToken}
              onChange={(e) => setNotionToken(e.target.value)}
              placeholder="secret_xxxxxxxxxxxxxxxxxx"
              required
              className="w-full h-10 px-3 rounded-lg border border-[#e5e7eb] bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/30 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="page-id" className="block text-sm font-medium text-[#1a1f36] mb-1.5">
              Notion Page URL or ID
            </label>
            <input
              id="page-id"
              type="text"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              placeholder="https://www.notion.so/My-Page-abc123..."
              required
              className="w-full h-10 px-3 rounded-lg border border-[#e5e7eb] bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/30 transition-colors"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Paste the full Notion page URL or just the 32-character page ID.
            </p>
          </div>

          <button
            type="submit"
            disabled={status === "loading" || !notionToken.trim() || !pageId.trim()}
            className="w-full h-11 rounded-lg gold-button font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting…
              </>
            ) : (
              "Export to Notion"
            )}
          </button>
        </form>

        {/* Status messages */}
        {status === "success" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800">{message}</p>
              {exportUrl && (
                <a
                  href={exportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:underline"
                >
                  Open in Notion
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{message}</p>
          </div>
        )}
      </main>
    </div>
  )
}
