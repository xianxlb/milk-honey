# Withdraw & Refer — Design Spec
**Date:** 2026-03-16
**Status:** Approved

---

## Overview

Two new features for Milk & Honey:
1. **Withdraw** — let users pull USDC back out of Lulo, with proportional building loss
2. **Refer** — shareable city link showing live stats; referrer earns Lulo bonus APY

Both are surfaced via a new bottom navigation bar.

---

## 1. Navigation

Add a sticky bottom nav bar with 4 tabs:

| Tab | Icon | Route |
|-----|------|-------|
| Home | 🏠 | `/` |
| Deposit | ➕ | `/deposit` |
| Withdraw | ➖ | `/withdraw` |
| Refer | 🔗 | `/refer` |

**Rules:**
- Nav is hidden on `/open-pack`, `/building/[id]` — these are immersive flows
- Active tab highlighted in app yellow (`#F0C430`)
- Implemented as a shared `<BottomNav>` component in `src/components/`

---

## 2. Withdraw

### 2.1 Database

New `withdrawals` table (Drizzle schema):

```
withdrawals
├─ id                  UUID PK
├─ wallet_address      FK → users.wallet_address
├─ amount_usdc         bigint (micro-units, 6 decimal places)
├─ status              text: 'pending' | 'completed'
├─ cooldown_seconds    integer (from Lulo initiate response, if provided; default 0)
├─ initiated_tx        text (Solana signature)
├─ completed_tx        text (Solana signature, nullable)
├─ initiated_at        timestamp (default now)
└─ completed_at        timestamp (nullable)
```

**Uniqueness constraint:** Unique partial index on `(wallet_address) WHERE status = 'pending'` — enforced at DB level, so concurrent initiate requests cannot both succeed.

### 2.2 Lulo API

- **Initiate:** `POST https://api.lulo.fi/v1/generate.transactions.initiateRegularWithdraw`
  - Body: `{ owner, mintAddress: USDC_MINT, amount }` where `amount` is **whole USDC** (divide `amount_usdc` by `1_000_000` before sending)
  - Returns: `{ transaction: base64 }`
- **Complete:** `POST https://api.lulo.fi/v1/generate.transactions.completeRegularWithdraw`
  - Body: `{ owner, mintAddress: USDC_MINT }`
  - Returns: `{ transaction: base64 }`

Both follow the same sign-and-send pattern as deposits (serialize → sign via Privy → broadcast → confirm).

### 2.3 API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/withdraw/pending` | GET | Privy JWT | Returns active pending withdrawal or null |
| `/api/withdraw/initiate` | POST | Privy JWT | Calls Lulo, saves pending row |
| `/api/withdraw/complete` | POST | Privy JWT | Calls Lulo, marks completed, removes buildings |

**`/api/withdraw/initiate` error cases:**
- 409 if a `pending` withdrawal already exists for this wallet (DB constraint)
- 400 if amount exceeds current Lulo position
- 400 if amount ≤ 0

**`/api/withdraw/complete` error cases:**
- 404 if no pending withdrawal exists
- 400 if Lulo returns a simulate error (cooldown not yet elapsed)

### 2.4 UI Flow

**`/withdraw` page:**
1. Shows current Lulo balance (from `/api/portfolio`)
2. Amount input with preset buttons: `$20`, `$50`, `$100`
3. Live preview: "You'll lose X buildings" (calculated from `floor((balance - amount) / 20)` vs current card count)
4. Disabled with message "Withdrawal already in progress" if a pending withdrawal exists
5. "Withdraw" button → calls initiate → user signs tx → stores pending record → redirects home

**Home screen pending banner:**
- Shown when `GET /api/withdraw/pending` returns a record
- Yellow banner (same style as unopened packs): "💸 Withdrawal pending · $X · Ready in Xh Xm"
- Countdown computed from `initiated_at + cooldown_seconds`
- When cooldown elapsed, banner changes to: "💸 Withdrawal ready · Tap to complete"
- Tapping → calls complete → user signs tx → buildings removed → banner disappears

### 2.5 Building Removal Logic

On withdrawal completion in `/api/withdraw/complete`:
1. Compute `expectedNewBalanceUsdc = currentTotalDeposited - withdrawal.amount_usdc` using the stored `amount_usdc` from the DB row — do **not** re-query Lulo (avoids race with indexing delay and protects against `readPosition` returning 0 on error)
2. `targetBuildingCount = floor(expectedNewBalanceDollars / 20)` where dollars = `expectedNewBalanceUsdc / 1_000_000`
3. Fetch user's cards ordered by `level ASC, created_at ASC`
4. If `currentCardCount <= targetBuildingCount`: no buildings to remove, skip
5. Otherwise: take the first `(currentCardCount - targetBuildingCount)` cards from the list; for each:
   a. Set `packs.card_id = null` and `packs.opened_at = null` (reset pack to unopened) where `card_id = card.id`
   b. Delete the card row
6. Mark withdrawal `status = 'completed'`, set `completed_at = now()`, set `completed_tx`

---

## 3. Refer

### 3.1 Database

Add `city_code` column to `users` table:
```
users
└─ city_code   text, unique, nullable
```

