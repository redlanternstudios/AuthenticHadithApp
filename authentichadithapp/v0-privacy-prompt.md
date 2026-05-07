Create two new routes in my Next.js app: /privacy and /terms. Both should be standalone pages (not inside any layout group) with a clean, minimal design matching my site's dark aesthetic. Use the same fonts and styling already in the project.

## /privacy route (app/privacy/page.tsx)

Create a Privacy Policy page with this exact content:

Title: Privacy Policy
Last updated: May 4, 2026

Opening: byRed LLC ("we," "us," or "our") operates the Authentic Hadith App (the "App"), available on iOS and Android. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data. By using the App, you agree to the collection and use of information as described in this policy.

Section 1: Information We Collect

1.1 Information You Provide (as a table):
- Email address | Account registration and login | Required: Yes
- Password | Account registration (hashed, never stored in plain text) | Required: Yes
- Full name | Account registration | Required: No
- Notes and annotations | When you save notes on hadiths | Required: No
- Folders and collections | When you organize saved hadiths | Required: No
- Chat messages | When you use the AI assistant feature | Required: No
- Quiz responses | When you complete quizzes | Required: No

1.2 Information Collected Automatically (as a table):
- Usage statistics (hadiths read, streaks, XP) | Gamification and progress tracking
- Reading progress | Resuming stories and lessons where you left off
- Lesson and learning path completion | Tracking your educational progress
- Achievement unlocks | Displaying your accomplishments
- Language and theme preferences | Personalizing the App experience
- Subscription status | Providing access to premium features

1.3 Information We Do Not Collect:
- Precise or coarse location data
- Contacts, photos, or camera data
- Health or fitness data
- Device advertising identifiers (IDFA)
- Browsing history outside the App
- Biometric data
- Phone number

Section 2: How We Use Your Information
- App Functionality: To provide core features including authentication, saving hadiths, tracking progress, and syncing data across your devices.
- Personalization: To remember your language preference, theme, and learning progress.
- Subscriptions: To manage your premium subscription status and restore purchases.
- AI Assistant: To process your questions and provide hadith-related responses through our AI chat feature.
- Improvement: To understand how features are used so we can improve the App.
- We do not use your data for advertising, profiling, or selling to third parties.

Section 3: Third-Party Services (as a table):
- Supabase | Backend database, authentication, and data storage | Account info, user content (notes, folders, progress), usage statistics
- RevenueCat | Subscription and in-app purchase management | User ID, purchase transactions, subscription status
- Groq (via our server) | AI-powered hadith assistant | Chat messages you send to the AI assistant
- Apple / Google | Payment processing for subscriptions | Payment is handled entirely by Apple/Google; we do not receive or store credit card information

Links to their privacy policies:
- Supabase: https://supabase.com/privacy
- RevenueCat: https://www.revenuecat.com/privacy
- Groq: https://groq.com/privacy-policy

Section 4: Data Storage and Security
4.1 Remote Storage: Your account data, saved content, and progress are stored on Supabase servers secured with encryption in transit (TLS/SSL) and row-level security policies that restrict data access to your account only.
4.2 On-Device Storage:
- Authentication tokens are stored in iOS Keychain (encrypted) via Expo SecureStore.
- Offline cache (saved hadiths and folders) is stored in a local SQLite database so the App works without an internet connection.
- Preferences (theme, language, onboarding status) are stored in local device storage.
4.3 Security Measures:
- All network communication uses HTTPS encryption.
- Passwords are hashed using industry-standard algorithms and are never stored in plain text.
- Database access is governed by row-level security, ensuring users can only access their own data.
- API keys and secrets are stored securely and are not exposed in the App bundle.

Section 5: AI Assistant and Chat Data
When you use the AI assistant feature, your messages are sent from the App to our server, which forwards them to Groq's large language model for processing. Chat messages are used solely to generate responses to your questions. We do not use your chat messages to train AI models. Chat history is stored temporarily in your device's memory during the session and is not permanently saved to our servers.

Section 6: Data Retention
- Account data: Retained for as long as your account is active.
- User content (notes, folders, saved hadiths): Retained until you delete them or delete your account.
- Usage statistics: Retained for as long as your account is active.
- Chat messages: Not permanently stored on our servers.
- When you delete your account, your personal data is archived for up to 30 days (to allow recovery if requested) and then permanently deleted from our active systems.

Section 7: Your Rights
- Access: You can view your profile information, saved content, and statistics within the App at any time.
- Correction: You can update your name and email through the App settings.
- Deletion: You can delete individual notes, folders, and saved hadiths at any time. You can request full account deletion by contacting us at the email below.
- Export: You can request a copy of your data by contacting us.
- Opt-out: You can stop using optional features (AI assistant, gamification) at any time without affecting core App functionality.

