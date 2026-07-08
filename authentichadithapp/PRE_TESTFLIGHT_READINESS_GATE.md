# PRE_TESTFLIGHT_READINESS_GATE.md — Authentic Hadith iOS App

> **PURPOSE**: Strategic pre-TestFlight gate. Every gate below must be assessed (and most must reach PASS) before `eas build --profile production --platform ios` is run. Engineering readiness alone is NOT sufficient. Apple Review, IAP, and metadata gates block submission even if the build is technically green.

**Generated**: 2026-05-18
**Owner**: AH — Engineering Operator (Claude Code)
**Approver**: KP
**Bundle ID**: `com.byred.authentichadith`
**Version**: 1.0.0
**EAS Project ID**: `66afcbbf-55c3-48fb-9bf1-29efc52d09eb`
**ASC App ID**: `6764673665`

---

## STATUS LEGEND

- **PASS** — verified this session, evidence in trace
- **PENDING** — needs KP human verification on RoPhone, Apple dashboards, or App Store Connect; AI cannot self-verify
- **NOT_READY** — known to be incomplete; do not attempt verification yet
- **FAIL** — verified broken; blocks build

---

## GATE A — EAS Production Environment

**Status**: ✅ **PASS**

**Evidence**:
- `eas env:list --environment production` returns 6 keys (was: "No variables found"):
  - `EXPO_PUBLIC_API_URL`
  - `EXPO_PUBLIC_APP_ENV` (= `production`)
  - `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `EXPO_PUBLIC_SUPABASE_URL`
- Server-only secrets (Stripe, Supabase service role, OpenAI, Groq, Sunnah, Hadith, TruthSerum private/public PEM, Stripe webhook, all `STRIPE_PRICE_ID_*` / `STRIPE_PRODUCT_ID_*`) were filtered OUT of the push. They remain only on the Vercel web backend.
- `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` was dropped because its value was empty (Android not yet configured). iOS-only TestFlight does not need it.
- Temp env file at `/tmp/eas-mobile-prod.env` was deleted post-push (`rm -f /tmp/eas-mobile-prod.env`; verified absent).
- Logged in `BUILD_FIX_LOG.md` as `FIX-040`.

**Blocker?**: None.

---

## GATE B — Real-Device QA (RoPhone)

**Status**: ⏳ **PENDING** (KP human verification required on RoPhone via internal-device build)

KP must run the existing internal-device build on the RoPhone and confirm each path below cold-launches and behaves correctly. Mark each `[x]` or note the failure.

| Path | Confirmed by KP |
|------|-----------------|
| Cold launch (force-quit → re-open) | [ ] |
| Warm relaunch (background → foreground) | [ ] |
| Home tab loads (no crash, AI Summary card renders) | [ ] |
| Collections tab loads | [ ] |
| Hadith detail screen opens | [ ] |
| Large chapter loading beyond 100 hadiths (verifies FIX-037 `.limit(1000)`) | [ ] |
| Search tab + query returns results | [ ] |
| Sunnah tab loads | [ ] |
| Stories tab loads | [ ] |
| Progress / Badges tab loads (verifies FIX-032 unified completion) | [ ] |
| Profile / Settings opens | [ ] |
| Delete Account route reachable + completes | [ ] |

**Blocker?**: Yes. Any unconfirmed row is a TestFlight risk.

---

## GATE C — AI Summary / Assistant

**Status**: ⏳ **PENDING** (KP human verification required on RoPhone)

Backend side is **PASS** (`/api/mobile-chat` returns HTTP 200 JSON in production — verified this session, see FIX-038 / FIX-040 trace).

Client-side paths KP must confirm on RoPhone:

| Path | Confirmed by KP |
|------|-----------------|
| Home AI Summary card generates and renders | [ ] |
| Hadith detail AI Summary works | [ ] |
| Assistant tab works (multi-turn message exchange) | [ ] |

**Blocker?**: Yes. Backend green does not prove the bundled mobile build correctly calls it.

---

## GATE D — Apple Review Demo Account

**Status**: ⏳ **PENDING** (KP verification + private credential storage required)

Apple Review will reject the app if they cannot log in and exercise the core flow. The demo account must exist BEFORE submission and the credentials must appear in App Store Connect → App Review Information.

| Check | Confirmed |
|-------|-----------|
| `applereview@byredllc.com` exists in Supabase Auth | [ ] |
| Email confirmed (not pending verification) | [ ] |
| `public.profiles` row exists for this user with non-null required fields | [ ] |
| Login tested end-to-end on RoPhone | [ ] |
| Password stored privately by KP for the App Store Connect "Sign-in Information" review notes field | [ ] |

**Blocker?**: Yes for App Store submission. NOT a blocker for TestFlight internal testing, but should be done before external TestFlight or production submit.

---

## GATE E — IAP Capability (Apple Developer Portal)

**Status**: ⏳ **PENDING** (KP verification in developer.apple.com)

| Check | Confirmed |
|-------|-----------|
| Apple Developer Portal → Identifiers → `com.byred.authentichadith` exists | [ ] |
| In-App Purchase capability enabled on that identifier | [ ] |
| Push Notifications capability enabled (per FIX-026 — required by RevenueCat) | [ ] |
| Provisioning profile regenerated AFTER capability change (if applicable) | [ ] |

**Blocker?**: Yes if IAP not enabled — RevenueCat init will succeed but no products will ever return.

---

## GATE F — App Store Connect Products

**Status**: ⏳ **PENDING** (KP verification in App Store Connect)

Product IDs must match exactly what `lib/purchases/revenuecat.ts` references. Canonical IDs (confirmed, matching code):

- `ah_monthly_premium`
- `ah_annual_premium`
- `ah_lifetime_premium`

App Store Connect IDs are immutable once approved, so the dashboard MUST use these exact IDs. Mismatch = paywall returns no offerings.

| Check | Confirmed |
|-------|-----------|
| Canonical product ID naming resolved (code is source of truth) | [x] |
| Monthly product created in App Store Connect | [ ] |
| Annual product created in App Store Connect | [ ] |
| Lifetime product created in App Store Connect | [ ] |
| Prices set per tier | [ ] |
| Localizations (at minimum en-US display name + description) configured | [ ] |
| All three products status = Ready to Submit (not Missing Metadata) | [ ] |
| Product IDs in ASC match exactly the IDs read by `lib/revenuecat/config.ts` | [ ] |

**Blocker?**: Yes. No products = no paywall = App Review rejects.

---

## GATE G — RevenueCat Mapping

**Status**: 🟨 **PARTIAL** (`qa:revenuecat` API PASS; KP dashboard + RoPhone verification still pending)

| Check | Confirmed |
|-------|-----------|
| Entitlement `premium` exists | [ ] |
| All three iOS products attached to the `premium` entitlement | [ ] |
| Offering configured (default offering with the three products as packages) | [x] API verified by `npm run qa:revenuecat` |
| Subscription / paywall screen can fetch offerings on RoPhone (no "no offerings configured" error) | [ ] |
| Restore Purchases path reachable from Profile / Settings | [x] Simulator verified 2026-07-08, screenshot `e2e-submit-20260708-39-revenuecat-subscription.png` |
| StoreKit configuration file (`Configuration.storekit`) present in `ios/` for sandbox testing (if used) | [ ] |

**Blocker?**: Partial. The previous zero-package offering blocker is cleared by API verification, but dashboard entitlement proof and RoPhone/TestFlight purchase-path proof still block App Store submission.

---

## GATE H — Privacy / Compliance

**Status**: ⏳ **PENDING** (KP verification — content lives outside this repo)

| Check | Confirmed |
|-------|-----------|
| Privacy policy URL live (likely `https://authentichadith.app/privacy` or similar) | [ ] |
| Privacy policy mentions data collection (Supabase auth, profile data) | [ ] |
| Privacy policy mentions account deletion path (Gate B includes Delete Account route) | [ ] |
| Privacy policy mentions subscriptions / IAP / RevenueCat | [ ] |
| Privacy policy mentions AI assistant behavior (Groq backend, no PII sent to model) | [ ] |
| Content rights / source attribution statement ready (sahih-bukhari, sunnah.com sources — required given FIX-039 content-trust sweep) | [ ] |
| Export compliance answer ready: `ITSAppUsesNonExemptEncryption: false` already set in `app.json`, so the answer in App Store Connect is "No" / "Does not use encryption" — KP just needs to confirm this matches the actual binary | [ ] |
| App Store Connect → App Privacy → Data Types declarations filled out (email, name, identifiers, etc. per Supabase profile fields) | [ ] |

