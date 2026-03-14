# Milk & Honey — PWA Rebuild Design

## Overview

A clean rebuild of the Milk & Honey gamified DeFi savings PWA. The hackathon prototype proved the concept (deposit → packs → buildings → merge); this rebuild wires it to real on-chain infrastructure with proper auth, non-custodial yield via Lulo, and a fully configured installable PWA.

## Goals

- Replace fake payment flow with real on-chain USDC deposits via Lulo
- Replace localStorage cityId with Privy-authenticated wallet identity
- Gasless transactions for embedded wallet users (Apple/Google SSO)
- Postgres on Railway replaces SQLite
- Properly configured PWA (manifest, service worker, offline portfolio cache)
- Keep the existing game loop, UI, and assets — only infrastructure changes

## Out of Scope

- Withdrawals (no withdraw endpoint in this version)
- On-chain game state (buildings/cards stay off-chain in Postgres)
- Multi-token support (USDC only)
- Push notifications

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 | Unchanged |
| Auth | Privy (`@privy-io/react-auth`) | Apple/Google SSO + Phantom/Jupiter Mobile |
| Yield | Lulo (`api.lulo.fi`) | Auto-routes to Kamino, Drift, MarginFi, Jupiter |
| Gas | Privy gas sponsorship | Embedded wallets only; external wallets pay own gas |
| DB | Postgres on Railway | Drizzle ORM + drizzle-kit migrations |
| Chain | Solana mainnet | `@solana/web3.js` for tx verification + PDA reads |
| PWA | `@ducanh2912/next-pwa` | Replaces `next-pwa@5.6.0` (incompatible with Next.js 15+) |

**Removed:** `better-sqlite3`, `@jup-ag/lend`, `@voltr/vault-sdk`, `next-pwa`
**Added:** `drizzle-orm`, `pg`, `drizzle-kit`, `@privy-io/react-auth`, `@ducanh2912/next-pwa`

> **Note on next-pwa:** `next-pwa@5.6.0` (currently in deps) is incompatible with Next.js 15+. Replace with `@ducanh2912/next-pwa` — the actively maintained fork with Next.js 16 support.

---

## Database Schema

All tables keyed by `wallet_address` (replaces UUID cityId).

### users
| Column | Type | Notes |
|---|---|---|
| wallet_address | TEXT | PK — Privy-authenticated Solana address |
| name | TEXT | Display name, nullable |
| created_at | TIMESTAMP | Default now() |

### deposits
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| wallet_address | TEXT | FK → users |
| tx_signature | TEXT | UNIQUE — prevents double-credit of same on-chain tx |
| amount_usdc | BIGINT | USDC micro-units (6 decimals) |
| created_at | TIMESTAMP | Default now() |

### packs
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| wallet_address | TEXT | FK → users |
| deposit_id | UUID | FK → deposits — auditable link to originating tx |
| card_id | UUID | FK → cards, nullable (null = unopened) |
| created_at | TIMESTAMP | Default now() |
| opened_at | TIMESTAMP | Nullable |

### cards
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| wallet_address | TEXT | FK → users |
| building_type | TEXT | bakery, bookshop, cafe, house, pet-shop |
| level | INTEGER | 0–8. **Newly opened cards start at level 0.** Max level is 8 (cannot merge further). |
| created_at | TIMESTAMP | Default now() |

**Yield is never stored.** Live yield = (Lulo position value) − (sum of deposits.amount_usdc) for wallet, read on-chain per portfolio request.

---

## Auth

### Identity model

Privy is the auth layer. Both paths return a JWT containing the user's Solana `walletAddress`:

- **Apple/Google SSO** → Privy creates a TEE-backed embedded Solana wallet
- **Phantom / Jupiter Mobile** → user connects their existing wallet

The `walletAddress` from the JWT is the universal primary key. No UUIDs, no localStorage.

### Middleware

```typescript
// src/lib/auth.ts
verifyPrivyJwt(req): walletAddress | null
withAuth(handler): NextResponse  // 401 if no valid JWT
```

Every protected route uses `withAuth`. The handler receives `walletAddress` extracted server-side — the client never sends its own address as a trusted parameter.

