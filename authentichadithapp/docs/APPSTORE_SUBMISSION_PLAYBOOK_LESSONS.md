# iOS App Store Submission — Master Playbook & Lessons Learned

> **Source:** Authentic Hadith V1 submission, 2026-06-16 (Build 37, commit `0f8259f`).
> **Purpose:** Skip every error we hit this build, on the next one. Hand this to any operator (KP, Cowork, Claude Code, a swarm agent) before touching an App Store submission.
> **For Cowork:** Ingest this whole document into Notion as a permanent reference under the Red Lantern / Apps space. Mirror it verbatim, do not paraphrase the technical facts.

---

## 0. The One-Sentence Summary

Most App Store pain this build came from **not knowing the App Store Connect data model** (Subscriptions vs In-App Purchases are different products in different places with different submit paths) and from **trusting the UI/docs instead of verifying against the live ASC API**. Fix those two habits and the next submission is hours, not days.

---

## 1. THE #1 TRAP — Subscriptions vs In-App Purchases Are Different Animals

This single confusion cost the most time. Burn it into memory:

| | **Auto-Renewable Subscriptions** | **Non-Consumable In-App Purchase** |
|---|---|---|
| Examples | Premium Monthly ($9.99/mo), Premium Annual ($49.99/yr) | Lifetime Premium ($99.99 one-time) |
| Billing | Recurring, auto-renews | One-time, never renews |
| Lives in ASC | **Subscriptions** section → inside a **Subscription Group** | **In-App Purchases** section (a separate list) |
| How it submits | Has its **own "Submit for Review" button** on the subscription group | **NO own submit button** — attached to the **app version** and submitted with the binary on the version page |
| Where you fix a rejected localization | Click into each subscription → its localization | In-App Purchases list → the IAP → its localization |

**Rules that follow from this:**
- A non-consumable (Lifetime) will **never** appear in the Subscriptions group. If you go looking for it there, you will think it is "missing." It is not. It is a separate product type.
- A non-consumable IAP being submitted for the **first time** must be **selected on the app version page** (section: "In-App Purchases and Subscriptions") before you submit the version. ASC literally tells you: *"Your first in-app purchase must be submitted with a new app version."*
- Subscriptions can be submitted from their own section once the binary is up; IAPs ride with the version.

---

## 2. App Store Connect API — HARD LIMITS (what the API will NOT let you do)

We tried to automate fixes via the ASC API and hit walls. Do not waste time re-trying these — go straight to the ASC web UI:

1. **You cannot edit a REJECTED IAP localization via API.**
   `PATCH /v1/inAppPurchaseLocalizations/{id}` → **409 `ENTITY_ERROR.ATTRIBUTE.INVALID.UNMODIFIABLE`** ("Cannot edit … when it is in REJECTED state").
2. **You cannot delete the last/only localization.**
   `DELETE /v1/inAppPurchaseLocalizations/{id}` → **409** ("Cannot delete last localization"). An IAP must always have ≥1 localization.
3. **The add-a-sibling-then-delete workaround also fails.** Adding a temp `en-GB` localization succeeds (201), but deleting the rejected `en-US` then throws **500 UNEXPECTED_ERROR**. Apple blocks deletion of a rejected localization regardless of position.
4. **Replying to Apple (Resolution Center) has NO API.** App Review messaging is browser-only. The reply must be typed/pasted in the ASC UI.
5. **"Submit for Review" / "Resubmit to App Review" is effectively UI-driven** and, by our own Rule 040, is a human action — never automated.

**Net:** Rejected-IAP metadata edits, Apple replies, and the final submit are **ASC-UI-only**. Everything else (reading state, attaching builds, deleting promo images, editing prices/non-rejected metadata) IS API-doable.

**Field limit gotcha:** IAP **description max = 55 characters**. (`POST` returns `409 TOO_LONG` over 55.) Keep IAP descriptions short and complete. Example that fits: `Get lifetime access to all premium features.` (44 chars).

---

## 3. App Icon & Build Mechanics (the "wrong icon shipped" trap)

History: a prior build shipped the blue Expo default icon. Here is the full truth so it never happens again.

- **The app icon is compiled INTO the binary.** Changing `assets/images/icon.png` requires a **NEW build**. You cannot hot-swap an icon on an existing TestFlight build.
- **`ios/` is gitignored.** EAS Build runs `expo prebuild` fresh on its servers and **regenerates the icon from `icon.png`** every build. So an EAS build has the new icon even if your local `ios/` folder is stale.
- **`expo run:ios` does NOT regenerate the icon** on an existing local `ios/` folder. The simulator will show the OLD icon even after you change `icon.png`. To fix the sim: copy the new icon over `ios/<App>/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png`, uninstall the app from the sim, then rebuild. (Or run `expo prebuild`, which needs approval per repo rules.)
- **Apple requires app icons with NO alpha channel** (must be opaque). Check with `sips -g hasAlpha icon.png`. A PNG with rounded-corner transparency = rejection (ITMS-90717).
- **iOS app icons inside an IPA are stored in Apple's "CgBI" PNG format** (byte-swapped). Standard image viewers fail to decode them. Use `sips -s format png in.png --out out.png` to re-decode for viewing.
- **To PROVE what icon actually shipped:** download the IPA from EAS, unzip, and read `Payload/<App>.app/AppIcon60x60@2x.png` (re-decode via sips). That is the literal home-screen icon. Do not trust the simulator or the source PNG — verify the binary.

