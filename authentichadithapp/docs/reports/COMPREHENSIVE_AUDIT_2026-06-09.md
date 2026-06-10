# Authentic Hadith — Comprehensive Submission Audit
Date: 2026-06-09 | Auditor: Claude (Opus 4.8) | Branch: release/appstore-ready-v1.0
Method: TruthSerum — every claim below has a receipt I generated this session, not a doc I trusted.

## VERDICT: NO-GO

One **hard functional blocker** (AI backend route 404 in production) plus the standard
human-only App Store Connect tasks. All in-repo code work is genuinely clean and verified.
The app is one backend deploy + the ASC checklist away from submittable.

---

## 1. BLOCKER — AI feature is broken in production (HARD)

The mobile app's AI assistant calls `${baseUrl}/api/mobile-chat` (`lib/api/groq.ts:39`).
Runtime baseUrl resolves to `https://www.authentichadith.app` (`app.config.js` normalizeApiBaseUrl).

Live probe, 2026-06-09:
```
POST https://www.authentichadith.app/api/mobile-chat  -> HTTP 404
POST https://authentichadith.app/api/mobile-chat      -> HTTP 307 (redirects to www -> 404)
GET  https://www.authentichadith.app/                 -> HTTP 200  (site is up)
```

Root cause (ERROR_REPORT.md BUG-C, confirmed still live): production deploys from
`origin/main` on Rory's repo, which is missing `app/api/mobile-chat/route.ts`. The route
exists locally; it has never reached the deployed branch.

Why this is a submission blocker, not a nice-to-have:
- The AI assistant is a core feature AND the thing the premium paywall gates.
- If the Apple reviewer opens the AI tab, it 404s -> Guideline 2.1 (App Completeness) rejection.
- Paying users would hit a dead core feature on day one.

Fix: deploy the mobile-chat route to the production backend (Rory's Vercel) and re-probe
until it returns 200/401 instead of 404. This is gated infra (Rory's), so it needs his
authorization. Until this endpoint answers, NO-GO regardless of everything else.

---

## 2. CONTENT INTEGRITY — Sahihayn-only decision is sound, one honesty gap remains

Decision shipped (commit 0e39e5a): V1 ships Sahih al-Bukhari + Sahih Muslim only. The 5
non-Sahihayn collections (unreliable heuristic grades) + Musnad Ahmad (under-seeded) are
hidden via `HIDDEN_COLLECTION_FILTER`, wired consistently across every surface (index,
collections, search, today, quiz, topics). Good call — it removes the grade-integrity risk.

Remaining gap (KP's own "do not exaggerate" standard):
- Headline count `VISIBLE_HADITH_TOTAL = 14_444` (`lib/hadith/visibleCollections.ts`) is the
  raw row count and includes ~203 fully-blank Muslim rows + ~42 Bukhari/Muslim duplicate
  hadith_number rows. The live feed query correctly filters blanks
  (`index.tsx:65-66 .not('english_text','is',null).neq('english_text','')`), so users never
  see blank cards — but the advertised number overstates the viewable corpus by ~245.
- Honest viewable total is ~14,199, not 14,444. For an app literally named "Authentic
  Hadith," shipping an inflated count cuts against the brand. Either (a) purge the 203 blank
  Muslim rows + dedupe in nq and keep the number truthful, or (b) drop the headline to a
  conservative rounded "14,000+" / compute it live. Not an Apple blocker; it is a KP-standard
  blocker.

---

## 3. GREEN — verified clean this session (my receipts, not the docs')

| Gate | Result | Receipt |
|---|---|---|
| TypeScript | PASS | `npx tsc --noEmit` -> exit 0, 0 lines output |
| Tests | PASS | `jest` -> 10 suites, 82/82 pass, exit 0 |
| ESLint | PASS | `expo lint` -> exit 0, no findings |
| Secrets not committed | PASS | `.env.local` NOT git-tracked; `.gitignore` covers `.env*.local`; no live-key patterns in tracked non-doc files |
| iOS payment compliance (3.1.1) | PASS | mobile paywall uses RevenueCat `purchasePackage`/`restorePurchases` (`app/settings/subscription.tsx`); zero Stripe refs in mobile app code — Stripe is web-backend only |
| App icon | PASS | 1024x1024, RGB, `hasAlpha: no` (`sips`) |
| Splash | PASS | 1024x1024 present, configured `app.json` + expo-splash-screen plugin |
| Privacy manifest | PASS | `ios/AuthenticHadith/PrivacyInfo.xcprivacy` present + referenced in pbxproj; `app.json` privacyManifests covers 4 required-reason API categories; `NSPrivacyTracking:false`, no ATT calls |
| Export compliance | PASS | `ITSAppUsesNonExemptEncryption:false` — only OS/TLS crypto, no ERN needed |
| NS*UsageDescription | PASS | no camera/location/mic/photo/contacts APIs in stack; none required |
| Build wiring | PASS | bundle `com.byred.authentichadith`, version 1.0.0, buildNumber 5 (auto-increments), EAS projectId `66afcbbf-...`, ascAppId `6764673665` consistent across app.json/eas.json |
| Demo account | PASS (code) | `DEMO_ACCOUNT.sql` now hashes inline via pgcrypto (no placeholder) — working-tree version fixed the stale "placeholder" the readiness doc mentions |

---

## 4. HUMAN-ONLY — Apple/dashboard tasks (no code blocker, but submission can't happen without them)

1. Merge `release/appstore-ready-v1.0` -> main (PR not yet merged; branch is 8 commits ahead of main).
2. Commit the uncommitted working-tree changes (APPSTORE_METADATA.md, DEMO_ACCOUNT.sql) + untracked audit scripts/docs, or discard intentionally.
3. App Store Connect: create IAP products `ah_monthly_premium` (auto-renew), `ah_annual_premium` (auto-renew), `ah_lifetime_premium` (non-consumable); set prices; set all to **Ready to Submit**.
4. App Store Connect: sign Paid Apps agreement.
5. RevenueCat: grant premium promotional entitlement to the demo reviewer App User ID.
6. Supabase: run `DEMO_ACCOUNT.sql` so `apple.reviewer@authentichadith.app` exists.
7. App Store Connect: fill App Privacy labels (source: `docs/appstore/PRIVACY_LABELS.md`).
8. App Store Connect: set Age Rating (4+ recommended — no objectionable content).
9. Screenshots: 6.9" (or 6.5") iPhone + iPad 2048x2732 (required because `supportsTablet:true`).
10. TestFlight: cold-launch on a real iPhone; test paywall purchase + restore end to end (StoreKit/Keychain don't fully exercise on simulator).
11. `eas build --platform ios --profile production` -> then `eas submit --platform ios --profile production`.

---

## Bottom line

Code side is the cleanest it has been — types, tests, lint, security, IAP wiring, privacy,
compliance all verified green by me, not just asserted by prior docs. Two things stand between
this and a submittable binary:

- **Must-fix:** deploy `/api/mobile-chat` to production so the AI feature stops 404ing (gated on Rory).
- **Should-fix (KP standard):** correct the inflated 14,444 headline to the honest ~14,199.

Then it's the mechanical ASC checklist + one real-device QA pass. No deep code work left.
