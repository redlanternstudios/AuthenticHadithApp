# SYSTEM_RULES.md

# Authentic Hadith Engineering System Rules

## Purpose

This document defines the permanent engineering rules for the Authentic Hadith app and all future mobile applications built from this process.

The purpose is to prevent recurring bugs, standardize debugging, preserve institutional knowledge, and make each future app build faster, cleaner, and easier to execute.

Every coding agent, developer, or AI assistant working on this project must read this file before making changes.

---

# Core Principle

No issue is considered fully fixed until:

1. The root cause is identified.
2. The exact files changed are documented.
3. The fix is verified through a build or test.
4. The lesson is added to `BUILD_FIX_LOG.md`.
5. Any recurring pattern is converted into a permanent rule.

---

# Required Debugging Flow

## Step 1: Capture the Error

All active errors must be documented in:

`ERROR_REPORT.md`

Required fields:

- Current goal
- Command or action that triggered the error
- Full error output
- Files likely involved
- What has already been attempted
- Current environment details

---

## Step 2: Diagnose Before Editing

No file should be changed until the root cause is identified.

The debugging agent must determine whether the issue is related to:

- Database schema
- Supabase query logic
- Xcode/iOS build configuration
- Expo plugin configuration
- RevenueCat configuration
- Environment variables
- Missing route or screen
- Authentication/session state
- Dependency mismatch
- Production vs sandbox/test configuration

---

## Step 3: Apply the Smallest Safe Fix

The fix must be minimal, targeted, and reversible.

Do not rewrite large parts of the application unless the existing structure is proven to be the root cause.

---

## Step 4: Verify the Fix

A fix is not complete until one of the following succeeds:

- App runs locally
- iOS simulator opens without error
- Xcode build succeeds
- Expo command completes successfully
- Target feature works in-app
- TestFlight build succeeds

---

## Step 5: Document the Fix

Every completed fix must be added to:

`BUILD_FIX_LOG.md`

Each entry must include:

- Fix ID
- Date
- Problem
- Root cause
- Files changed
- Exact fix
- Verification method
- Lesson learned
- Related recurring pattern

---

# Permanent Engineering Rules

## Rule 001: Database Column Name Consistency

Database column mismatches are a known recurring issue.

Before changing, renaming, or referencing any Supabase column, confirm consistency across:

- Supabase table schema
- Generated Supabase types
- Query files
- UI components
- Join logic
- Seed data
- Test data
- Documentation

No database-related change is complete until all references have been checked.

---

## Rule 002: Supabase Query Standardization

All Supabase queries must follow established project patterns.

Before creating a new query:

1. Check existing working queries.
2. Reuse proven query structure.
3. Avoid unverified PostgREST foreign key joins.
4. Confirm table relationships exist in Supabase.
5. Test the query independently before wiring it into UI.

If a query fails, check schema and relationship structure before blaming the frontend. Very advanced concept, apparently.

---

## Rule 003: RevenueCat Single Source of Truth

RevenueCat configuration must not be scattered across the app.

All RevenueCat values must come from a centralized config file.

This includes:

- API keys
- Entitlement IDs
- Offering IDs
- Package IDs
- Sandbox/test settings
- Production settings

Hardcoded RevenueCat values inside screens, components, or hooks are prohibited.

---

## Rule 004: No Production Test Keys

Before any TestFlight or App Store build, search the entire repo for:

- test key
- sandbox
- mock
- placeholder
- hardcoded
- demo
- fake
- sample

No production build may include test credentials, mock values, or hardcoded temporary keys.

---

## Rule 005: Required Stub Screens

All navigation routes must point to real screens.

If a feature is not ready, create a clean stub screen instead of leaving the route broken.

Every route must have:

- Valid file path
- Exported component
- Safe fallback UI
- No broken imports
- No placeholder crash logic

---

## Rule 006: Build Config Changes Must Be Documented

Any change to build configuration must be documented immediately.

This includes changes to:

- `app.json`
- `app.config.js`
- `package.json`
- Expo plugins
- iOS folder
- Xcode project settings
- Bundle ID
- Version number
- Build number
- Environment variables

Build config changes are high-risk because one tiny setting can ruin an entire afternoon, as Apple intended.

