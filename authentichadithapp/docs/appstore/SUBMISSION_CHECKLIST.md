# Submission Checklist — Authentic Hadith v1.0

Generated: 2026-06-09 | Branch: release/appstore-ready-v1.0 | Last updated: 2026-06-09 (GAP 1+2 closed)

**CODE VERDICT: GO. All automated gates closed. PR #28 holds for KP human-only review and merge.**

---

## [DONE-CODE] Items completed this run (with receipts)

### C1 — PrivacyInfo.xcprivacy / NSPrivacyAccessedAPITypes

**Status: Verified — no additions required.**

Current manifest in `app.json:26-48` covers all required-reason APIs for this dependency stack:

| API Category | Reasons Set | Justification |
|---|---|---|
| NSPrivacyAccessedAPICategoryUserDefaults | CA92.1 | RevenueCat SDK reads/writes NSUserDefaults for subscription state and configuration. CA92.1 = "Access from this app or extension" — correct. |
| NSPrivacyAccessedAPICategoryFileTimestamp | C617.1, 0A2A.1, 3B52.1 | React Native runtime and Expo modules access file timestamps for asset bundling and cache validation. Three reasons cover: app file timestamps (C617.1), display to user (0A2A.1), no semantic meaning to access (3B52.1). |
| NSPrivacyAccessedAPICategoryDiskSpace | 85F4.1, E174.1 | Expo and React Native check disk space before writing bundles and assets. 85F4.1 = app's own container, E174.1 = display to user. |
| NSPrivacyAccessedAPICategorySystemBootTime | 35F9.1 | Supabase/networking libraries use boot time for monotonic clock/timeout calculations. 35F9.1 = calculate elapsed time. |

**react-native-purchases (RevenueCat):** Requires UserDefaults (CA92.1 — present) and FileTimestamp access. Both are already declared.

**expo-secure-store:** Uses iOS Keychain API exclusively. Keychain is NOT in the Apple required-reason API list — no entry needed. Confirmed via Apple's "Describing use of required reason API" documentation.

**Groq API / Supabase:** HTTPS networking only. No additional required-reason APIs beyond SystemBootTime (35F9.1 — present).

**ATT (App Tracking Transparency):** No `requestTrackingAuthorization` or `ATTrackingManager` calls found in codebase (grep confirmed zero matches). `NSPrivacyTracking: false` in app.json is correct. No ATT prompt, no NSUserTrackingUsageDescription needed.

Receipt: `app.json:26-48` read and verified 2026-06-09.

**Physical file receipt (2026-06-09):**
- File present: `authentichadithapp/ios/AuthenticHadith/PrivacyInfo.xcprivacy` (48 lines, plist format, all 4 API categories + NSPrivacyTracking=false + NSPrivacyCollectedDataTypes=[])
- pbxproj file reference: `14BBB2C22DA81FCE83797FA4 /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; includeInIndex = 1; name = PrivacyInfo.xcprivacy; path = AuthenticHadith/PrivacyInfo.xcprivacy; sourceTree = "<group>"; };`
- pbxproj build file (Copy Bundle Resources): `D11106C3C2017F5EB59D161B /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = 14BBB2C22DA81FCE83797FA4 /* PrivacyInfo.xcprivacy */; };`
- Build type: **CNG/Expo prebuild** — `ios.privacyManifests` in `app.json:26-48` drives generation; `ios/` directory is a committed prebuild output. Both the source config and the emitted file are present and consistent.

---

### C2 — Export Compliance (ITSAppUsesNonExemptEncryption)

**Status: Verified — `ITSAppUsesNonExemptEncryption: false` is correct.**

Analysis of all encryption in the app:

| Component | Encryption Used | Exempt? | Reason |
|---|---|---|---|
| All API calls (Supabase, Groq, RevenueCat) | HTTPS / TLS 1.2+ | YES | Standard TLS, EAR 740.13(e) exemption |
| expo-secure-store | iOS Keychain (AES-256) | YES | System-provided API, not custom crypto. EAR 740.13(e) exemption applies to apps using only OS-provided encryption. |
| RevenueCat SDK | TLS only | YES | No custom encryption layer |
| Groq API client | HTTPS only | YES | Standard TLS |

No non-exempt encryption (custom algorithms, custom VPN protocols, or non-OS crypto libraries) is used anywhere in the app. `ITSAppUsesNonExemptEncryption: false` set at `app.json:23` is correct and no ERN (Encryption Registration Number) is required.

Receipt: `app.json:23` read and verified 2026-06-09.

---

### C3 — NS*UsageDescription Strings