**Blocker?**: Yes for App Store submission. NOT a blocker for internal TestFlight, but should be done before external TestFlight or production submit.

---

## GATE I — Screenshots / Metadata

**Status**: 🚫 **NOT_READY**

Reason: UI is still being verified (Gate B pending). Capturing screenshots before QA confirms stable UI risks shipping outdated assets that must be re-captured after any visual fix.

When Gates B + C reach PASS, return here and execute:

| Asset | Sizes Needed | Confirmed |
|-------|--------------|-----------|
| iPhone 6.7" screenshots (3 minimum, 10 max) | 1290 × 2796 | [ ] |
| iPhone 6.5" screenshots (3 minimum, 10 max) | 1242 × 2688 | [ ] |
| iPad 12.9" screenshots (3 minimum, 10 max — only if `supportsTablet: true` in app.json, which it is) | 2048 × 2732 | [ ] |
| App preview video (optional but recommended) | per device | [ ] |
| App name (30 char): "Authentic Hadith" | [ ] |
| Subtitle (30 char) | [ ] |
| Description (4000 char) | [ ] |
| Keywords (100 char) | [ ] |
| Promotional text (170 char) | [ ] |
| Support URL | [ ] |
| Marketing URL (optional) | [ ] |
| App icon 1024 × 1024 (no alpha, no transparency) | [ ] |

