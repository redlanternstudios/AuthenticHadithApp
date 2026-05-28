/**
 * Bundled Sunnah practices fallback dataset.
 *
 * Purpose: when Supabase `sunnah_categories` / `sunnah_practices` tables are
 * empty, missing, or unreachable, the mobile Sunnah screen falls back to this
 * curated dataset so users always see content. This is shipped seed data,
 * NOT placeholder text — every entry has a hadith reference.
 *
 * Authoritative when:
 *   - First launch on a fresh install
 *   - Supabase down / network unavailable
 *   - Production DB hasn't been seeded with sunnah tables yet
 *
 * Override behavior:
 *   - If Supabase returns ≥1 category, the live data wins.
 *   - This file is the safety net.
 *
 * Sources: hadith refs cite well-known authentic narrations from the
 * canonical six (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasai, Ibn Majah)
 * and Muwatta Malik. Every reference can be verified against the
 * deployed app's own Hadith collection lookup.
 */

import type { ComponentProps } from 'react'

export interface FallbackSunnahCategory {
  id: string
  title: string
  title_ar: string
  description: string
  icon: string
  color: string
  bg_color: string
  sort_order: number
}

export interface FallbackSunnahPractice {
  id: string
  category_id: string
  title: string
  title_ar?: string
  description: string
  description_ar?: string
  hadith_ref?: string
  collection?: string
  sort_order: number
  /** Day-of-year anchor for "Today's Sunnah" rotation (1-365). */
  day_of_year: number
}

export const FALLBACK_SUNNAH_CATEGORIES: FallbackSunnahCategory[] = [
  {
    id: 'cat-purification',
    title: 'Purification',
    title_ar: 'الطهارة',
    description: 'Wudu, ghusl, and the manners of cleanliness.',
    icon: '💧',
    color: '#1B5E43',
    bg_color: '#1B5E43',
    sort_order: 1,
  },
  {
    id: 'cat-prayer',
    title: 'Prayer',
    title_ar: 'الصلاة',
    description: 'Sunan related to the daily prayers and adhan.',
    icon: '🕌',
    color: '#C49A45',
    bg_color: '#C49A45',
    sort_order: 2,
  },
  {
    id: 'cat-adhkar',
    title: 'Daily Adhkar',
    title_ar: 'الأذكار',
    description: 'Morning, evening, and post-prayer remembrances.',
    icon: '📿',
    color: '#7C5C2E',
    bg_color: '#7C5C2E',
    sort_order: 3,
  },
  {
    id: 'cat-eating',
    title: 'Eating & Drinking',
    title_ar: 'الأكل والشرب',
    description: 'The Prophetic manners of food and drink.',
    icon: '🍽️',
    color: '#A86B2D',
    bg_color: '#A86B2D',
    sort_order: 4,
  },
  {
    id: 'cat-sleep',
    title: 'Sleep & Waking',
    title_ar: 'النوم والاستيقاظ',
    description: 'Sunan before sleep and on waking up.',
    icon: '🌙',
    color: '#3E5C8A',
    bg_color: '#3E5C8A',
    sort_order: 5,
  },
  {
    id: 'cat-social',
    title: 'Greetings & Manners',
    title_ar: 'الآداب',
    description: 'Salaam, social etiquette, and visiting practices.',
    icon: '🤝',
    color: '#4A7C59',
    bg_color: '#4A7C59',
    sort_order: 6,
  },
  {
    id: 'cat-fasting',
    title: 'Fasting',
    title_ar: 'الصيام',
    description: 'Voluntary fasts and Ramadan sunan.',
    icon: '🌙',
    color: '#8B5A3C',
    bg_color: '#8B5A3C',
    sort_order: 7,
  },
]

/**
 * Seed practices. ~30 entries. Each has a stable id, hadith reference, and
 * day_of_year anchor so the home "Today's Sunnah" rotation has variety.
 */
