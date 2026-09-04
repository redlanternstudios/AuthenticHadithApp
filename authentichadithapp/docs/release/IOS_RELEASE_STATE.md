# Authentic Hadith — Authoritative iOS Release State

- **Document ID:** `IOS-RELEASE-STATE-20260903`
- **Application:** Authentic Hadith (`authentichadithapp/`)
- **Bundle ID:** `com.byred.authentichadith`
- **App Store App ID:** `6764673665`
- **Developer Team:** By red llc (`P5H924VDYH`)
- **Target Release Version:** `1.1.3`
- **Target Build Number:** `6`
- **Live Baseline on App Store:** `1.1.2` (released 2026-08-01)
- **Last Updated:** 2026-09-03
- **Governing Intent:** `INT-2026-09-02-authentic-hadith-ios-release`
- **Governing Mission:** `operations/missions/2026-09-02__authentic-hadith__ios-release-scope-and-remediation.md`

---

## 1. Release Truth & Identity Matrix

| Parameter | Value | Source of Truth |
|---|---|---|
| Canonical Mobile Source | `authentichadithapp/` | Repository tree root |
| Version (`app.json`) | `1.1.3` | `authentichadithapp/app.json` |
| Build Number (`app.json`) | `6` | `authentichadithapp/app.json` |
| Package Version (`package.json`) | `1.1.3` | `authentichadithapp/package.json` |
| App Store Connect Key ID | `XGZYSP8AB3` | App Store Connect API |
| App Store Connect Issuer ID | `5cd5d8fc-d3e0-48de-b75a-767348bb8fc8` | App Store Connect API |
| Cloud Signing Method | Headless EAS via App Store Connect API Key | GitHub Secret `APPLE_API_KEY_JSON` |
| CI/CD Pipeline | GitHub Actions (`eas-ios.yml`) | `.github/workflows/eas-ios.yml` |

---

## 2. Blocker Remediation Status

| Blocker ID | Description | Remediation Action | Status |
|---|---|---|---|
| **IOS-1** | Workflow targeted wrong directory (`v0-authentic-hadith/expo-wrapper`) | Overhauled `.github/workflows/eas-ios.yml` to target `./authentichadithapp`, use `ubuntu-latest`, and use `APPLE_API_KEY_JSON` | ✅ RESOLVED |
| **IOS-2** | Reviewer credentials exposed in tracked repo files | Scrubbed literal passwords from `BUILD_FIX_LOG.md`, `DEMO_ACCOUNT.sql`, `REVIEW_NOTES.md`, `XCODE_NATIVE_RELEASE_AUDIT.md`, `DEVICE_QA_CHECKLIST_BUILD22.md`. Added `*.p8` to `.gitignore`. | ✅ RESOLVED |
| **IOS-3** | Version drift between live App Store (`1.1.2`) and local repo (`1.1.0`) | Reconciled and bumped to `1.1.3` (build `6`) across `app.json` and `package.json`. | ✅ RESOLVED |
| **IOS-4** | Apple Distribution Certificate blocker (57 days stale) | Keymon created active certificate in Xcode (`Keymon Penn`, 9/3/26); App Store Connect API key generated and wired to EAS. | ✅ RESOLVED |
| **IOS-5** | Content Trust / Provenance of Enriched Hadiths | Quarantined via `ENRICHED_HADITHS_ENABLED = false` in `app/hadith/[id].tsx`. Copyright updated to `© 2026 byRed LLC` in `app/settings/about.tsx`. | ✅ RESOLVED |

---

## 3. Historical Document Deprecation Notice

The following documents in `authentichadithapp/docs/` are now marked **HISTORICAL / SUPERSEDED** by this document:
- `authentichadithapp/docs/appstore/REVIEW_NOTES.md` (historical notes from v1.0.0 submission)
- `authentichadithapp/docs/DEVICE_QA_CHECKLIST_BUILD22.md` (historical QA from build 22)
- `authentichadithapp/docs/HANDOFF_BUILD24.md` (historical handoff from build 24)
- `authentichadithapp/docs/QA_BUILD44.md` (historical QA from build 44)
- `authentichadithapp/docs/QA_BUILD45_MIGRATION.md` (historical migration from build 45)
- `authentichadithapp/docs/SUBMISSION_BLOCKER_LEDGER.md` (historical v1.0 blocker ledger)

All future release tracking references this file as canonical truth.
