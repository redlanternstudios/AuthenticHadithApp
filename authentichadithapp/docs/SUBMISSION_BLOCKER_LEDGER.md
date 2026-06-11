# Submission Blocker Ledger — Authentic Hadith (SELF-HEALING)

Every blocker that has ever gated this app's App Store submission, each with a **live probe** that
detects it. This is the self-healing checklist: BEFORE any submission, run every probe; ALL must be
GREEN. A blocker is never "resolved" because a doc says so — it is GREEN only when its probe passes
against production THIS run (see `SYSTEM_RULES.md` Rule 034). We do not ship anything halfway.

> Probes use creds from `.env.local` + the ASC API (`AuthKey_L65WW2C698.p8`, issuer `5cd5d8fc-…`).
> The reviewer account is whatever ASC `appStoreReviewDetail` returns — read it live, never hardcode.

| # | Blocker | Live probe (must be GREEN) | Fix ref | Status 2026-06-09 |
|---|---|---|---|---|
| B1 | AI assistant 404 in prod (AI route only on web repo `v0-authentic-hadith`, unmerged) | `POST https://www.authentichadith.app/api/mobile-chat` returns 200 + `{response}` | FIX-062 | ✅ GREEN |
| B2 | Apple reviewer cannot log in | GoTrue password grant on the **ASC demo account** (read `demoAccountName` from `appStoreReviewDetail`) returns access_token | FIX-063 | ✅ GREEN (`apple.reviewer+20260604@…`) |
| B3 | Premium not unlocked for reviewer | `GET api.revenuecat.com/v1/subscribers/{reviewer_uid}` → entitlement `premium` active | FIX-063 | ✅ GREEN |
| B4 | New-user signup/onboarding broken (`profiles` wrong columns + NOT-NULL `user_id`) | canary: insert `{id,user_id,name}` for a real auth uid → 201; resolvable by `user_id` | FIX-064 | ✅ code fixed — **needs build to ship** |
| B5 | Account deletion broken in shipped path (prior Apple rejection) | live: throwaway user → `POST /api/auth/delete-account` (Bearer + `{confirmation:"DELETE"}`) → 200 `{success:true}` AND user removed | FIX-065 | ✅ GREEN (server-side fix, **no rebuild** — build 22 already sends the right contract) |
| B6 | Inflated hadith count ("don't exaggerate") | `VISIBLE_HADITH_TOTAL` == live non-blank Sahihayn count (service-role count) | FIX-064 era | ✅ GREEN (14,232) |
| B7 | Doc-vs-reality drift (repo readiness docs disagree with ASC/prod) | pull live state from ASC API (`appStoreVersions`, `inAppPurchasesV2`, `appStoreReviewDetail`) — trust that, not docs | Rule 034 | ✅ controlled by probe |
| B8 | Reviewer creds mismatch (repo notes ≠ ASC App Review Detail) | the exact `demoAccountName`/`demoAccountPassword` in ASC must log in + show premium | FIX-063 | ✅ GREEN |
| B9 | Shipped binary missing the mobile fixes (B4, B5) | production EAS build from a commit with FIX-064; B5 fixed server-side so any recent build works; build uploaded + attached in ASC | — | ✅ GREEN — Build 22 (1.0.0, id 6d95e335) VALID + ATTACHED to version 1.0 (swapped off stale Build 20). NOTE: use top-level `/v1/builds?filter[app]=` to read builds — the nested `/v1/apps/{id}/builds` returns empty with this key. |

| B10 | Reviewer auth | GoTrue password grant on `apple.reviewer@authentichadith.app` returns `access_token` and the app reaches the home tab without error | FIX-063 / Rule 039 | ⬜ PROBE REQUIRED |
| B11 | RC entitlement (reviewer) | `GET api.revenuecat.com/v1/subscribers/00000000-0000-0000-0000-000000000001` → entitlement key `premium` present and active (key `rc_promo_premium_lifetime` is permanently retired — do not reference) | FIX-063 / Rule 038 | ⬜ PROBE REQUIRED |
| B12 | Quiz null guard live | Open quiz tab with zero eligible hadiths (e.g. all filtered out); no crash, graceful empty state shown — no JS exception, no red screen | FIX-069 | ⬜ PROBE REQUIRED |
| B13 | Collection visibility | Only Sahih Bukhari and Sahih Muslim visible in-app; all 6 `HIDDEN_COLLECTION_SLUGS` absent from browse; total hadith count reads 14,444 | AUDIT-061 / Rule 037 | ⬜ PROBE REQUIRED |
| B14 | Delete account round-trip | Authenticated throwaway user triggers account deletion in-app; receives success confirmation; is signed out; `profiles` row absent on Supabase service-role read; `auth.users` row absent | FIX-065 / Rule 035 | ⬜ PROBE REQUIRED |

## ASC live state (probe `appStoreVersions` / `inAppPurchasesV2`)
- Version 1.0 → `PREPARE_FOR_SUBMISSION`.
- IAPs: `ah_monthly_premium`, `ah_annual_premium` (subs) + `ah_lifetime_premium` (non-consumable) → all `READY_TO_SUBMIT`.
- Age rating 4+, Free pricing, iPhone 6.7" + iPad 13" screenshots → done.

## Submission rule
GO only when B1–B9 are all GREEN against production in the same run. B9 (a build containing every
mobile fix) is the current gate — never attach/submit a binary that predates the latest mobile fix.
