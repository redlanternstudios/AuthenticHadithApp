# COWORK HANDOFF — App Store Connect metadata fixes (AH build 40 rejection)

**For:** Cowork (browser/ASC UI agent). **Self-contained — assume no prior context.**
**Goal:** clear Apple's build-40 rejection (Guidelines 3.1.2c + 2.3.7) by fixing App Store
Connect metadata. All actions are in the ASC web UI. **Do NOT press "Submit for Review" — that
and the screen recording are KP's device step (see end).**

## Account / app
- App Store Connect: https://appstoreconnect.apple.com
- App: **Authentic Hadith** · Apple ID **6764673665** · team **By red llc / redlantern**
- Rejection submission ID: 96f2f1c8-b353-4646-95ae-64fc08cc145b (reviewed 2026-06-17)

## The two issues to clear
1. **3.1.2(c)** — App Store metadata must include a functional Terms of Use (EULA) link (standard Apple EULA → put it in the App Description) + Privacy Policy in the Privacy field.
2. **2.3.7** — App screenshots must contain NO price/"free"/discount references. Remove priced screenshots; remove the "Save 50%" line from the Annual subscription description.

---

## TASK 1 — App Description (3.1.2c)
ASC → Apps → Authentic Hadith → [version 1.0] → **App Store** tab → **Description**. Replace the
entire Description field with this exact text:

```
Discover and study authentic hadiths from the most trusted collections in Islamic scholarship.

WHAT YOU GET:
- Browse hadiths from the Sahihayn — Sahih al-Bukhari and Sahih Muslim, the two most rigorously authenticated collections in Islamic scholarship — with full Arabic text and English translations
- AI-powered hadith assistant that answers your questions with scholarly context
- Daily hadith readings to build a consistent learning habit
- Save, organize, and annotate hadiths in personal folders
- Structured learning paths with lessons on key Islamic topics
- Gamified progress tracking with streaks, XP, and achievements
- Progress tracking that keeps working even with a spotty connection
- Dark mode, light mode, and multiple language preferences

WHY AUTHENTIC HADITH:
Hadiths in the app are sourced exclusively from the Sahihayn — Sahih al-Bukhari and Sahih Muslim. These are the two most rigorously authenticated hadith collections in Islamic scholarship, agreed upon by the Ummah for over 1,000 years. No grading ambiguity. No disputed chains. Only the most authentic.

The AI assistant provides context and background, not religious rulings (fatwa). It helps you explore hadith meaning, historical context, and connections between narrations while encouraging you to consult qualified scholars for matters of jurisprudence.

PREMIUM FEATURES:
- Unlimited AI assistant conversations
- Advanced learning paths and quizzes
- Priority access to new features

Sign in to keep your account, saved hadiths, and premium access with you across devices.

Built with care for the Muslim ummah by byRed LLC, San Diego, California.

Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy Policy: https://byredllc.com/privacy
```

## TASK 2 — Annual subscription description (2.3.7)
ASC → **Monetization → Subscriptions** → group "Premium" → **Premium Annual** (`ah_annual_premium`)
→ Localization (English). Set the **Description** to exactly (removes the "Save 50%" price claim):

```
Unlimited AI assistant, advanced learning paths, quizzes, and all premium features. Cancel anytime.
```

(Leave Monthly and Lifetime descriptions as-is — they already have no price/discount language.)

## TASK 3 — Privacy Policy field (3.1.2c)
ASC → App Information (or App Privacy) → **Privacy Policy URL** = `https://byredllc.com/privacy`
Confirm it's set and saves.

## TASK 4 — Screenshots (2.3.7)
For **each** device size, delete any screenshot showing prices/tiers (the old paywall screenshot),
then upload the new price-free set. Files are on this Mac:
- **iPhone 6.9":** `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/screenshots/build40-appstore/iphone69/` → upload `01_home.png … 06_stories.png` (6 files, 1320×2868)
- **iPad 13":** `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/screenshots/build40-appstore/ipad13/` → upload `01_home.png … 06_stories.png` (6 files, 2064×2752)
Ignore the `_candidates/` subfolders. Confirm no remaining screenshot shows any price.

## TASK 5 — Review Notes
ASC → App Review Information → **Notes**. Paste:

```
This app requires account creation. Demo credentials are provided in this section.
Subscriptions (Guideline 3.1.2c): The in-app paywall (Profile → Subscription) shows each subscription's title, length, and price, plus functional links to the Terms of Use (EULA) and Privacy Policy. We use Apple's standard EULA, linked in the App Description.
- Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
- Privacy Policy: https://byredllc.com/privacy
Metadata (Guideline 2.3.7): App Store screenshots contain no price, "free," or discount references.
```

## TASK 6 — Draft the Resolution Center reply (do NOT send yet)
ASC → the rejected submission → Resolution Center. Draft this reply (KP sends it WITH the screen
recording attached — see below). Save as draft if possible, otherwise leave it ready for KP:

```
Thank you for the review. We have addressed both items:

Guideline 3.1.2(c) — Subscriptions: The App Description now includes a functional link to the Terms of Use (EULA, Apple's standard) and the Privacy Policy, and the Privacy Policy is set in the Privacy field. The in-app paywall (Profile → Subscription) shows each subscription's title, length, and price with functional Terms of Use (EULA) and Privacy Policy links. A screen recording demonstrating these links is attached.

Guideline 2.3.7 — Accurate Metadata: We removed all price, "free," and discount references from the screenshots and metadata, including the priced paywall screenshot and a comparative pricing line in a subscription description.

Please let us know if anything further is needed.
```

---

## GUARDRAILS (Cowork must obey)
- **Never press "Submit for Review."** Stop after the metadata/screenshots/notes are saved and the reply is drafted.
- Make ONLY the changes above. No other metadata, pricing, or build changes.
- If any field/screen differs from these steps or anything is ambiguous, STOP and report to KP — do not guess.
- Do not echo or store the demo account password anywhere.

## KP's final step (human + device — NOT Cowork)
1. Record a ≤30s screen recording on a device: open Profile → Subscription, show the three tiers
   (title/length/price), tap **Terms of Use (EULA)** (Apple page opens), tap **Privacy Policy**
   (byredllc.com/privacy opens).
2. Attach it to the Resolution Center reply, send the reply.
3. Press **Submit for Review** (KP-owned per Rule 040), after device QA of the chosen build.
