# Codex App Store Build Log - Authentic Hadith

Purpose: durable launch memory for Codex while preparing Authentic Hadith for App Store submission. This is not marketing copy. It is a proof-bearing operator log of what worked, what failed, and what should transfer to future Expo/RevenueCat apps.

Last updated: 2026-05-28 20:26 PDT

## Source Map

Imported and cross-agent normalized from:

- `BUILD_FIX_LOG.md` — Claude's long-form fix ledger, 57 fix entries plus pattern tracker.
- `SYSTEM_RULES.md` — permanent engineering rules for this app and future mobile apps.
- `WORKFLOW_ROUTER.md` — how to classify VS Code app-layer, Expo hybrid-layer, and Xcode/native-layer work.
- `APP_LAUNCH_PLAYBOOK.md` — repeatable launch commands, env rules, prebuild gates, and App Store process.
- `APP_STORE_RELEASE_BLOCKERS.md` — App Store rejection risks and manual launch blockers.
- `AI_OPERATOR_HANDOFF_PROTOCOL.md` — coordination rules between ChatGPT, Claude Code, Gemini, v0, Make.com, Notion/Drive, and other operators.

Note: there is no separate file literally named `buildlog.md` in the current tree. The authoritative Claude build log is `BUILD_FIX_LOG.md`.

## Operating Rules

- Do not call a build App Store-ready without a current receipt: typecheck, lint, tests, Expo dependency validation, EAS production env validation, and the manual Apple/RevenueCat gates.
- Never ship temporary diagnostic screens in a final App Store candidate.
- RevenueCat secret keys (`sk_...`) are backend-only. They must never go in Expo `extra`, React Native app code, screenshots, logs, or App Store metadata.
- RevenueCat public SDK keys (`appl_...` for iOS, `goog_...` for Android) are client-safe and may ship in app code when intentionally documented.
- For client SDKs that fail silently on physical devices, use deterministic config resolution and explicit degraded-mode logs. Do not depend on `.env.local` as the only source of truth for EAS/TestFlight.
- Default to the app/code layer first. Use Xcode only when the issue is provably native: signing, certificates, provisioning, archive, linker, Swift/Obj-C, pods, or Apple submission.
- Do not edit generated `ios/` files as the source of truth. Mirror durable native config into `app.json`, `app.config.js`, or a verified Expo config plugin.
- Before any package/native/config change, classify risk and choose the smallest reversible fix.
- Every fix needs root cause, files changed, verification, lesson learned, and a log entry.
- If a pattern repeats, promote it into a permanent rule instead of rediscovering it later.

## Claude Build Log Import - Fix Families

The Claude `BUILD_FIX_LOG.md` contains these major fix families. Codex should use this table before debugging similar issues in this app or future Expo apps.

| Family | Claude evidence | Transfer rule |
|---|---|---|
| Supabase schema mismatch | FIX-002, 009, 013, 015, 016, 035, 041, 044 | Never assume column names or relationships. Verify schema, then use explicit selects and separate lookups when FK joins are not proven. |
| PostgREST FK joins | FIX-011, 012, 014, 041 | Hadith tables have repeatedly failed with assumed FK embed syntax. Avoid `collection:collections(*)` unless the relationship is verified in Supabase. |
| Route reachability | FIX-005, 017, 020 | A screen file is not a feature. Every route needs a navigation path and a route audit before launch. |
| RevenueCat config drift | FIX-004, 006, 007, 019, 026, 027, 031, 040, 049, 050, 051 | Keep RevenueCat product IDs, entitlement, and SDK key resolution centralized. Never scatter config across screens/hooks. Do real-device and dashboard verification. |
| EAS env drift | FIX-040 | `.env.local` is not proof for EAS/TestFlight. Run EAS production env checks before every TestFlight/App Store build. |
| Native config durability | FIX-025, 026, 027 | In Expo CNG, app-level config is the durable source. Direct `ios/` edits are temporary unless mirrored to Expo config. |
| Invalid Expo plugins | FIX-007, 026, 027 | A package is not an Expo config plugin unless it ships one. `react-native-purchases` autolinks and must not be added to `expo.plugins` unless official docs change. |
| Dependency/version drift | FIX-034, 036, 048 plus current Jest repair | Use Expo-compatible versions. Validate with `npx expo install --check`. Jest 30 / `jest-expo` 55 broke Expo SDK 54 tests. |
| Async crash/hang paths | FIX-019, 031, 036, 045 | Every async IIFE in `useEffect` needs try/catch/finally or bounded cancellation. Add explicit client timeouts where a spinner can hang forever. |
| AI mobile backend | FIX-003, 037, 038, 039, 045 | Native apps cannot rely on relative `/api/...` paths. Use full production URLs and avoid apex-to-www POST redirects. Fatwa/ruling requests need safety deferral. |
| Content trust / religious safety | FIX-037, 039 | Separate source attribution, AI-generated context, and fatwa/ruling limitations. Do not overclaim scholarly authority or content completeness. |
| App Store compliance | FIX-004, 007, 008, 025, 039 | Privacy manifest, account deletion, demo account, export compliance, IAP products, review notes, and metadata all need receipts. |
| Visual/UI polish | FIX-024, 033, 043 | Dynamic theme via `getColors(isDark)`, stable text containers, explicit ellipsis/line limits, no unreadable dark mode. |
| Quota/enforcement | FIX-022 | A visible limit must be actually enforced and persisted. Cosmetic counters are worse than no counter. |
| Observability | FIX-023, 049, 050 | Gate noisy logs, but keep critical production lifecycle visibility for opaque SDKs. Temporary diagnostic screens must be stripped before App Store candidate. |
| Governance | FIX-046, WORKFLOW_ROUTER, SYSTEM_RULES | Read operating docs, classify the issue, run `qa:truthserum`, and log any fix with proof. |

