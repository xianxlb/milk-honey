# Milk & Honey — Backend API Design

## Overview

Backend for a gamified DeFi savings app (hackathon demo). Users create a "city," deposit USDC to earn packs, open packs to reveal random building cards, and merge same-type/same-level cards to level up. Yield is mocked at 5% APY, calculated on the fly. A referral system provides social proof ("your friend earned $X at 5% APY").

The frontend is being rebuilt separately by a colleague. This backend is the source of truth — the frontend will consume these API endpoints.

## Tech Stack

- Next.js API routes (existing repo)
- `better-sqlite3` for persistence (file-based, zero config)
- Database file: `milk-honey.db` in project root, gitignored

## Database Schema

### cities

| Column      | Type   | Notes                        |
|-------------|--------|------------------------------|
| id          | TEXT   | PK, UUID                     |
| name        | TEXT   | City/player name             |
| referred_by | TEXT   | FK → cities.id, nullable     |
| created_at  | INTEGER| Unix timestamp               |

### deposits

| Column     | Type    | Notes                         |
|------------|---------|-------------------------------|
| id         | TEXT    | PK, UUID                      |
| city_id    | TEXT    | FK → cities.id                |
| amount     | INTEGER | USDC amount in cents          |
| created_at | INTEGER | Unix timestamp                |

### cards

| Column        | Type   | Notes                              |
|---------------|--------|------------------------------------|
| id            | TEXT   | PK, UUID                          |
| city_id       | TEXT   | FK → cities.id                    |
| building_type | TEXT   | flower-shop, pet-shop, bookshop, farm |
| level         | INTEGER| 0-8                               |
| created_at    | INTEGER| Unix timestamp                    |

Cards are simple: type + level. No value tracking per card — yield is calculated from deposits, not cards. Merging uses hard DELETE (both source cards removed, new card inserted).

### packs

| Column     | Type   | Notes                              |
|------------|--------|------------------------------------|
| id         | TEXT   | PK, UUID                          |
| city_id    | TEXT   | FK → cities.id                    |
| card_id    | TEXT   | FK → cards.id, nullable (null = unopened) |
| created_at | INTEGER| Unix timestamp                    |
| opened_at  | INTEGER| nullable, when opened             |

## API Endpoints

### POST /api/cities
Create a new city (user account).

- Body: `{ name: string, referralCode?: string }`
- referralCode is another city's ID
- Response:
```json
{
  "id": "uuid",
  "name": "Xian's City",
  "referralCode": "uuid",
  "createdAt": 1710400000
}
```

### POST /api/deposit
Deposit USDC and generate packs.

- Body: `{ cityId: string, amount: number }` (amount in dollars, stored as cents)
- Creates deposit record
- Generates 1 pack per $100 (e.g. $350 → 3 packs; $50 remainder deposited but no pack)
- Response:
```json
{
  "deposit": { "id": "uuid", "amount": 35000, "createdAt": 1710400000 },
  "packs": [
    { "id": "uuid", "cardId": null, "createdAt": 1710400000 },
    { "id": "uuid", "cardId": null, "createdAt": 1710400000 },
    { "id": "uuid", "cardId": null, "createdAt": 1710400000 }
  ]
}
```

### POST /api/packs/:packId/open
Open a pack to reveal a random building card.

- Randomizes building type with equal probability
- Default types: flower-shop, pet-shop, bookshop (33% each)
- Farm unlocks when city prosperity >= $3000 (then 25% each)
- All revealed cards start at level 0
- Creates card record, links to pack
- Response:
```json
{
  "pack": { "id": "uuid", "cardId": "uuid", "openedAt": 1710400000 },
  "card": { "id": "uuid", "buildingType": "flower-shop", "level": 0, "createdAt": 1710400000 }
}
```

### POST /api/cards/merge
Merge two same-type, same-level cards into a higher level card.

- Body: `{ cardId1: string, cardId2: string }`
- Validates: same type, same level, same city, level < 8
- Hard deletes both source cards, creates new card at level + 1
- Response:
```json
{
  "card": { "id": "uuid", "buildingType": "flower-shop", "level": 1, "createdAt": 1710400000 }
}
```

### GET /api/cities/:cityId/portfolio
Dashboard data for a city.

- Response:
```json
{
  "city": { "id": "uuid", "name": "Xian's City", "createdAt": 1710400000 },
  "cards": [
    { "id": "uuid", "buildingType": "flower-shop", "level": 0, "createdAt": 1710400000 }
  ],
  "packs": [
    { "id": "uuid", "cardId": null, "createdAt": 1710400000 }
  ],
  "stats": {
    "totalDepositedCents": 35000,
    "yieldEarnedCents": 123,
    "apyPercent": 5,
    "prosperity": 350.00,
    "cardCount": 3,
    "unopenedPackCount": 1
  }
}
```

### GET /api/referral/:cityId
Social proof data for referral landing page.

- Public endpoint (no auth required)
- Response:
```json
{
  "cityName": "Xian's City",
  "yieldEarned": 12.34,
  "apyPercent": 5,
  "cardCount": 7
}
```

## Yield Calculation

Mocked at 5% APY, calculated on the fly per deposit (not stored):

```
For each deposit:
  depositYield = deposit.amount * 0.05 * (now - deposit.created_at) / (365 * 24 * 60 * 60)

totalYield = sum of all depositYields
```

Each deposit accrues yield independently from its own creation time. This is intentionally simplified for the demo.

## Prosperity

Prosperity = total deposited across all deposits for a city (in dollars). Used to determine farm unlock threshold ($3000). Calculated on the fly from the deposits table.

## Pack Randomization

- Equal probability across available building types
- 3 base types: flower-shop, pet-shop, bookshop
- Farm unlocks at prosperity >= $3000
- All cards from packs are level 0

## Merge Rules

- Two cards of same type + same level → one card at level + 1
- Level 8 is maximum (cannot merge further)
- Source cards are hard deleted

## Out of Scope (Hackathon Demo)

- Withdrawals (no withdraw endpoint)
- Authentication / authorization
- Rate limiting
- Real on-chain transactions
- Wilting / card lifecycle states

## File Structure

```
src/
├── app/api/
│   ├── cities/
│   │   └── route.ts                # POST - create city
│   ├── cities/[cityId]/
│   │   └── portfolio/route.ts      # GET - dashboard data
│   ├── deposit/
│   │   └── route.ts                # POST - deposit + generate packs
│   ├── packs/[packId]/
│   │   └── open/route.ts           # POST - open pack, reveal card
│   ├── cards/
│   │   └── merge/route.ts          # POST - merge two cards
│   └── referral/[cityId]/
│       └── route.ts                # GET - social proof data
├── lib/
│   └── db.ts                       # SQLite connection + schema init
```

## Dependencies

- `better-sqlite3` — synchronous SQLite for Node
- `@types/better-sqlite3` — TypeScript types
