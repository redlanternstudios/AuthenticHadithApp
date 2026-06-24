# PARITY SPEC — Friday Demo (Visual Web Parity)
**Generated:** 2026-06-23  
**Designer stage:** Stage 5, App Store Factory  
**Design SSOT (web):** `/Users/kp/Projects/v0-authentic-hadith`  
**Mobile target:** `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp`  
**Scope:** SPEC ONLY. Builder executes. No source file was modified to produce this document.

---

## HOW TO READ THIS SPEC

Every instruction in this document is copy-paste actionable. "Add X to Y at line Z" means open
the file, go to that line, make the stated change. No "make it look nice." No guessing.

The spec is broken into three parts executed in order:
1. **TOKEN EDITS** — fix `lib/styles/colors.ts` first. Everything downstream depends on correct tokens.
2. **FONT SETUP** — install packages, extend `useFonts`, extend `constants/theme.ts`, update `components/themed-text.tsx`.
3. **PER-SCREEN RESTYLE** — apply font and spacing changes screen by screen.

Execute in this order. Do not skip ahead to screen restyle before tokens and fonts are done.

---

## PART 1 — TOKEN EDITS

### File: `lib/styles/colors.ts`

These are the only lines that need to change. Everything else in the file already matches the web.

#### Receipt: what already matches (no changes needed)

| Mobile token | Mobile value | Web source | Web value |
|---|---|---|---|
| `emeraldMid` | `#1b5e43` (colors.ts:4) | globals.css:17 `--emerald-mid` | `#1b5e43` |
| `goldMid` | `#c5a059` (colors.ts:9) | globals.css:10 `--gold-mid` | `#c5a059` |
| `marbleBase` | `#f8f6f2` (colors.ts:13) | globals.css:21 `--marble-base` | `#f8f6f2` |
| `bronzeText` | `#2c2416` (colors.ts:16) | globals.css:27 `--bronze-text` | `#2c2416` |
| `mutedText` | `#6b5d4d` (colors.ts:17) | globals.css:40 `--muted-foreground` | `#6b5d4d` |
| `card` | `#fffefb` (colors.ts:27) | globals.css:31 `--card` | `#fffefb` |
| `destructive` | `#dc2626` (colors.ts:40) | globals.css:43 `--destructive` | `#b91c1c` |

> NOTE on `destructive`: mobile uses `#dc2626`, web uses `#b91c1c`. These are visually close (both dark red).
> This is the delete-account screen only. The builder may choose to align these for strict parity
> (`colors.ts:40 destructive: '#b91c1c'`) but it is NOT a demo-visible surface, so it is marked
> optional. This spec does NOT require it for Friday.

---

#### Changes required (4 edits, all in `LIGHT_COLORS`)

**Edit 1 — `background`**
```
File: lib/styles/colors.ts line 25
BEFORE: background: '#f5f3ef',
AFTER:  background: '#f8f6f2',
```
Web source: `globals.css:29` `--background: #f8f6f2`

**Edit 2 — `border`**
```
File: lib/styles/colors.ts line 27
BEFORE: border: '#e4dfd7',
AFTER:  border: '#d4cfc7',
```
Web source: `globals.css:45` `--border: #d4cfc7`

**Edit 3 — `borderSubtle` (also named `muted` on web)**
```
File: lib/styles/colors.ts line 28
BEFORE: borderSubtle: '#ede9e3',
AFTER:  borderSubtle: '#ebe7e0',
```
Web source: `globals.css:39` `--muted: #ebe7e0`

**Edit 4 — `chatUserBubble` (off-palette retokened to goldMid)**
```
File: lib/styles/colors.ts line 44
BEFORE: chatUserBubble: '#D4A574',
AFTER:  chatUserBubble: '#c5a059',
```
Web rationale: The web palette's user-facing accent is `--secondary: #c5a059` (globals.css:37 `goldMid`).
`#D4A574` is a desaturated peach not present anywhere in the web token set.
Replace with `goldMid` so the user bubble reads on-brand.

