# Apple Review Notes — Authentic Hadith v1.0

## Demo Credentials

- Email: apple.reviewer@authentichadith.app
- Password: [STORED_SECURELY_IN_APP_STORE_CONNECT_REVIEW_NOTES]
- Account type: Premium (full access)
- Setup: KP must run docs/appstore/DEMO_ACCOUNT.sql in the Supabase SQL Editor, then grant the "premium" RevenueCat Promotional Entitlement to App User ID `00000000-0000-0000-0000-000000000001` in the RevenueCat dashboard before the review window opens.

## App Overview

Authentic Hadith is an Islamic education app that gives Muslims access to authenticated hadith from Sahih al-Bukhari and Sahih Muslim, with an AI assistant for contextual explanations, structured learning paths, and personal hadith collections. The app helps users study the prophetic traditions with verified chains of narration and scholarly grading.

## How to Reach Gated Features

1. Launch the app and tap "Sign In" on the welcome screen.
2. Enter the demo credentials above.
3. The app will load with premium status active (verified via RevenueCat entitlement).
4. The paywall normally appears when a free user attempts to access a premium-tier Learning Path (Learn tab) or exhausts the 3 free daily AI assistant queries (Assistant tab).
5. With the demo account, the paywall is bypassed: all Learning Paths (including advanced and scholar-level) are accessible, and the AI Assistant shows "Unlimited explanations (Premium)" with no query cap.

## AI Assistant — How It Works

- Source: Groq API (server-side, fast inference — key never shipped in client bundle)
- Model: `llama-3.3-70b-versatile`
- Hadith data: sourced and graded from Sahih al-Bukhari and Sahih Muslim collections
- Safeguards:
  - Input safety filter (`lib/islamic-safety-filter.ts`) runs on every message before it reaches the model. It pattern-matches and blocks six categories: `prompt_injection`, `explicit_content`, `haram_facilitation`, `blasphemy`, `extremism`, and `ruling_request`. Blocked messages receive a pre-written Islamic scholarly deflection rather than a model response.
  - The system prompt enforces Islamic scholarly ethics (adab al-ilm) via `ISLAMIC_ETHICS_ADDENDUM` on every request. The addendum explicitly instructs the model to refuse jailbreaks, maintain reverence for Islamic figures, decline haram facilitation, and guard Islamic aqeedah.
  - Input length is capped at 500 characters (`MAX_INPUT_LENGTH` in assistant.tsx).
  - Model responses are capped at 1024 tokens.
- Disclaimer: "Ask questions about hadith. Answers are AI-generated context, not a fatwa." shown in the Assistant screen header. "AI guidance only. For rulings, consult a qualified scholar." shown in the persistent footer bar beneath every conversation. "AI guidance only. For religious rulings, consult a qualified scholar." also shown on the empty state of the Assistant screen and in the Credits screen (`app/settings/credits.tsx`). On the Hadith detail screen, AI-generated summaries are labeled "AI-generated. Not a religious ruling."
- Daily quota for free users: 3 queries per day (resets at midnight, tracked in AsyncStorage)

## Content and Data Sources

- Hadith collections: Bukhari, Muslim (authenticated chains, graded)
- Storage: Supabase (cloud database, PostgreSQL with Row Level Security enabled on all tables)
- Authentication: Supabase Auth (email/password, session stored in iOS Keychain via expo-secure-store)

## Notes for Reviewer

- The app does not require location, camera, or microphone access. No sensitive permission prompts will appear.
- In-app purchases use Apple's native StoreKit via RevenueCat. The three IAP products are: `ah_monthly_premium` (monthly subscription), `ah_annual_premium` (annual subscription), `ah_lifetime_premium` (non-consumable lifetime).
- No user-generated content features in v1.0. Users can save hadiths and add personal notes to their own collection, but no content is shared publicly.
- The AI assistant does not issue fatwas or religious rulings. Every surface where AI output is shown includes an explicit disclaimer to consult a qualified scholar for religious rulings.
- App Tracking Transparency: the app has `NSPrivacyTracking: false` and makes no ATT permission requests. No cross-app or cross-site tracking occurs.
