# Content Trust — App Store Submission Blockers

Open items that must be resolved before the build can be submitted to App Review. Owned by Agent 2 (Content Trust). Each row has the file the answer unblocks, what needs to change, and who can answer.

| # | Blocker | Resolves | File to update | Owner |
|---|---|---|---|---|
| CTB-01 | Provenance of `enriched_hadiths.key_teaching_en` rows (scholar-reviewed or AI-generated?). Until answered, the Key Teaching panel stays hidden via `ENRICHED_HADITHS_ENABLED = false`. | Re-enabling the Key Teaching panel with a correct label/credit. | `app/hadith/[id].tsx` (flip flag + adjust panel header/footnote per Path A or B), `docs/ENRICHED_HADITHS_PROVENANCE.md` | KP / Rory |
| CTB-02 | Translator source attribution for the bundled English hadith translations. Currently the Credits screen shows a placeholder pointing to support@authentichadith.app. | App Store reviewer / Muslim user can see translation source + license. | `app/settings/credits.tsx` (replace placeholder section with confirmed translator credit and license), `app/hadith/[id].tsx` (optionally add a "Translation" row to the Reference table when source is known) | KP / Rory |
| CTB-03 | Preferred Arabic phrasing for the softened AI claim in onboarding step 3. Current Arabic text is an interim translation: `مساعدنا الذكي موجَّه للتركيز على الأحاديث الصحيحة والإحالة إلى العلماء المؤهلين للأحكام الشرعية.` | Native-speaker-acceptable Arabic copy. | `app/onboarding.tsx` (Arabic branch of the AI safety paragraph) | KP / Rory (preferably a native Arabic speaker on review) |
| CTB-04 | About-screen copyright vs publisher mismatch. Screen reads "© 2024 Authentic Hadith App"; `APPSTORE_METADATA.md` declares the publisher as byRed LLC and the year is now 2026. | App Store description matches in-app attribution. | `app/settings/about.tsx` (footer text) | KP — confirm desired wording |
| CTB-05 | **RESOLVED (FIX-038, 2026-05-13).** Deployed `/api/mobile-chat` route returns HTTP 200 with a JSON response body. Mobile client also now has a defensive client-side safety filter as defense-in-depth. | AI Assistant tab + AI Summary now functional. The deployed route's own system prompt and safety enforcement are owned by the backend lane and should be re-verified before any major content-trust audit. | n/a | Closed |

## How this list is used

- Before submitting to App Review, every row must be either resolved or explicitly accepted by KP as a "ship-with-known-gap" item.
- CTB-01 and CTB-05 are hard blockers in their current state. CTB-02 and CTB-04 should be resolved but the app can ship without them if KP signs off. CTB-03 only affects Arabic-language onboarding.
