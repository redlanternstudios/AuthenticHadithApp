# Resubmission Pack — Apple Rejection of v1.0 Build 32 (FIX-085)

**Submission ID:** 632f5eee-0eb4-4a95-be1e-01d00806da30
**Reviewed:** 2026-06-14 · iPad Air 11-inch (M3)
**Prepared:** 2026-06-15 · pairs with `BUILD_FIX_LOG.md` FIX-085 + Notion FIX-085 receipt

Apple cited 4 guidelines. **2 are code (done — FIX-085). 3 are App Store Connect metadata (coworker — below).**
Note 3.1.2(c) is split: the in-app links are code (done); the EULA link in App Store metadata is ASC (below).

---

## PART A — App Store Connect metadata tasks (COWORKER)

### A1. Guideline 2.3.7 — Remove pricing from screenshots
Apple flagged a screenshot that shows subscription prices. That is the **paywall screenshot** ($9.99 / $49.99 / $99.99).

1. ASC → **Apps → Authentic Hadith → [version 1.0] → App Store tab**.
2. Scroll to **Previews and Screenshots**.
3. For **every** device size that has it (iPhone 6.9"/6.5" AND iPad 13"/12.9"): find the screenshot showing the subscription tiers/prices and **delete it**.
4. If removing it drops a device size below 3 screenshots, replace it with a price-free screen (e.g. Hadith detail, Search, or Learning Paths).
5. Do **not** add any caption or image text that states a price anywhere in the screenshot set.

> Note: in-app prices on the live paywall are fine and required. The rule is only about the **store listing** images.

### A2. Guideline 2.3.2 — Remove duplicate IAP promotional images
Two promoted in-app purchases were given the **same** promotional image.

1. ASC → **Monetization → In-App Purchases** (and **Subscriptions**).
2. Open each product that has a **Promotional Image** / **App Store Promotion** set.
3. Simplest compliant fix: **delete the promotional image** on every product (these are optional). 
   - OR, if you want to keep promotion: upload a **unique** image per product (no two identical).
4. Confirm no two products share an identical promotional image.

### A3. Guideline 3.1.2(c) — Add EULA link in App Store metadata
The in-app links are already added in code (FIX-085). Apple also needs the metadata-side links.

1. **Privacy Policy URL** — ASC → **App Privacy** (or App Information → Privacy Policy): set to
   `https://byredllc.com/privacy`
2. **Terms of Use (EULA)** — we use Apple's **standard** EULA, so per Apple's instruction, add the link in the **App Description**. ASC → App Store tab → **Description**, add a line at the bottom:
   `Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`
   - (Alternative: ASC → App Information → **License Agreement** → keep "Apple's Standard License Agreement." A custom EULA goes in the EULA field instead — not needed here.)

### A4. After A1–A3
Confirm the version state is ready and ping KP. Do **not** Submit for Review — KP triggers that after device QA (Stage 3/4).

---

## PART B — Apple reply (Resolution Center) + Notes for Review

### B1. Reply to paste in App Store Connect Resolution Center
> Thank you for the detailed review. We have addressed all four items:
>
> **Guideline 3.1.1 — In-App Purchase:** We have fully removed the promo/referral code redemption feature. The app no longer unlocks Premium through any mechanism other than Apple In-App Purchase. All Premium access is granted exclusively through the App Store subscription products.
>
> **Guideline 3.1.2(c) — Subscriptions:** The subscription screen now displays functional links to the Terms of Use (EULA) and the Privacy Policy, alongside the subscription title, length, and price. We use Apple's standard EULA (linked in the app and in the App Description) and our Privacy Policy at https://byredllc.com/privacy. A screen recording demonstrating these links (and tapping each to open the respective page) is attached.
>
> **Guideline 2.3.7 — Accurate Metadata:** We have removed the screenshot that referenced pricing from the App Store listing for all device sizes.
>
> **Guideline 2.3.2 — Promotional Images:** We have removed the duplicate in-app purchase promotional images so each product has a unique image (or none).
>
> Please let us know if anything further is needed. Thank you.

### B2. Notes for Review (App Review Information → Notes) — keep for future submissions
> Premium is unlocked only via Apple In-App Purchase; the previous promo-code feature has been removed entirely.
> Subscription screen (More → Profile → Subscription) shows subscription title, length, price, and functional Terms of Use (EULA) + Privacy Policy links.
> EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
> Privacy Policy: https://byredllc.com/privacy

### B3. Screen recording checklist (record on device, attach to the reply)
1. Open the app → **More → Profile → Subscription** (the paywall with the three tiers).
2. Show the three priced tiers + the auto-renew disclosure are visible.
3. Tap **Terms of Use (EULA)** → confirm the Apple EULA page opens → back.
4. Tap **Privacy Policy** → confirm byredllc.com/privacy opens → back.
5. (Optional) Show that there is no longer any "Redeem Code" screen reachable.
Keep it under ~30 seconds, portrait, no editing needed.

---

## Dependency order (do NOT skip)
1. KP approves Checkpoint #1 → commit + push (Stage 3).
2. ✅ EAS production **Build 34** (v1.0.0) built 2026-06-15 — build ID `16fa55ca-6d5e-4419-9f31-d25daea353f3`, IPA ready, NOT yet submitted to TestFlight.
3. Coworker completes A1–A3 in ASC (can run in parallel with 1–2).
4. Device QA on the new build incl. paywall EULA/Privacy tap-through (Rule 040).
5. Record B3 screen recording on the QA build.
6. Attach build + screen recording, paste B1 reply, fill B2 notes.
7. Submit for Review — **KP only**, after 3–5 are green.
