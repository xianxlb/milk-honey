# Animal Theme Overhaul — Design Spec
**Date:** 2026-03-17
**Status:** Ready for implementation planning

---

## Overview

Replace the buildings/village metaphor with an animal collection game. Each deposited pack now reveals a quirky animal with a distinct personality. The mechanics (merge, levels, packs) are unchanged — only the presentation layer changes.

---

## 1. Animal Roster

8 animal types replace the 5 building types. All are starter animals (`unlockProsperity: 0`).

| `animal_type` | Display Name | Emoji (placeholder) | Personality |
|---|---|---|---|
| `cow` | Bessie | 🐄 | Rebel. Cape, scooter, doesn't follow rules. |
| `pig` | Sir Reginald | 🐷 | Distinguished gentleman — monocle, top hat — hopelessly clumsy. |
| `duck` | Gerald | 🦆 | Vacation duck. Assigned as delivery duck, delivers only on foot (waddle waddle). |
| `dog` | Biscuit | 🐶 | Terrified of humans. Communicates via whiteboard only. |
| `sheep` | Wooly | 🐑 | Always freezing despite the wool. Constantly bundled up, always has a hot drink. |
| `frog` | Ribbit | 🐸 | Clown suit. Balances on a ball. Laughs at own jokes exclusively. |
| `chicken` | Nugget | 🐔 | Small. Angry. Has back pain. |
| `horse` | Clover | 🐴 | Zero willpower around sweet treats. |

**Note on images:** Emojis are placeholders only. Each animal will have a custom illustrated image per level (see §7 — Art Direction). Images live at `/animals/{type}/level-{n}.png` (or `.webp`).

---

## 2. Personality Data Structure

All lore, dialogue, and personality lives in `src/lib/animals.ts` — a single content file, no DB changes for copy.

```ts
// src/lib/animals.ts

export type AnimalType = 'cow' | 'pig' | 'duck' | 'dog' | 'sheep' | 'frog' | 'chicken' | 'horse'

export interface AnimalConfig {
  type: AnimalType
  name: string         // "Bessie", "Sir Reginald", etc.
  personality: string  // 1-line descriptor shown on detail page
  // Dialogue per level (8 levels). Each level gets a new line that reflects growth.
  dialogue: [string, string, string, string, string, string, string, string]
}

export const ANIMAL_TYPES: AnimalConfig[] = [
  {
    type: 'cow',
    name: 'Bessie',
    personality: 'Rebel. Doesn\'t follow rules.',
    dialogue: [
      'Rules? Never heard of them.',
      'My scooter goes faster than your scooter.',
      'I read the terms. I disagree with all of them.',
      'I cape, therefore I am.',
      'They said I couldn\'t. That was motivating.',
      'The rulebook? Great coaster.',
      'I have opinions about speed limits.',
      'Legendary. It\'s a whole thing.',
    ],
  },
  // ... etc for all 8 animals
]
```

Dialogue follows **option C**: each level gets a new line that fits the same personality at increasing absurdity/confidence.

---

## 3. Code Changes

### 3.1 Renamed files and identifiers

| Old | New |
|---|---|
| `src/lib/building-images.ts` | `src/lib/animal-images.ts` |
| `src/lib/constants.ts` — `BUILDING_TYPES`, `STARTER_BUILDING_TYPES` | `ANIMAL_TYPES`, `STARTER_ANIMAL_TYPES` |
| `src/store/types.ts` — `BuildingType`, `Building`, `BuildingTypeConfig`, `CityState` | `AnimalType`, `Animal`, `AnimalConfig`, `CrewState` |
| `src/app/building/[id]/` | `src/app/animal/[id]/` |
| `src/lib/game-logic.ts` — all `building` references | `animal` equivalents |
| `src/app/page.tsx` — "Your Village", "No buildings yet", etc. | "Your Crew", "No crew yet", etc. |

### 3.2 Database migration

One column rename in the `cards` table:
```sql
ALTER TABLE cards RENAME COLUMN building_type TO animal_type;
```

New migration file: `src/lib/db/migrations/0001_animal_rename.sql`

### 3.3 New file: `src/lib/animals.ts`

Content-only file. No DB queries. Exports:
- `ANIMAL_TYPES: AnimalConfig[]`
- `getAnimalConfig(type: AnimalType): AnimalConfig`
- `getAnimalDialogue(type: AnimalType, level: number): string`
- `getAnimalName(type: AnimalType): string`
- `getAnimalPersonality(type: AnimalType): string`

### 3.4 `src/lib/animal-images.ts` (replaces building-images.ts)

```ts
export function getAnimalImage(animalType: string, level: number): string | null
// Returns `/animals/{type}/level-{level}.png` if image exists, else null
// Falls back to emoji from ANIMAL_TYPES config
```

Image existence is tracked in a `HAS_IMAGE` set — initially empty until art is added.

---

## 4. Home Screen ("Your Crew")

### Header
- "Your Village" → **"Your Crew"**
- Subtitle copy TBD (or removed)

### Empty state
- Current: "Deposit $20 USDC to unlock your first building!"
- New: **"Deposit $20 USDC to meet your first crew member!"**
- Mascot image stays.

### Animal card (in grid)
- **Layout:** Big animal image/emoji centered, display name below ("Bessie"), level number smaller below that
- **Merge badge:** Gold "Merge" pill in top-right corner — shown only when merge is available (same type + same level exists in crew)
- **Image:** `/animals/{type}/level-{level}.png` if available; else large emoji centered in card
- **Card style:** Rounded corners, white/cream background, subtle border — matches existing card aesthetic

---

