import React from "react"
import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config"

const COLLECTION_NAMES: Record<string, string> = {
  "sahih-bukhari": "Sahih al-Bukhari",
  "sahih-muslim": "Sahih Muslim",
}

function parseTranslation(raw: string): string {
  if (!raw) return ""
  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw)
      return parsed.text || raw
    } catch {
      return raw
    }
  }
  return raw
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  const supabase = createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  )

  const { data: hadith } = await supabase
    .from("hadiths")
    .select("english_translation, collection, reference, grade")
    .eq("id", id)
    .single()

  if (!hadith) {
    return {
      title: "Hadith Not Found | Authentic Hadith",
    }
  }

  const translationText = parseTranslation(hadith.english_translation)
  const collectionName = COLLECTION_NAMES[hadith.collection] || hadith.collection
  const description = translationText.substring(0, 200) + (translationText.length > 200 ? "..." : "")
  const title = `${collectionName} - ${hadith.reference} | Authentic Hadith`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [
        {
          url: `/api/og/hadith?id=${id}`,
          width: 1200,
          height: 630,
          alt: `Hadith from ${collectionName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/hadith?id=${id}`],
    },
  }
}

export default function HadithLayout({ children }: { children: React.ReactNode }) {
  return children
}
