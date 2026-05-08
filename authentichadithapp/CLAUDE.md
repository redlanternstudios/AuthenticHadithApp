# Authentic Hadith iOS App — Claude Code Instructions

## Error Debugging Protocol — MANDATORY EVERY SESSION

Before writing ANY code or running ANY command, execute this sequence:

### Step 1: Read ERROR_REPORT.md
- If status is 🔴 ACTIVE → this is your #1 priority. Fix it before anything else.
- If status is 🟢 No active errors → proceed to the user's request.

### Step 2: Read BUILD_FIX_LOG.md
- Search for keywords related to the current task or error.
- If a matching fix exists → apply it, do not reinvent the solution.
- This file is the app's repair memory. Use it.

### Step 3: Reference APP_LAUNCH_PLAYBOOK.md
- Contains the correct build process, config rules, and common fixes.
- Follow the dependency rules — never install packages without checking Expo SDK compatibility.
- Follow the destructive command rules — never run nuclear resets without KP approval.

### Step 4: Read SYSTEM_RULES.md
- Contains the permanent engineering rules derived from recurring bug patterns.
- These rules are non-negotiable. Every code change must comply with them.
- If a new recurring pattern emerges, add it as the next numbered rule.
- Rule 009 is the escalation rule: any bug that appears twice becomes a permanent rule.

### Step 5: Read WORKFLOW_ROUTER.md
- Tells you whether the issue lives in VS Code, Expo config, or Xcode.
- Classify every problem as VS_CODE_APP_LAYER, EXPO_HYBRID_LAYER, XCODE_NATIVE_LAYER, or UNKNOWN_NEEDS_TRIAGE before touching files.
- Default working tool is VS Code. Xcode is only for provably native iOS issues.
- Never run `npx expo prebuild --clean` or edit `ios/` files without KP approval.

### After Fixing Any Bug (MANDATORY DOCUMENTATION PROTOCOL)
1. Update BUILD_FIX_LOG.md with full entry: Fix ID, date, root cause, files changed, exact fix applied, verification steps, lesson learned, pattern category
2. Reset ERROR_REPORT.md status back to 🟢 No active errors
3. Check whether this issue matches an existing recurring pattern in BUILD_FIX_LOG.md Pattern Tracker
4. If the bug category has appeared 2 or more times: update SYSTEM_RULES.md with a new permanent rule or strengthen an existing one
5. If deployment or architecture behavior changed: update APP_LAUNCH_PLAYBOOK.md
6. If new operational guidance is discovered: update CLAUDE.md onboarding instructions if necessary
7. Never complete a debugging task without updating project memory

The system must improve after every fix. No exceptions.

## App Stack (DO NOT UPGRADE WITHOUT APPROVAL)
- Expo SDK 54 | React Native 0.81.5 | React 19.1.0 | TypeScript 5.9.2
- Bundle ID: com.byred.authentichadith
- Use npx expo install for all packages — never raw npm install for Expo-managed deps
- Supabase 2.48.1 | React Query 5.62.11 | Zustand 5.0.2 | RevenueCat 9.9.0
- i18next 23.16.8 | Vercel AI SDK 4.3.19 | @ai-sdk/groq 1.2.9

## File Priority Order
1. ERROR_REPORT.md → current problem
2. BUILD_FIX_LOG.md → historical solutions
3. SYSTEM_RULES.md → permanent engineering rules
4. WORKFLOW_ROUTER.md → tool routing (VS Code vs Expo vs Xcode)
5. APP_LAUNCH_PLAYBOOK.md → process reference
6. package.json → dependency truth
7. app.json → static config
8. app.config.js → dynamic config
9. eas.json → build profiles

## Expo Config Rules
- app.json = static metadata (name, slug, scheme, icons, splash, bundle ID, build number, plugins)
- app.config.js = dynamic config (environment-based values, EXPO_PUBLIC_ variables)
- Never put secrets in app.json

## Dependency Rules
1. Check package.json first — know what is installed
2. Check package-lock.json — know exact versions locked
3. Check Expo SDK 54 compatibility BEFORE adding any package
4. Prefer Expo-compatible/managed packages
5. Use npx expo install package-name (not npm install)
6. Do NOT randomly upgrade React, React Native, or Expo
7. If a package conflict arises, check Expo SDK docs first

## Destructive Commands (NEVER WITHOUT KP APPROVAL)
- rm -rf node_modules package-lock.json → Ask KP first
- rm -rf ios android → Ask KP first
- npx expo prebuild --clean → Ask KP first
- Any version upgrade of React/RN/Expo → Ask KP first
