# Xcode Native Release Audit — Authentic Hadith iOS App

**Audit Date:** 2026-05-07
**Auditor Role:** Senior Apple Release Engineer
**Last Update:** 2026-05-07 (FIX-027 — C-01 invalidated, RevenueCat plugin reverted)
**App Version:** 1.0.0
**Bundle ID:** com.byred.authentichadith
**EAS App Store Connect ID:** 6764673665
**Apple Developer Team:** LXL3ZMHHK6

---

## Release Readiness Score: 7.5 / 10 (was 6.5 / 10, briefly 8.0 before FIX-027 correction)

C-02, C-03, and M-01 are resolved at the config layer. **C-01 has been INVALIDATED** by FIX-027 — the original audit premise was wrong. `react-native-purchases` v9.x does not ship an Expo config plugin; the In-App Purchase capability is enabled externally through the Apple Developer portal (now consolidated into M-05). Native verification deferred until `npx expo prebuild --clean` or an EAS build runs with KP approval. Remaining work is external (Apple Developer portal IAP capability toggle, App Store Connect, Supabase demo account, web hosting) plus one low-risk hybrid-layer item.

### Status from FIX-026 / FIX-027
- ❌ C-01 RevenueCat plugin — **INVALID** (FIX-027). Package does not ship an Expo config plugin. Capability enabling moved to M-05.
- ✅ C-02 Push entitlement — confirmed orphaned (no plugin, no code); will be eliminated by next clean prebuild
- ✅ C-03 Display name — `expo.name` and `CFBundleDisplayName` both set to "Authentic Hadith"
- ✅ M-01 Build number — `app.json` synced to "4"; EAS production `autoIncrement` will manage from here

### Remaining
- 🟡 M-02 Deployment target alignment — requires `expo-build-properties` plugin (NOT installed; deferred to KP approval before installing)
- 🔴 M-03 Demo review account — must be created in Supabase (manual)
- 🔴 M-04 Privacy policy URL — deploy `privacy-policy.html` to `https://byredllc.com/privacy` (manual, external)
- 🔴 M-05 Product ID verification — requires App Store Connect + RevenueCat dashboard access (manual, external)
- 🟡 P-03 PortraitUpsideDown — cosmetic, no rejection risk
- 🟡 P-04 Notifications stub — keep "coming soon" label or hide row until v1.1

---

## CRITICAL BLOCKERS (Must fix before TestFlight)

### C-01: react-native-purchases plugin registration — ❌ INVALID (FIX-027)
**This blocker was based on a wrong premise. There is no fix to apply at the Expo plugin layer.**

- **Original claim:** "RevenueCat's Expo config plugin registers the In-App Purchase capability on the native target. Without it, StoreKit entitlements may not be present in the provisioning profile during EAS builds."
- **Why it was wrong:** `react-native-purchases` v9.x (currently 9.15.2 installed) does not ship an Expo config plugin. There is no `app.plugin.js` at the package root and no `expo` field in its `package.json`. Adding it to `expo.plugins` causes `npx expo config --json` to fail with `Unable to resolve a valid config plugin for react-native-purchases`, which blocks every EAS build and local prebuild.
- **What FIX-026 did:** Added `"react-native-purchases"` to `expo.plugins`. The next EAS preview build immediately failed pre-flight.
- **What FIX-027 did:** Removed the entry. Restored the build pipeline.
- **How RevenueCat actually wires into Expo:** Standard React Native autolinking handles the JS bridge during prebuild. The In-App Purchase capability is enabled externally:
  1. Apple Developer portal → Identifiers → `com.byred.authentichadith` → Capabilities → toggle In-App Purchase ON
  2. App Store Connect → My Apps → Authentic Hadith → Features → In-App Purchases → create products with IDs matching `lib/purchases/revenuecat.ts` (consolidated into M-05)
  3. RevenueCat dashboard → Products → confirm product IDs match
- **Verification (post-prebuild or post-EAS-build):**
  ```bash
  # Option 1: After local prebuild
  grep -i "in-app-payments\|InAppPurchase" ios/AuthenticHadithApp/AuthenticHadithApp.entitlements
  # If missing, the Apple Developer portal capability is not toggled — fix in (1) above
  
  # Option 2: After EAS build
  # Inspect the EAS build logs for "in-app-payments" or check the .ipa entitlements
  ```