Section 8: Children's Privacy
The App is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at the email below and we will promptly delete that information.

Section 9: California Privacy Rights (CCPA)
If you are a California resident, you have the right to:
- Know what personal information we collect about you.
- Request deletion of your personal information.
- Opt out of the sale of your personal information. We do not sell your personal information.
- Not be discriminated against for exercising your privacy rights.
To exercise these rights, contact us at privacy@byredllc.com.

Section 10: International Data Transfers
Your data may be processed on servers located outside your country of residence, including the United States. By using the App, you consent to the transfer of your information to these locations. We ensure all transfers are protected by appropriate security measures.

Section 11: Changes to This Policy
We may update this Privacy Policy from time to time. When we make changes, we will update the "Last updated" date at the top of this page. Continued use of the App after changes constitutes acceptance of the updated policy. For material changes, we will provide notice within the App.

Section 12: Contact Us
byRed LLC
Email: privacy@byredllc.com
Website: byredllc.com

---

## /terms route (app/terms/page.tsx)

Create a Terms of Use page with this exact content:

Title: Terms of Use
Last updated: May 4, 2026

Opening: These Terms of Use ("Terms") govern your use of the Authentic Hadith App (the "App") and the website at byredllc.com (the "Site"), operated by byRed LLC ("we," "us," or "our"). By accessing or using the App or Site, you agree to be bound by these Terms.

Section 1: Acceptance of Terms
By creating an account or using the App, you confirm that you are at least 13 years old and agree to comply with these Terms. If you do not agree, do not use the App.

Section 2: Account Registration
- You must provide accurate and complete information when creating an account.
- You are responsible for maintaining the security of your account credentials.
- You must notify us immediately of any unauthorized access to your account.
- We reserve the right to suspend or terminate accounts that violate these Terms.

Section 3: Permitted Use
The App is provided for personal, non-commercial use. You may:
- Browse, read, and save hadiths for personal study.
- Create notes, folders, and collections for personal use.
- Share hadiths and folders using the App's built-in sharing features.
- Use the AI assistant for hadith-related questions.

Section 4: Prohibited Use
You may not:
- Reverse-engineer, decompile, or disassemble any part of the App.
- Use the App to distribute harmful, misleading, or offensive content.
- Attempt to gain unauthorized access to our systems or other users' accounts.
- Use automated tools (bots, scrapers) to access the App or its data.
- Redistribute, sell, or sublicense the App or its content without our written permission.
- Misrepresent AI-generated responses as scholarly Islamic rulings (fatwa).

Section 5: Subscriptions and Payments
- Premium features are available through in-app subscriptions (monthly, annual, or lifetime).
- Payments are processed by Apple (App Store) or Google (Play Store). We do not collect or store your payment information.
- Subscriptions auto-renew unless cancelled at least 24 hours before the current period ends.
- You can manage or cancel subscriptions through your device's subscription settings.
- Refunds are handled by Apple or Google according to their respective refund policies.

Section 6: Hadith Content
The hadith texts, translations, and gradings provided in the App are sourced from established scholarly collections. While we strive for accuracy, the App is an educational tool and should not be used as a sole source for Islamic legal rulings. We encourage users to consult qualified scholars for matters of fiqh (Islamic jurisprudence).

Section 7: AI Assistant Disclaimer
The AI assistant feature uses large language models to answer hadith-related questions. AI responses are generated by machine learning models and may contain errors or inaccuracies. AI responses do not constitute Islamic scholarly opinions or legal advice. Always verify important information with qualified scholars and authenticated sources.

Section 8: User Content
- You retain ownership of notes, annotations, and collections you create in the App.
- By sharing content publicly or via links, you grant us a non-exclusive license to display that content to the intended recipients.
- We may remove user content that violates these Terms or applicable law.

Section 9: Intellectual Property
The App's design, code, branding, and original content are the property of byRed LLC. Hadith texts are part of the Islamic scholarly tradition and are not claimed as our intellectual property. You may not use our trademarks, logos, or branding without written permission.

Section 10: Disclaimer of Warranties
The App is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the App will be uninterrupted, error-free, or free of harmful components.

Section 11: Limitation of Liability
To the maximum extent permitted by law, byRed LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.

Section 12: Governing Law
These Terms are governed by and construed in accordance with the laws of the State of California, United States. Any disputes shall be resolved in the courts located in San Diego County, California.

Section 13: Changes to These Terms
We may update these Terms from time to time. When we make changes, we will update the "Last updated" date at the top of this page. Continued use of the App after changes constitutes acceptance of the updated Terms.

Section 14: Contact Us
byRed LLC
Email: legal@byredllc.com
Website: byredllc.com

---

Both pages should have a back link to "/" at the top. Use clean typography, good spacing, and make tables responsive on mobile. Match the existing site design.