**Where the icon shows to a paying user:** the iOS **StoreKit purchase sheet** (the "Confirm Subscription" sheet) displays the **app icon**, not any promo image. So your branded icon at checkout comes from the build's app icon, full stop.

---

## 4. The Three "Images" — Never Confuse Them (this is a 2.3.2 minefield)

A subscription/IAP can have multiple image-ish fields. They are NOT the same thing:

1. **App Icon** — the brand logo, compiled into the build. Shows on home screen + StoreKit purchase sheet. Required, opaque, 1024×1024.
2. **IAP/Subscription "Promotional Image"** (1024×1024) — **OPTIONAL**. Only used if you promote the IAP on your App Store product page. **Apple guideline: it must NOT imitate the app icon and must be unique per IAP.** Two IAPs sharing one image = **2.3.2 "duplicate" rejection**. If you are not promoting IAPs on the product page, **delete these entirely** — it removes all 2.3.2 risk and the user still sees your logo at checkout (that is the app icon, not this).
3. **Review Screenshot** (under "Review Information") — **REQUIRED**. Shows the Apple reviewer where/how the purchase appears in the app (the paywall). Keep it. Make sure it shows the actual current paywall (no stale "Save 33%" or removed features).

**Rule:** the fix for a 2.3.2 promo-image flag is usually **delete the optional promo images**, not "change your logo." Your logo is never the thing in violation.

---

## 5. Rejection Guidelines — What Triggers Them & The Fix

The four that hit Authentic Hadith, and the durable fixes:

