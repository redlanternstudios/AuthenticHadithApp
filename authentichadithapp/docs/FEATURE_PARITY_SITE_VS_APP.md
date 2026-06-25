# Feature Parity — authentichadith.app (site) vs AuthenticHadithApp (native)

**Method:** mapped the site's routes/APIs (`redlanternstudios/v0-authentic-hadith`, default branch `main`, via GitHub tree) against the native app's screens + verified each candidate gap against the app's actual code (grep + spot-reads), so presence is confirmed, not inferred from route names. Date 2026-06-23. Native scanned on branch `feat/learn-v2-supabase-20260622` (current, ahead of main).

> Headline: **strong parity.** Most apparent gaps are already implemented in the app inside existing screens. Genuine deltas are few and mostly minor; one is ~80% built.

## ✅ At parity (present in BOTH — verified in app code)
Home/Today (daily hadith), Collections → Books → Chapters, Hadith detail, Search, **AI Assistant** (with real free-tier quota metering), **Learn** (now Supabase-driven via Learn v2: paths→modules→lessons), **Quizzes**, Stories (prophets + companions), Topics, My-Hadith + folders, Bookmarks/Saved, Reflections, Achievements/Progress + gamification tracking (`trackActivity`), Settings (about, privacy, notifications, language, appearance, subscription, delete-account, sync), Onboarding, Auth (login/signup/forgot), **Summarize** (on hadith cards), **Share-OUT** (ShareSheet + `generateShareToken`).

## ❗ Confirmed gaps (site has, app missing)
1. **In-app shared-folder viewer (moderate, ~80% built).** App can CREATE + share a token (`generateShareToken`) and has the lookup fn (`getFolderByShareToken`), but there is **no in-app screen/deep-link to OPEN a shared folder** (site has `my-hadith/shared/[token]` + `api/share/[token]`; app has no such route). Today a shared link opens on the **website**, not in the app. Fix = add a `my-hadith/shared/[token]` screen + deep-link handler wired to the existing `getFolderByShareToken`.
2. **Topic tags — `topics/tag/[slug]` (minor).** Site has tag-based topic browsing; app has topics + topic detail but no tag filter. No app code matches `topics/tag` / `byTag`.
3. **On-demand AI quiz generation (minor/optional).** Site generates quizzes via `api/quiz/generate`; app serves pre-made questions (Supabase `learning_quiz_questions` + static fallback). Feature "quiz" is present; live AI generation is not.
4. **Server-side usage quota (robustness, not a feature).** App meters AI usage **locally** (AsyncStorage `FREE_DAILY_LIMIT`); site enforces server-side (`api/user/quota`). Local can be reset by reinstall. Optional hardening.

## 🚫 Intentionally different — DO NOT port
- **Stripe / web billing / billing portal / Stripe webhooks** → the app correctly uses **RevenueCat in-app purchases**. Apple REQUIRES IAP for digital goods; adding Stripe web payments = **Guideline 3.1.1 rejection.** Keep them split.
- **`/admin/*`, `/api/seed/*`, `/api/enrich/*`** → internal content tooling, not user features. Not for the app.
- **`/pricing`, `/contact`, `/terms`, `/checkout/success`** → web marketing/checkout pages; the app covers these via the native paywall + Settings (terms/privacy links).

## Caveat
Presence is verified (routes + grep + spot-reads). Depth/quality parity per feature (does the app's quiz/share/etc. behave identically) would need a per-feature code read. The 4 gaps above are the structural deltas; everything else is present or intentionally web-only.

## Recommendation (one call)
For "replicate the site completely," only **gap #1 (in-app shared-folder viewer)** is worth building now, and it's mostly done (the data fn exists, needs a screen + deep link). #2/#3 are nice-to-haves; #4 is hardening. Build #1 into a 1.2 update; park the rest unless they earn it.