- **App Store Risk:** ZERO at the config-plugin layer (no fix exists there). Risk now lives entirely in M-05 (external capability + product ID verification).

### C-02: Push notification entitlement present but push not implemented — ✅ RESOLVED (FIX-026)
**Resolution note:** No `expo-notifications` plugin registered, no push code anywhere in the JS layer. The orphan `aps-environment` entitlement in the existing `ios/` folder will be eliminated automatically on the next `npx expo prebuild --clean` run. No code change needed; verification deferred to post-prebuild.

- **File:** `ios/AuthenticHadithApp/AuthenticHadithApp.entitlements`
- **Root Cause:** Entitlements file declares `aps-environment = development` but the app has no push notification code. The notification settings screen (`app/settings/notifications.tsx`) is a disabled stub with switches set to `false`.
- **Evidence:** No `expo-notifications` plugin in app.json. No `getExpoPushToken()` calls. No notification permission request code.
- **Risk:** Apple may question why the app claims push capability but never requests permission. Could trigger review questions or delay.
- **Fix Location:** VS Code (app.json) + requires `npx expo prebuild`
- **Option A (remove):** Remove `aps-environment` from entitlements if push is not shipping in v1.0. Remove or mark the notification settings screen as "Coming Soon" more prominently.
- **Option B (implement):** If push is shipping, add `expo-notifications` to plugins and implement the permission flow.
- **Recommendation:** Option A for v1.0. Ship without push, remove the entitlement, clean up the stub screen.
- **Verification:** After prebuild, confirm entitlements file no longer contains `aps-environment`.
- **App Store Risk:** MEDIUM — may trigger reviewer questions.

### C-03: CFBundleDisplayName is "AuthenticHadithApp" (developer name, not user-facing) — ✅ RESOLVED (FIX-026)
- **File:** `ios/AuthenticHadithApp/Info.plist` (line 10)
- **Root Cause:** Expo prebuild used the raw project name instead of a clean display name. The APPSTORE_METADATA.md says the app name should be "Authentic Hadith".
- **Evidence:** `<string>AuthenticHadithApp</string>` under CFBundleDisplayName.
- **Risk:** Users see "AuthenticHadithApp" on their home screen. Looks unprofessional. Apple may flag name mismatch with App Store listing.
- **Fix Location:** VS Code (app.json)
- **Fix:** Add to `app.json` under `expo.ios`:
  ```json
  "ios": {
    "bundleIdentifier": "com.byred.authentichadith",
    "buildNumber": "1",
    "name": "Authentic Hadith",
    "infoPlist": {
      "ITSAppUsesNonExemptEncryption": false,
      "CFBundleDisplayName": "Authentic Hadith"
    }
  }
  ```
- **Verification:** After prebuild, check Info.plist CFBundleDisplayName shows "Authentic Hadith".
- **App Store Risk:** REJECTION RISK — name mismatch with App Store Connect listing.

---

## MEDIUM ISSUES (Must fix before App Store submission)

### M-01: Build number mismatch between app.json and project.pbxproj — ✅ RESOLVED (FIX-026)
**Resolution note:** `app.json` `ios.buildNumber` synced from "1" → "4". EAS production profile has `autoIncrement: true`, so future builds will increment from this baseline.

- **File:** `app.json` line 22 vs `project.pbxproj` lines 361/398
- **Root Cause:** `app.json` says `buildNumber: "1"` but `project.pbxproj` says `CURRENT_PROJECT_VERSION = 3`. Previous local builds incremented the native value without updating Expo config.
- **Risk:** EAS with `appVersionSource: "remote"` may override this, but manual Xcode archives would use the wrong number. App Store Connect rejects duplicate build numbers.
- **Fix Location:** VS Code (app.json). Sync to highest value.
- **Fix:** Update `app.json` buildNumber to `"4"` (next after current 3) or rely entirely on EAS remote versioning (which the eas.json `autoIncrement: true` already does for production).
- **Verification:** Confirm EAS production builds auto-increment. If doing local Xcode archive, verify build number is unique.
- **App Store Risk:** LOW if using EAS. HIGH if archiving locally from Xcode.