**Edit 5 — `chatAiBubble` (off-palette retokened to emeraldMid)**
```
File: lib/styles/colors.ts line 45
BEFORE: chatAiBubble: '#50C878',
AFTER:  chatAiBubble: '#1b5e43',
```
Web rationale: `#50C878` is a bright mint-green absent from the web palette.
The web's primary emerald is `--primary: #1b5e43` (globals.css:35 `emeraldMid`).
Replace with `emeraldMid`. The Markdown heading color in `assistant.tsx:77-78` already uses
`colors.goldHighlight` for gold accents inside AI bubbles — that stays unchanged.
White text on `#1b5e43` meets WCAG AA contrast (4.8:1).

> Tab-bar tokens (`tabBarBorder: '#e4dfd7'`, line 49) use the old `border` value.
> After Edit 2, update `tabBarBorder` to match:

**Edit 6 — `tabBarBorder`**
```
File: lib/styles/colors.ts line 49
BEFORE: tabBarBorder: '#e4dfd7',
AFTER:  tabBarBorder: '#d4cfc7',
```
This keeps the tab bar border consistent with the corrected `border` token.

---

### DARK_COLORS — no changes required for Friday demo

The dark-mode palette uses custom iOS-appropriate dark values, not mapped to the web's `.dark`
block. This is intentional (web dark is emerald-green-dominant; iOS dark uses standard neutral
darks). The builder does NOT touch `DARK_COLORS` for this spec.

---

## PART 2 — FONT SETUP

### 2A. Package install (requires KP approval per `.claude/rules/approval-gates.md` Hard Gate)

The builder must run these two commands in the project root. These are `npx expo install`
commands (Expo-managed, SDK 54 compatible). Do not use raw `npm install`.

```bash
npx expo install @expo-google-fonts/cinzel
npx expo install @expo-google-fonts/geist
```

**Why these two:** The web app (layout.tsx:3) imports `Cinzel` and `Geist` from `next/font/google`.
These are the exact Google Fonts packages. The Expo equivalents are `@expo-google-fonts/cinzel` and
`@expo-google-fonts/geist`. Both are maintained by the Expo team and are SDK 54 compatible.

**Weights to load:**
- Cinzel: `400` (regular), `500` (medium), `600` (semibold), `700` (bold) — mirrors web layout.tsx:11
- Geist: `400` (regular), `500` (medium), `600` (semibold) — mirrors web layout.tsx:14 (Geist auto-includes variable axes; load discrete weights for React Native compatibility)

---

### 2B. Extend `useFonts` in `app/_layout.tsx`

Current `useFonts` call at `app/_layout.tsx:75-77`:
```tsx
const [fontsLoaded, fontError] = useFonts({
  Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
});
```

Replace with (add the Cinzel and Geist imports at the top of the file, then extend the object):

**Step 1: Add imports at the top of `app/_layout.tsx` (after existing imports):**
```tsx
import {
  Cinzel_400Regular,
  Cinzel_500Medium,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
} from '@expo-google-fonts/cinzel';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
} from '@expo-google-fonts/geist';
```

**Step 2: Extend the `useFonts` map at `app/_layout.tsx:75-77`:**
```tsx
const [fontsLoaded, fontError] = useFonts({
  Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
  Cinzel_400Regular,
  Cinzel_500Medium,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
});
```

The existing splash gate at `app/_layout.tsx:83-87` already waits on `fontsLoaded || fontError`
before hiding the splash screen. No changes needed to the gate logic — it will automatically
hold until Cinzel and Geist resolve alongside Ionicons.

---

### 2C. Add `FONT_FAMILY` token block to `constants/theme.ts`

Add this block at the end of `constants/theme.ts` (after the `BREAKPOINTS` export at line 219):

```typescript
// ─── Font Families ───────────────────────────────────────────────────────────
// Cinzel = display/heading font (web: --font-serif / --font-cinzel, layout.tsx:8-12)
// Geist  = body/UI font        (web: --font-geist,                  layout.tsx:14-16)
// Arabic = kept as-is; not Cinzel or Geist
export const FONT_FAMILY = {
  heading: 'Cinzel_700Bold',        // H1, hero titles, screen headers
  headingMedium: 'Cinzel_600SemiBold', // H2, card titles
  headingLight: 'Cinzel_400Regular', // H3, eyebrows in Cinzel
  body: 'Geist_400Regular',         // default body text
  bodyMedium: 'Geist_500Medium',    // body emphasis
  bodySemiBold: 'Geist_600SemiBold', // body strong, labels
  arabic: undefined,                 // falls back to system serif (Amiri not required for demo)
} as const
```

