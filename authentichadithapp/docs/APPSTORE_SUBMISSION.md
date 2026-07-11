# Authentic Hadith — App Store Submission (live log)

> **AUTO-SYNCED.** Editing this file fires the submission auto-sync loop
> (`app_factory/tools/sync_project_submission.mjs` via a PostToolUse hook): it validates the
> category sections, hashes the content, and queues an in-session mirror up to this project's
> Notion page. **You write submission content under the right category heading; the loop files it
> to Notion.** App: Authentic Hadith · ASC app id `6764673665` · bundle `com.byred.authentichadith`.
> Cross-app playbook (the rules): `app_factory/SUBMISSION_WATCHOUTS.md`.

<!-- SUBMISSION:START -->

## Current Submission Status
- **LIVE / prior distribution page:** version **1.1.0** is marked **Ready for Distribution** in App Store Connect. Do not use it for the Day 1 refinement submission.
- **Current submission binary:** version **1.1.1**, build **107**, EAS build `86473f82-d0a8-4b45-ad00-522ffb97ff79`, source commit `e9f1bfd`.
- **State:** build 107 finished on EAS and EAS scheduled App Store Connect upload/submission `a3a777e1-e138-49d7-a1ca-ea34f58dcabd`.
- **Remaining Apple gate:** in App Store Connect, create or open iOS version **1.1.1**, select build **107**, verify `ah_monthly_premium` has the seven day free trial, attach screenshots, and submit for review.

## Icon & Binary
- 1024×1024, opaque, no alpha. Verify the SHIPPED icon by decoding `AppIcon60x60@2x.png` from the IPA (CgBI → `sips`), not the source/sim.
- Build 19 shipped the default blue icon; build 20 fixed it. Always verify in the built artifact.

## Metadata Text
- Description carries the EULA link. No pricing/savings language anywhere (2.3.7). Support/marketing/privacy URLs resolve 200.

## Screenshots
- Price-free set (no paywall screenshot — 2.3.7). iPhone 6.9" + iPad 13" both required (`supportsTablet:true`).

## Subscriptions / IAP / Pricing
- `ah_monthly_premium` $9.99/mo · `ah_annual_premium` $49.99/yr · `ah_lifetime_premium` $99.99 one-time. Subscription group `22067506`.
- Prices render from StoreKit via RevenueCat (no hardcoded literals). 3-surface match: ASC == RC == paywall.
- Each tier's ASC Description non-empty (paywall reads it live); `PACKAGE_DESC` code fallback so an empty ASC field never renders blank (FIX-093).

## Reviewer Access
- Reviewer account in ASC App Review Detail: `apple.reviewer+20260604@authentichadith.app` (password lives in ASC only). Prod-probe before submit: login returns access_token; RC entitlement `premium` active; backend route not 404.
- Supabase prod project = `nqklipakrfuwebkdnhwg`.

## Build & State
- **v1.1.1 = build 107** (EAS build `86473f82-d0a8-4b45-ad00-522ffb97ff79`, commit `e9f1bfd`) — finished on EAS 2026-07-10 and queued for App Store Connect submission through EAS submission `a3a777e1-e138-49d7-a1ca-ea34f58dcabd`.
- **Screenshots:** Day 1 evidence is saved in Claudex at `OPS/evidence/authentic_hadith_ios_submission_day_1_20260710/`.
- **Apple blocker:** App Store Connect still must show the seven day free trial on `ah_monthly_premium`; RevenueCat offering is verified but Apple intro offer proof is still human gated.
- v1.0 = build 41, commit `da32e0f`. Submit the PINNED build by `--id`, never `--latest`.
- AI backend served by the SEPARATE web repo `v0-authentic-hadith` at `www.authentichadith.app` (`/api/mobile-chat`), locked to Sahihayn (commit `993bfd2`).

## Privacy
- `PrivacyInfo.xcprivacy` shipped. App Privacy label matches data use. `ITSAppUsesNonExemptEncryption:false`. In-app account deletion present (5.1.1(v), FIX-065).

## Rejections & Resolutions
- Build 32 + Build 40: rejected on 2.3.7 (priced screenshot / "Save 50%") + 3.1.2c (EULA/Privacy on paywall). Resolved: removed priced screenshots, unique promo images, EULA+Privacy in 3 places, live pricing. Build 41 cleared it → v1.0 LIVE 2026-06-18.

<!-- SUBMISSION:END -->

<!-- SYNC-STATE: managed by sync_project_submission.mjs — do not hand-edit -->