**Status: Verified — no NS*UsageDescription strings are required.**

Permissions audit for the full plugin and dependency stack:

| Plugin / SDK | iOS Permission Required | NS*UsageDescription Needed? |
|---|---|---|
| expo-router | None | No |
| expo-splash-screen | None | No |
| expo-secure-store | Keychain (system, no prompt) | No |
| expo-web-browser | None | No |
| expo-font | None | No |
| react-native-purchases | StoreKit (system, no prompt) | No |
| Supabase JS client | Network (standard) | No |
| Groq SDK | Network (standard) | No |
| expo-notifications | NOT in dependency list | N/A |

Grep for camera, photo, location, microphone, contact, calendar, bluetooth, face/touch ID, notification permissions, health, motion, tracking across `app.json`, `app.config.js`, and all `.plist` files returned zero matches for sensitive permission APIs.

No NS*UsageDescription strings need to be added to `app.json infoPlist`.

Receipt: Grep run 2026-06-09, zero sensitive permission matches in app.json/js/plist files.

---

### C4 — App Icon and Launch Screen

**Status: Icon — Verified dimensions, alpha channel confirmed absent. Launch screen — Verified path.**

- Icon path: `assets/images/icon.png` (`app.json:7`)
- `file` command output: `PNG image data, 1024 x 1024, 8-bit/color RGB, non-interlaced`
- Dimensions: 1024x1024 — correct for App Store requirement.
- Color mode: `8-bit/color RGB` — this is RGB, NOT RGBA. No alpha channel present. App Store requirement satisfied.
- Splash screen path: `assets/images/splash-icon.png` (`app.json:11`)

**Version / Build Number:**
- Version string: `1.0.0` (`app.json:5`)
- Build number: `5` (`app.json:21`) — this is a floor value only. `eas.json:27` has `autoIncrement: true` on the production profile, so EAS will auto-increment the build number on each `eas build` run. No manual bump needed.

**Required App Store Screenshot Sizes:**

| Display | Resolution | Required? |
|---|---|---|
| 6.9" iPhone 16 Pro Max | 1320 x 2868 px | Minimum required (OR 6.5") |
| 6.5" iPhone 14 Plus / 15 Plus | 1284 x 2778 px | Minimum required (OR 6.9") |
| 5.5" iPhone 8 Plus | 1242 x 2208 px | Optional but recommended |
| 12.9" iPad Pro (3rd gen+) | 2048 x 2732 px | Required if supportsTablet: true |

Note: `app.json:19` sets `supportsTablet: true`. This means iPad screenshots (2048x2732) are required in App Store Connect.

Receipt: `file assets/images/icon.png` run 2026-06-09, output shows `8-bit/color RGB` (no alpha).

---

### C5 — EAS Production Profile Verification

**Status: Verified — production profile is correctly configured.**

- `eas.json:24-27`: production profile exists with `environment: production` and `autoIncrement: true`.
- `eas.json:30-35`: submit profile exists with `ascAppId: 6764673665`.
- `app.json:89`: EAS project ID `66afcbbf-55c3-48fb-9bf1-29efc52d09eb` matches expected value.
- `app.json:20`: bundle ID `com.byred.authentichadith` matches what is declared in eas.json submit profile context.

**Exact commands KP must run (DO NOT run until PR is merged and build is approved):**

```bash
# Step 1 — Build for App Store (run from repo root after PR merged to main)
eas build --platform ios --profile production

# Step 2 — Submit to App Store Connect (run AFTER build completes and KP approves the binary)
eas submit --platform ios --profile production
```

The `--profile production` flag ensures EAS uses the ascAppId `6764673665` from `eas.json:33` for auto-submission routing.

Receipt: `eas.json:1-36` and `app.json:85-92` read and verified 2026-06-09.

---

### C6 — Test Suite (all 4 required suites + full regression)

**Status: Verified — 82/82 tests passing.**

Runner: `npm test -- --watchAll=false --forceExit` executed 2026-06-09 from `authentichadithapp/`.

| Suite | File | Result |
|---|---|---|
| delete-account | `__tests__/delete-account.test.ts` | PASS |
| mobile-chat | `__tests__/mobile-chat.test.ts` | PASS |
| revenuecat | `__tests__/revenuecat.test.ts` | PASS |
| ai-safeguards | `__tests__/ai-safeguards.test.ts` | PASS |
| navigation | `__tests__/navigation/route-integrity.test.ts` | PASS |
| groq-api | `__tests__/ai/groq-api.test.ts` | PASS |
| supabase client | `__tests__/supabase/client.test.ts` | PASS |
| login-screen | `__tests__/auth/login-screen.test.tsx` | PASS |
| error-boundary | `__tests__/ui/error-boundary.test.tsx` | PASS |
| auth-provider | `__tests__/auth/auth-provider.test.tsx` | PASS |