**Format:** `[adjective]-[noun]-[3-digit zero-padded number]`
**Examples:** `golden-river-482`, `silver-maple-031`, `amber-forest-719`

**Generation:** In `src/lib/city-code.ts` — hardcoded word lists (adjectives + nouns) + random 0–999 number, zero-padded. Generated in `POST /api/users/me` with a retry loop (up to 5 attempts on unique constraint violation). If all 5 attempts collide, return a 500 with a clear error message. `city_code` is generated on first auth and never changed.

**Backfill for existing users:** `city_code` column is nullable. Existing users without a `city_code` will have one generated the next time `POST /api/users/me` is called (on login). The `/refer` page shows a loading state while waiting for `city_code` to be assigned.

### 3.2 Lulo API

`GET https://api.lulo.fi/v1/referral.getReferrer?owner={wallet}`
Headers: `x-api-key`

Key response fields used:
- `code` — Lulo referral code
- `bonusApyPct` — extra APY earned from referrals (already a percentage, no ×100 needed)
- `numReferrals` — count of active referrals
- `pendingReferralEarnings` — unclaimed earnings in USD

Called server-side from the new `/api/referral/me` route.

### 3.3 API Routes

**New authenticated route:** `GET /api/referral/me`
- Protected by Privy JWT
- Calls Lulo `getReferrer` with the authenticated wallet
- Returns: `{ cityCode, cityName, yieldEarnedUsdc, apyPercent, cardCount, bonusApyPct, numReferrals, pendingReferralEarnings }`
- Used by the `/refer` page

**Existing public route:** `GET /api/referral/[wallet]` → **rename folder to `[city_code]`**
- Resolves `city_code → wallet_address` via DB lookup (`SELECT wallet_address FROM users WHERE city_code = ?`)
- Returns 404 if code not found
- No existing clients call this route with a raw wallet address (the route was previously used only by the referral pitch mockup, not the live app)
- Returns same fields as before + `bonusApyPct`, `numReferrals`

### 3.4 UI

**`/refer` page (authenticated):**

Top section — **Referral Card** (app-themed, same visual used on public city page):
- Cream (`#FBF8F2`) card, blue header (`#6CB4E8`)
- Header: 🏙️ "[Name]'s City" + subtitle "Public · [city_code]"
- Stats rows (divider-separated, same style as deposit page):
  - Yield earned — gold value (`#F0C430`)
  - APY — from Lulo
  - Buildings — card count
  - Bonus APY — from `bonusApyPct`
- **Share button** → Web Share API with text + URL `https://milk-honey.app/city/[city_code]`
- **Copy link** button as fallback if `navigator.share` not available

Bottom section — Referral stats:
- Active referrals count (from `numReferrals`)
- Pending earnings in USD (from `pendingReferralEarnings`)

**`/city/[city_code]` page (public, unauthenticated):**
- Reuses the same `<ReferralCard>` component, read-only mode
- Fetches from `GET /api/referral/[city_code]`
- "Join and start saving →" CTA → links to `/login`
- App-themed (cream background, blue/yellow accents)

---

## 4. File Plan

### New files
- `src/components/bottom-nav.tsx`
- `src/components/referral-card.tsx` — shared between `/refer` and `/city/[city_code]`
- `src/app/withdraw/page.tsx`
- `src/app/refer/page.tsx`
- `src/app/city/[city_code]/page.tsx`
- `src/app/api/withdraw/pending/route.ts`
- `src/app/api/withdraw/initiate/route.ts`
- `src/app/api/withdraw/complete/route.ts`
- `src/app/api/referral/me/route.ts`
- `src/lib/city-code.ts` (word lists + generator with retry)

### Modified files
- `src/lib/db/schema.ts` — add `withdrawals` table + `city_code` to `users`
- `src/lib/lulo.ts` — add `generateWithdrawInitiateTx`, `generateWithdrawCompleteTx`
- `src/app/api/users/me/route.ts` — generate `city_code` on user creation (with retry loop)
- `src/app/api/referral/[wallet]/route.ts` → rename to `[city_code]`, resolve via city_code lookup
- `src/app/page.tsx` — add pending withdrawal banner, add `<BottomNav>`
- `src/app/deposit/page.tsx` — add `<BottomNav>`
- `src/app/withdraw/page.tsx` — add `<BottomNav>`
- `src/app/refer/page.tsx` — add `<BottomNav>`

### DB Migration
Use Drizzle's `drizzle-kit generate` to produce the migration from schema changes, then `drizzle-kit migrate` to apply. Two changes in one migration:
1. Add `city_code text UNIQUE` to `users` (nullable, existing rows get NULL)
2. Create `withdrawals` table with partial unique index: `CREATE UNIQUE INDEX withdrawals_one_pending_per_user ON withdrawals (wallet_address) WHERE status = 'pending'`

---

## 5. Out of Scope

- Claiming referral earnings (Lulo handles this in their own app)
- Partial building preservation choice (always remove lowest-level first)
- Push notifications for withdrawal ready
- Referral reward bonuses beyond Lulo's built-in bonus APY