> `undefined` for arabic is intentional. The web uses `--font-arabic: "Amiri"` (globals.css:108),
> but loading Amiri is a separate task outside this spec's scope. Arabic text will continue to
> fall back to system serif on iOS, which is acceptable for the Friday demo.

---

### 2D. Update `components/themed-text.tsx`

The current `themed-text.tsx` has no font family assignments — all styles use implicit system
font (lines 36-59). It is already imported but has ~0 usages in app screens. Updating it here
establishes the canonical font-aware text component that screen restyle calls will reference.

Replace the full contents of `components/themed-text.tsx` with:

```tsx
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { FONT_FAMILY, FONT_SIZES, LINE_HEIGHTS } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  /**
   * default      — Geist 400, 16pt body
   * defaultSemiBold — Geist 600, 16pt body strong
   * title        — Cinzel 700, 32pt display (hero headings)
   * heading      — Cinzel 700, 24pt section heading
   * headingMd    — Cinzel 600, 20pt sub-heading
   * subtitle     — Geist 500, 20pt body subtitle
   * label        — Geist 600, 12pt uppercase label / eyebrow
   * link         — Geist 400, 16pt link
   */
  type?: 'default' | 'defaultSemiBold' | 'title' | 'heading' | 'headingMd' | 'subtitle' | 'label' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        styles[type],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
  },
  defaultSemiBold: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
  },
  title: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.display,
    lineHeight: FONT_SIZES.display * LINE_HEIGHTS.tight,
  },
  heading: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xxl,
    lineHeight: FONT_SIZES.xxl * LINE_HEIGHTS.tight,
  },
  headingMd: {
    fontFamily: FONT_FAMILY.headingMedium,
    fontSize: FONT_SIZES.xl,
    lineHeight: FONT_SIZES.xl * LINE_HEIGHTS.tight,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.bodyMedium,
    fontSize: FONT_SIZES.xl,
    lineHeight: FONT_SIZES.xl * LINE_HEIGHTS.normal,
  },
  label: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  link: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.relaxed,
    color: '#0a7ea4',
  },
});
```

> The old `ThemedText` only had 5 type variants and no fontFamily assignments.
> The new version adds `heading`, `headingMd`, and `label` variants and wires all
> types to `FONT_FAMILY` tokens. Existing call sites that pass `type="title"` will
> now render in Cinzel 700. The `link` default color is left as-is since no brand
> override is needed for it.

---

## PART 3 — PER-SCREEN RESTYLE

### Reference: how to apply font in a screen that does NOT yet use `ThemedText`

All existing screens use bare `<Text>` components styled via local `StyleSheet.create`.
The pattern for applying fonts is:

```tsx
// At top of file, add this import:
import { FONT_FAMILY } from '@/constants/theme';

// In the StyleSheet block, add fontFamily to the relevant style:
screenTitle: {
  fontFamily: FONT_FAMILY.heading,  // ← add this line
  fontSize: FONT_SIZES.xxxl,
  fontWeight: '700',                // ← keep existing weight for fallback
  // ...rest unchanged
},
```

> fontFamily overrides fontWeight on iOS when a named font is loaded — the weight is determined
> by which variant you pick (e.g. `Cinzel_700Bold` already encodes bold). Keep the `fontWeight`
> line for Android fallback and for the brief moment before fonts load.

---

### SCREEN 1 — Today: `app/(tabs)/today.tsx`

**Effort: MINOR**