**Blocker?**: Yes for App Store submission. NOT a blocker for internal TestFlight (TestFlight only requires beta description + email), but full metadata is needed before submitting for App Review.

---

## SHOULD WE RUN PRODUCTION EAS BUILD NOW?

# 🚫 NO — DO NOT RUN PRODUCTION BUILD YET

**Reason**:

The engineering build is technically green (Gate A PASS, expo-doctor 17/17, tsc 0 errors, deps pinned, endpoint 200). But Gates B through I are unconfirmed:

- **Gate B (RoPhone QA)** — no real-device sign-off on 12 core paths
- **Gate C (AI Summary on device)** — backend works but mobile-bundled client untested
- **Gate D (Apple Review demo account)** — credentials and Supabase row not confirmed
- **Gate E (IAP capability)** — Apple Developer Portal not verified
- **Gate F (App Store Connect products)** — products and ID-naming mismatch unresolved
- **Gate G (RevenueCat mapping)** — entitlement and offering not confirmed
- **Gate H (Privacy / Compliance)** — privacy policy and ASC App Privacy declarations unconfirmed
- **Gate I (Screenshots / Metadata)** — explicitly NOT_READY

Running the production build now would produce a binary that *might* upload cleanly but would either:
1. Be wasted ops minutes if QA surfaces a UI bug requiring a rebuild (autoIncrement burns a build number every time).
2. Reach TestFlight only to be untestable because RevenueCat returns no offerings (Gate F/G).
3. Reach App Review and get rejected on Gate D, H, or I.

**Cost of waiting**: zero — the engineering work is already done and frozen behind FIX-040.
**Cost of building now**: a wasted build number, possible duplicate review rejection, and review timer reset.

---

## EXACT NEXT KP ACTION

Pick the lowest-friction unblock and work upward:

1. **Tonight or tomorrow morning**: Install the latest internal-device build on RoPhone and run through every row in **Gate B** and **Gate C**. Mark each `[x]` directly in this file. Estimated: 20 minutes.
2. **Same session**: Open Supabase Auth dashboard, create `applereview@byredllc.com`, confirm email, verify `public.profiles` row exists. Store the password in 1Password / password manager. Test the login on RoPhone. (Gate D). Estimated: 10 minutes.
3. **Next session**: Open developer.apple.com → Identifiers → `com.byred.authentichadith` and confirm IAP + Push Notifications capabilities are on. (Gate E). Estimated: 5 minutes.
4. **Next session**: Reconcile product ID naming. Read `lib/revenuecat/config.ts` and write the canonical IDs into the dashboard. Create the three products in App Store Connect → In-App Purchases. (Gate F). Estimated: 30 minutes.
5. **Next session**: RevenueCat dashboard → Products tab → attach the three iOS products → Entitlements tab → attach to `premium` → Offerings tab → confirm default offering. Test on RoPhone. (Gate G). Estimated: 20 minutes.
6. **Before submission only**: Privacy policy + ASC App Privacy declarations + screenshots (Gates H + I). Estimated: 2-3 hours.

After Gates B, C, E, F, G all show PASS, return here, run a fresh check, then trigger the production build.

---

## INSTRUCTIONS FOR NEXT CLAUDE SESSION

1. Do NOT run `eas build --profile production --platform ios` until at least Gates A, B, C, E, F, G all show PASS and KP has explicitly approved.
2. Do NOT modify this file's PASS/PENDING/NOT_READY values without KP confirmation. KP marks gates as he completes them.
3. If KP says "we're clear, run the build," re-read this file first and verify Gates B, C, E, F, G show PASS (checkboxes ticked). If any are still pending, push back before running.
4. If a new blocker appears during QA, file it in `ERROR_REPORT.md` as 🔴 ACTIVE and pause this gate.
