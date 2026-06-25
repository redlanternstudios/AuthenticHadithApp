# Authentic Hadith — App Store Submission (live log)

> **AUTO-SYNCED.** Editing this file fires the submission auto-sync loop
> (`app_factory/tools/sync_project_submission.mjs` via a PostToolUse hook): it validates the
> category sections, hashes the content, and queues an in-session mirror up to this project's
> Notion page. **You write submission content under the right category heading; the loop files it
> to Notion.** App: Authentic Hadith · ASC app id `6764673665` · bundle `com.byred.authentichadith`.
> Cross-app playbook (the rules): `app_factory/SUBMISSION_WATCHOUTS.md`.

<!-- SUBMISSION:START -->

## Current Submission Status
- **LIVE** on the App Store: version **1.0**, released **2026-06-18** (Apple lookup, Free). Seller "By red llc".
- **In flight: v1.1.0 — STAGED, awaiting device QA + submit.** Learn v2 committed `93f567a`; **build 44** (EAS `2ff84ece`) VALID in TestFlight; ASC version 1.1.0 (`5b82b9d6`) created, build 44 attached, What's New set, state `PREPARE_FOR_SUBMISSION`. REMAINING (KP-only): device QA on build 44 (Rule 040, physical iPhone) → Submit for Review. Server-side pieces (muqaddimah fill, AI Sahihayn lock) already live for 1.0 users.

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
- **v1.1.0 = build 44** (EAS build `2ff84ece-0c1a-4718-823b-1cd6a51c60aa`, commit `93f567a`) — uploaded to ASC 2026-06-23, **processing into TestFlight** (submission `f0939eef`). Next: KP device QA (Rule 040) → Submit for Review.
- v1.0 = build 41, commit `da32e0f`. Submit the PINNED build by `--id`, never `--latest`.
- AI backend served by the SEPARATE web repo `v0-authentic-hadith` at `www.authentichadith.app` (`/api/mobile-chat`), locked to Sahihayn (commit `993bfd2`).

## Privacy
- `PrivacyInfo.xcprivacy` shipped. App Privacy label matches data use. `ITSAppUsesNonExemptEncryption:false`. In-app account deletion present (5.1.1(v), FIX-065).

## Rejections & Resolutions
- Build 32 + Build 40: rejected on 2.3.7 (priced screenshot / "Save 50%") + 3.1.2c (EULA/Privacy on paywall). Resolved: removed priced screenshots, unique promo images, EULA+Privacy in 3 places, live pricing. Build 41 cleared it → v1.0 LIVE 2026-06-18.

<!-- SUBMISSION:END -->

<!-- SYNC-STATE: managed by sync_project_submission.mjs — do not hand-edit -->
