# iOS Submission Command Sheet

Date: 2026-06-08
Purpose: deterministic run order for build and submission.

## 0) Stop Rule

Do not run production build or submit unless GO is confirmed in IOS_SUBMISSION_GO_NO_GO.md.

## 1) Local Preflight (must pass)

Run from repo root.

```bash
npm run qa:ios:go-no-go
npm run qa:appstore:metadata
npm run qa:types
npm run qa:lint
npm test -- --runInBand
npm run qa:truthserum
npm run qa:revenuecat
```

Expected: all commands exit 0.

Notes:

- `qa:ios:go-no-go` exits non-zero when any blocking gate is still open and writes a machine-readable report to `docs/reports/ios-go-no-go-latest.json`.
- `qa:appstore:metadata` validates Apple field limits and metadata integrity and writes `docs/reports/appstore-metadata-latest.json`.

## 2) Confirm Build Wiring

```bash
grep -n "buildNumber" app.json
grep -n "ascAppId" eas.json
grep -n "CFBundleVersion" ios/AuthenticHadith/Info.plist
```

Expected:

- `app.json` has iOS build number set.
- `eas.json` has submit.production.ios.ascAppId = 6764673665.
- `Info.plist` includes CFBundleVersion.

## 3) Confirm EAS Production Env (must exist)

```bash
npx eas env:list --environment production
```

Required keys:

- EXPO_PUBLIC_API_URL
- EXPO_PUBLIC_APP_ENV
- EXPO_PUBLIC_REVENUECAT_API_KEY_IOS
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY

## 4) Build (production)

```bash
npx eas build --platform ios --profile production
```

Record:

- Build ID
- Build number assigned
- Build URL

## 5) Submit (after build is processed)

⛔ NEVER use `--latest`. Always use the specific Build ID captured in Step 4.
This is a standing security rule (CLAUDE.md + BUILD_FIX_LOG.md FIX-120).

```bash
npx eas submit --platform ios --id {BUILD_ID_FROM_STEP_4} --non-interactive
```

Record:

- Submission ID
- ASC processing status

## 5a) Rule 034 — Live Probes BEFORE submit (all 3 must be GREEN)

1. Reviewer login: `POST {SUPABASE_URL}/auth/v1/token?grant_type=password` with reviewer credentials → must return `access_token`
2. RC premium: `GET https://api.revenuecat.com/v1/subscribers/{reviewer_uuid}` → `premium` entitlement must be active
3. API: `POST https://www.authentichadith.app/api/mobile-chat` → must NOT return 404

If any probe fails: fix live state first, re-probe, then submit.

## 5b) Rule 040 — KP Device QA BEFORE Submit for Review

Must be completed on physical iPhone running the TestFlight build. Submit for Review = KP's finger in ASC only, never automated.

Checklist:
1. Cold launch — no white flash, no hang
2. Reviewer login (apple.reviewer@authentichadith.app) + premium confirmed
3. Account deletion flow
4. AI assistant — response in <12s + disclaimer
5. Paywall prices — correct amounts, no crash
6. Restore purchases — no crash
7. Lessons — Mark Complete → progress bar advances
8. App icon — correct branding (not Expo default)

## 6) Immediate Post-Submit Checks (manual)

1. App Store Connect shows the selected build attached to the version.
2. App Review notes include valid demo credentials.
3. IAP products are Ready to Submit and linked to subscription group.
4. Screenshots and metadata fields are complete for required device classes.

## 7) Evidence Logging

Update these files after each run:

- ERROR_REPORT.md
- CODEX_APP_STORE_BUILD_LOG.md
- PRE_TESTFLIGHT_READINESS_GATE.md
- IOS_SUBMISSION_GO_NO_GO.md

Keep logs factual: command, result, timestamp, and blocker if failed.