export const FALLBACK_SUNNAH_PRACTICES: FallbackSunnahPractice[] = [
  // ─── Purification (1-5) ───────────────────────────────────────────
  {
    id: 'sun-wudu-bismillah',
    category_id: 'cat-purification',
    title: 'Begin wudu with Bismillah',
    title_ar: 'البسملة قبل الوضوء',
    description:
      'Say "Bismillah" before starting ablution. The Prophet ﷺ said: "There is no wudu for the one who does not mention the name of Allah upon it."',
    hadith_ref: 'Sunan Abu Dawud 101',
    collection: 'sunan-abu-dawud',
    sort_order: 1,
    day_of_year: 5,
  },
  {
    id: 'sun-wudu-siwak',
    category_id: 'cat-purification',
    title: 'Use the siwak (toothstick)',
    title_ar: 'السواك',
    description:
      'The Prophet ﷺ said: "Were it not that I would burden my community, I would have ordered them to use the siwak with every prayer."',
    hadith_ref: 'Sahih al-Bukhari 887',
    collection: 'sahih-bukhari',
    sort_order: 2,
    day_of_year: 12,
  },
  {
    id: 'sun-wudu-thrice',
    category_id: 'cat-purification',
    title: 'Wash each limb three times',
    title_ar: 'غسل الأعضاء ثلاثاً',
    description:
      'The Prophet ﷺ performed wudu washing each limb three times. The minimum is once; three is the perfected sunnah.',
    hadith_ref: 'Sahih al-Bukhari 159',
    collection: 'sahih-bukhari',
    sort_order: 3,
    day_of_year: 47,
  },
  {
    id: 'sun-wudu-shahada',
    category_id: 'cat-purification',
    title: 'Recite the shahada after wudu',
    title_ar: 'الشهادة بعد الوضوء',
    description:
      'After completing wudu, say: "Ash-hadu an la ilaha illallah, wahdahu la sharika lah, wa ash-hadu anna Muhammadan abduhu wa rasuluh." The eight gates of Paradise are opened.',
    hadith_ref: 'Sahih Muslim 234',
    collection: 'sahih-muslim',
    sort_order: 4,
    day_of_year: 78,
  },
  {
    id: 'sun-ghusl-friday',
    category_id: 'cat-purification',
    title: 'Ghusl on Friday',
    title_ar: 'غسل الجمعة',
    description:
      'The Prophet ﷺ said: "Ghusl on Friday is incumbent upon every adult."',
    hadith_ref: 'Sahih al-Bukhari 879',
    collection: 'sahih-bukhari',
    sort_order: 5,
    day_of_year: 113,
  },

  // ─── Prayer (6-11) ────────────────────────────────────────────────
  {
    id: 'sun-prayer-12-rakat',
    category_id: 'cat-prayer',
    title: '12 rak‘ah of voluntary prayer daily',
    title_ar: 'السنن الرواتب',
    description:
      'Whoever prays 12 rak‘ah a day apart from the obligatory prayers, Allah builds for them a house in Paradise. (4 before Dhuhr, 2 after, 2 after Maghrib, 2 after Isha, 2 before Fajr.)',
    hadith_ref: 'Sahih Muslim 728',
    collection: 'sahih-muslim',
    sort_order: 1,
    day_of_year: 23,
  },
  {
    id: 'sun-prayer-witr',
    category_id: 'cat-prayer',
    title: 'Pray Witr before sleep',
    title_ar: 'الوتر قبل النوم',
    description:
      'The Prophet ﷺ said: "Whoever fears not to wake up at the end of the night, let him pray Witr at the beginning of the night."',
    hadith_ref: 'Sahih Muslim 755',
    collection: 'sahih-muslim',
    sort_order: 2,
    day_of_year: 56,
  },
  {
    id: 'sun-prayer-duha',
    category_id: 'cat-prayer',
    title: 'Pray Duha (forenoon prayer)',
    title_ar: 'صلاة الضحى',
    description:
      'Each morning, charity is due on every joint of the body. Two rak‘ah of Duha suffice for that charity.',
    hadith_ref: 'Sahih Muslim 720',
    collection: 'sahih-muslim',
    sort_order: 3,
    day_of_year: 91,
  },
  {
    id: 'sun-prayer-tahajjud',
    category_id: 'cat-prayer',
    title: 'Pray Tahajjud in the last third of the night',
    title_ar: 'قيام الليل',
    description:
      'The best prayer after the obligatory is the night prayer. Allah descends to the lowest heaven in the last third of the night.',
    hadith_ref: 'Sahih al-Bukhari 1145',
    collection: 'sahih-bukhari',
    sort_order: 4,
    day_of_year: 144,
  },
  {
    id: 'sun-prayer-mosque-arrival',
    category_id: 'cat-prayer',
    title: 'Two rak‘ah on entering the masjid',
    title_ar: 'تحية المسجد',
    description:
      'The Prophet ﷺ said: "When one of you enters the masjid, let him pray two rak‘ah before sitting down."',
    hadith_ref: 'Sahih al-Bukhari 444',
    collection: 'sahih-bukhari',
    sort_order: 5,
    day_of_year: 178,
  },
  {
    id: 'sun-prayer-straight-rows',
    category_id: 'cat-prayer',
    title: 'Straighten the rows in congregation',
    title_ar: 'تسوية الصفوف',
    description:
      'The Prophet ﷺ said: "Straighten your rows, for I see you behind my back." He would walk between the rows and adjust them.',
    hadith_ref: 'Sahih al-Bukhari 719',
    collection: 'sahih-bukhari',
    sort_order: 6,
    day_of_year: 209,
  },

  // ─── Daily Adhkar (12-17) ─────────────────────────────────────────
  {
    id: 'sun-adhkar-morning-evening',
    category_id: 'cat-adhkar',
    title: 'Morning and evening adhkar',
    title_ar: 'أذكار الصباح والمساء',
    description:
      'Set aside time after Fajr and before Maghrib for the protective and praising rememberances established in the sunnah.',
    hadith_ref: 'Sunan Abu Dawud 5074',
    collection: 'sunan-abu-dawud',
    sort_order: 1,
    day_of_year: 33,
  },
  {
    id: 'sun-adhkar-after-prayer',
    category_id: 'cat-adhkar',
    title: 'SubhanAllah, Alhamdulillah, Allahu Akbar after prayer',
    title_ar: 'التسبيح بعد الصلاة',
    description:
      'After every obligatory prayer: 33× SubhanAllah, 33× Alhamdulillah, 34× Allahu Akbar. The Prophet ﷺ said this is among the lasting good deeds.',
    hadith_ref: 'Sahih Muslim 596',
    collection: 'sahih-muslim',
    sort_order: 2,
    day_of_year: 67,
  },
  {
    id: 'sun-adhkar-ayat-kursi',
    category_id: 'cat-adhkar',
    title: 'Ayat al-Kursi after every prayer',
    title_ar: 'آية الكرسي بعد الصلاة',
    description:
      'The Prophet ﷺ said: "Whoever recites Ayat al-Kursi after every obligatory prayer, nothing prevents them from entering Paradise except death."',
    hadith_ref: 'Sunan an-Nasai (al-Kubra) 9928',
    collection: 'sunan-nasai',
    sort_order: 3,
    day_of_year: 100,
  },
  {
    id: 'sun-adhkar-three-quls',
    category_id: 'cat-adhkar',
    title: 'Three Quls in morning, evening, and after Maghrib/Fajr',
    title_ar: 'المعوذات',
    description:
      'Recite Surah al-Ikhlas, al-Falaq, and an-Nas three times morning and evening. They suffice you against everything.',
    hadith_ref: 'Sunan Abu Dawud 5082',
    collection: 'sunan-abu-dawud',
    sort_order: 4,
    day_of_year: 133,
  },
  {
    id: 'sun-adhkar-istighfar',
    category_id: 'cat-adhkar',
    title: 'Istighfar 100 times daily',
    title_ar: 'الاستغفار',
    description:
      'The Prophet ﷺ said: "By Allah, I seek Allah\'s forgiveness and turn to Him in repentance more than seventy times a day."',
    hadith_ref: 'Sahih al-Bukhari 6307',
    collection: 'sahih-bukhari',
    sort_order: 5,
    day_of_year: 166,
  },
  {
    id: 'sun-adhkar-salawat',
    category_id: 'cat-adhkar',
    title: 'Send salawat upon the Prophet ﷺ',
    title_ar: 'الصلاة على النبي',
    description:
      'Whoever sends one salawat upon the Prophet ﷺ, Allah sends ten upon them. Increase it on Friday especially.',
    hadith_ref: 'Sahih Muslim 408',
    collection: 'sahih-muslim',
    sort_order: 6,
    day_of_year: 199,
  },

  // ─── Eating & Drinking (18-22) ────────────────────────────────────
  {
    id: 'sun-eat-bismillah',
    category_id: 'cat-eating',
    title: 'Say Bismillah before eating',
    title_ar: 'التسمية قبل الأكل',
    description:
      'The Prophet ﷺ said: "When one of you eats, let him mention the name of Allah. If he forgets at the start, let him say: Bismillah at the beginning and end of it."',
    hadith_ref: 'Sunan Abu Dawud 3767',
    collection: 'sunan-abu-dawud',
    sort_order: 1,
    day_of_year: 17,
  },
  {
    id: 'sun-eat-right-hand',
    category_id: 'cat-eating',
    title: 'Eat with the right hand',
    title_ar: 'الأكل باليمين',
    description:
      'The Prophet ﷺ said: "When any of you eats, let him eat with his right hand, and when he drinks, let him drink with his right hand. For Shaytan eats and drinks with his left."',
    hadith_ref: 'Sahih Muslim 2020',
    collection: 'sahih-muslim',
    sort_order: 2,
    day_of_year: 50,
  },
  {
    id: 'sun-eat-three-fingers',
    category_id: 'cat-eating',
    title: 'Eat with three fingers',
    title_ar: 'الأكل بثلاث أصابع',
    description:
      'The Prophet ﷺ used to eat with three fingers and lick them when finished.',
    hadith_ref: 'Sahih Muslim 2032',
    collection: 'sahih-muslim',
    sort_order: 3,
    day_of_year: 83,
  },
  {
    id: 'sun-drink-three-breaths',
    category_id: 'cat-eating',
    title: 'Drink in three breaths, sitting',
    title_ar: 'الشرب جالساً وعلى ثلاث',
    description:
      'The Prophet ﷺ would breathe three times when drinking and forbade drinking from a single breath.',
    hadith_ref: 'Sahih al-Bukhari 5631',
    collection: 'sahih-bukhari',
    sort_order: 4,
    day_of_year: 116,
  },
  {
    id: 'sun-eat-no-blame',
    category_id: 'cat-eating',
    title: 'Never criticize food',
    title_ar: 'عدم عيب الطعام',
    description:
      'The Prophet ﷺ never criticized any food. If he liked it, he ate; if he disliked it, he left it.',
    hadith_ref: 'Sahih al-Bukhari 5409',
    collection: 'sahih-bukhari',
    sort_order: 5,
    day_of_year: 149,
  },

  // ─── Sleep & Waking (23-27) ───────────────────────────────────────
  {
    id: 'sun-sleep-right-side',
    category_id: 'cat-sleep',
    title: 'Sleep on the right side',
    title_ar: 'النوم على الشق الأيمن',
    description:
      'The Prophet ﷺ said: "When you go to your bed, perform wudu, lie on your right side, and say [the bedtime du‘a]…"',
    hadith_ref: 'Sahih al-Bukhari 247',
    collection: 'sahih-bukhari',
    sort_order: 1,
    day_of_year: 25,
  },
  {
    id: 'sun-sleep-dust-bed',
    category_id: 'cat-sleep',
    title: 'Dust the bed before sleeping',
    title_ar: 'نفض الفراش قبل النوم',
    description:
      'The Prophet ﷺ said: "When any of you goes to his bed, let him dust it with the inside of his garment, for he does not know what came onto it after him."',
    hadith_ref: 'Sahih al-Bukhari 6320',
    collection: 'sahih-bukhari',
    sort_order: 2,
    day_of_year: 58,
  },
  {
    id: 'sun-sleep-dua',
    category_id: 'cat-sleep',
    title: 'Du‘a before sleep',
    title_ar: 'دعاء النوم',
    description:
      'Recite "Bismika Allahumma amutu wa ahya" before sleeping, and on waking: "Alhamdulillah alladhi ahyana ba‘da ma amatana wa ilayhi an-nushur."',
    hadith_ref: 'Sahih al-Bukhari 6314',
    collection: 'sahih-bukhari',
    sort_order: 3,
    day_of_year: 89,
  },
  {
    id: 'sun-sleep-three-breaths-water',
    category_id: 'cat-sleep',
    title: 'Cover food and water vessels at night',
    title_ar: 'تخمير الإناء',
    description:
      'The Prophet ﷺ said: "Cover the vessels and tie the waterskins, for there is a night in the year when pestilence descends, and it does not pass an uncovered vessel except that something of it falls in."',
    hadith_ref: 'Sahih Muslim 2014',
    collection: 'sahih-muslim',
    sort_order: 4,
    day_of_year: 122,
  },
  {
    id: 'sun-sleep-yawn-cover',
    category_id: 'cat-sleep',
    title: 'Suppress yawning',
    title_ar: 'كظم التثاؤب',
    description:
      'The Prophet ﷺ said: "Yawning is from Shaytan. When one of you yawns, let him suppress it as much as he can."',
    hadith_ref: 'Sahih al-Bukhari 6223',
    collection: 'sahih-bukhari',
    sort_order: 5,
    day_of_year: 155,
  },

  // ─── Greetings & Manners (28-32) ──────────────────────────────────
  {
    id: 'sun-salaam-spread',
    category_id: 'cat-social',
    title: 'Spread the salaam',
    title_ar: 'إفشاء السلام',
    description:
      'The Prophet ﷺ said: "You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I tell you of something which, if you do it, you will love one another? Spread the salaam between yourselves."',
    hadith_ref: 'Sahih Muslim 54',
    collection: 'sahih-muslim',
    sort_order: 1,
    day_of_year: 31,
  },
  {
    id: 'sun-salaam-young-old',
    category_id: 'cat-social',
    title: 'Younger greets older, walker greets sitting',
    title_ar: 'آداب السلام',
    description:
      'The younger greets the older, the walker greets the one sitting, the smaller group greets the larger.',
    hadith_ref: 'Sahih al-Bukhari 6231',
    collection: 'sahih-bukhari',
    sort_order: 2,
    day_of_year: 64,
  },
  {
    id: 'sun-smile-charity',
    category_id: 'cat-social',
    title: 'Smiling is charity',
    title_ar: 'التبسم صدقة',
    description:
      'The Prophet ﷺ said: "Your smile in the face of your brother is charity."',
    hadith_ref: 'Jami at-Tirmidhi 1956',
    collection: 'jami-tirmidhi',
    sort_order: 3,
    day_of_year: 95,
  },
  {
    id: 'sun-handshake',
    category_id: 'cat-social',
    title: 'Shake hands when meeting',
    title_ar: 'المصافحة عند اللقاء',
    description:
      'The Prophet ﷺ said: "No two Muslims meet and shake hands except that their sins are forgiven before they part."',
    hadith_ref: 'Sunan Abu Dawud 5212',
    collection: 'sunan-abu-dawud',
    sort_order: 4,
    day_of_year: 127,
  },
  {
    id: 'sun-visit-sick',
    category_id: 'cat-social',
    title: 'Visit the sick',
    title_ar: 'عيادة المريض',
    description:
      'The Prophet ﷺ said: "When a Muslim visits a sick Muslim brother in the morning, seventy thousand angels supplicate forgiveness for him until evening."',
    hadith_ref: 'Jami at-Tirmidhi 969',
    collection: 'jami-tirmidhi',
    sort_order: 5,
    day_of_year: 161,
  },

  // ─── Fasting (33-35) ──────────────────────────────────────────────
  {
    id: 'sun-fast-monday-thursday',
    category_id: 'cat-fasting',
    title: 'Fast Monday and Thursday',
    title_ar: 'صيام الإثنين والخميس',
    description:
      'The Prophet ﷺ would fast Mondays and Thursdays, saying: "Deeds are presented on Monday and Thursday, and I love that my deeds be presented while I am fasting."',
    hadith_ref: 'Jami at-Tirmidhi 747',
    collection: 'jami-tirmidhi',
    sort_order: 1,
    day_of_year: 41,
  },
  {
    id: 'sun-fast-three-days',
    category_id: 'cat-fasting',
    title: 'Fast three days each month',
    title_ar: 'صيام ثلاثة أيام من كل شهر',
    description:
      'The Prophet ﷺ recommended fasting three days of each month — preferably the white days (13th, 14th, 15th of the lunar month).',
    hadith_ref: 'Sunan an-Nasai 2424',
    collection: 'sunan-nasai',
    sort_order: 2,
    day_of_year: 74,
  },
  {
    id: 'sun-fast-suhoor',
    category_id: 'cat-fasting',
    title: 'Take suhoor before fasting',
    title_ar: 'السحور',
    description:
      'The Prophet ﷺ said: "Take suhoor, for in suhoor there is blessing."',
    hadith_ref: 'Sahih al-Bukhari 1923',
    collection: 'sahih-bukhari',
    sort_order: 3,
    day_of_year: 107,
  },
]

export const FALLBACK_TOTAL_PRACTICES = FALLBACK_SUNNAH_PRACTICES.length
export const FALLBACK_TOTAL_CATEGORIES = FALLBACK_SUNNAH_CATEGORIES.length

// Defensive runtime check that no two practices share an id (catches typos
// during seed expansion). Only fires in DEV; production builds skip this
// to avoid any startup overhead.
if (__DEV__) {
  const seen = new Set<string>()
  for (const p of FALLBACK_SUNNAH_PRACTICES) {
    if (seen.has(p.id)) {
      console.warn(`[sunnahFallbackData] duplicate practice id: ${p.id}`) // __DEV__
    }
    seen.add(p.id)
  }
  const catIds = new Set(FALLBACK_SUNNAH_CATEGORIES.map((c) => c.id))
  for (const p of FALLBACK_SUNNAH_PRACTICES) {
    if (!catIds.has(p.category_id)) {
      console.warn( // __DEV__
        `[sunnahFallbackData] practice ${p.id} references unknown category ${p.category_id}`
      )
    }
  }
}