## Cross-Agent Universal Workflow

Use this workflow when KP moves between ChatGPT/Codex and Claude Code:

1. Read the current app state first: `git status`, relevant docs, current config, and recent logs.
2. Classify the work:
   - `VS_CODE_APP_LAYER`: JS/TS, Expo Router, Supabase, RevenueCat logic, UI, theme, tests.
   - `EXPO_HYBRID_LAYER`: app config, EAS profiles, package/native dependency changes, permissions, bundle/build numbers.
   - `XCODE_NATIVE_LAYER`: certificates, provisioning, archive, linker, pods, Swift/Obj-C, App Store upload errors.
   - `UNKNOWN_NEEDS_TRIAGE`: inspect logs before acting.
3. Diagnose before editing. Identify root cause, likely files, risk level, and verification step.
4. Apply the smallest safe fix.
5. Verify with the correct scope:
   - App-layer: typecheck, tests, lint, targeted route/feature smoke.
   - Expo hybrid: `npx expo install --check`, app config review, EAS env/build receipts.
   - Native: EAS/Xcode logs, successful build/archive/submit.
6. Update the log:
   - `BUILD_FIX_LOG.md` for bug fixes and recurring patterns.
   - `CODEX_APP_STORE_BUILD_LOG.md` for reusable cross-agent launch lessons.
   - Codex memory note when KP explicitly asks to preserve lessons for future apps.

## Universal Debug Checklist

- `git status --short --branch`
- `npx expo install --check`
- `npm run qa:types`
- `npm run qa:lint`
- `npm test -- --runInBand`
- `npm run qa:truthserum`
- `npx eas-cli@latest env:list --environment production`
- `npm run qa:revenuecat`
- Search live app code for server secrets before building.
- Search for diagnostic routes/screens before final App Store candidate.
- Verify App Store Connect and RevenueCat dashboards manually before claiming revenue flow is ready.

## Known Good Verification Baseline

Latest verified in this Codex session:

- TypeScript: `npm run qa:types` PASS.
- Tests: `npm test -- --runInBand` PASS, 6 suites / 48 tests.
- Lint: `npm run qa:lint` PASS with 0 warnings and 0 errors.
- Expo dependency validation: `npx expo install --check` PASS.
- Truth Serum audit chain: `npm run qa:truthserum` PASS.
- EAS production environment contains required public app vars including `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`.
- Live `app/` and `lib/` code contains no `rcDiag`, `rc-diagnostics`, `maskUserId`, hidden diagnostics unlock, or `RC Diagnostics` route references.
- Live app code search found no RevenueCat `sk_...`, Stripe secret, or Supabase service role references under `app`, `lib`, `components`, `constants`, or `hooks`.
- Source scan found no old hardcoded Supabase project URL or anon JWT fallback under `app`, `lib`, `components`, `scripts`, `app.config.js`, or `app.json`.
- RevenueCat v1 offerings smoke check is now scripted as `npm run qa:revenuecat` and currently passes.

