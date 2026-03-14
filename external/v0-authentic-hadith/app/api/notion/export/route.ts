import { Client } from "@notionhq/client"
import { getSupabaseServerClient } from "@/lib/supabase/server"

interface SavedHadith {
  id: string
  hadith_id: string
  created_at: string
  hadiths: {
    id: string
    arabic_text: string
    english_translation: string
    collection: string
    reference: string
    grade: string
    narrator: string | null
  }
}

/** Maximum characters per Notion rich text block (Notion API limit is 2000 chars) */
const MAX_NOTION_TEXT_LENGTH = 1900

function extractTranslationAndNarrator(raw: string, narrator: string | null): { text: string; narrator: string } {
  let text = raw || ""
  let resolvedNarrator = narrator || ""

  if (text.startsWith("{") && text.includes('"text"')) {
    try {
      const parsed = JSON.parse(text)
      text = (parsed.text || text).replace(/\\n/g, "\n").replace(/\\"/g, '"').trim()
      if (!resolvedNarrator && parsed.narrator) {
        resolvedNarrator = parsed.narrator.replace(/^Narrated\s+/i, "").replace(/:$/, "").trim()
      }
    } catch {
      // keep original
    }
  }

  return { text, narrator: resolvedNarrator }
}

/**
 * POST /api/notion/export
 *
 * Exports the authenticated user's saved hadiths to a Notion database.
 *
 * Request body:
 *   - notionToken: string  — Notion Internal Integration Token (starts with "secret_")
 *   - pageId: string       — ID or URL of the Notion page to create the database under
 *
 * Returns: { url: string, count: number }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { notionToken, pageId } = body as { notionToken?: string; pageId?: string }

    if (!notionToken || !pageId) {
      return Response.json(
        { error: "notionToken and pageId are required" },
        { status: 400 },
      )
    }

    // Validate token format
    if (!notionToken.startsWith("secret_") || notionToken.length < 20) {
      return Response.json(
        { error: "Invalid Notion integration token. It must start with 'secret_'." },
        { status: 400 },
      )
    }

    // Extract plain page ID (strip URL prefix and dashes)
    const rawPageId = pageId
      .replace(/^https:\/\/www\.notion\.so\/[^/]*\//, "")
      .replace(/^https:\/\/www\.notion\.so\//, "")
      .replace(/\?.*$/, "")
      .split("-")
      .pop() || pageId

    const cleanPageId = rawPageId.replace(/-/g, "")
    if (!/^[0-9a-f]{32}$/i.test(cleanPageId)) {
      return Response.json(
        { error: "Invalid Notion page ID or URL. Please copy the page link from Notion." },
        { status: 400 },
      )
    }

    // Format as Notion UUID
    const notionPageId = [
      cleanPageId.slice(0, 8),
      cleanPageId.slice(8, 12),
      cleanPageId.slice(12, 16),
      cleanPageId.slice(16, 20),
      cleanPageId.slice(20),
    ].join("-")

    // Authenticate user
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "You must be logged in to export to Notion." }, { status: 401 })
    }

    // Fetch saved hadiths
    const { data: savedHadiths, error: fetchError } = await supabase
      .from("saved_hadiths")
      .select(`
        id,
        hadith_id,
        created_at,
        hadiths (
          id,
          arabic_text,
          english_translation,
          collection,
          reference,
          grade,
          narrator
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("[Notion Export] Failed to fetch saved hadiths:", fetchError)
      return Response.json({ error: "Failed to fetch saved hadiths." }, { status: 500 })
    }

    const hadiths = (savedHadiths ?? []) as unknown as SavedHadith[]

    if (hadiths.length === 0) {
      return Response.json({ error: "You have no saved hadiths to export." }, { status: 400 })
    }

    // Connect to Notion
    const notion = new Client({ auth: notionToken })

    // Collect unique collection names for the select property options
    const collectionNames = [...new Set(hadiths.map((h) => h.hadiths.collection).filter(Boolean))]

    // Create the database under the given page
    const database = await notion.databases.create({
      parent: { type: "page_id", page_id: notionPageId },
      title: [{ type: "text", text: { content: "Saved Hadiths — Authentic Hadith App" } }],
      properties: {
        Reference: { title: {} },
        Collection: {
          select: {
            options: collectionNames.map((name) => ({ name })),
          },
        },
        Grade: {
          select: {
            options: [
              { name: "sahih", color: "green" },
              { name: "hasan", color: "yellow" },
              { name: "daif", color: "red" },
            ],
          },
        },
        Narrator: { rich_text: {} },
        "Date Saved": { date: {} },
      },
    })

    // Add each hadith as a page in the database
    const results = await Promise.allSettled(
      hadiths.map(async (saved) => {
        const h = saved.hadiths
        const { text, narrator } = extractTranslationAndNarrator(h.english_translation, h.narrator)

        // Notion rich text has a per-block character limit; truncate if needed
        const truncatedText = text.length > MAX_NOTION_TEXT_LENGTH
          ? text.slice(0, MAX_NOTION_TEXT_LENGTH) + "…"
          : text
        const truncatedArabic = (h.arabic_text || "").length > MAX_NOTION_TEXT_LENGTH
          ? (h.arabic_text || "").slice(0, MAX_NOTION_TEXT_LENGTH) + "…"
          : h.arabic_text || ""

        return notion.pages.create({
          parent: { database_id: database.id },
          properties: {
            Reference: {
              title: [{ type: "text", text: { content: h.reference || "Unknown" } }],
            },
            Collection: h.collection
              ? { select: { name: h.collection } }
              : { select: null },
            Grade: h.grade
              ? { select: { name: h.grade.toLowerCase() } }
              : { select: null },
            Narrator: narrator
              ? { rich_text: [{ type: "text", text: { content: narrator } }] }
              : { rich_text: [] },
            "Date Saved": {
              date: { start: new Date(saved.created_at).toISOString().split("T")[0] },
            },
          },
          children: [
            ...(truncatedText
              ? [{
                  object: "block" as const,
                  type: "paragraph" as const,
                  paragraph: {
                    rich_text: [{ type: "text" as const, text: { content: truncatedText } }],
                  },
                }]
              : []),
            ...(truncatedArabic
              ? [{
                  object: "block" as const,
                  type: "paragraph" as const,
                  paragraph: {
                    rich_text: [
                      {
                        type: "text" as const,
                        text: { content: truncatedArabic },
                        annotations: { italic: true, bold: false, strikethrough: false, underline: false, code: false, color: "default" as const },
                      },
                    ],
                  },
                }]
              : []),
          ],
        })
      }),
    )

    const successCount = results.filter((r) => r.status === "fulfilled").length
    const failCount = results.filter((r) => r.status === "rejected").length

    if (failCount > 0) {
      console.warn(`[Notion Export] ${failCount} hadiths failed to export for user ${user.id}`)
    }

    return Response.json({
      url: `https://www.notion.so/${database.id.replace(/-/g, "")}`,
      count: successCount,
      total: hadiths.length,
    })
  } catch (error: unknown) {
    console.error("[Notion Export] Error:", error)

    // Surface Notion API errors helpfully
    const err = error as { code?: string; message?: string; status?: number }
    if (err?.code === "unauthorized" || err?.status === 401) {
      return Response.json(
        { error: "Invalid Notion token. Please check your integration token and try again." },
        { status: 401 },
      )
    }
    if (err?.code === "object_not_found" || err?.status === 404) {
      return Response.json(
        { error: "Notion page not found. Make sure you shared the page with your integration." },
        { status: 404 },
      )
    }

    return Response.json(
      { error: "Failed to export to Notion. Please check your token and page ID, then try again." },
      { status: 500 },
    )
  }
}
