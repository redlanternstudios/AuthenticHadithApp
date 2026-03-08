# Authentic Hadith — Mobile App + Web Platform

A comprehensive **monorepo** containing both mobile and web applications for accessing authentic Islamic hadiths.

> 🔄 **Repository Sync**: The `external/v0-authentic-hadith/` folder is kept in sync with [rsemeah/v0-authentic-hadith](https://github.com/rsemeah/v0-authentic-hadith). Both repositories contain the same production web application.

---

## Overview

This repository contains:
- **🌐 Web App** (`external/v0-authentic-hadith/`) — **Next.js, Production-Ready**, deployed at [authentichadith.app](https://authentichadith.app)
- **📱 Mobile App** (`authentichadithapp/`) — **React Native/Expo, Early Development Stage**
- **🗄️ Shared Backend** — **Supabase** with 36,000+ authentic hadiths from 6 major collections

Both applications share the same Supabase backend infrastructure for a unified experience across platforms.
📱 **React Native mobile app** (in development) + 🌐 **Production web platform** (live at [authentichadith.app](https://authentichadith.app))

## Overview

This repository contains two applications sharing a unified Supabase backend:

- **Mobile App** (`authentichadithapp/`) — React Native with Expo SDK 54, early-stage development
- **Web App** (`external/v0-authentic-hadith/`) — Next.js 16, production-ready and fully deployed
- **Shared Backend** — Supabase PostgreSQL with 36,000+ verified hadiths across 6 major collections

---

## 🌐 Web Application (Production)

**Live at:** https://authentichadith.app

The web application in `external/v0-authentic-hadith/` is a fully-featured Islamic learning platform built with Next.js 16.

✅ **Features:**
- **📚 36,000+ Authentic Hadiths** — 6 major collections (Bukhari, Muslim, Tirmidhi, Abu Dawud, Nasa'i, Ibn Majah)
- **🤖 AI Scholar Assistant** — Powered by Groq (Llama 3.3 70B) for intelligent hadith analysis
- **👤 User Authentication** — Secure login with Supabase Auth
- **💳 Premium Subscriptions** — Stripe-powered payment integration
- **📖 Personalized Learning Paths** — Structured curriculum from beginner to scholar-level
- **💾 Bookmarks and Collections** — Build your personal hadith library
- **🔍 Full-Text Search** — Instant search across all hadiths
- **🌙 Daily Hadith** — Featured hadith refreshed daily
- **🎨 Dark/Light Theme** — Customizable user interface

**Tech Stack:** Next.js 16, TypeScript, Supabase, Stripe, Groq AI, Tailwind CSS, shadcn/ui

**Database:** Complete Supabase setup with 13 SQL migration files in `external/v0-authentic-hadith/scripts/`
**Live at:** [https://authentichadith.app](https://authentichadith.app)

A full-featured Islamic learning platform with:

- 📚 **6 Major Hadith Collections** — Bukhari, Muslim, Tirmidhi, Abu Dawud, Nasa'i, Ibn Majah
- 🤖 **AI Scholar Assistant** — Powered by Groq/Llama 3.3 70B for hadith explanations
- 🔍 **Advanced Search** — Full-text search across all 36,000+ hadiths
- 📖 **Learning Paths** — Structured curriculum from beginner to scholar
- 💾 **Bookmarks & Profiles** — Save favorites, track progress, customize experience
- 💳 **Stripe Integration** — Subscription payments with customer portal
- 🌙 **Daily Hadith** — Featured tradition on home page

### Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** Supabase PostgreSQL with Row Level Security
- **Authentication:** Supabase Auth (Email, Magic Link)
- **Payments:** Stripe Embedded Checkout + Webhooks
- **AI:** Groq API with Llama 3.3 70B Versatile
- **Styling:** Tailwind CSS 4
- **Hosting:** Vercel Edge Network
- **Analytics:** Vercel Analytics

### Database Setup

Complete SQL migrations available in `external/v0-authentic-hadith/scripts/`:

1. `001-create-profiles-table.sql` — User profiles with Stripe integration
2. `002-create-user-preferences-table.sql` — Settings and preferences
3. `003-create-hadiths-tables.sql` — Core hadith content tables
4. `004-seed-sample-hadiths.sql` — Initial sample data
5. `005-create-collections-tables.sql` — Collections, books, chapters
6. `006-seed-collections-data.sql` — Collection metadata
7. `007-seed-tirmidhi-book1-hadiths.sql` — Tirmidhi Book 1 data
8. `008-seed-tirmidhi-remaining-hadiths.sql` — Complete Tirmidhi collection
9. `009-create-subscriptions-table.sql` — Stripe subscriptions tracking
10. `010-create-stripe-events-table.sql` — Webhook deduplication
11. `create-avatars-bucket.sql` — Storage bucket for user avatars
12. `seed-real-hadiths.sql` — **44KB of real hadith data**
13. `seed-trigger.sql` — Database triggers and functions

### Web App Setup

```sh
cd external/v0-authentic-hadith
npm install

# Configure environment variables
cp .env.example .env.local

# Edit .env.local with your credentials:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
# - GROQ_API_KEY

# Run SQL migrations in Supabase SQL Editor (001-010 in order)

# Start development server
npm run dev
```

Visit `http://localhost:3000`

---

## 📱 Mobile Application (In Development)

Located in `authentichadithapp/`, the mobile app is being developed with React Native and Expo.

**Current Status:** 🚧 **Early Development** (Foundation in place)

✅ **Completed:**
- Expo SDK 54 setup
- File-based routing with Expo Router
- Basic UI scaffolding with themed components
- Dark mode support
- Haptic feedback integration
Cross-platform mobile app built with React Native and Expo, designed to integrate with the existing Supabase backend.

### Current Status

- ✅ Expo SDK 54 starter template
- ✅ File-based routing with Expo Router
- ✅ Dark mode support
- ✅ Themed UI components
- ✅ Haptic feedback
- ⏳ Supabase integration (planned)
- ⏳ Hadith browsing (planned)
- ⏳ Offline-first architecture (planned)

**Planned Features:**
- Supabase authentication integration
- 36,000+ hadiths browsing and search
- Daily hadith notifications
- Offline mode with SQLite caching
- Arabic text with RTL support
- Bookmarks and collections
- QR code sharing
- Premium features integration

**Tech Stack:** React Native, Expo SDK 54, TypeScript, Expo Router, Shared Supabase Backend

---

## 📊 Development Status

| Component | Status | Technology | Location |
|-----------|--------|------------|----------|
| Web App | ✅ **Production** | Next.js 16, Vercel | `external/v0-authentic-hadith/` |
| Backend Database | ✅ **Production** | Supabase PostgreSQL | Shared by both apps |
| Hadith Data | ✅ **Production** | 36,000+ hadiths seeded | Supabase database |
| Mobile App | 🚧 **Development** | Expo SDK 54 | `authentichadithapp/` |
- 📚 Access to all 36,000+ hadiths from shared backend
- 🌐 Bilingual Arabic/English with RTL support
- 📥 Offline-first with local caching
- 📤 Native sharing & QR code generation
- 🔔 Push notifications for daily hadiths
- 💎 Premium subscriptions via in-app purchases
- 🔖 Sync bookmarks with web app

### Tech Stack

- **Framework:** React Native 0.81.5
- **Platform:** Expo SDK 54
- **Language:** TypeScript 5.9
- **Navigation:** Expo Router 6.0
- **UI:** React Native Reanimated, Gesture Handler
- **Icons:** Expo Vector Icons

### Mobile App Setup

```sh
cd authentichadithapp
npm install

# Start development server
npm start

# Run on specific platforms
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run web       # Web browser
```

### iOS Deployment

Automated builds via GitHub Actions:
- Pushes to `main` trigger EAS builds
- Builds submitted to TestFlight
- Configure secrets: `EXPO_TOKEN`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY`

---

## 📁 Project Structure

```
AuthenticHadithApp/
├── authentichadithapp/              # 📱 Mobile App (React Native/Expo)
│   ├── app/                         # Expo Router screens
│   │   ├── (tabs)/                  # Tab navigation
│   │   ├── _layout.tsx
│   │   └── modal.tsx
│   ├── components/                  # Mobile UI components
│   ├── constants/                   # Theme and configuration
│   ├── hooks/                       # React hooks
│   └── package.json
│
├── external/
│   └── v0-authentic-hadith/         # 🌐 Web App (Next.js) - PRODUCTION
│       ├── app/                     # Next.js 16 App Router pages
│       ├── components/              # React components
│       ├── lib/                     # Utilities, Supabase client, Stripe
│       ├── scripts/                 # 🗄️ 13 SQL migration files
├── authentichadithapp/           # 📱 Mobile app (React Native/Expo)
│   ├── app/                      # File-based routing
│   ├── components/               # Themed UI components
│   ├── constants/                # Colors, tokens
│   └── package.json              # Expo SDK 54, React Native 0.81.5
├── app/                          # EAS build configuration
├── external/
│   └── v0-authentic-hadith/      # ✨ Production web app (Next.js 16)
│       ├── app/                  # Next.js App Router
│       │   ├── (pages)/          # Route groups (home, collections, search, etc.)
│       │   └── api/              # API routes (chat, checkout, webhooks)
│       ├── components/           # React components (UI, home, collections)
│       ├── lib/                  # Utilities (Supabase, Stripe, subscriptions)
│       ├── scripts/              # 🗄️ 13 SQL migration files
│       │   ├── 001-create-profiles-table.sql
│       │   ├── 002-create-user-preferences-table.sql
│       │   ├── 003-create-hadiths-tables.sql
│       │   ├── 004-seed-sample-hadiths.sql
│       │   ├── 005-create-collections-tables.sql
│       │   ├── 006-seed-collections-data.sql
│       │   ├── 007-seed-tirmidhi-book1-hadiths.sql
│       │   ├── 008-seed-tirmidhi-remaining-hadiths.sql
│       │   ├── seed-real-hadiths.sql (36K+ hadiths)
│       │   ├── seed-trigger.sql
│       │   └── create-avatars-bucket.sql
│       ├── public/                  # Static assets
│       └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Web Application Setup

```bash
cd external/v0-authentic-hadith
pnpm install
cp .env.example .env.local
# Configure environment variables (Supabase, Stripe, Groq API keys)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the web app.

**Live Production Site:** https://authentichadith.app

### Mobile Application Setup

```bash
cd authentichadithapp
npm install
# Create .env file with Supabase configuration
npx expo start
```

Scan the QR code with Expo Go app on your iOS or Android device.

### Database Setup

Both applications share the same Supabase backend. To set up the database:

1. **Create a Supabase Project** at [supabase.com](https://supabase.com)
2. **Run SQL Migrations** in the Supabase SQL Editor in order:
   ```bash
   cd external/v0-authentic-hadith/scripts
   # Execute each file in numerical order:
   # 001-create-profiles-table.sql
   # 002-create-user-preferences-table.sql
   # 003-create-hadiths-tables.sql
   # 004-seed-sample-hadiths.sql
   # 005-create-collections-tables.sql
   # 006-seed-collections-data.sql
   # 007-seed-tirmidhi-book1-hadiths.sql
   # 008-seed-tirmidhi-remaining-hadiths.sql
   # seed-real-hadiths.sql (36K+ authentic hadiths)
   # create-avatars-bucket.sql
   # seed-trigger.sql
   ```
3. **Update Environment Variables** in both apps with your Supabase credentials

---

## 🔗 Related Repositories

- **[rsemeah/v0-authentic-hadith](https://github.com/rsemeah/v0-authentic-hadith)** - Standalone web app repository (synced with `external/v0-authentic-hadith/`)

The web application code exists in both repositories and is kept synchronized. Both point to the same production deployment at [authentichadith.app](https://authentichadith.app).

---

## 🚢 Deployment
│       │   ├── 009-create-subscriptions-table.sql
│       │   ├── 010-create-stripe-events-table.sql
│       │   ├── create-avatars-bucket.sql
│       │   ├── seed-real-hadiths.sql (44KB)
│       │   └── seed-trigger.sql
│       └── package.json          # Next.js 16, Supabase, Stripe, Groq
├── .github/workflows/            # CI/CD for iOS builds
└── README.md                     # This file
```

---

## 🔗 Related Repository

The web application is also maintained in a separate repository:
**[github.com/rsemeah/v0-authentic-hadith](https://github.com/rsemeah/v0-authentic-hadith)**

Changes to the web app can be contributed to either repository. The `external/v0-authentic-hadith/` folder is synchronized with the standalone repo.

---

## 📋 Prerequisites

### For Web App
- Node.js 20+
- npm or pnpm
- Supabase project
- Stripe account (test mode)
- Groq API key

### For Mobile App
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS: macOS with Xcode
- Android: Android Studio

---

## 🎯 Development Status

| Component | Status | Description |
|-----------|--------|-------------|
| **Web App** | ✅ **Production** | Live at authentichadith.app, fully functional |
| **Supabase Backend** | ✅ **Production** | 36K+ hadiths, user profiles, subscriptions |
| **Mobile App** | 🚧 **Early Development** | Starter template, integration in progress |

---

## 📄 License
> A cross-platform Islamic hadith application — Expo WebView wrapper for mobile + Next.js web platform — providing access to 36,000+ authenticated hadiths from 8 major collections.

---

## Overview

**Authentic Hadith** is a full-stack Islamic education platform. The mobile app ships as a **WebView wrapper** around the deployed Next.js web app, giving users the full feature set on day one with native in-app purchases via RevenueCat.

The web application is deployed to Vercel:

```bash
cd external/v0-authentic-hadith
vercel
```

**Current Production URL:** https://authentichadith.app

### Mobile App → App Stores

Mobile deployment is planned for future releases:

```bash
cd authentichadithapp
eas build --platform ios --profile production
eas submit --platform ios
### Repository Layout

| Directory | What It Is |
|---|---|
| **`authentichadithapp/`** | React Native / Expo native app (future incremental native screens) |
| **`.github/workflows/`** | CI/CD for EAS Build & Submit (iOS + Android) |

### Related Repository

| Repository | Purpose |
|---|---|
| **[v0-authentic-hadith](https://github.com/rsemeah/v0-authentic-hadith)** | Next.js web app (source of truth) + `expo-wrapper/` (the production mobile shell) |

> **App Store builds** are produced from `v0-authentic-hadith/expo-wrapper/`. The CI workflows in this repo check out that code automatically.

---

## App Store Strategy (Option A: WebView Wrapper)

The mobile app wraps the full Next.js web app (`v0-authentic-hadith.vercel.app`) in a native Expo shell. This gives immediate feature parity with the web while adding native in-app purchases.

```
┌─────────────────────────────────┐
│  Expo Native Shell              │
│  ┌───────────────────────────┐  │
│  │  RevenueCat Provider      │  │
│  │  ┌─────────────────────┐  │  │
│  │  │  WebView             │  │  │
│  │  │  ┌─────────────────┐ │  │  │
│  │  │  │  Next.js Web App │ │  │  │
│  │  │  │  (all features)  │ │  │  │
│  │  │  └─────────────────┘ │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**How it works:**
1. The Expo app renders a full-screen WebView pointing to the deployed web app
2. The web app detects it's inside a native shell via `window.__IS_NATIVE_APP__`
3. When the user hits a paywall, the web app calls `showNativePaywall()` from `lib/native-bridge.ts`
4. The native shell presents RevenueCat's native paywall UI
5. Purchase results are communicated back via `CustomEvent`
6. User auth is synced between Supabase (web) and RevenueCat (native)

**Why this approach:**
- Immediate feature parity — all 40+ pages, gamification, stories, quizzes, AI assistant
- Single codebase to maintain (the web app)
- Native payments satisfy Apple/Google IAP requirements
- Can incrementally replace WebView screens with native screens over time

---

## 📄 License
## Features (Full Platform)

### Hadith Content
- **8 major collections** — Sahih al-Bukhari, Sahih Muslim, Sunan Abu Dawud, Jami at-Tirmidhi, Sunan an-Nasai, Sunan Ibn Majah, Muwatta Malik, Musnad Ahmad
- **36,246 authenticated hadiths** with Arabic + English text
- **Authentication grades** — Sahih, Hasan, Da'if with color coding
- **Hierarchical browsing** — Collection > Book > Chapter > Hadith
- **Full-text search** with tag faceting

### AI & Learning
- **AI Chat Assistant** — GPT-4o-mini with hadith database search tool
- **On-demand AI summarization** — bilingual scholarly analysis per hadith
- **Structured learning paths** — Beginner to Advanced with lessons and quizzes
- **AI-generated quizzes** — narrator, collection, grade, and completion questions
- **Stories** — Sahaba companions and 25 Quranic Prophets with progress tracking
- **365 daily Sunnah practices** organized by category

### Personal & Social
- **Daily hadith** — deterministic Sahih-graded selection
- **Bookmarks & folders** — personal library with notes
- **Shareable hadith cards** — 4 themes x 3 sizes, downloadable PNG
- **Discussion threads** — comments with likes/replies on hadiths
- **Private reflection journal** — with hadith references and tags
- **Gamification** — XP, levels, achievements, streaks

### Payments
- **Web** — Stripe (Explorer free, Pro $9.99/mo or $49.99/yr, Founding $99.99 lifetime)
- **Mobile** — RevenueCat (native iOS/Android in-app purchases)
- **Quota system** — tiered daily/monthly AI limits by plan

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Web Framework** | Next.js 16 (App Router, React 19) |
| **Mobile Shell** | Expo SDK 52, React Native WebView |
| **Language** | TypeScript |
| **UI** | Tailwind CSS 4, shadcn/ui, Radix UI |
| **Backend** | Supabase (PostgreSQL + Auth + RLS) |
| **AI** | OpenAI GPT-4o-mini via Vercel AI SDK |
| **Web Payments** | Stripe |
| **Mobile Payments** | RevenueCat |
| **Deployment** | Vercel (web), EAS Build (mobile) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- EAS CLI: `npm install -g eas-cli`
- Expo account: `eas login`

### Local Development

```bash
# Clone the WebView wrapper source
git clone https://github.com/rsemeah/v0-authentic-hadith.git
cd v0-authentic-hadith/expo-wrapper

# Install dependencies
npm install

# Start dev server (opens in Expo Go or dev client)
npx expo start
```

### Building for Stores

See the full submission guide at [`v0-authentic-hadith/expo-wrapper/STORE_SUBMISSION.md`](https://github.com/rsemeah/v0-authentic-hadith/blob/main/expo-wrapper/STORE_SUBMISSION.md).

```bash
cd v0-authentic-hadith/expo-wrapper

# Development build (simulator)
eas build --profile development --platform ios

# Production build
eas build --profile production --platform ios
eas build --profile production --platform android

# Submit to stores
eas submit --platform ios --latest
eas submit --platform android --latest
```

---

## CI/CD

GitHub Actions workflows in `.github/workflows/` handle automated builds:

| Workflow | Trigger | What It Does |
|---|---|---|
| `eas-ios.yml` | Push to main / manual | Builds iOS via EAS, submits to TestFlight |
| `eas-android.yml` | Push to main / manual | Builds Android via EAS, submits to Play Store |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request for:
- 📱 Mobile app feature development
- 🐛 Bug fixes
- 📚 Documentation improvements
- 🕌 New hadith collections or improvements

---

*The web application is in **production** and live at [authentichadith.app](https://authentichadith.app).  
The mobile application is in **early development**.*
### Required GitHub Secrets

| Secret | Description |
|---|---|
| `EAS_TOKEN` | Expo access token for EAS CLI |
| `REVENUECAT_API_KEY_APPLE` | Production RevenueCat Apple API key |
| `REVENUECAT_API_KEY_GOOGLE` | Production RevenueCat Google API key |
| `APPLE_API_KEY_JSON` | App Store Connect API key JSON (for iOS submission) |
| `APPLE_ID` | Apple ID email (fallback if no API key JSON) |
| `APPLE_TEAM_ID` | Apple Developer Team ID (fallback) |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` | Google Play service account JSON (for Android submission) |

---

## Environment Variables

### Mobile Wrapper (app.json extra)

Configured in `v0-authentic-hadith/expo-wrapper/app.json`:

| Key | Description |
|---|---|
| `webAppUrl` | Deployed web app URL (`https://v0-authentic-hadith.vercel.app`) |
| `revenueCatApiKeyApple` | RevenueCat Apple API key |
| `revenueCatApiKeyGoogle` | RevenueCat Google API key |
| `revenueCatEntitlementId` | RevenueCat entitlement name (`RedLantern Studios Pro`) |

### Web Platform

See the web app's own `.env.example` in the v0-authentic-hadith repo.

---

## Acknowledgments

- **Hadith Data** — [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api) and [sunnah.com](https://sunnah.com)
- **UI Components** — [shadcn/ui](https://ui.shadcn.com), [Radix UI](https://www.radix-ui.com)
- **AI** — [OpenAI](https://openai.com), [Groq](https://groq.com)
- **Icons** — [Lucide](https://lucide.dev)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

**Built with ☪️ for seekers of authentic knowledge.**

*Last updated: February 2026*
