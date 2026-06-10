# iOS Submission Go/No-Go (Truthserum)

Date: 2026-06-08
App: Authentic Hadith
Bundle ID: com.byred.authentichadith
ASC App ID: 6764673665

## Current Verdict

NO-GO for App Store submission.

Reason: hard blockers remain open across device QA, IAP readiness, and App Review metadata/compliance.

## Hard Gates (All must be PASS)

1. Device QA PASS on real iPhone/TestFlight.
2. AI core path PASS on real device (assistant and summary flows).
3. App Store Connect IAP products exist, localized, and show Ready to Submit.
4. RevenueCat mapping PASS (entitlement + package mapping + restore path proven on device).
5. App Review metadata PASS (screenshots, review notes, privacy, rights/compliance answers complete).

If any single gate is not PASS, submission remains NO-GO.

## 2026-06-08 Status Snapshot

PASS:

- EAS production env verification completed.
- IPA structural verification completed.
- Simulator launch verification completed.
- Build wiring is aligned (`app.json` build number, `eas.json` submit app id, `Info.plist` bundle version).
- Local preflight rerun on 2026-06-08 completed with all green: `qa:types`, `qa:lint`, `test --runInBand` (51/51), `qa:truthserum`, `qa:revenuecat`.
- Automated gate audit rerun via `npm run qa:ios:go-no-go`: automated blocking failures = 0; machine report written to `docs/reports/ios-go-no-go-latest.json`.
- App Store metadata lint passed via `npm run qa:appstore:metadata`; machine report written to `docs/reports/appstore-metadata-latest.json`.
- Metadata lint parser hardened to handle markdown spacing/newline variance so `qa:appstore:metadata` reports stable truth instead of formatting-dependent false negatives.

PENDING:

- Submit gate still pending in task tracker.
- Real-device gates still pending.
- App Store Connect product status proof still pending.
- RevenueCat dashboard plus real-device purchase/restore proof still pending.
- Full metadata/screenshots/compliance gate still pending.
- Automated audit currently detects 4 manual blocking signals still open (Gate F Ready to Submit unchecked, Gate G paywall proof unchecked, Gate G restore proof unchecked, document verdict still NO-GO).
- Latest audit run confirms all automated blockers are cleared (`automated_failures=0`); remaining blockers are manual Apple/dashboard/device proof only.

OPEN RISK (non-technical):

- Content integrity governance audit is open and requires owner decision before confident review posture.

## Submit Authority Rule

Run `eas submit --platform ios` only after this file is manually flipped to GO and every hard gate above has explicit PASS evidence in:

- PRE_TESTFLIGHT_READINESS_GATE.md
- CODEX_LAUNCH_CONTROL.md
- ERROR_REPORT.md

## Fast Decision Card

- If device QA is incomplete -> NO-GO
- If any IAP status is not Ready to Submit -> NO-GO
- If RevenueCat paywall/restore is not proven on real device -> NO-GO
- If App Review metadata is incomplete -> NO-GO
- If all four checks above are green -> GO
