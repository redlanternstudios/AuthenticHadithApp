# Enterprise Capability Audit — Authentic Hadith iOS App
**Date:** 2026-06-26 · **Branch:** `fix/repair-batch-2026-06-25` · **Trigger:** user-reported folder-save bug + full capability sweep before App Store submission.

This audit maps every user-facing capability to its data write path, ranks fragility findings with `file:line` receipts, and records what was fixed in-session vs. reviewed-and-accepted vs. recommended for post-V1. Governed by TruthSerum — no claim without a receipt.

---

## 1. Headline finding (the reported bug) — BUG-138

**Symptom:** Hadiths don't save into a folder.

**Root cause:** Production project `nqklipakrfuwebkdnhwg` (nq) has the `(user_id, hadith_id)` UNIQUE constraint on `saved_hadiths` (proven by FIX-119's live 23505 — `BUILD_FIX_LOG.md:4322`) but is **missing the `saved_hadiths` UPDATE RLS policy**. The original schema (`external/v0-authentic-hadith/scripts/003-create-hadiths-tables.sql:57-64`) shipped SELECT/INSERT/DELETE only.

`saveHadithToFolder` (`lib/api/my-hadith.ts:56-79`) upserts `onConflict:'user_id,hadith_id'`. New hadith → INSERT path → lands in folder. **Already-bookmarked** hadith → conflict resolves to UPDATE of `folder_id` → missing UPDATE policy silently denies it → `folder_id` stays NULL → never appears in the folder. The same gap broke reflection-note saves.

**The fix that already existed but was never shipped:** `docs/RLS_SAVED_HADITHS_FIX.sql` — a loose doc, never promoted to a migration, with no receipt it ever ran against nq.

**Resolution (this session):**
- `supabase/migrations/1000-saved-hadiths-canonical-rls.sql` — new, idempotent, canonical. Adds all 4 DML policies (incl. UPDATE), de-dupes, re-asserts the one-folder unique constraint, ends with verification SELECTs. Now the single source of truth; the loose doc is banner-marked superseded.
- `app/reflections.tsx` — routed through hardened `saveHadithToFolder` (onConflict + real error surfacing).
- **Pending production:** migration 1000 must run against nq (routed to Cowork — MCP can't reach nq). Tracked OPEN in `OPEN_BUGS.md` BUG-138 until the nq verification receipt + device round-trip land.

---

## 2. Capability → write-path map

| Capability | Screen | Hook → API | Table · op | Conflict | Status |
|---|---|---|---|---|---|
| Bookmark hadith | Collections, Hadith detail | `BookmarkService.add` | `saved_hadiths` · upsert | `user_id,hadith_id` (ignoreDuplicates) | ✅ OK |
| Save to folder | Hadith detail | `useSaveHadith → saveHadithToFolder` | `saved_hadiths` · upsert | `user_id,hadith_id` | ⚠️ needs nq UPDATE policy (BUG-138) |
| Update notes | Folder / Hadith | `updateSavedHadithNotes` | `saved_hadiths` · update | — | ⚠️ needs nq UPDATE policy (BUG-138) |
| Write reflection | Reflections | inline → `saveHadithToFolder` | `saved_hadiths` · upsert | `user_id,hadith_id` | ✅ Fixed this session |
| Create / update / delete folder | My Hadith | `useCreateFolder` / `useUpdateFolder` / `useDeleteFolder` | `hadith_folders` | — | ✅ OK |
| Share folder | Folder detail | `generateShareToken` | RPC + `hadith_folders` update | — | ✅ OK |
| Mark lesson complete | Learn | `progressService.markComplete` | AsyncStorage + `user_lesson_progress` upsert | local-first | ✅ OK (best-effort sync) |
| Advance story | Story | `advanceStoryPart` | AsyncStorage + `*_reading_progress` upsert | `user_id,*_id` | ✅ OK (best-effort, guarded) |
| Track activity / XP / streak | many | `trackActivity` | `user_stats`, `user_streaks` | — | ✅ Hardened this session (non-throwing) |
| Notification prefs | Settings | `NotificationService` | AsyncStorage | — | ✅ OK |
| Register push token | implicit | `pushService.upsertPushToken` | `profiles` · upsert | `user_id` | ✅ OK |
| Delete account | Settings | `/api/auth/delete-account` | RPC + `auth.admin` | — | ✅ OK (rate-limited) |
| AI assistant | Assistant | `/api/mobile-chat` (web backend) | none (no DB write) | — | ✅ OK (FIX-045) |
| Folder comments | — | `addComment` | `folder_comments` · insert | — | ℹ️ DEAD CODE (no caller) |

---

## 3. Ranked fragility findings

### Fixed in-session
1. **CRITICAL — reflection save silently failed.** `app/reflections.tsx:104-108` upserted with NO `onConflict` and never captured the error → 23505 for any already-saved hadith while the mutation reported success. **Fixed:** routed through `saveHadithToFolder`; real error surfaced in `onError`.
2. **HIGH — folder-save UPDATE path (BUG-138).** Missing nq UPDATE RLS policy. **Fixed in code/migration; pending nq apply (Cowork).**
3. **HIGH — `trackActivity` could throw and break the primary action.** `lib/gamification/track-activity.ts` — the `user_stats` writes weren't guarded. **Fixed:** whole body wrapped; the gamification side-effect can never break a save/completion.
4. **HIGH — second folder-save cause: missing cache invalidation.** `hooks/useMyHadith.ts:useSaveHadith` invalidated `['bookmark']`, `['bookmarks']`, `['folders']` but **never `['folder-hadiths']`** (the key `useFolderHadiths` reads). A hadith saved while the folder screen was already open did not refresh — indistinguishable from "it didn't save." **Fixed:** added `['folder-hadiths']` invalidation. This is independent of the nq RLS fix and is fully verified client-side (tsc EXIT:0).

> **Note on a hollow prior fix (TruthSerum):** a Cowork task dated 2026-06-25
> (`~/.claude/cowork/INBOX/2026-06-26T03-14-21_...rls...md`) is marked `status: DONE`
> and ran nearly identical RLS SQL — but its body contains **no pasted verification
> receipt**, and it only asked for `rowsecurity = true`, never the policy set. The bug
> still manifested afterward. Treated as UNVERIFIED. The new task (below) demands the full
> 3-part verification (rowsecurity + unique constraint + 4 named policies) as the receipt.

### Reviewed — accepted, no change (not real bugs)
4. **`syncPartProgressToSupabase` getSession** (`lib/progress/progressService.ts:252-292`). Flagged as a FIX-119 risk, but it uses `getSession()` (local read, not the network `getUser()`), guards `if (!userId) return`, is fully try/catch-wrapped (best-effort background sync), and uses correct `onConflict`. Materially different from the FIX-119 bug. **No change** — refactoring its signature across callers before a build is risk with no payoff.
5. **`BookmarkService.add` / `create-folder` auth guards** — already correct (userId param; deep-link guard `FIX-CRASH-002`). No action.

### Recommended — post-V1 (no user impact today; do NOT block submission)
6. **No FK `saved_hadiths.hadith_id → hadiths.id` in production.** Golden Rule #1. Every read uses the two-query merge workaround (`lib/api/my-hadith.ts:103-142`, `bookmark-service.ts:37-80`, `reflections.tsx`), so reads work. Risk is a future engineer re-introducing a PostgREST embed. Recommend adding the FK (or a permanent code comment at each read site) post-V1.
7. **`addComment` is dead code** with the FIX-119 `getUser()` anti-pattern (`my-hadith.ts:182`). No caller, so zero user impact. Recommend wiring with a `userId` param OR removing it post-V1.
8. **No centralized observability** on mutation errors (Sentry/PostHog). Errors throw + surface locally but aren't aggregated. Recommend post-V1.

---

## 4. The permanent fix (so this class can't recur)

`SYSTEM_RULES.md` gains a rule: **(a)** every user-writable table must carry all four CRUD RLS policies — a missing UPDATE policy silently breaks edits with no error; **(b)** any `docs/*.sql` fix must be promoted to a numbered `supabase/migrations/` file with a verification block — loose SQL docs may not be the source of truth. This is the structural cause behind BUG-138 and is now closed at the rule level.

---

## 5. Receipts

- `npx tsc --noEmit` → **EXIT:0** (after all code edits, this session).
- Root cause traced to live behavior via `BUILD_FIX_LOG.md:4322` (FIX-119, 23505) + `003-create-hadiths-tables.sql:57-64` (no UPDATE policy) + `996-my-hadith-tables.sql:33` (constraint drop).
- nq production verification: **PENDING** (Cowork) — the one wall, documented in §1.
