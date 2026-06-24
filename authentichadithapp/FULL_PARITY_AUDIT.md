# Authentic Hadith — Full Web↔Mobile Parity Audit (live site: authentichadith.app)

Date: 2026-06-24. SSOT = the WEB app (`v0-authentic-hadith`, live at authentichadith.app).
Method: live render via Chrome (computed fonts/palette) + source read of both repos. Receipts = path:line.
This is the gap list of what is NOT yet matched in the mobile app after build 50's font/token pass.

## Live design fingerprint (verified in-browser, not from docs)
- Body + paragraph font computes to `Cinzel, Geist, serif` — **the web uses Cinzel as the DEFAULT font for everything**, not just headings. (Chrome `getComputedStyle` on body + `<p>`.)
- Palette: text `rgb(44,36,22)` = `#2c2416` bronze; bg `rgb(248,246,242)` = `#f8f6f2` marble. (Matches mobile tokens already.)
- H1 30px/700, H2 20px/700, H3 16px/600, all Cinzel.

## A. VISUAL PARITY GAPS (why it still looks iOS) — ranked by impact

| # | Gap | Web (SSOT) | Mobile now | Fix | Effort |
|---|-----|-----------|-----------|-----|--------|
| 1 | **Body font** | Cinzel everywhere incl. body/hadith text (`globals.css:105` `--font-sans:"Cinzel"`) | Geist body (`constants/theme.ts:42` `body:'Geist_400Regular'`) | flip `FONT_FAMILY.body` → Cinzel (watch readability at small sizes) | **LOW / huge impact** |
| 2 | **Tab bar active color** | gold gradient `#C5A059→#E8C77D` (`bottom-navigation.tsx:54`) | emerald `#1b5e43` (`(tabs)/_layout.tsx:24`) | `tabBarActiveTintColor` → `goldMid` | LOW |
| 3 | **Card gold accents** | gold left border / full gold border (`hadith-card-condensed.tsx:141`, `daily-hadith-card.tsx:87`) | hairline neutral border (`ui/Card.tsx:37-47`) | add `borderLeftWidth:4, borderLeftColor:goldMid` (or gold border) to cards | LOW-MED |
| 4 | **Card padding** | 24-40px (`daily-hadith-card.tsx:87` `p-6 sm:p-10`) | 16px (`Card.tsx:40` `SPACING.md`) | bump card padding to 20-24px | LOW |
| 5 | **Home composition** | DailyHadithCard hero + AIAssistantBlock + collections grid + banners (`app/home/page.tsx:9-15`) | greeting + level/streak + quick-action emoji grid + simple HadithCard (`(tabs)/index.tsx:130-232`) | re-order home to lead with the premium daily card + surface AI | MED |
| 6 | **No top header** | sticky top bar: back + title + gold home btn (`mobile-top-bar.tsx:89-131`) | none, native iOS nav `headerShown:false` (`(tabs)/_layout.tsx:26`) | build a shared top-bar component | MED (changes native nav feel) |
| 7 | **Card border radius** | 12-16px (`rounded-xl/2xl`) | 20px (`colors.ts:153`) | reduce to 16px if matching exactly | LOW |

## B. STORIES — full migration map (web feature mobile largely lacks)
WEB Stories (sahaba + prophets) is a full multi-part reader. MOBILE renders all parts at once with a single
"complete" toggle. Shared Supabase project `nqklipakrfuwebkdnhwg`. Tables: `sahaba`, `story_parts`,
`shareable_snippets` (400+ rows), `sahaba_reading_progress`, `prophets`, `prophet_stories`.

| # | Web feature | Mobile now | Effort | Web receipt |
|---|-------------|-----------|--------|-------------|
| 1 | Per-part reader (Next/Prev, part dots, progress bar) | all parts in one scroll | HIGH | `stories/[slug]/page.tsx:1-561` |
| 2 | Per-part progress (`current_part`, `parts_completed[]`) | boolean complete only | MED | `stories/[slug]/page.tsx:78,144` |
| 3 | Bookmarking (`is_bookmarked`) | missing | MED | `stories/[slug]/page.tsx:308-317` |
| 4 | Shareable snippets ("Share a Moment") | missing | HIGH | `stories/[slug]/page.tsx:446-477` |
| 5 | Quran/Hadith references on a part | missing | LOW | `stories/[slug]/page.tsx:407-443` |
| 6 | Share-to-social | missing | LOW | `stories/[slug]/page.tsx:222-231` |
| 7 | Reading-time tracking | missing | LOW | `stories/[slug]/page.tsx:156-158` |
| 8 | Continue-Reading filtered list + tabs | flat list | MED | `stories/page.tsx:208-233` |
| 9 | `display_order` sort | alphabetical | LOW | `stories/page.tsx:87-88` |

Mobile files to change: `app/stories/index.tsx`, `app/stories/companion/[slug].tsx`,
`app/stories/prophet/[slug].tsx`, `lib/progress/progressService.ts`.

## C. Honest scope read (CTP Pass 3)
Full A + B is NOT a 2-day job. A#1-4,7 (token-level matches) are ~half a day and close most of the
"looks iOS" gap. A#5-6 (home recompose, top header) restructure native UX = real effort + taste calls.
B (stories full reader) is multi-day. Friday demo should ship the token matches + existing stories,
not the full stories reader. The rest is a post-Friday parity sprint, run through the asf pipeline per
the hardcoded Parity Discipline (CLAUDE.md).

## D. Recommended sequence
1. NOW (low-risk, high-impact, → build 51): A#1 body→Cinzel, A#2 tab gold, A#3 card gold accent, A#4 padding, A#7 radius.
2. Friday-optional: A#5 home lead-with-daily-card.
3. Post-Friday sprint (asf pipeline): A#6 top header; B stories multi-part reader + snippets + bookmarking + references.