Known warning/risk:

- `npm audit --omit=dev` still reports production dependency advisories, including two high severities, mostly transitive Expo/AI SDK chain issues whose automated fixes require major upgrades. Do not run `npm audit fix --force` without a planned Expo/AI SDK upgrade.
- Lint is clean: 0 warnings and 0 errors.
- RevenueCat currently returns offering `default` with 3 packages containing `ah_monthly_premium`, `ah_annual_premium`, and `ah_lifetime_premium`. Gate G still needs entitlement dashboard proof plus RoPhone/TestFlight paywall and restore-purchases proof.
- Public support/privacy URLs on `byredllc.com` return HTTP 200. `authentichadith.app/privacy` currently returns HTTP 404, so use `https://byredllc.com/privacy` unless the app domain privacy page is added.
- App icon is 1024 x 1024 with no alpha. Unused Expo template React logo assets have been removed.

## Current RevenueCat Decision

Problem: RevenueCat was not showing the user/customer reliably on physical device/TestFlight.

Root issue class: runtime config could silently miss the public iOS SDK key if EAS/App config injection drifted, leaving RevenueCat in degraded mode before customer identity could be synced.

Decision: use a three-layer iOS key resolution strategy:

1. Prefer `Constants.expoConfig.extra.revenueCatApiKeyIos`.
2. Fallback to legacy `Constants.expoConfig.extra.revenueCatApiKey`.
3. Last-resort hardcoded iOS public SDK key fallback in `lib/revenuecat/config.ts`.

Guardrail: the hardcoded fallback is only the public iOS `appl_...` key. The private `sk_...` RevenueCat secret key remains local/backend-only.

## What Changed In This Session

- Removed Build #17 temporary diagnostics scaffold:
  - Deleted `lib/revenuecat/diagnostics.ts`.
  - Deleted `app/settings/rc-diagnostics.tsx`.
  - Removed the hidden 7-tap Settings unlock path.
  - Removed all `rcDiag.record(...)` calls.
- Kept durable RevenueCat improvements:
  - `isConfigured` flips immediately after `Purchases.configure()` succeeds.
  - `Purchases.logIn()` failure no longer prevents later identity sync.
  - Bounded configure retry remains available after auth hydration.
  - Customer info listener double-attach guards remain.
- Centralized RevenueCat constants in `lib/revenuecat/config.ts`:
  - `PRODUCT_IDS`
  - `ENTITLEMENT_ID`
  - `getRevenueCatApiKey()`
- Added public-key validation:
  - Reject missing keys.
  - Reject `sk_...` secret keys.
  - Require iOS keys to start with `appl_`.
  - Require Android keys to start with `goog_`.
- Aligned Expo/Jest dependencies to Expo SDK 54 expected versions:
  - `expo@~54.0.35`
  - `expo-font@~14.0.12`
  - `expo-router@~6.0.24`
  - `jest@~29.7.0`
  - `jest-expo@~54.0.17`
  - `@types/jest@29.5.14`
- Fixed Jest harness:
  - Corrected Jest setup config.
  - Added AsyncStorage mock in `jest.setup.js`.
- Cleared all lint errors from unescaped JSX text.
- Cleared launch-polish lint warnings:
  - Removed unused imports/variables.
  - Stabilized `sunnah.tsx` fallback practice memo dependencies.
  - Used the assistant quota-loaded state in send gating.
- Re-audited stale App Store blocker docs and marked resolved items with receipts.
- Re-ran RevenueCat offering gate after dashboard/product changes; the offering API now returns all three canonical products.
- Removed the hardcoded Supabase project URL / anon JWT fallback from `lib/supabase/client.ts`.
- Changed `app.config.js` appEnv fallback to production and hardened `qa:audit:env` to fail if `EXPO_PUBLIC_APP_ENV` is not `production`.
- Added test-only public env defaults in `jest.setup.js` so module-load tests can keep running without source-level production fallbacks.
- Hardened Today screen Save/Share failure handling so Supabase save errors and native share failures surface to users instead of being swallowed.

## Verification Receipts