### M-02: Deployment target mismatch (15.1 vs 16.1) — 🟡 DEFERRED
**Status note:** Aligning to 16.0 cleanly requires the `expo-build-properties` plugin, which is NOT currently in `package.json`. Per process rules, packages are not auto-installed without KP approval. Decision: leave as-is until KP authorizes installing `expo-build-properties`. Risk is LOW — current mismatch is functional, not blocking.

- **Files:** `Podfile` line 19 sets platform to `15.1`. `project.pbxproj` lines 369/401 set `IPHONEOS_DEPLOYMENT_TARGET = 16.1` for the app target. Project-level settings (lines 473/534) say `15.1`.
- **Root Cause:** Expo prebuild set 15.1, then either a manual change or config plugin bumped the app target to 16.1. The Podfile still reads `15.1` from `Podfile.properties.json`.
- **Risk:** Pods compile for iOS 15.1 but the app targets 16.1. This works (higher target includes lower), but is inconsistent. If a pod uses iOS 16+ API with availability checks against the 15.1 target, runtime crashes are possible on iOS 15 devices.
- **Fix Location:** VS Code (Podfile.properties.json or app.json)
- **Fix:** Align everything to 16.0 (recommended minimum for modern features):
  - In `Podfile.properties.json`: `"ios.deploymentTarget": "16.0"`
  - This flows to both Podfile and project settings on next prebuild.
- **Verification:** After prebuild, check both Podfile platform and IPHONEOS_DEPLOYMENT_TARGET are 16.0.
- **App Store Risk:** LOW — functional but sloppy.

### M-03: Demo account for Apple review not yet created
- **File:** `APPSTORE_METADATA.md` line 61
- **Root Cause:** The metadata doc says "NOTE: You must create this account in your Supabase dashboard before submitting." The review credentials (applereview@byredllc.com / AppleReview2026!) must actually exist and work.
- **Risk:** Apple reviewer cannot log in. Immediate rejection.
- **Fix Location:** Supabase dashboard (external)
- **Fix:** Create the demo account in Supabase Auth. Verify login works. Set it to premium tier so reviewers can test all features.
- **Verification:** Log in with demo credentials on a test device. Confirm all screens load.
- **App Store Risk:** REJECTION — Guideline 2.1 (incomplete information).

### M-04: Privacy policy URL must be live and accessible
- **File:** `APPSTORE_METADATA.md` line 50 references `https://byredllc.com/privacy`
- **Root Cause:** A `privacy-policy.html` file exists in the project, but it must be deployed and accessible at the URL provided to App Store Connect.
- **Risk:** If the URL returns 404, Apple rejects.
- **Fix Location:** External (web hosting)
- **Fix:** Deploy `privacy-policy.html` to `https://byredllc.com/privacy`. Verify it loads.
- **Verification:** Open `https://byredllc.com/privacy` in a browser. Confirm it renders the full privacy policy.
- **App Store Risk:** REJECTION — Guideline 5.1.1 (privacy policy required).

### M-05: Product IDs may not match BUILD_FIX_LOG historical values
- **File:** `lib/purchases/revenuecat.ts` lines 33-36 vs `BUILD_FIX_LOG.md` FIX-007
- **Current code:** `ah_monthly_premium`, `ah_annual_premium`, `ah_lifetime_premium`
- **BUILD_FIX_LOG reference:** `ah_monthly_999`, `ah_annual_4999`, `ah_lifetime_9999`
- **Root Cause:** Product IDs were updated in code but BUILD_FIX_LOG references old IDs. Need to verify which IDs are actually configured in App Store Connect and RevenueCat dashboard.
- **Risk:** If App Store Connect has the old IDs, purchases will fail silently.
- **Fix Location:** External (App Store Connect + RevenueCat dashboard)
- **Fix:** Verify product IDs in: (1) App Store Connect > In-App Purchases, (2) RevenueCat dashboard > Products, (3) code. All three must match exactly.
- **Verification:** Check RevenueCat dashboard products match code values.
- **App Store Risk:** HIGH — silent purchase failure = rejection.

---

## POLISH ISSUES (Fix before or shortly after launch)

### P-01: LSMinimumSystemVersion set to 12.0 (macOS key, harmless but noisy)
- **File:** `ios/AuthenticHadithApp/Info.plist` line 44
- **Root Cause:** Expo prebuild template includes this macOS Catalyst key. Harmless on iOS-only apps.
- **Risk:** None. Cosmetic.
- **Fix:** No action needed unless shipping Mac Catalyst.

