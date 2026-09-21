# Authentic Hadith iOS Agent Learning Ledger
**Penn Enterprises LLC Operational Asset — KI-HADITH-RELEASE-001**
*Governed by JP for Keymon Penn (CEO)*

Purpose: Durable, receipt-backed lessons, rejection autopsies, and release invariants for Authentic Hadith iOS (`com.byred.authentichadith`).

---

## 1. Executive Historical Summary

Authentic Hadith has achieved 5 successful production releases on the Apple App Store (v1.0 Build 43, v1.1.0 Build 102, v1.1.1 Build 108, v1.1.2 Build 110, and v1.1.3 Build 135 — all currently `READY_FOR_SALE`). 

During its initial v1.0 and subsequent feature release phases, the app underwent 4 formal App Review rejections and containment cycles. Every single failure mode was audited, isolated, and permanently immunized through machine-enforced repository guards.

---

## 2. Master Historical Rejection Autopsies

### Incident 1: Guideline 3.1.1 — Alternative Unlock / Redeem Promo Code Bypass (Build 37)
- **Trigger:** Submission `1637f309` rejected under App Store Review Guideline 3.1.1 (Business — Payments — In-App Purchase).
- **Root Cause:** The application included an in-app "Redeem Promo Code" screen and backend logic intended for influencer gifting or offline promotions. Apple classified this as an external digital unlock bypassing StoreKit.
- **Permanent Immunization:** Completely expunged the redeem code routes, navigation entries, and database tables. All digital unlocking in Authentic Hadith is 100% routed through Apple StoreKit via RevenueCat.

### Incident 2: Guideline 2.3.7 — Pricing & Savings Claims in ASC Metadata (Build 40)
- **Trigger:** Submission `632f5eee` rejected under Guideline 2.3.7 (Accurate Metadata).
- **Root Cause:** Subscription descriptions in App Store Connect contained claims like *"Save 33% with Annual"* and comparative price references. Apple strictly prohibits comparative pricing or savings percentages in subscription descriptions because system localization already handles regional pricing displays.
- **Permanent Immunization:** Stripped all price references, currency symbols, and discount percentages from ASC product descriptions. Descriptions must focus purely on feature utility (e.g., *"Unlock complete Sahih collections and audio recitation."*).

### Incident 3: Guideline 2.3.2 — Expo Router Slug Header Leaks & Duplicate Promotional Images (Build 37/40)
- **Trigger:** Metadata rejection citing unpolished UI headers and duplicate promotional images.
- **Root Cause:** 
  1. Expo Router folders lacking `_layout.tsx` or `headerShown: false` leaked raw filesystem route paths (e.g. `auth/login`, `redeem/index`) into the native navigation bar title.
  2. The optional 1024x1024 IAP promotional images duplicated the main app icon across multiple SKUs. Apple flagged this as misleading duplicate metadata.
- **Permanent Immunization:**
  1. Every Expo Router route folder must define an explicit `_layout.tsx` setting `headerShown: false` or defining a user-friendly localized title.
  2. Deleted all optional IAP promotional images from ASC. StoreKit checkout sheets automatically render the official app icon without needing promotional images.

### Incident 4: Guideline 2.1 — Navigation Dead-End on Custom Header Stack (FIX-092)
- **Trigger:** App Reviewer got stranded on a pushed screen without an exit.
- **Root Cause:** A screen pushed as a root `Stack.Screen` over a tab group left the native header back button (`‹ Home`) a non-functional no-op, relying solely on iOS edge swipe gestures. Reviewers on certain iPad/accessibility configurations could not pop the view.
- **Permanent Immunization:** Wired explicit on-screen back navigation (`headerLeft` calling `router.back()`) on every screen. Never rely exclusively on gesture popping.

### Incident 5: The RevenueCat Screenshot Bypass Revenue Destruction Trap
- **Trigger:** Pre-submission testing error in `app/_layout.tsx`.
- **Root Cause:** A developer hardcoded `isPro = true` and commented out RevenueCat initialization with `// REVERT BEFORE COMMIT` to capture marketing screenshots on the simulator. The change was accidentally committed and pushed to `main`, which completely unlocked premium for all free users and crippled revenue.
- **Permanent Immunization:** Created `scripts/qa-release-guard.mjs` (Gate 0 of `npm run qa:release`), which automatically scans the codebase for `REVERT BEFORE COMMIT`, `SCREENSHOT-BYPASS`, and forced `isPro` flags, terminating CI builds with a fatal exit if detected.

### Incident 6: Separate Subscriptions vs In-App Purchases Submission Architecture
- **Trigger:** Build 37 submission stall.
- **Root Cause:** Non-consumable Lifetime IAP was expected to appear inside the Subscriptions Group. It was thought to be missing, delaying submission.
- **Permanent Immunization:** Hardcoded the ASC data model into `RELEASE_ENGINEERING_SOP.md`: Non-consumable IAPs must be attached on the App Store Version page, whereas Auto-Renewable Subscriptions submit via the Subscription Group.

---

## 3. Automated QA & Invariant Tooling in Authentic Hadith

```bash
# Run complete release gate sequence:
npm run qa:release

# Sub-gate commands:
npm run qa:release-guard   # Gate 0: Scans for forbidden bypasses & leaked secrets
npm run qa:types           # Gate 1: TypeScript compilation check (tsc --noEmit)
npm run qa:lint            # Gate 2: ESLint compliance
npm run qa:test            # Gate 3: Jest test suite with 100% coverage
npm run qa:audit:routes    # Gate 4: Expo Router navigation integrity audit
npm run qa:audit:deps      # Gate 5: Security & dependency vulnerability scan
```

---

## 4. Current App Store Status

| Version | Build | App Store State | Distribution | Release Notes |
| :--- | :--- | :--- | :--- | :--- |
| **1.1.3** | `#135` | **`READY_FOR_SALE`** | Public App Store | Native audio playback optimizations & bookmark sync |
| **1.1.2** | `#110` | **`READY_FOR_SALE`** | Superseded | Performance & memory footprint fixes |
| **1.1.1** | `#108` | **`READY_FOR_SALE`** | Superseded | Search indexing enhancements |
| **1.1.0** | `#102` | **`READY_FOR_SALE`** | Superseded | Translation engine updates |
| **1.0** | `#43` | **`READY_FOR_SALE`** | Superseded | Initial public launch |