---

## API Routes

### Public
| Method | Route | Description |
|---|---|---|
| GET | `/api/referral/[wallet]` | Social proof: name, yield earned, APY, card count |

### Protected (Bearer JWT required)
| Method | Route | Description |
|---|---|---|
| POST | `/api/users/me` | Upsert user record (name), returns profile |
| GET | `/api/portfolio` | Cards, packs, stats, live yield from Lulo PDA |
| POST | `/api/deposit/tx` | Call Lulo API → return serialized tx for client to sign |
| POST | `/api/deposit/verify` | Verify tx on-chain → INSERT deposit → generate packs |
| POST | `/api/packs/[id]/open` | Reveal random building card |
| POST | `/api/cards/merge` | Merge two same-type/level cards → level + 1 |

### Request bodies

**POST /api/deposit/verify**
```json
{ "txSignature": "string", "amountUsdc": "number" }
```

**POST /api/cards/merge**
```json
{ "cardId1": "string", "cardId2": "string" }
```

---

## Deposit Flow

### Step 1 — Generate transaction (server-side)

`POST /api/deposit/tx` — protected

Backend calls Lulo's transaction generation API with `LULO_API_KEY`:

```
POST https://api.lulo.fi/v1/generate.transactions.deposit
Headers: x-api-key: LULO_API_KEY
Body: { owner, mintAddress, protectedAmount, regularAmount }
```

