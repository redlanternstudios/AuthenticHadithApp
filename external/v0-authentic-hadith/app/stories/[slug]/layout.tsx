import React from "react"
import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  const supabase = createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  )

  const { data: sahabi } = await supabase
    .from("sahaba")
    .select("name_en, title_en, notable_for, total_parts")
    .eq("slug", slug)
    .single()

  if (!sahabi) {
    return {
      title: "Story | Authentic Hadith",
    }
  }

  const description = `${sahabi.title_en} -- Read the ${sahabi.total_parts}-part story of ${sahabi.name_en}. ${(sahabi.notable_for || []).join(", ")}.`

  return {
    title: `${sahabi.name_en} | Authentic Hadith`,
    description,
    openGraph: {
      title: `${sahabi.name_en} -- ${sahabi.title_en}`,
      description,
      images: [
        {
          url: `/api/og/story?slug=${slug}`,
          width: 1200,
          height: 630,
          alt: `Story of ${sahabi.name_en}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${sahabi.name_en} -- ${sahabi.title_en}`,
      description,
      images: [`/api/og/story?slug=${slug}`],
    },
  }
}

export default function StoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
