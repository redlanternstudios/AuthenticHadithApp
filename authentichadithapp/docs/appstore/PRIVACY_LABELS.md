# Privacy Labels — Authentic Hadith

Generated from code audit on 2026-06-09. Based on actual Supabase query findings, not assumptions.

---

## Data Collected

| Category | Data Type | Use | Linked to User | Tracking |
|---|---|---|---|---|
| Contact Info | Email address | Account creation / sign-in (Supabase Auth) | Yes | No |
| Identifiers | User ID (UUID) | Session management, RevenueCat identity sync, content personalization | Yes | No |
| User Content | Saved hadiths (hadith_id, folder_id, notes, notes_html) | Personal library / My Hadith feature | Yes | No |
| User Content | Folder names, privacy settings (hadith_folders) | My Hadith folder organization | Yes | No |
| User Content | Reflections / notes on hadiths (saved_hadiths.notes) | Personal annotations | Yes | No |
| User Content | Folder comments (folder_comments) | Notes on saved hadiths | Yes | No |
| User Content | AI chat messages (sent to Groq API server-side; not persisted in Supabase) | AI assistant responses | No | No |
| Usage Data | Hadith views (hadith_views table) | Reading history | Yes | No |
| Usage Data | Quiz attempts (quiz_attempts) | Learning progress tracking | Yes | No |
| Usage Data | User streaks (user_streaks), user stats (user_stats) | Gamification / progress | Yes | No |
| Usage Data | Lesson progress (user_lesson_progress) | Learning path tracking | Yes | No |
| Usage Data | User preferences (user_preferences) | App settings (language, notifications) | Yes | No |
| Purchase History | Subscription tier, subscription status, subscription expiry (profiles table via RevenueCat sync) | Premium feature gating | Yes | No |
| Health & Fitness | None | — | — | — |
| Location | None | — | — | — |
| Sensitive Info | None | — | — | — |
| Financial Info | None (IAP handled entirely by Apple App Store / RevenueCat; raw payment data never touches our servers) | — | — | — |

---

## Analytics / Third-Party SDKs

| SDK | Purpose | Data Sent | Privacy Policy |
|---|---|---|---|
| RevenueCat (`react-native-purchases`) | In-app purchase management | User ID (Supabase UUID), purchase events, entitlement status | https://www.revenuecat.com/privacy |
| Supabase | Backend database and authentication | Email, user ID, all user-generated content listed above | https://supabase.com/privacy |
| Groq (via server-side API route) | AI assistant inference | Chat messages sent via POST /api/mobile-chat (server-side only, not from client SDK) | https://groq.com/privacy-policy |

No analytics SDKs present (no Mixpanel, Amplitude, PostHog, Sentry, Firebase, Segment, or similar). Confirmed from package.json audit.

---

## Privacy Policy URL

https://byredllc.com/privacy

In-app location: `app/settings/privacy.tsx:17` and `app/onboarding.tsx:389`

The privacy policy HTML file also exists at the repo root: `privacy-policy.html`

---

## ATT (App Tracking Transparency)

ATT prompt is NOT required. The app does not:
- Track users across apps or websites owned by other companies
- Share device-level advertising identifiers (IDFA) with third parties
- Use data for targeted advertising

RevenueCat uses the Supabase user UUID (not IDFA) to identify users. No cross-app tracking.

App Store Connect answer: **Does this app use data for tracking?** No.

---

## Notes for App Store Connect Privacy Questionnaire

1. **Data Linked to User.** All data collected (except AI chat messages which are transient server-side) is linked to the Supabase user UUID. Select "Yes" for linked-to-identity on all categories above that show "Yes".

2. **AI Chat Messages.** Chat messages are sent from the mobile client to the server route (`POST /api/mobile-chat`), processed by Groq's API, and returned as a response. Messages are NOT stored in Supabase. The client-side `lib/api/groq.ts` does not persist messages beyond the in-memory session state in `AsyncStorage` (quota counter only, not message content). App Store label: User Content > Other User Content (transient, not linked to identity).

3. **Purchase History.** Apple handles raw payment data. RevenueCat syncs entitlement status only (tier, active/expired, expiry date) to the `profiles` table. No raw payment instrument data is stored.

4. **Data Retention.** Users can delete their account via `app/settings/delete-account.tsx`, which triggers account deletion and data removal.

5. **Third-Party Data.** RevenueCat has its own App Store privacy nutrition label. Supabase is a data processor under our privacy policy. Groq processes AI inference server-side only.

6. **Children.** App does not target children under 13. No parental gate required.