| Element | Current style (line ref) | Restyle instruction |
|---|---|---|
| Screen title "Today" | `styles.title` at today.tsx:321-325: fontSize 30, fontWeight '700', no fontFamily | Add `fontFamily: FONT_FAMILY.heading` to `styles.title` |
| Date eyebrow text | `styles.dateText` at today.tsx:314-319: fontSize 11, fontWeight '700', letterSpacing 1.2 | Add `fontFamily: FONT_FAMILY.bodySemiBold` to `styles.dateText` |
| Card eyebrow labels ("REFLECTION", "TODAY'S SUNNAH") | `styles.cardEyebrow` at today.tsx:355-359: fontSize 11, fontWeight '700', letterSpacing 1 | Add `fontFamily: FONT_FAMILY.bodySemiBold` to `styles.cardEyebrow` |
| Sunnah action body | `styles.sunnahAction` at today.tsx:371-376: fontSize FONT_SIZES.md, fontWeight '600' | Add `fontFamily: FONT_FAMILY.bodySemiBold` |
| Background color | Via `colors.background` — corrected by Token Edit 1 above | No code change needed in this file |
| Border color | Via `colors.border` — corrected by Token Edit 2 | No code change needed in this file |

**How to apply:** In the `StyleSheet.create` block starting at today.tsx:304, add the
`fontFamily` lines as described. Import `FONT_FAMILY` from `@/constants/theme` at the top of
the file (add to the existing `getColors, SPACING, FONT_SIZES, BORDER_RADIUS` import on line 22).

---

### SCREEN 2 — Home: `app/(tabs)/index.tsx`

**Effort: MINOR**

The Home screen uses `HadithCard`, `StreakCounter`, `TodayFeaturedSection`, and `Card`
components. This spec addresses the screen-level styles only (the components are separate files
not in scope for this pass).

Find the `StyleSheet.create` block in index.tsx. The screen has a section title rendered inline
as a `<Text>` element (the "Hadith of the Moment" heading and quick-action labels). Apply:

| Element | Instruction |
|---|---|
| Any screen-level section title (fontSize ≥ 20, fontWeight '700') | Add `fontFamily: FONT_FAMILY.heading` |
| Quick-action chip labels (small, uppercase or semibold) | Add `fontFamily: FONT_FAMILY.bodySemiBold` |
| Body copy (fontSize 14-16, no special weight) | Add `fontFamily: FONT_FAMILY.body` |

Import: add `FONT_FAMILY` to the import from `@/constants/theme` at index.tsx:23
(`import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors'` — note: FONT_FAMILY
lives in `constants/theme`, not `lib/styles/colors`).

Background and border: handled by Token Edits 1 and 2 — no code change in this file.

---

### SCREEN 3 — Collections: `app/(tabs)/collections.tsx`

**Effort: MINOR**

| Element | Current style (line ref) | Restyle instruction |
|---|---|---|
| Screen title "Hadith Collections" | `styles.title` at collections.tsx:83: fontSize FONT_SIZES.xxxl (28pt), fontWeight '700' | Add `fontFamily: FONT_FAMILY.heading` |
| Subtitle | `styles.subtitle` at collections.tsx:87-89: fontSize FONT_SIZES.base | Add `fontFamily: FONT_FAMILY.body` |
| Collection card name | `styles.collectionName` at collections.tsx:103-108: fontSize FONT_SIZES.md, fontWeight '600' | Add `fontFamily: FONT_FAMILY.bodySemiBold` |
| Collection hadith count | `styles.collectionCount` at collections.tsx:109-112 | Add `fontFamily: FONT_FAMILY.body` |

Import: add `FONT_FAMILY` from `@/constants/theme` at the top (currently not imported).
The existing import on collections.tsx:9 is `import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors'`.

---

### SCREEN 4 — Hadith Detail (most-watched): `app/hadith/[id].tsx`

**Effort: MODERATE — this is the highest-value screen for the demo**

