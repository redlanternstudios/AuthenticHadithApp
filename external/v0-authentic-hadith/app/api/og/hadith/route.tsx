import { ImageResponse } from "next/og"
import { createClient } from "@supabase/supabase-js"

export const runtime = "edge"

const COLLECTION_NAMES: Record<string, string> = {
  "sahih-bukhari": "Sahih al-Bukhari",
  "sahih-muslim": "Sahih Muslim",
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const hadithId = searchParams.get("id")

  if (!hadithId) {
    return new Response("Missing hadith ID", { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nqklipakrfuwebkdnhwg.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xa2xpcGFrcmZ1d2Via2RuaHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyODA3NDUsImV4cCI6MjA4Mzg1Njc0NX0.yhIe3hqiLlyF8atvSmNOL3HBq91V9Frw5jYcat-sZxY",
  )

  const { data: hadith } = await supabase
    .from("hadiths")
    .select("arabic_text, english_translation, collection, reference, grade, narrator")
    .eq("id", hadithId)
    .single()

  if (!hadith) {
    return new Response("Hadith not found", { status: 404 })
  }

  // Parse english translation
  let translationText = hadith.english_translation || ""
  if (translationText.startsWith("{")) {
    try {
      const parsed = JSON.parse(translationText)
      translationText = parsed.text || translationText
    } catch {
      // keep raw
    }
  }

  const arabicSnippet = (hadith.arabic_text || "").substring(0, 120)
  const englishSnippet = translationText.substring(0, 200) + (translationText.length > 200 ? "..." : "")
  const collectionName = COLLECTION_NAMES[hadith.collection] || hadith.collection
  const gradeLabel = hadith.grade?.charAt(0).toUpperCase() + hadith.grade?.slice(1) || "Authentic"

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0D3B2E 0%, #1B5E43 50%, #0D3B2E 100%)",
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
        <div
          style={{
            position: "absolute",
            top: "24px",
            left: "24px",
            width: "40px",
            height: "40px",
            borderTop: "3px solid #C5A059",
            borderLeft: "3px solid #C5A059",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            width: "40px",
            height: "40px",
            borderTop: "3px solid #C5A059",
            borderRight: "3px solid #C5A059",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            left: "24px",
            width: "40px",
            height: "40px",
            borderBottom: "3px solid #C5A059",
            borderLeft: "3px solid #C5A059",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            right: "24px",
            width: "40px",
            height: "40px",
            borderBottom: "3px solid #C5A059",
            borderRight: "3px solid #C5A059",
            display: "flex",
          }}
        />

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
          {/* Top: Collection + Grade */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#C5A059", letterSpacing: "0.05em" }}>
                {collectionName}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                background: gradeLabel === "Sahih" ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)",
                borderRadius: "8px",
                border: `1px solid ${gradeLabel === "Sahih" ? "rgba(16, 185, 129, 0.3)" : "rgba(59, 130, 246, 0.3)"}`,
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: gradeLabel === "Sahih" ? "#34d399" : "#60a5fa",
                }}
              >
                {gradeLabel}
              </span>
            </div>
          </div>

          {/* Middle: Arabic text */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "24px 0",
            }}
          >
            <p
              style={{
                fontSize: "32px",
                lineHeight: 2,
                color: "#E8C77D",
                textAlign: "center",
                direction: "rtl",
                maxWidth: "900px",
              }}
            >
              {arabicSnippet}
            </p>
          </div>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              justifyContent: "center",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "rgba(197, 160, 89, 0.3)", display: "flex" }} />
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#C5A059",
                display: "flex",
              }}
            />
            <div style={{ flex: 1, height: "1px", background: "rgba(197, 160, 89, 0.3)", display: "flex" }} />
          </div>

          {/* English snippet */}
          <p
            style={{
              fontSize: "18px",
              lineHeight: 1.6,
              color: "rgba(255, 255, 255, 0.8)",
              textAlign: "center",
              maxWidth: "800px",
              marginLeft: "auto",
              marginRight: "auto",
              padding: "16px 0",
            }}
          >
            {englishSnippet}
          </p>

          {/* Bottom: Brand + Reference */}
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
                  color: "#0D3B2E",
                }}
              >
                A
              </div>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "rgba(255, 255, 255, 0.6)" }}>
                Authentic Hadith
              </span>
            </div>
            <span style={{ fontSize: "14px", color: "rgba(197, 160, 89, 0.7)" }}>{hadith.reference}</span>
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
