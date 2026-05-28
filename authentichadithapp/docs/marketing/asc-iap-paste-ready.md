# App Store Connect — IAP Paste Ready

Source of truth: `APPSTORE_METADATA.md` (lines 65-87). All values below are copy-paste ready into the App Store Connect "In-App Purchases" form for the Authentic Hadith app (bundle `com.byred.authentichadith`, ASC App ID `6764673665`).

Subscription Group: **Premium**

---

## Shared (App-Level) Context

These fields are NOT per-IAP. They live at the app level in ASC, but are included here so the reviewer's mental model of the suite stays consistent.

- **App Promotional Text** (max 170 chars, editable without review):
  Explore authentic hadiths with AI-powered guidance, daily readings, structured learning paths, and gamified progress tracking. Start your journey today.

- **App Review Notes** (already in APPSTORE_METADATA.md):
  This app requires account creation to access features. Use the provided demo credentials. The AI assistant feature requires an internet connection. In-app purchases unlock premium features (unlimited AI chat, advanced learning paths). Subscription management is handled through the standard iOS subscription settings.

- **Demo Account** (already in APPSTORE_METADATA.md):
  Email: apple.reviewer@authentichadith.app
  Password: stored privately by KP, enter only in ASC Review Information

---

## 1. Monthly Premium (Auto-Renewable Subscription)

- **Reference Name**: Premium Monthly Subscription
- **Product ID**: ah_monthly_premium
- **Cleared for Sale**: Yes
- **Price**: $4.99 USD per month (Tier 5)
- **Display Name**: Premium Monthly
- **Description**: Unlimited AI assistant, advanced learning paths, quizzes, and all premium features. Cancel anytime.
- **Review Notes**: Auto-renewable subscription in the Premium subscription group. Unlocks the same premium entitlement as Annual and Lifetime: unlimited AI assistant conversations, advanced learning paths, quizzes, and full offline library access. Renews monthly via the user's iTunes account. Cancellation is handled through the standard iOS Subscription Settings (Settings App, Apple ID, Subscriptions). The demo Apple Review account has the premium entitlement pre-granted in Supabase so reviewers can verify all premium-gated features without a live purchase.

---

## 2. Annual Premium (Auto-Renewable Subscription)

- **Reference Name**: Premium Annual Subscription
- **Product ID**: ah_annual_premium
- **Cleared for Sale**: Yes
- **Price**: $29.99 USD per year (Tier 30)
- **Display Name**: Premium Annual
- **Description**: Unlimited AI assistant, advanced learning paths, quizzes, and all premium features. Save 50% compared to monthly.
- **Review Notes**: Auto-renewable subscription in the Premium subscription group. Identical feature set to Premium Monthly, billed annually at a 50% effective discount versus 12 monthly renewals. Renews yearly via the user's iTunes account. Cancellation is handled through the standard iOS Subscription Settings. The demo Apple Review account has the premium entitlement pre-granted in Supabase so reviewers can verify all premium-gated features without a live purchase.

---

## 3. Lifetime Premium (Non-Consumable)

- **Reference Name**: Lifetime Premium
- **Product ID**: ah_lifetime_premium
- **Cleared for Sale**: Yes
- **Price**: $79.99 USD one-time (Tier 80)
- **Display Name**: Lifetime Premium
- **Description**: Unlock all premium features forever. Unlimited AI assistant, advanced learning paths, and all future premium content. One-time purchase, no subscription needed.
- **Review Notes**: Non-consumable in-app purchase. One-time payment unlocks the premium entitlement permanently for the purchasing Apple ID. Restorable via the standard "Restore Purchases" action in the app. Same feature set as Monthly and Annual subscriptions: unlimited AI assistant conversations, advanced learning paths, quizzes, full offline library access, and priority access to new premium features as they ship. The demo Apple Review account has the premium entitlement pre-granted in Supabase so reviewers can verify all premium-gated features without a live purchase.

---

## Field Mapping Reference

| ASC Field | Source in APPSTORE_METADATA.md | Notes |
|---|---|---|
| Reference Name | Synthesized | Internal only, not user-visible. Max 64 chars. |
| Product ID | Line 70 / 76 / 84 | Must match RevenueCat product IDs. See drift note below. |
| Cleared for Sale | Set to Yes | Required Yes for production launch. |
| Price | Line 71 / 77 / 85 | Pick the closest ASC price tier in the form. |
| Display Name | Line 72 / 78 / 86 | User-visible. Max 30 chars. |
| Description | Line 73 / 79 / 87 | User-visible. Max 45 chars typically — review and trim if ASC rejects. |
| Review Notes | Synthesized from app-level review notes + product description | Notes to Apple reviewer, not user-visible. |

---

## Drift Flags (Reconcile Before Submitting)

1. **Product ID convention — RESOLVED 2026-05-27**: Runtime code is canonical. `lib/purchases/revenuecat.ts:27-29` defines `ah_monthly_premium`, `ah_annual_premium`, `ah_lifetime_premium` — and that is what App Store Connect AND the RevenueCat dashboard MUST use. `APPSTORE_METADATA.md`, this file, `PRE_TESTFLIGHT_READINESS_GATE.md`, `XCODE_NATIVE_RELEASE_AUDIT.md`, `RUNTIME_SMOKE_TEST_01.md`, and `EAS_PREVIEW_QA_02.md` all already use the canonical naming. The stale outlier is `.claude/rules/forbidden-actions.md:27` (still lists the old `ah_premium_monthly / ah_premium_annual / ah_lifetime` convention) — update that file separately under its own approval gate. `BUILD_FIX_LOG.md` historical entries are left as audit trail.

2. **Description character limits**: The descriptions above exceed the typical 45-char ASC display description limit (Monthly is 113 chars, Annual is 118 chars, Lifetime is 154 chars). ASC will reject these in the short-description field. Either use them in the long-description / promotional-text field (where 100+ chars is allowed) or trim to ~45 chars. Suggested trims:
   - Monthly: "Unlimited AI, learning paths, premium features."
   - Annual: "Unlimited AI, learning paths. 50% off monthly."
   - Lifetime: "Unlock all premium features forever. One-time."

3. **Price tier precision**: ASC uses regional price tiers, not raw USD values. The Tier numbers above are approximations — confirm in the ASC pricing matrix before finalizing.