### P-02: exp+authentichadithapp URL scheme is a development artifact
- **File:** `ios/AuthenticHadithApp/Info.plist` lines 33-37
- **Root Cause:** Expo dev client registers this scheme for development builds. It persists in the prebuild output.
- **Risk:** None for production (scheme is unused). Slightly unprofessional if Apple reviewer inspects.
- **Fix:** This is removed automatically by EAS production builds. No manual action needed.

### P-03: PortraitUpsideDown orientation enabled on iPhone
- **File:** `ios/AuthenticHadithApp/Info.plist` lines 72-73
- **Root Cause:** Expo includes both portrait orientations by default.
- **Risk:** Users can accidentally flip the app upside down. Unusual for modern apps.
- **Fix Location:** VS Code (app.json)
- **Fix:** Consider removing `UIInterfaceOrientationPortraitUpsideDown` from iPhone orientations. Most hadith reading apps are portrait-only.
- **App Store Risk:** NONE.

### P-04: Notification settings screen shows disabled UI
- **File:** `app/settings/notifications.tsx`
- **Root Cause:** Stub screen with `Switch value={false} disabled`. Says "coming soon."
- **Risk:** Apple may question why a settings screen exists with non-functional controls.
- **Fix:** Either hide the notifications row from settings until implemented, or keep the "coming soon" label prominent. Apple generally accepts "coming soon" for non-core features.
- **App Store Risk:** LOW.

---

## Files and Configs Inspected

| File | Location | Status |
|------|----------|--------|
| `Info.plist` | ios/AuthenticHadithApp/ | Reviewed |
| `AuthenticHadithApp.entitlements` | ios/AuthenticHadithApp/ | Reviewed |
| `AppDelegate.swift` | ios/AuthenticHadithApp/ | Clean, standard Expo template |
| `Images.xcassets/AppIcon.appiconset/` | ios/AuthenticHadithApp/ | 1024x1024 universal icon present |
| `SplashScreen.storyboard` | ios/AuthenticHadithApp/ | Configured, branded color #1b5e43 |
| `SplashScreenLogo.imageset/` | ios/AuthenticHadithApp/Images.xcassets/ | 1x, 2x, 3x images present |
| `PrivacyInfo.xcprivacy` | ios/AuthenticHadithApp/ | Comprehensive, 4 API types, 5 data types |
| `Podfile` | ios/ | Platform 15.1, Hermes enabled |
| `Podfile.properties.json` | ios/ | Hermes engine, dev client inspector |
| `project.pbxproj` | ios/AuthenticHadithApp.xcodeproj/ | Team LXL3ZMHHK6, signing configured |
| `app.json` | project root | Bundle ID correct, plugins incomplete |
| `app.config.js` | project root | Dynamic env config, RevenueCat keys via env |
| `eas.json` | project root | 3 profiles, auto-increment, ASC ID set |
| `package.json` | project root | 40 deps, versions match CLAUDE.md spec |
| `.env.example` | project root | Template only, no real keys |
| `.gitignore` | project root | .env and .env*.local excluded |
| `APPSTORE_METADATA.md` | project root | Complete metadata, demo credentials documented |
| `privacy-policy.html` | project root | Full HTML privacy policy |
| `lib/purchases/revenuecat.ts` | project root | Product IDs defined, config reads from env |

---

## Xcode Settings Verified

| Setting | Value | Status |
|---------|-------|--------|
| PRODUCT_BUNDLE_IDENTIFIER | com.byred.authentichadith | CORRECT |
| DEVELOPMENT_TEAM | LXL3ZMHHK6 | SET |
| CODE_SIGN_IDENTITY | iPhone Developer | SET |
| MARKETING_VERSION | 1.0.0 | CORRECT |
| CURRENT_PROJECT_VERSION | 3 | MISMATCH with app.json (1) |
| IPHONEOS_DEPLOYMENT_TARGET (target) | 16.1 | MISMATCH with Podfile (15.1) |
| IPHONEOS_DEPLOYMENT_TARGET (project) | 15.1 | MATCHES Podfile |
| CODE_SIGN_ENTITLEMENTS | AuthenticHadithApp.entitlements | SET |
| RCTNewArchEnabled | true | New Architecture enabled |
| ITSAppUsesNonExemptEncryption | false | CORRECT (no export compliance needed) |
| UIUserInterfaceStyle | Automatic | CORRECT (supports dark mode) |
| Hermes Engine | Enabled | CORRECT (via Podfile.properties.json) |

