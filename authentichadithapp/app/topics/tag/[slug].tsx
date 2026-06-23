import React from 'react'
import { Redirect, useLocalSearchParams } from 'expo-router'

// Tag-topic deep-link/path alias for site parity.
// The website browses a single tag at /topics/tag/[slug]. The app's existing
// tag-detail screen already lives at /topics/[slug] and reads the SAME `tags`
// slug namespace (tags -> hadith_tags -> hadiths -> /hadith/[id]). This thin
// route forwards /topics/tag/<slug> -> /topics/<slug> so the site's tag URL
// shape resolves in-app and reuses the existing screen — no duplicated tag or
// hadith query logic, no redesign.
export default function TopicTagRedirect() {
  const { slug } = useLocalSearchParams<{ slug: string }>()

  if (!slug) {
    return <Redirect href="/topics" />
  }

  return <Redirect href={`/topics/${slug}`} />
}
