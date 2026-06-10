# App Store Submission Tonight Checklist

Date: 2026-06-08
Target: submit tonight only if all blocking gates are complete.

## Command Preflight (run first)

- [x] `npm run qa:ios:go-no-go`
- [x] `npm run qa:appstore:metadata`
- [x] `npm run qa:types`
- [x] `npm run qa:lint`
- [x] `npm test -- --runInBand`
- [x] `npm run qa:truthserum`
- [x] `npm run qa:revenuecat`

Evidence:

- [x] `docs/reports/ios-go-no-go-latest.json` updated this session
- [x] `docs/reports/appstore-metadata-latest.json` updated this session

## Manual Blocking Gates (must be checked)

### 1) Gate F: App Store Connect product readiness

- [ ] Monthly product exists and configured
- [ ] Annual product exists and configured
- [ ] Lifetime product exists and configured
- [ ] All 3 products show Ready to Submit
- [ ] IDs match exactly: `ah_monthly_premium`, `ah_annual_premium`, `ah_lifetime_premium`

### 2) Gate G: RevenueCat live path proof

- [ ] Entitlement `premium` exists
- [ ] All 3 iOS products attached to `premium`
- [ ] RoPhone/TestFlight paywall renders packages
- [ ] Restore Purchases path works on device

### 3) Gate D/H/I: Review package completeness

- [ ] Demo reviewer account works end-to-end on device
- [ ] App Review notes include working credentials
- [ ] Privacy and compliance answers complete in ASC
- [ ] Screenshot set complete for required device classes
- [ ] Metadata fields pasted from `APPSTORE_METADATA.md`

## Go/No-Go Flip

- [ ] Update `PRE_TESTFLIGHT_READINESS_GATE.md` Gate F and Gate G rows to `[x]` where proven
- [ ] Update `IOS_SUBMISSION_GO_NO_GO.md` verdict to GO only after all blockers are fully checked
- [ ] Re-run `npm run qa:ios:go-no-go` and confirm `overall=GO`

## Build + Submit

- [ ] `npx eas build --platform ios --profile production`
- [ ] Capture build ID, build number, and build URL
- [ ] `npx eas submit --platform ios --latest --non-interactive`
- [ ] Capture submission ID and ASC processing status

## Final Evidence Log

- [ ] Update `ERROR_REPORT.md` with tonight's outcomes
- [ ] Update `CODEX_APP_STORE_BUILD_LOG.md` with build and submit evidence
- [ ] Keep outcome factual: command, timestamp, result, blocker if any

## Stop Rule

If any required checkbox above stays unchecked, do not submit tonight.