- TypeScript: `npm run qa:types` PASS.
- Tests: `npm test -- --runInBand` PASS, 6 suites / 48 tests.
- Lint: `npm run qa:lint` PASS with 0 warnings and 0 errors.
- Expo dependency validation: `npx expo install --check` PASS.
- Truth Serum audit chain: `npm run qa:truthserum` PASS.
- RevenueCat offering gate: `npm run qa:revenuecat` PASS.
- RevenueCat diagnostics removal grep: no `rcDiag`, `rc-diagnostics`, `maskUserId`, hidden unlock, or `RC Diagnostics` references remain under live `app/` or `lib/` code.

## Transferable Pattern For Future Apps

When configuring RevenueCat in another Expo app:

1. Put product IDs and entitlement IDs in one config module.
2. Treat public SDK keys as client-safe but still validate their prefix.
3. Keep secret API keys server-only.
4. Resolve runtime keys from Expo config first, then a documented public fallback if the business accepts that tradeoff.
5. Make `configure()` success independent from `logIn()` success.
6. Run identity sync again after auth hydration.
7. Add a bounded retry path for configure failures.
8. Do not add `react-native-purchases` to Expo plugins unless the package ships a real config plugin.
9. Verify App Store Connect product IDs, RevenueCat products, RevenueCat entitlement, and RevenueCat offering all match the code exactly.
10. Test on a real iPhone/TestFlight before declaring the RevenueCat dashboard path fixed.

## Claude Fix Index Imported

The current `BUILD_FIX_LOG.md` entries imported into Codex understanding:

- FIX-001 Auth flow broken: sign-out, OAuth handling, route protection.
- FIX-002 Supabase schema mismatch: wrong column names everywhere.
- FIX-003 Critical logic gaps: native AI chat URL, TruthSerum search, settings routes, profile errors.
- FIX-004 Critical App Store blockers: delete account, RevenueCat test key, product ID drift, app.config bridge.
- FIX-005 Line-wrap corruption and CI wrong directory.
- FIX-006 RevenueCat API key and entitlement scattered across files.
- FIX-007 iOS submission blockers: duplicate deps, missing/invalid plugins.
- FIX-008 EAS build config missing build number and ASC app ID.
- FIX-009 30+ column name mismatches causing blank tabs.
- FIX-010 Comprehensive App Store build audit fixes.
- FIX-011 and FIX-012 Broken FK joins in hadith hooks and premium gate issue.
- FIX-013 to FIX-016 DB alias/filter/search/chapter query failures.
- FIX-017 Unreachable delete account, subscription, and bookmarks screens.
- FIX-018 Boilerplate modal shipping to production.
- FIX-019 Subscription screen crash on RevenueCat init failure.
- FIX-020 Duplicate QueryClientProvider and missing Stack routes.
- FIX-021 Home random offset crash.
- FIX-022 AI quota cosmetic only, no persistence/enforcement.
- FIX-023 Production console statements leaking to device logs.
- FIX-024 Dark mode static `COLORS` import.
- FIX-025 Workflow governance and later privacy manifest durability entry.
- FIX-026 RevenueCat plugin/push/display-name blockers.
- FIX-027 Invalid `react-native-purchases` plugin registration reverted.
- FIX-028 CocoaPods UTF-8 locale failure.
- FIX-029 First successful local iOS build verification.
- FIX-030 Slug-derived stale workspace reference.
- FIX-031 Runtime startup services hardened.
- FIX-032 Badges/progress completion stabilization.
- FIX-033 Web-to-mobile parity, Sunnah fallback, home summarize button.
- FIX-034 Corrupted package-lock blocking EAS.
- FIX-035 Mobile schema alignment with production Supabase.
- FIX-036 Reanimated warm-relaunch hang; downgrade to 3.18.
- FIX-037 Content and AI summary audit.
- FIX-038 `/api/mobile-chat` restoration verified.
- FIX-039 Content trust sweep and AI safety labeling.
- FIX-040 EAS production env empty before TestFlight.
- FIX-041 My Hadith folder empty due to embed alias mismatch.
- FIX-042 Subscription screen generic error masking real cause.
- FIX-043 Search cards text cut off.
- FIX-044 Learning paths missing progress indicator / silent query failure.
- FIX-045 AI Assistant spinner hang due to apex-to-www POST redirect and no client timeout.
- FIX-046 AI Assistant red banner audit plus governance scaffold duplicate entry.
- FIX-047 Learning Paths red banner audit.
- FIX-048 expo-doctor metro.config false positive.
- FIX-049 Build #17 RevenueCat visibility scaffold.
- FIX-050 Build #18 RevenueCat diagnostics removal.
- FIX-051 RevenueCat public SDK key fallback and config single source.
- FIX-052 RevenueCat offerings API gate.
- FIX-053 Unused Expo template logo asset removal.
- FIX-054 Lint-clean launch polish and stale blocker re-audit.
- FIX-055 RevenueCat offering API gate passed.
- FIX-056 Supabase env hardening and production appEnv default.
- FIX-057 Today save/share failure handling.