---

## What Is Missing

1. ~~`react-native-purchases` Expo plugin in app.json~~ — INVALID, package does not ship one (FIX-027)
2. In-App Purchase capability toggle in Apple Developer portal for `com.byred.authentichadith`
3. Product IDs verified in App Store Connect
4. Demo review account created in Supabase
5. Privacy policy deployed to live URL
6. ~~Clean display name in Info.plist~~ — RESOLVED at config layer (FIX-026), pending prebuild verification
7. ~~Push notification entitlement resolved~~ — RESOLVED at config layer (FIX-026), pending prebuild verification
8. Deployment target alignment

---

## What Must Be Fixed Before TestFlight

1. ~~Add `react-native-purchases` to app.json plugins~~ — REMOVED (FIX-027); not a real fix
2. **Fix CFBundleDisplayName to "Authentic Hadith"** (C-03) — done in app.json (FIX-026)
3. **Resolve push entitlement** — remove `aps-environment` if not shipping push (C-02) — handled by next clean prebuild (no plugin produces it)
4. **Run `npx expo prebuild --clean` OR an EAS build** to regenerate native project with fixes (requires KP approval)
5. **Toggle In-App Purchase capability** in Apple Developer portal for `com.byred.authentichadith` (the real fix that the original C-01 was trying to point at)

---

## What Must Be Fixed Before App Store Submission

Everything above, plus:

5. **Create demo review account** in Supabase (M-03)
6. **Deploy privacy policy** to `https://byredllc.com/privacy` (M-04)
7. **Verify product IDs match** across App Store Connect, RevenueCat, and code (M-05)
8. **Verify In-App Purchase capability** is enabled in Apple Developer portal for this App ID (M-01 related)
9. **Align deployment targets** to 16.0 across Podfile and project (M-02)
10. **Sync build number** or confirm EAS remote versioning handles it (M-01)

---

## Exact Next Actions (in order)

### Step 1: VS Code edits (no approval needed)
```
1. app.json — add "react-native-purchases" to plugins array
2. app.json — add CFBundleDisplayName: "Authentic Hadith" to ios.infoPlist
3. Podfile.properties.json — set "ios.deploymentTarget": "16.0"
```

### Step 2: Requires KP approval
```
npx expo prebuild --clean
```
This regenerates the ios/ directory with the corrected config.

### Step 3: External verification (KP must do manually)
```
1. Apple Developer portal — verify In-App Purchase is enabled for com.byred.authentichadith
2. App Store Connect — verify product IDs: ah_monthly_premium, ah_annual_premium, ah_lifetime_premium
3. RevenueCat dashboard — verify products match
4. Supabase — create applereview@byredllc.com demo account
5. Deploy privacy-policy.html to https://byredllc.com/privacy
6. Verify byredllc.com/privacy loads in browser
```

### Step 4: Build verification
```
eas build --platform ios --profile production
```
Confirm build succeeds with all capabilities.

---

## App Store Review Risk Summary

| Risk Area | Status | Notes |
|-----------|--------|-------|
| Account deletion | PASS | Fully implemented, wired to API |
| Subscription restore | PASS | `restorePurchases()` implemented in RevenueCat provider |
| Privacy policy | NEEDS DEPLOYMENT | HTML exists, URL must be live |
| AI feature behavior | PASS | Described as context assistant, not fatwa. Appropriate disclaimers |
| Premium limits | PASS | Quota enforcement with daily reset |
| Placeholder text | LOW RISK | Notification screen has "coming soon" label |
| Test keys | PASS | No hardcoded keys, all via env vars, .env excluded from git |
| Metadata completeness | PASS | APPSTORE_METADATA.md is thorough |
| Religious content | PASS | Sourced from established hadith collections (Bukhari, Muslim). Grading system shown. Standard scholarly practice. |
| Raw error messages | PASS | Console statements gated with `__DEV__ &&` guard |
| Apple Sign In | NOT REQUIRED | App uses email/password auth only, no third-party social login |
| Export compliance | PASS | `ITSAppUsesNonExemptEncryption = false` |
| Privacy manifest | PASS | PrivacyInfo.xcprivacy properly configured with API types and data collection |
