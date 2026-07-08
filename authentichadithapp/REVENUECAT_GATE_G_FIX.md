# RevenueCat Gate G Fix - Authentic Hadith

Last updated: 2026-07-08 12:50 PDT

## Current Status

`API VERIFIED / DEVICE PENDING`: RevenueCat accepts the same iOS public SDK key path used by the app and returns current offering `default` with all three expected product IDs.

Current verifier:

```sh
npm run qa:revenuecat
```

Current passing receipt:

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

## What This Means

The app-side RevenueCat key path and current offering package mapping are no longer the primary problem. The remaining proof is dashboard/device/store verification:

- The RevenueCat project has an offering named `default`.
- That offering currently returns three packages through the public iOS SDK key.
- App Review/TestFlight paywall flows still need real-device proof because a passing offerings API check does not prove StoreKit purchase sheets, sandbox purchase behavior, entitlement activation, restore behavior, or App Store Connect product status.

## Required Dashboard Verification

Use RevenueCat dashboard and App Store Connect.

### 1. App Store Connect

Verify these product IDs exactly:

| Type | Product ID | Display |
|---|---|---|
| Subscription | `ah_monthly_premium` | Premium Monthly |
| Subscription | `ah_annual_premium` | Premium Annual |
| Non-consumable | `ah_lifetime_premium` | Lifetime Premium |

Each product needs:

- Price configured.
- English localization configured.
- Status not stuck at missing metadata.
- Bundle ID matches `com.byred.authentichadith`.

### 2. RevenueCat Products

In RevenueCat:

1. Open the Authentic Hadith project.
2. Go to Product catalog / Products.
3. Verify the three iOS products:
   - `ah_monthly_premium`
   - `ah_annual_premium`
   - `ah_lifetime_premium`
4. Confirm each is connected to the Apple app that uses bundle ID `com.byred.authentichadith`.

### 3. RevenueCat Entitlement

In RevenueCat:

1. Go to Entitlements.
2. Create or open entitlement `premium`.
3. Attach all three products to `premium`.

### 4. RevenueCat Offering

In RevenueCat:

1. Go to Offerings.
2. Open offering `default`.
3. Confirm packages exist for the three products.
4. Use clear package identifiers, for example:
   - `$rc_monthly` -> `ah_monthly_premium`
   - `$rc_annual` -> `ah_annual_premium`
   - `lifetime` -> `ah_lifetime_premium`
5. Make sure `default` is the current offering.

## Verification

After any dashboard changes, run:

```sh
npm run qa:revenuecat
```

Expected result:

- `RevenueCat offering audit: PASS`
- `current_offering_id` is `default`
- `current_package_count` is at least `3`
- `actual_product_ids` contains:
  - `ah_monthly_premium`
  - `ah_annual_premium`
  - `ah_lifetime_premium`

Current status: PASS as of 2026-07-08 12:50 PDT.

Latest simulator receipt:

- `e2e-submit-20260708-39-revenuecat-subscription.png`

Latest local proof:

- `npm run qa:revenuecat` returned PASS with `current_offering_id` `default`, package count `3`, and no missing product IDs.
- `npm test -- revenuecat.test.ts onboarding-access.test.ts route-integrity.test.ts --runInBand` returned PASS.
- `npx tsc --noEmit` returned PASS.

## Do Not Do This

- Do not put `REVENUECAT_SECRET_API_KEY` or any `sk_...` key in Expo config or app code.
- Do not rename product IDs in code to match dashboard guesses. App Store product IDs are the contract.
- Do not run final App Store submission until this verifier passes and RoPhone/TestFlight confirms the paywall fetches offerings.

## Next Gate

After `npm run qa:revenuecat` passes:

1. Install the latest TestFlight/internal build on RoPhone.
2. Open the subscription screen.
3. Confirm packages render.
4. Confirm Restore Purchases is reachable.
5. Update launch gate docs with KP-confirmed evidence.