## Still Not Proven

- App Store Connect IAP products exist and are `Ready to Submit`.
- Apple Developer bundle ID has In-App Purchase capability enabled.
- RevenueCat dashboard has `premium` entitlement with all three products attached.
- RevenueCat paywall and restore-purchases flow work on RoPhone/TestFlight.
- A real TestFlight/physical iPhone session creates/updates the expected RevenueCat customer.
- Apple Review demo account has a premium entitlement and working credentials stored privately in App Store Connect.

Status: engineering config is hardened; dashboard/device proof is still required before final App Store submission.

### 2026-07-09 seven day monthly trial copy pass

Rory requested that the monthly subscription clearly show a free seven day option tied to the $9.99 monthly product.

Code side change:

- `app/settings/subscription.tsx` now renders `ah_monthly_premium` as seven days free, then the live StoreKit monthly price and cadence.
- The monthly subtitle now says seven day free trial, then monthly premium access, cancel anytime.

Verification:

- `npx tsc --noEmit` passed.
- `npm test -- revenuecat.test.ts onboarding-access.test.ts route-integrity.test.ts --runInBand` passed, 61 tests.
- `node scripts/qa-appstore-metadata.mjs` passed.
- `npm run lint` passed with zero errors and four existing warnings.
- `npm run qa:revenuecat` passed against current offering `default` with all three product ids.

Remaining Apple proof:

- App Store Connect must still confirm `ah_monthly_premium` has a real seven day introductory offer. Local copy does not create the Apple trial.
- `node scripts/ios-go-no-go-audit.mjs` still reports NO GO because Gate F Ready to Submit, Gate G RoPhone paywall proof, and the go or no go doc remain manually pending.

Production build receipt:

- 2026-07-09: `npm run qa:build` started a production iOS EAS build after Rory approved uploading source to Expo.
- EAS build ID: `67bbfe1d-12b1-4421-8085-766b82a8ccd0`
- Build URL: `https://expo.dev/accounts/redlantern/projects/authentichadithapp/builds/67bbfe1d-12b1-4421-8085-766b82a8ccd0`
- App version: `1.1.0`
- iOS build number: `104`
- Commit: `1b011308ced92bee83f1e3492ef91c050e52d6ed`
- Status: `FINISHED`
- IPA artifact: `https://expo.dev/artifacts/eas/BuqvvoIQm3XPw0We74Sh4purKmSaLTSuml5iNGZ_s-o.ipa`

Submit blocker:

- `npx eas-cli submit --platform ios --id 67bbfe1d-12b1-4421-8085-766b82a8ccd0 --non-interactive` was not run.
- Reason: Apple upload requires exact approval after the risk is stated because `IOS_SUBMISSION_GO_NO_GO.md` still says NO GO and the manual gates remain open.
- Safe next approval text: `Approved: upload Authentic Hadith build 104 to App Store Connect and TestFlight via EAS Submit. I understand the go/no-go doc is still NO GO and this does not submit for App Review.`

Apple upload attempt:

- 2026-07-09: Rory approved proceeding with the Apple upload.
- EAS submission ID: `396c981c-b2d6-4dd5-bf95-2da09f3056bd`
- Submission URL: `https://expo.dev/accounts/redlantern/projects/authentichadithapp/submissions/396c981c-b2d6-4dd5-bf95-2da09f3056bd`
- Result: FAILED.
- Apple rejection: `CFBundleShortVersionString [1.1.0]` must be higher than the previously approved version `[1.1.0]`; the `1.1.0` prerelease train is closed for new build submissions.
- Fix: bump release version to `1.1.1`, rebuild, then upload the new build to App Store Connect.