---

## Rule 007: Dependency Changes Require Verification

No package may be added, removed, upgraded, or downgraded without verification.

Required checks:

- Package is compatible with current Expo SDK
- Package supports iOS
- Package does not require unsupported native config
- App still runs after install
- Lockfile changes are reviewed

Major dependency upgrades must be treated as separate tasks.

---

## Rule 008: Environment Variables Must Be Centralized

All environment variables must be documented in:

`.env.example`

Never rely on hidden local-only configuration.

Required documentation:

- Variable name
- Purpose
- Required or optional
- Development value format
- Production value source

Secrets must never be committed to GitHub.

---

## Rule 009: Every Recurring Bug Becomes a Rule

If the same category of bug appears more than once, it must be converted into a permanent rule inside this file.

A recurring bug is not just a bug.

It is a system failure wearing a different hat.

---

## Rule 010: The Hadiths Table Has Zero Foreign Keys

The `hadiths` table is a flat table with NO foreign key relationships.

This rule exists because this single fact caused 3 separate production failures (FIX-011, FIX-012, FIX-014).

Prohibited:
- `.select('*, collection:collections(*)')` on hadiths — will fail
- `.select('*, book:books(*)')` on hadiths — will fail
- Any PostgREST FK join syntax targeting hadiths as the source table

Required:
- Always use `.select('*')` on hadiths
- Filter by `collection_slug` and `book_number` (not collection_id, not book_id)
- For chapter context: chapter → book (book_id) → collection (collection_id) → hadiths (collection_slug + book_number)

Valid FK joins TO hadiths from other tables:
- `saved_hadiths.hadith_id → hadiths.id` (valid)
- `hadith_views.hadith_id → hadiths.id` (valid)

---

## Rule 011: PostgREST Fails Silently on Bad Column Names

PostgREST does NOT throw errors when you filter on a column that does not exist. It silently returns zero results.

This caused FIX-016: search used `english_translation` instead of `english_text`, and returned nothing for English queries with no error message.

Required:
- After writing any Supabase `.or()`, `.eq()`, `.ilike()`, or `.filter()` call, verify every column name against the actual table schema
- If a query returns zero results unexpectedly, check column names first
- Test search and filter features manually after any query change

---

## Rule 012: Mandatory Documentation Protocol

After completing any fix, the following documentation updates are required:

1. Update `BUILD_FIX_LOG.md` with full entry (Fix ID, date, root cause, files changed, exact fix, verification, lesson, pattern category)
2. Check whether this issue matches an existing recurring pattern in the Pattern Tracker
3. If the bug category has appeared 2 or more times: update this file (`SYSTEM_RULES.md`) with a new permanent rule or strengthen an existing one
4. If deployment or architecture behavior changed: update `APP_LAUNCH_PLAYBOOK.md`
5. If new operational guidance is discovered: update `CLAUDE.md` onboarding instructions
6. Update project memory so future sessions have context

No debugging task is complete until all applicable documentation is updated.

The system must improve after every fix.

---

## Rule 013: Coding Agent Must Read Project Memory First

Before making changes, every AI coding agent must read:

1. `CLAUDE.md` — onboarding and session protocol
2. `ERROR_REPORT.md` — active bugs (fix these first)
3. `BUILD_FIX_LOG.md` — historical fixes and Golden Rules
4. `SYSTEM_RULES.md` — permanent engineering rules
5. `APP_LAUNCH_PLAYBOOK.md` — build process and config reference

No agent should start editing files without first reviewing project memory.

---

# Required File System

Every serious app build must include:

- `ERROR_REPORT.md`
- `BUILD_FIX_LOG.md`
- `APP_LAUNCH_PLAYBOOK.md`
- `SYSTEM_RULES.md`
- `CLAUDE.md`
- `.env.example`
- `README.md`

These files form the engineering operating system.

---

# Future App Rule

When starting a new app, copy this entire system first.

Do not begin a new app from a blank repo.

The next app must begin from:

1. Starter template repo
2. Existing debugging system
3. Existing launch playbook
4. Existing system rules
5. Existing coding agent instructions

The goal is not to rebuild knowledge.

The goal is to reuse it.