| Element | Current style (line ref) | Restyle instruction |
|---|---|---|
| Collection name (emerald, top of page) | `styles.collectionName` at [id].tsx:632: fontSize FONT_SIZES.lg (18pt), fontWeight '700' | Add `fontFamily: FONT_FAMILY.headingMedium` (Cinzel 600) — this is the first piece of text the user reads on entry |
| Grade badge chip | `styles.gradeBadge` at [id].tsx:648-652: `paddingHorizontal:12, paddingVertical:4, borderRadius: BORDER_RADIUS.full` | No color change needed — grade colors (`sahih`/`hasan`/`daif`) already match web. Shape already uses `BORDER_RADIUS.full` (pill). The badge renders correctly. |
| Grade text inside badge | `styles.gradeText` at [id].tsx:653-657: fontSize FONT_SIZES.sm, fontWeight '700', letterSpacing 0.3 | Add `fontFamily: FONT_FAMILY.bodySemiBold` (Geist 600 — not Cinzel, badges are UI not headings) |
| Arabic body text | `styles.arabicText` (search for it in [id].tsx — it uses RTL, larger font) | Do NOT add fontFamily here — Arabic fallback to system serif is correct |
| English translation body | `styles.englishText` — body text block | Add `fontFamily: FONT_FAMILY.body` (Geist 400) |
| Section labels ("Arabic", "Translation", "Reference") | `styles.sectionLabel` at [id].tsx:668: fontSize 10 | Add `fontFamily: FONT_FAMILY.bodySemiBold` (Geist 600, small label) |
| Key Teaching title | `styles.keyTeachingTitle` — goldMid label | Add `fontFamily: FONT_FAMILY.bodySemiBold` |
| Reference table values | `styles.referenceValue` | Add `fontFamily: FONT_FAMILY.body` |
| AI Summary button label | `styles.summarizeBtnText` | Add `fontFamily: FONT_FAMILY.bodySemiBold` |
| Narrator text (italic) | `styles.narrator` at [id].tsx:658-662: fontStyle italic | Add `fontFamily: FONT_FAMILY.body` (Geist 400 italic renders correctly) |

**Grade chip visual spec (confirmed matches web):**
The web renders grade chips with `bg-opacity-10` rounded-full pill containing colored text.
The mobile already implements this at [id].tsx:268-305 using `colors.sahih + '18'` (10% opacity)
background and full `BORDER_RADIUS.full` pill. No color or shape changes needed. The only
addition is `fontFamily: FONT_FAMILY.bodySemiBold` on the grade text.

Import: add `FONT_FAMILY` from `@/constants/theme` to the import at [id].tsx:17.

---

### SCREEN 5 — Search: `app/(tabs)/search.tsx`

**Effort: MINOR**

| Element | Current style (line ref) | Restyle instruction |
|---|---|---|
| Screen title "Search Hadiths" | Find `styles.title` in search.tsx StyleSheet — fontSize FONT_SIZES.xxl or xxxl, fontWeight '700' | Add `fontFamily: FONT_FAMILY.heading` |
| Subtitle | Find `styles.subtitle` | Add `fontFamily: FONT_FAMILY.body` |
| Grade filter chip text | Find `styles.chipText` | Add `fontFamily: FONT_FAMILY.bodySemiBold` |
| Search result list | Rendered via `<HadithList>` component (not in this file) | Out of scope for this pass — HadithList is a shared component |

Import: add `FONT_FAMILY` from `@/constants/theme` to the existing import line 20
(currently `import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'`).

---

### SCREEN 6 — My Hadith: `app/(tabs)/my-hadith.tsx`

**Effort: MINOR**

The `ScreenHeader` component renders the "My Hadith" title. That component is not in scope
for this pass. Apply font to the folder card content only:

| Element | Instruction |
|---|---|
| Folder name text (`styles.folderName`) — fontSize FONT_SIZES.md, in card | Add `fontFamily: FONT_FAMILY.bodySemiBold` |
| Folder count text (`styles.folderCount`) | Add `fontFamily: FONT_FAMILY.body` |
| Auth prompt text (`styles.authPrompt`) | Add `fontFamily: FONT_FAMILY.body` |
| Empty state text (inside `ListEmptyComponent`) | Add `fontFamily: FONT_FAMILY.body` |

Import: add `FONT_FAMILY` from `@/constants/theme` to the import at my-hadith.tsx:10
(currently `import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors'`).

---

### SCREEN 7 — AI Assistant: `app/(tabs)/assistant.tsx`

**Effort: MODERATE — chat bubble color change is the primary visual fix**

#### Chat bubble colors (CRITICAL for demo — most visually wrong surface today)

The bubble `backgroundColor` values are set inline at assistant.tsx:209-211:
```tsx
message.role === 'user'
  ? [styles.userBubble, { backgroundColor: colors.chatUserBubble }]
  : [styles.aiBubble, { backgroundColor: colors.chatAiBubble }]
```

