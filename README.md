# Authentic Hadith

Authentic Hadith is an Islamic study platform with a live iOS application and a web platform. This repository contains the actively developed mobile and web source trees, shared backend work, automation, and release-support materials.

## Live iOS App

[Download Authentic Hadith on the Apple App Store](https://apps.apple.com/us/app/authentic-hadith/id6764673665)

The App Store listing is the source of truth for the public iOS release.

- **Developer:** By Red, LLC
- **Availability:** iPhone and iPad
- **Current listed version:** 1.1.2
- **Requirements:** iOS/iPadOS 15.1 or later
- **Business model:** Free with in-app purchases

### Current App Store Experience

The live iOS app provides:

- 14,444 authentic hadiths from Sahih al-Bukhari and Sahih Muslim, with Arabic text and English translations
- An AI-powered assistant for scholarly context and background; it does not provide religious rulings
- Daily hadith readings
- Personal folders for saved, organized, and annotated hadiths
- Structured learning paths, lessons, and quizzes
- Progress tracking with streaks, XP, and achievements
- Progress that continues to work with limited connectivity
- Dark mode, light mode, and language preferences

Premium access includes unlimited AI assistant conversations, advanced learning paths and quizzes, and priority access to new features. For current pricing, availability, privacy details, and release notes, refer to the [App Store listing](https://apps.apple.com/us/app/authentic-hadith/id6764673665).

## Latest Release Notes

Version 1.1.2 includes refinements to daily readings, Sunnah reflections, learning paths, progress tracking, and LanternAI, along with visual and stability updates. The release also includes onboarding fixes, paywall-gating improvements, trial-display verification, restore-purchase checks, and simulator QA updates.

## Repository Structure

```text
AuthenticHadithApp/
├── authentichadithapp/              # React Native / Expo mobile source tree
├── external/v0-authentic-hadith/    # Next.js web application
├── .github/workflows/               # iOS and Android build workflows
├── scripts/                         # Development and data-support scripts
└── README.md
```

The mobile source tree remains under active development. It can include feature work that is not yet part of the current public App Store release; use the App Store listing for the official release status and user-facing feature set.

## Local Development

### Mobile

```sh
cd authentichadithapp
npm install
npx expo start
```

### Web

```sh
cd external/v0-authentic-hadith
npm install
npm run dev
```

Configure environment variables from the relevant `.env.example` file before running either application. Never commit credentials or production secrets.

## Release and Contribution Notes

- Review the App Store listing before documenting public product claims.
- Keep release-specific information, screenshots, and feature descriptions aligned with the currently shipped version.
- Open pull requests for changes; include testing or verification evidence when applicable.
- Do not treat the repository’s in-progress code as a statement of App Store availability.

## Related Links

- [Authentic Hadith on the App Store](https://apps.apple.com/us/app/authentic-hadith/id6764673665)
- [Authentic Hadith web platform](https://authentichadith.app)
- [Privacy Policy](https://byredllc.com/privacy)