**Runner summary (verbatim):**
```
Test Suites: 10 passed, 10 total
Tests:       82 passed, 82 total
Snapshots:   0 total
Time:        3.612 s
```

No skipped tests. No mocks missing. console.error/info lines are expected log output from the route logic under test, not failures.

Receipt: terminal output 2026-06-09, `npm test -- --watchAll=false --forceExit`.

---

## [HUMAN-ONLY] Items requiring KP action before submission

These cannot be automated. Each must be completed before `eas submit` is run.

| Priority | Action Needed | Why | Exact Step |
|---|---|---|---|
| 1 | Merge PR release/appstore-ready-v1.0 into main | EAS production build must build from main | KP reviews and approves PR in GitHub, merges via GitHub UI |
| 2 | App Store Connect — create IAP products | App will crash at paywall if IAP products do not exist in ASC | In ASC > Monetization > In-App Purchases, create: `ah_monthly_premium` (Auto-Renewable), `ah_annual_premium` (Auto-Renewable), `ah_lifetime_premium` (Non-Consumable). Set all three to "Ready to Submit". |
| 3 | App Store Connect — sign Paid Apps agreement | Cannot sell IAPs without signed agreement | ASC > Agreements, Tax, and Banking > sign Paid Apps agreement |
| 4 | App Store Connect — set prices for each IAP tier | IAPs require price tiers before going live | In each IAP product page, set the price tier (e.g., $4.99/mo, $29.99/yr, $49.99 lifetime) |
| 5 | Supabase — run DEMO_ACCOUNT.sql | App Review team logs in as apple.reviewer@authentichadith.app; if account does not exist, review fails | Open Supabase dashboard > SQL Editor > run DEMO_ACCOUNT.sql |
| 6 | App Store Connect — fill App Privacy labels | Required before submission | Use `docs/PRIVACY_LABELS.md` (or equivalent) as source. Navigate ASC > App Privacy > fill all data collection sections. |
| 7 | App Store Connect — set Age Rating | Required field for submission | ASC > App Information > Age Rating. Given app is Islamic religious content, no adult content: likely 4+ or 9+. Answer the questionnaire. |
| 8 | Vercel — verify env vars and redeploy | Backend API at authentichadith.app must be live with correct env vars | Check Vercel dashboard for any missing env vars, redeploy if any changes were made |
| 9 | TestFlight — cold-launch QA on real device | Simulator does not catch StoreKit, Keychain, or network edge cases | Install IPA from TestFlight on physical iPhone, run cold launch, test paywall flow end to end |
| 10 | Upload screenshots to App Store Connect | Required before submission — minimum 6.9" or 6.5" | Capture at required resolutions (see C4 above). iPad screenshots required because supportsTablet: true. Upload in ASC > App Store > Screenshots. |
| 11 | Verify icon.png has no alpha channel (secondary confirmation) | Already confirmed via `file` command (8-bit/color RGB), but if any doubt, run: `python3 -c "from PIL import Image; img=Image.open('assets/images/icon.png'); print(img.mode)"` — should print `RGB` not `RGBA` | See C4 receipt — already looks clean. |
| 12 | Run `eas build --platform ios --profile production` | Compiles and uploads the IPA to EAS | Run ONLY after PR is merged to main. Wait for build to complete (~15-20 min). |
| 13 | Run `eas submit --platform ios --profile production` | Submits the completed build to App Store Connect | Run ONLY after build is approved and KP confirms the binary looks correct in EAS dashboard. |

---

## Reviewer Enablement

| Item | Status | Notes |
|---|---|---|
| `docs/appstore/DEMO_ACCOUNT.sql` created | [HUMAN-ONLY] | KP must run in Supabase SQL Editor. Must also grant "premium" Promotional Entitlement in RevenueCat dashboard to App User ID `00000000-0000-0000-0000-000000000001` before review opens. |
| `docs/appstore/REVIEW_NOTES.md` created | [DONE-CODE] | Contains demo credentials, paywall navigation steps, AI model details, safeguards, disclaimer locations, and reviewer notes. |

---

## Reference

- Bundle ID: `com.byred.authentichadith`
- Version: `1.0.0` (build number auto-increments via EAS)
- EAS Project ID: `66afcbbf-55c3-48fb-9bf1-29efc52d09eb`
- ASC App ID: `6764673665`
- API base: `https://authentichadith.app`
