import { ImageResponse } from "next/og"
import { createClient } from "@supabase/supabase-js"

export const runtime = "edge"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug")
  const snippetId = searchParams.get("snippet")

  if (!slug) {
    return new Response("Missing slug", { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nqklipakrfuwebkdnhwg.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xa2xpcGFrcmZ1d2Via2RuaHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyODA3NDUsImV4cCI6MjA4Mzg1Njc0NX0.yhIe3hqiLlyF8atvSmNOL3HBq91V9Frw5jYcat-sZxY",
  )

  const { data: sahabi } = await supabase
    .from("sahaba")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!sahabi) {
    return new Response("Story not found", { status: 404 })
  }

  // If a specific snippet is requested, fetch it
  let snippet: { text_en: string; attribution_en: string | null; source_reference: string | null } | null = null
  if (snippetId) {
    const { data } = await supabase
      .from("shareable_snippets")
      .select("text_en, attribution_en, source_reference")
      .eq("id", snippetId)
      .single()
    snippet = data
  }

  const themeColor = sahabi.theme_primary || "#1B5E43"
  const nameAr = sahabi.name_ar || ""
  const titleEn = sahabi.title_en || ""
  const notableFor = (sahabi.notable_for || []).slice(0, 3)

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 50%, ${themeColor}bb 100%)`,
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Gold border */}
        <div
          style={{
            position: "absolute",
            inset: "12px",
            border: "2px solid rgba(197, 160, 89, 0.4)",
            borderRadius: "16px",
            display: "flex",
          }}
        />

        {/* Corner decorations */}
        <div style={{ position: "absolute", top: "24px", left: "24px", width: "40px", height: "40px", borderTop: "3px solid #C5A059", borderLeft: "3px solid #C5A059", display: "flex" }} />
        <div style={{ position: "absolute", top: "24px", right: "24px", width: "40px", height: "40px", borderTop: "3px solid #C5A059", borderRight: "3px solid #C5A059", display: "flex" }} />
        <div style={{ position: "absolute", bottom: "24px", left: "24px", width: "40px", height: "40px", borderBottom: "3px solid #C5A059", borderLeft: "3px solid #C5A059", display: "flex" }} />
        <div style={{ position: "absolute", bottom: "24px", right: "24px", width: "40px", height: "40px", borderBottom: "3px solid #C5A059", borderRight: "3px solid #C5A059", display: "flex" }} />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "56px 64px",
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          {/* Top: Label + Arabic name */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 20px",
                background: "rgba(197, 160, 89, 0.15)",
                borderRadius: "8px",
                border: "1px solid rgba(197, 160, 89, 0.3)",
              }}
            >
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#C5A059", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
                Stories of the Companions
              </span>
            </div>
            <p style={{ fontSize: "36px", color: "rgba(197, 160, 89, 0.6)", direction: "rtl" as const }}>
              {nameAr}
            </p>
          </div>

          {/* Middle: Name + Title or Snippet */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "16px 0" }}>
            {snippet ? (
              <>
                <p style={{ fontSize: "28px", lineHeight: 1.6, color: "#ffffff", textAlign: "center" as const, maxWidth: "900px", fontStyle: "italic" }}>
                  {'"'}{snippet.text_en.substring(0, 200)}{snippet.text_en.length > 200 ? "..." : ""}{'"'}
                </p>
                {snippet.attribution_en && (
                  <p style={{ fontSize: "18px", color: "rgba(197, 160, 89, 0.8)" }}>
                    -- {snippet.attribution_en}
                  </p>
                )}
              </>
            ) : (
              <>
                <p style={{ fontSize: "52px", fontWeight: 800, color: "#ffffff", textAlign: "center" as const, lineHeight: 1.2 }}>
                  {sahabi.name_en}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "center" }}>
                  <div style={{ flex: 1, height: "1px", background: "rgba(197, 160, 89, 0.4)", display: "flex", maxWidth: "80px" }} />
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#C5A059", display: "flex" }} />
                  <div style={{ flex: 1, height: "1px", background: "rgba(197, 160, 89, 0.4)", display: "flex", maxWidth: "80px" }} />
                </div>
                <p style={{ fontSize: "24px", color: "rgba(255, 255, 255, 0.7)", textAlign: "center" as const }}>
                  {titleEn}
                </p>
              </>
            )}
          </div>

          {/* Notable tags */}
          {!snippet && notableFor.length > 0 && (
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" as const }}>
              {notableFor.map((item: string, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 16px",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          )}

          {/* Bottom: Brand */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #C5A059, #E8C77D)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: 900,
                  color: themeColor,
                }}
              >
                A
              </div>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "rgba(255, 255, 255, 0.6)" }}>
                Authentic Hadith
              </span>
            </div>
            <span style={{ fontSize: "14px", color: "rgba(197, 160, 89, 0.7)" }}>
              {sahabi.total_parts} parts
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