> **Note:** The exact Lulo endpoint path and request body shape must be confirmed from the developer dashboard at [dev.lulo.fi](https://dev.lulo.fi) before implementation. The endpoint above is sourced from public search results and may differ from the current API. Do not code against it without verifying.

Returns serialized transaction to frontend. API key stays server-side.

### Step 2 — Sign and submit (client-side)

**Embedded wallet (gasless):**

Configure a gas policy in the Privy Dashboard (Solana mainnet). Then use Privy's standard send path — the policy applies automatically when the wallet submits through Privy's infrastructure. The exact React SDK call for gasless Solana depends on Privy SDK version; follow [Privy's Solana gas sponsorship docs](https://docs.privy.io/wallets/gas-and-asset-management/gas/setup) for the current call signature.

**External wallet (own gas):**
```typescript
await wallet.sendTransaction(transaction, connection)
```

Both paths return a `txSignature`.

### Step 3 — Verify and credit packs

`POST /api/deposit/verify` — protected

Backend:
1. Confirms tx on-chain via RPC (`connection.confirmTransaction`)
2. Verifies tx is a valid Lulo deposit for the authenticated wallet
3. Checks `tx_signature` not already in DB (idempotency via UNIQUE constraint)
4. INSERTs deposit record
5. Generates 1 pack per 100 USDC deposited
6. Returns `{ deposit, packs }`

---

## Yield Reading

On each `GET /api/portfolio`, read the Lulo `UserAccount` PDA on-chain:

```typescript
// PDA derivation — from Lulo public docs (verify against IDL before use)
PublicKey.findProgramAddressSync(
  [Buffer.from('flexlend'), walletAddress.toBuffer()],
  new PublicKey('FL3X2pRsQ9zHENpZSKDRREtccwJuei8yg9fwDu9UN69Q')
)
```

`yieldEarned = positionValue − sum(deposits.amount_usdc)`

> **Note:** The PDA seed (`'flexlend'`), program ID, and `UserAccount` field layout are sourced from the Lulo integration guide. Verify against the Lulo IDL before implementing `lulo.ts`. If the position value field name differs, yield reading will silently return incorrect values.

500× demo acceleration removed — real yield only.

---

## Gasless Transactions

Privy gas sponsorship covers SOL transaction fees for embedded wallet users (TEE-backed wallets created via Apple/Google SSO).

**Prerequisites:**
- Enable gas sponsorship in Privy Dashboard, select Solana mainnet, configure a sponsorship policy
- Fund Privy gas tank (SOL balance managed by Privy)

**Security:**
- Rate limit `POST /api/deposit/tx` to prevent gas tank drain
- `tx_signature UNIQUE` constraint prevents double-spend on verify
- Verify endpoint always confirms on-chain before crediting (Privy broadcasts async)

External wallet users (Phantom, Jupiter Mobile) pay their own gas (~$0.001 per tx).

---

## PWA Configuration

Use `@ducanh2912/next-pwa` (Next.js 16 compatible) in place of `next-pwa@5.6.0`.

```javascript
// next.config.js
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})
```

`public/manifest.json`:
- `name`: "Milk & Honey"
- `display`: "standalone"
- `theme_color`: "#6CB4E8"
- `background_color`: "#F5F0E8"
- Icons: 192×192 and 512×512

Service worker: caches last `GET /api/portfolio` response. Offline users see their village with last-known state instead of a blank screen.

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── users/me/route.ts          POST  upsert user (protected)
│   │   ├── portfolio/route.ts          GET   game state + live yield (protected)
│   │   ├── deposit/
│   │   │   ├── tx/route.ts            POST  Lulo tx generation (protected)
│   │   │   └── verify/route.ts        POST  on-chain verify → credit packs (protected)
│   │   ├── packs/[id]/open/route.ts   POST  reveal card (protected)
│   │   ├── cards/merge/route.ts       POST  merge two cards (protected)
│   │   └── referral/[wallet]/route.ts GET   social proof (public)
│   ├── (game)/
│   │   ├── page.tsx                   village / portfolio
│   │   ├── deposit/page.tsx           deposit amount entry + signing
│   │   ├── open-pack/page.tsx         pack reveal animation
│   │   └── building/[id]/page.tsx     building detail
│   ├── layout.tsx                     PrivyProvider wrapper
│   └── globals.css
├── lib/
│   ├── auth.ts                        verifyPrivyJwt, withAuth
│   ├── db/
│   │   ├── index.ts                   Drizzle pg client
│   │   ├── schema.ts                  users, deposits, packs, cards
│   │   └── migrations/                drizzle-kit generated
│   ├── lulo.ts                        generateDepositTx, readPosition
│   ├── solana.ts                      getConnection, verifyTx
│   └── game-logic.ts                  unchanged
├── store/
│   └── types.ts                       unchanged
└── components/
    └── privy-provider.tsx
```

**Deleted files (from hackathon):**
- `src/app/payment/page.tsx` — fake payment page, replaced by deposit/tx + verify flow
- `src/app/api/deposit/route.ts` — replaced by deposit/tx and deposit/verify
- `src/app/api/cities/route.ts` — replaced by users/me
- `src/app/api/cities/[cityId]/portfolio/route.ts` — replaced by portfolio route
- `src/app/api/referral/[cityId]/route.ts` — replaced by referral/[wallet]
- `src/lib/db.ts` — replaced by lib/db/
- `src/lib/jupiter-lend.ts`, `src/lib/voltr.ts`, `src/lib/yield-router.ts` — removed
- `src/lib/api.ts` — client-side API helpers, rewrite for new routes

## What Carries Over Unchanged

- `game-logic.ts` — pack rules, merge validation, level thresholds
- `constants.ts` — building types, level config (MAX_LEVEL = 8, new cards at level 0)
- `building-images.ts` — asset mapping
- `public/` — mascot, building WebPs, existing icons
- UI pages — same design, add Privy auth guards

---

## Environment Variables

```
# Privy
NEXT_PUBLIC_PRIVY_APP_ID      # client-side (PrivyProvider)
PRIVY_APP_SECRET              # server-side JWT verification
PRIVY_VERIFICATION_KEY        # public key for JWT verification

# Lulo
LULO_API_KEY                  # from dev.lulo.fi

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL    # existing

# Database
DATABASE_URL                  # Railway Postgres connection string
```

## Prerequisites Before Building

1. Register at [dev.lulo.fi](https://dev.lulo.fi) — get `LULO_API_KEY`, confirm API endpoint + request shape
2. Create Privy app at [privy.io](https://privy.io) — enable Solana, configure gas sponsorship policy, fund gas tank
3. Create Railway project — provision Postgres, get `DATABASE_URL`
4. Add `.superpowers/` to `.gitignore`
5. Verify Lulo `UserAccount` PDA layout against the Lulo IDL before implementing `lulo.ts`
