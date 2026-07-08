# Keymon iOS Submission Handoff

Date: 2026 07 08
Product: Authentic Hadith
Branch: `fix/repair-batch-2026-06-25`

## Verdict

PARTIAL: Code side is aligned for RevenueCat and iOS handoff.

PARTIAL: Do not submit until the remaining App Store Connect and RoPhone checks below are completed.

## RevenueCat State

VERIFIED: Product IDs in code remain unchanged:

- `ah_monthly_premium`
- `ah_annual_premium`
- `ah_lifetime_premium`

VERIFIED: entitlement ID in code remains `premium`.

VERIFIED: public iOS SDK key path is aligned between app runtime and `npm run qa:revenuecat`.

VERIFIED: `npm run qa:revenuecat` passed on 2026 07 08:

```json
{
  "current_offering_id": "default",
  "current_package_count": 3,
  "expected_product_ids": [
    "ah_monthly_premium",
    "ah_annual_premium",
    "ah_lifetime_premium"
  ],
  "actual_product_ids": [
    "ah_monthly_premium",
    "ah_annual_premium",
    "ah_lifetime_premium"
  ],
  "missing_product_ids": []
}
```

VERIFIED: subscription screen simulator receipt saved:

- `e2e-submit-20260708-39-revenuecat-subscription.png`

## Code Fix Included

VERIFIED: `resetUser()` now checks `Purchases.getAppUserID()` before `Purchases.logOut()`.

VERIFIED: if RevenueCat is already anonymous, logout is skipped instead of triggering the anonymous logout failure path.

VERIFIED: this does not change product IDs, entitlement IDs, prices, package mapping, or paywall placement.

## Local Checks

VERIFIED: `npx tsc --noEmit` passed.

VERIFIED: `npm test -- revenuecat.test.ts onboarding-access.test.ts route-integrity.test.ts --runInBand` passed.

VERIFIED: `node scripts/qa-appstore-metadata.mjs` passed.

VERIFIED: iOS simulator rebuild passed with zero errors.

PARTIAL: `node scripts/ios-go-no-go-audit.mjs` still reports NO GO because manual submission checks remain open.

## Keymon Must Verify Before Submit

UNKNOWN: App Store Connect product status. Confirm all three IAP products are Ready to Submit, not Missing Metadata.

UNKNOWN: RevenueCat entitlement dashboard. Confirm all three iOS products are attached to entitlement `premium`.

UNKNOWN: RoPhone or TestFlight paywall proof. Confirm packages render on device and no no offerings message appears.

UNKNOWN: RoPhone or TestFlight restore proof. Tap Restore Purchases and confirm the expected result for the Apple ID.

UNKNOWN: final go/no go doc. Flip `IOS_SUBMISSION_GO_NO_GO.md` only after the manual blockers above are verified.

## Stop Rule

If any App Store Connect product, RevenueCat entitlement, RoPhone paywall, or restore purchase proof is missing, do not submit.
