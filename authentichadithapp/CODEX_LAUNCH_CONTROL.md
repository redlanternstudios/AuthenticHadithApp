# Codex Launch Control - Authentic Hadith

Last updated: 2026-05-28 20:26 PDT

## Current Launch Status

`NOT READY FOR APP STORE SUBMISSION`

Reason: engineering checks are green and RevenueCat offerings now pass API verification, but external Apple/device/review gates remain unproven.

## Verified This Session

- Bundle ID: `com.byred.authentichadith`
- EAS project ID: `66afcbbf-55c3-48fb-9bf1-29efc52d09eb`
- App version: `1.0.0`
- iOS build number in `app.json`: `5`
- iPad support: enabled, so iPad 12.9" screenshots are required.
- App icon: `assets/images/icon.png`, 1024 x 1024, no alpha.
- Export compliance config: `ITSAppUsesNonExemptEncryption: false`
- Privacy manifest exists in `app.json` with required API categories.
- Public URLs:
  - `https://byredllc.com` -> HTTP 200
  - `https://byredllc.com/privacy` -> HTTP 200
  - `https://authentichadith.app` -> HTTP 200
  - `https://authentichadith.app/privacy` -> HTTP 404
  - `https://www.authentichadith.app/api/mobile-chat` -> HTTP 405 for GET, expected if endpoint only accepts POST.
- RevenueCat public iOS key reaches RevenueCat.
- RevenueCat current offering ID is `default`.
- RevenueCat current offering has 3 packages and includes all expected product IDs.
- Expo template React logo assets were tracked and unused; they have been removed.
- The old critical blocker list was re-audited: delete-account, subscription, bookmarks, boilerplate modal removal, root route registration, five-tab consolidation, and RevenueCat entitlement constant centralization are all resolved in current code.
- Supabase client no longer has a hardcoded production project URL or anon JWT fallback.
- Release env audit now requires `EXPO_PUBLIC_APP_ENV=production`.
- Today screen Save/Share failures are no longer silently swallowed; user-facing alerts are shown for failed save/share actions.

## Code-Side Verification Baseline

- `npm run qa:types`: PASS
- `npm test -- --runInBand`: PASS, 6 suites / 48 tests
- `npm run qa:lint`: PASS, 0 warnings, 0 errors
- `npx expo install --check`: PASS
- `npm run qa:truthserum`: PASS
- `npm run qa:revenuecat`: PASS
- Source scan for the old Supabase project URL / JWT fallback: PASS, no matches in live app/config/script source.

## Launch Blockers

### VERIFIED - RevenueCat Offering API

`npm run qa:revenuecat` proves:

- current offering: `default`
- current package count: `3`
- actual product IDs:
  - `ah_monthly_premium`
  - `ah_annual_premium`
  - `ah_lifetime_premium`
- missing product IDs: none

Remaining RevenueCat proof still needed: RoPhone/TestFlight paywall render, purchase attempt behavior, and restore-purchases behavior.

### MISSING - App Store Connect IAP Products

No App Store Connect API credentials were found locally, so Codex cannot verify or create IAP products from this environment.

Required product IDs:

- `ah_monthly_premium`
- `ah_annual_premium`
- `ah_lifetime_premium`

### PARTIAL - RevenueCat Dashboard Mapping

Codex cannot verify dashboard project configuration through API v2 because the local `REVENUECAT_SECRET_API_KEY` is a legacy key and RevenueCat v2 returns 403 for it.

Verified:

- all three products are packaged under current offering `default`

Still required:

- entitlement `premium`
- all three products attached to `premium`
- RevenueCat dashboard/manual confirmation or a current API key that can prove entitlement mapping

### MISSING - Real Device QA

RoPhone/TestFlight verification is still required for:

- cold launch
- warm relaunch
- Home
- Collections
- Hadith detail
- Search
- Sunnah
- Stories
- Progress/Badges
- Profile/Settings
- Delete Account
- AI Summary
- Assistant
- Subscription/paywall
- Restore Purchases

### MISSING - Apple Review Demo Account

Demo account must exist in Supabase Auth and be tested on device. Credentials must be stored privately in App Store Connect review notes.

### MISSING - App Privacy / Screenshots

- App Store Connect privacy declarations still need dashboard proof.
- Screenshots are still deferred until device QA confirms stable UI.
- Because `supportsTablet` is true, iPad 12.9" screenshots are required.

## Next Exact Action

1. Verify App Store Connect product statuses are `Ready to Submit`.
2. Verify RevenueCat entitlement `premium` has all three products attached.
3. Run RoPhone/TestFlight paywall QA and restore-purchases QA.
4. Do not proceed to final App Store build until device, demo-account, privacy, screenshot, and App Review metadata gates are complete.

## Final Build Rule

Do not run `eas build --profile production --platform ios --submit` until:

- `npm run qa:revenuecat` passes. Current status: PASS.
- RoPhone/TestFlight paywall confirms packages render.
- Apple Developer IAP capability is verified.
- App Store Connect products are `Ready to Submit`.
- Demo account is verified.
- Privacy declarations and screenshots are complete.