## 5. Animal Detail Page (`/animal/[id]`)

Replaces `/building/[id]`. Simpler than the current building detail.

### Layout (top to bottom)
1. **Animal image** — large, centered (level-specific art or emoji)
2. **Name + level** — e.g. "Bessie · Level 3"
3. **Personality line** — `animal.personality`, muted small text
4. **Speech bubble** — `getAnimalDialogue(type, level)`, displayed in a speech bubble component. No tip/tail. Rounded rectangle, slightly off-white, left-aligned text.
5. **Merge button** — shown only if merge is available. Same gold style as current merge CTA.

No stats/values shown on the detail page — it's purely personality-forward.

---

## 6. Intro Dialogue Component (new)

### Trigger
- Fires the **first time** a user receives a given animal type (after opening a pack)
- Seen state: `localStorage.getItem('intro_seen_{type}')` — set to `'1'` on dismiss
- Component mounts on the open-pack result screen, or home screen if pack was pre-opened

### Visual Layout
Bottom overlay — sits flush at the screen's bottom edge, slides up on mount.

```
┌─────────────────────────────────────────────────┐
│                                                   │
│  ┌──────────────────────┐  ┌───────────────────┐ │
│  │  Speech bubble       │  │                   │ │
│  │  (personality intro) │  │  Animal face      │ │
│  │                      │  │  (zoomed/cropped) │ │
│  └──────────────────────┘  └───────────────────┘ │
│         Tap anywhere to continue                  │
└─────────────────────────────────────────────────┘
```

- Both panels are the **same height**, side by side
- **Left:** speech bubble with the animal's level-1 dialogue line
- **Right:** zoomed animal face — `object-cover` crop of the level-1 image, rounded on top
- **Caption:** "Tap anywhere to continue" — small, centered, below both panels
- **Dismiss:** tap anywhere on overlay
- **Animation:** slide-up on mount, fade-out on dismiss

---

## 7. Raccoon Event (non-collectable)

### Trigger conditions (checked on home screen load)
- User's last deposit was **7+ days ago** (check against `deposits` table latest `created_at`)
- User has **≥ 1 animal** in their crew

### Display
- Full-width banner/overlay on home screen, above the crew grid
- Raccoon rummaging animation (CSS or Lottie TBD — use CSS first)
- Caption: **"one man's trash is another man's treasure"**
- Tap to dismiss

### Dismiss state
- `localStorage.getItem('raccoon_dismissed_date')` — stores today's date string (`2026-03-17`)
- Resets daily: if stored date ≠ today, show again
- Does not affect whether the user sees it tomorrow (trigger conditions re-evaluated each visit)

### Not a collectable
- Raccoon does not appear in the crew grid
- No DB record, no pack mechanic

---

## 8. Art Direction for Custom Animal Images

> This section guides the art/image generation process. The goal is to replace placeholder emojis with illustrated character images that match each animal's personality.

### File naming
```
public/animals/{type}/level-{1-8}.png
```
Example: `public/animals/cow/level-1.png`, `public/animals/cow/level-8.png`

### Style guidelines (to be refined with reference images from designer)

- **Format:** Square PNG, transparent background, 512×512px minimum
- **Style:** Flat illustration — bold outlines, limited palette, no gradients. Think character sticker art.
- **Expression/pose progression:** Level 1 is the base character. Each level adds a new expression or accessory that reflects growing confidence/absurdity per the personality.
  - Example for Bessie (cow): L1 = plain cow with rebellious look, L2 = adds cape, L3 = on scooter, etc.
- **No text in images** — all copy comes from the dialogue system
- **Consistency:** Same art style across all 8 animals — same line weight, same color vibrancy, same proportions

### How to provide reference images (read this section)
See §9.

---

## 9. Providing Reference Images to Claude

You can give Claude reference images in **two ways** during a Claude Code session:

### Option A — Screenshot / paste directly (recommended for quick iteration)
1. Take a screenshot or save an image file to your disk
2. In Claude Code, type your message and **drag the image file into the chat** or use the paperclip/attachment icon if your terminal supports it
3. Claude Code can read image files directly with the `Read` tool — just say: *"here's the reference image at `/path/to/image.png`"* and Claude will open it visually

### Option B — Give a file path
If the image is already on disk, just tell Claude the absolute path:
> "The art style I want is at `/Users/xian/Downloads/reference.png` — match this for all animals"

Claude will use the Read tool to view it visually and use it as a style reference.

### What Claude can do with reference images
- Describe the style in detail (line weight, palette, proportions) to inform a prompt for an AI image generator (Midjourney, Dall-E, Ideogram, etc.)
- Generate a consistent prompt template for all 8 animals based on the reference
- Review generated images against the reference for consistency
- Write alt-text, describe layout, check spacing — anything visual

### What Claude cannot do
- Generate the images itself (no image output capability in Claude Code)
- Guarantee that AI-generated images will perfectly match a reference — iteration is expected

### Recommended workflow
1. Find 1–3 reference images that match the vibe (Pinterest, Dribbble, existing sticker art)
2. Share them with Claude using Option A or B above
3. Claude will write a detailed prompt template
4. Run the prompt in your preferred image generator for each animal × 8 levels
5. Drop the files in `public/animals/{type}/level-{n}.png`
6. Update `HAS_IMAGE` set in `src/lib/animal-images.ts`

---

## 10. Out of Scope (for this spec)

- Any changes to merge mechanics, deposit flow, or API routes
- Sound effects or haptics
- Raccoon as a collectable
- Animated sprites (CSS animations for the raccoon event are acceptable; full sprite animation is deferred)
- Backend changes beyond the single column rename