- **3.1.1 (Business / Payments — IAP bypass):** Any "unlock premium" path that is NOT Apple IAP — promo codes, referral/redeem codes, external unlocks. **Fix:** remove the feature entirely; all unlocks route through StoreKit only. (We deleted the Redeem Code screens and all entry points.)
- **3.1.2(c) (Subscriptions metadata):** Auto-renewable subscription paywalls **must** show functional **Terms of Use (EULA)** + **Privacy Policy** links, alongside the auto-renew disclosure. **Fix:** add both links to the paywall surface itself (Apple standard `https://www.apple.com/legal/internet-services/itunes/dev/stdeula/` for EULA, your privacy URL for Privacy).
- **2.3.2 (Accurate Metadata):** Triggered by (a) raw route slugs showing as screen titles (e.g. a nav bar reading `redeem/index` or `auth/login`), (b) screenshots showing removed features, (c) duplicate/icon-imitating IAP promo images. **Fix:** ensure every screen has a real title (expo-router: every route folder needs a `_layout.tsx` with `screenOptions={{ headerShown: false }}` or a proper title — children with no layout fall through to the root stack's default header and leak the raw path), update screenshots, delete bad promo images.
- **2.3.7 (Accurate Metadata — pricing language):** Pricing/savings claims like **"Save 33%"** are not allowed in IAP/subscription **descriptions**. **Fix:** remove all pricing/savings language from descriptions (the price is shown by the system). Keep descriptions feature-focused.

---

## 6. The Resubmission Flow (rejected → back in review)

When an app is rejected, the rejection often flags the **metadata of ALL IAPs**, not just one. We discovered all three IAP localizations were `REJECTED`, not just the one we noticed first.

Exact sequence to resubmit:
1. **Fix every rejected IAP/subscription localization** in the ASC UI. Editing the display name/description and Saving moves a localization from `REJECTED` → `PREPARE_FOR_SUBMISSION`. (You cannot do this via API — see §2.)
2. **Subscriptions:** after editing, use the subscription group's **"Submit for Review"** → they move to `WAITING_FOR_REVIEW`.
3. **Non-consumable IAP:** edit its localization, then **attach it to the app version** on the version page ("In-App Purchases and Subscriptions" section).
4. **Reply to Apple** in the Resolution Center addressing each cited guideline (browser-only).
5. **Attach the correct build** to the version (confirm the build number — do not submit on a stale build).
6. **Add for Review → Submit to App Review** (or **Resubmit to App Review** on the rejection page). This is the irreversible commit — a human action.
7. **Verify it actually reached Apple** (see §8): the review submission state flips from `UNRESOLVED_ISSUES` → `WAITING_FOR_REVIEW` with a fresh `submittedDate`, the version → `WAITING_FOR_REVIEW`, all IAPs → `WAITING_FOR_REVIEW`.

State vocabulary you will see: `DEVELOPER_ACTION_NEEDED` (you must act), `PREPARE_FOR_SUBMISSION` / `READY_FOR_REVIEW` (ready, not yet submitted), `WAITING_FOR_REVIEW` (submitted, in Apple's queue), `IN_REVIEW`, `REJECTED` / `UNRESOLVED_ISSUES`.

---

## 7. EAS Build & Submit Gotchas

- **`eas submit` can report a generic failure ("Something went wrong … App Store Connect") even when Apple eventually processes the build.** The real reason lives on the EAS submission record (web dashboard), not the CLI output. Build 36's submit "failed" on the CLI but Apple processed it anyway. Check the dashboard before assuming.
- **Always pin submits by `--id <BUILD_ID>`, never `--latest`** (stale-binary trap — you can ship the wrong build).
- **A build appears in ASC as `VALID` only after Apple processing** (typically 5–15 min, sometimes longer). It will not appear in the builds list the instant the upload finishes.
- **`appVersionSource: remote` + `autoIncrement: true`** in `eas.json` → EAS assigns the next build number from its servers (e.g., 34 → 35). The `ios.buildNumber` in app config is ignored in this mode.
- **Export compliance:** `usesNonExemptEncryption: false` (set via `ITSAppUsesNonExemptEncryption`) must be present so the build is submittable without manual compliance answers.

---

## 8. Verification Discipline — Prove It, Don't Trust the Screen (TruthSerum)

Every "done" this build was proven against the **live App Store Connect API**, not a screenshot or a doc. Patterns to reuse:

- **Auth:** ASC API key (ES256 JWT, `dsaEncoding: 'ieee-p1363'`, `aud: appstoreconnect-v1`, 10-min exp). Bearer to `https://api.appstoreconnect.apple.com`.
- **Confirm a build shipped the right icon:** extract `AppIcon60x60@2x.png` from the IPA and view it (re-decode CgBI via sips). Don't trust the sim.
- **Confirm a fix cleared:** re-GET the object and check the state flipped (e.g., localization `REJECTED` → `PREPARE_FOR_SUBMISSION`).
- **Confirm a submission reached Apple:** the review submission has `state=WAITING_FOR_REVIEW` + a fresh `submittedDate`; the version is `WAITING_FOR_REVIEW`.
- **Confirm distinct images:** compare `sourceFileChecksum` / md5 / file size — different checksums = genuinely distinct.
- **Never claim "ready/fixed/submitted" from the UI alone.** Hit the API. The API does not lie; a cached browser tab does.

---

## 9. PRE-SUBMISSION CHECKLIST (run this top-to-bottom before every submit)

**Build:**
- [ ] Correct build number attached to the version (not a stale one).
- [ ] App icon verified from the IPA (right artwork, no alpha).
- [ ] `tsc --noEmit` exit 0, lint clean, tests green, `expo-doctor` clean.
- [ ] Export compliance set (`usesNonExemptEncryption: false`).

**Subscriptions (each one):**
- [ ] Price correct.
- [ ] Localization NOT `REJECTED` (edit+save to clear if it is).
- [ ] Review screenshot `COMPLETE` and matches the current paywall.
- [ ] Submitted via the subscription group → `WAITING_FOR_REVIEW`.

**In-App Purchases (each non-consumable):**
- [ ] Price correct.
- [ ] Localization NOT `REJECTED`; description ≤ 55 chars, no pricing language.
- [ ] Review screenshot `COMPLETE`.
- [ ] **Selected on the app version page** ("In-App Purchases and Subscriptions").

**Metadata / images:**
- [ ] No raw route slugs as screen titles anywhere (2.3.2).
- [ ] No "Save X%" / pricing language in any IAP description (2.3.7).
- [ ] Optional IAP promo images either UNIQUE-and-not-icon-imitating, or DELETED (2.3.2).
- [ ] Paywall shows working EULA + Privacy Policy links (3.1.2c).
- [ ] No non-IAP unlock paths anywhere (3.1.1).

**Paywall product source (RevenueCat or equivalent):**
- [ ] All intended tiers present in the **Current** offering (offering is fetched at runtime — no rebuild needed to add/remove a package; it is a dashboard change).
- [ ] App renders ALL offering packages dynamically (no hardcoded 2-package list that hides a tier).

**Submit:**
- [ ] Reply to Apple in Resolution Center addressing each guideline.
- [ ] Human clicks Submit / Resubmit (never automated — Rule 040).
- [ ] **Verify via API:** version + all IAPs `WAITING_FOR_REVIEW`, review submission `WAITING_FOR_REVIEW` with fresh `submittedDate`.

---

## 10. RevenueCat / Paywall Mechanics (bonus, learned this build)

- The app reads the **"Current" offering** from RevenueCat at runtime (`getOfferings()` → `offerings.current`). No offering ID is hardcoded.
- **Adding/removing a tier from the paywall is a RevenueCat dashboard change, NOT an app rebuild.** Re-attach the package to the Current offering and it appears on next app launch.
- Both paywall surfaces (a custom screen mapping `availablePackages`, and the `RevenueCatUI.Paywall` template) render the offering dynamically. If a tier "disappears," check the dashboard offering first — it is almost never a code issue.
- An IAP that is in the RevenueCat offering but is **submitted to Apple review while not purchasable in the app** = rejection risk. Conversely, an IAP that is NOT submitted to Apple can be absent from the paywall with no compliance issue. Keep "what is submitted" and "what is purchasable" in sync.

---

*End of playbook. Keep it current after every submission — append the next build's surprises here.*