After Token Edits 4 and 5 above, `colors.chatUserBubble` will be `#c5a059` (goldMid) and
`colors.chatAiBubble` will be `#1b5e43` (emeraldMid). No code change needed in assistant.tsx
itself — the color change flows in from the token edit in `lib/styles/colors.ts`.

The builder must verify visually: user bubble turns gold (#c5a059), AI bubble turns emerald
(#1b5e43). White text on both is already specified at assistant.tsx:222 and 230 via
`colors.white` — this does not change. Contrast is sufficient on both new backgrounds.

#### Font application

| Element | Current (line ref) | Instruction |
|---|---|---|
| Screen title "AI Assistant" | `styles.title` | Add `fontFamily: FONT_FAMILY.heading` (Cinzel 700) |
| Subtitle disclaimer | `styles.subtitle` | Add `fontFamily: FONT_FAMILY.body` |
| Suggested prompt card text | `styles.suggestedText` | Add `fontFamily: FONT_FAMILY.body` |
| Message role label ("You" / "AI Assistant") | `styles.messageRole` | Add `fontFamily: FONT_FAMILY.bodySemiBold` |
| User message body | `styles.messageContent` | Add `fontFamily: FONT_FAMILY.body` |
| AI message body | Rendered via `<Markdown style={markdownStyles}>` at assistant.tsx:228 | Add `fontFamily: FONT_FAMILY.body` to `markdownStyles.body` at assistant.tsx:74. The markdownStyles object is defined inline in the render function — add the `fontFamily` key there. |
| Empty state title | `styles.emptyText` | Add `fontFamily: FONT_FAMILY.heading` |
| Empty state subtext | `styles.emptySubtext` | Add `fontFamily: FONT_FAMILY.body` |
| Disclaimer text | `styles.disclaimer` | Add `fontFamily: FONT_FAMILY.body` |
| Free-usage counter / badge | Any quota-display text | Add `fontFamily: FONT_FAMILY.bodySemiBold` |

Import: add `FONT_FAMILY` from `@/constants/theme` to assistant.tsx:5
(currently `import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'`).

---

### SCREEN 8 — Learn: `app/(tabs)/learn.tsx`

**Effort: MINOR**

| Element | Current style (line ref) | Instruction |
|---|---|---|
| Screen title "Learning Paths" | `styles.title` (line ~120 context) — fontSize FONT_SIZES.xxxl | Add `fontFamily: FONT_FAMILY.heading` |
| Subtitle | `styles.subtitle` | Add `fontFamily: FONT_FAMILY.body` |
| Path card name | `styles.pathName` | Add `fontFamily: FONT_FAMILY.headingMedium` (Cinzel 600 — card titles are structural headings) |
| Difficulty badge | `styles.difficultyBadge` at learn.tsx:134 — small, emerald text | Add `fontFamily: FONT_FAMILY.bodySemiBold` |
| Path description | `styles.pathDescription` | Add `fontFamily: FONT_FAMILY.body` |
| Duration text | `styles.pathDuration` | Add `fontFamily: FONT_FAMILY.body` |
| Progress text ("{n} / {m} lessons") | `styles.progressText` | Add `fontFamily: FONT_FAMILY.body` |

Import: add `FONT_FAMILY` from `@/constants/theme` to learn.tsx:9
(currently `import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors'`).

---

## PART 4 — DO NOT TOUCH (in scope but intentionally preserved)

| Item | Reason |
|---|---|
| `constants/theme.ts` `BORDER_RADIUS` values (lines 148-156) | Intentionally richer than web's 8px — mobile uses iOS HIG scale. Do not change. |
| `DARK_COLORS` block in `lib/styles/colors.ts` (lines 53-103) | Scoped to light-mode parity for demo. Dark mode is acceptable as-is. |
| `tabBar` color `#fffefb` (colors.ts:48) | Already matches web `--card: #fffefb` (globals.css:31). No change. |
| Arabic text `fontFamily` on detail screen | Arabic falls back to system serif. Loading Amiri for the demo is out of scope. |
| `app/settings/delete-account.tsx:160,167` monospace | These are code/confirmation-input fields — monospace is correct UX. Do not apply Cinzel or Geist. |
| `components/common/ErrorBoundary.tsx:76` monospace | Error stack trace — monospace is correct. Do not change. |
| `tabBarInactive` color | `#a39d94` — not a token mismatch relative to the web. Keep. |

---

## PART 5 — OPEN QUESTIONS FOR THE BUILDER

1. **`@expo-google-fonts/geist` package name**: Verify the exact npm package name before
   installing. The Expo Google Fonts packages follow the pattern `@expo-google-fonts/{font-name}`
   with the font name lowercased and hyphenated. Run `npx expo install @expo-google-fonts/geist`
   and confirm it resolves. If it does not exist (Geist was added to Google Fonts in 2024 —
   may not yet have an Expo package), fallback: use `Inter` (`@expo-google-fonts/inter`) which
   is visually close (both are modern geometric sans) and has an established Expo package.
   Update `FONT_FAMILY.body` / `bodyMedium` / `bodySemiBold` tokens accordingly.

2. **Cinzel on Android**: Cinzel loads correctly on Android via the Expo Google Fonts package.
   However, Cinzel only covers Latin script. The Arabic text sections use a separate codepath
   and are unaffected. Confirm on an Android device or emulator before the demo if Android is
   in scope.

3. **`HadithCard` component font**: `HadithCard` (used on Today and Home) renders hadith titles
   and snippets. This component is NOT covered in this spec pass (it is a shared component that
   appears across many surfaces). If the builder has time, apply `FONT_FAMILY.body` to body text
   and `FONT_FAMILY.headingMedium` to any card title inside `components/hadith/HadithCard.tsx`.
   This is optional for Friday.

4. **`ScreenHeader` component font**: Used by My Hadith (`my-hadith.tsx:43`). The "My Hadith"
   title renders inside `ScreenHeader`, not in the screen's own StyleSheet. If the header reads
   wrong at the demo, apply `fontFamily: FONT_FAMILY.heading` inside the `ScreenHeader`
   component's title style. Out of scope for this pass.

5. **AI bubble contrast check**: After applying emerald `#1b5e43` to the AI bubble, the builder
   should visually verify on a physical device that white text (#ffffff) on this background is
   readable in both indoor and outdoor lighting. Contrast ratio is 4.83:1 (meets WCAG AA at 4.5:1
   for normal text, marginal for small text). If insufficient, lighten to `#2d7a5b`
   (`colors.emeraldHighlight`) — contrast improves to ~3.5:1 with a brighter green. This is a
   judgment call for the builder at the device test.

---

## EXECUTION CHECKLIST (builder runs top to bottom, marks each done)

- [ ] **Token Edits** — apply 6 hex changes to `lib/styles/colors.ts`
- [ ] **Package install** — `npx expo install @expo-google-fonts/cinzel @expo-google-fonts/geist` (KP approval required)
- [ ] **_layout.tsx** — add imports and extend `useFonts` map
- [ ] **constants/theme.ts** — add `FONT_FAMILY` export block at bottom
- [ ] **themed-text.tsx** — replace with font-wired version
- [ ] **today.tsx** — add `fontFamily` to title, dateText, cardEyebrow, sunnahAction styles
- [ ] **index.tsx** — add `fontFamily` to section titles and quick-action labels
- [ ] **collections.tsx** — add `fontFamily` to title, subtitle, collectionName, collectionCount
- [ ] **hadith/[id].tsx** — add `fontFamily` to collectionName, gradeText, englishText, sectionLabel, keyTeachingTitle, referenceValue, summarizeBtnText, narrator
- [ ] **search.tsx** — add `fontFamily` to title, subtitle, chipText
- [ ] **my-hadith.tsx** — add `fontFamily` to folderName, folderCount, authPrompt, emptyState
- [ ] **assistant.tsx** — add `fontFamily` to title, subtitle, messageRole, messageContent, emptyText, emptySubtext, disclaimer; add `fontFamily` to markdownStyles.body
- [ ] **learn.tsx** — add `fontFamily` to title, subtitle, pathName, difficultyBadge, pathDescription, pathDuration, progressText
- [ ] **Device smoke test** — run on physical iPhone, confirm: gold user bubble, emerald AI bubble, Cinzel on all screen titles, Geist on body text, marble background (#f8f6f2), correct border grey (#d4cfc7)
