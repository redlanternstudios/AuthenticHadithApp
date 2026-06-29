export const CDN_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1"

export interface CollectionConfig {
  slug: string
  name_en: string
  name_ar: string
  scholar: string
  scholar_dates: string
  editions: { english: string; arabic: string }
  is_featured: boolean
}

export const COLLECTION_MAPPING: Record<string, CollectionConfig> = {
  "sahih-bukhari": {
    slug: "sahih-bukhari",
    name_en: "Sahih al-Bukhari",
    name_ar: "صحيح البخاري",
    scholar: "Imam Muhammad al-Bukhari",
    scholar_dates: "810–870 CE",
    editions: { english: "eng-bukhari", arabic: "ara-bukhari" },
    is_featured: true,
  },
  "sahih-muslim": {
    slug: "sahih-muslim",
    name_en: "Sahih Muslim",
    name_ar: "صحيح مسلم",
    scholar: "Imam Muslim ibn al-Hajjaj",
    scholar_dates: "815–875 CE",
    editions: { english: "eng-muslim", arabic: "ara-muslim" },
    is_featured: true,
  },
}

export const ALL_COLLECTION_SLUGS = Object.keys(COLLECTION_MAPPING)
