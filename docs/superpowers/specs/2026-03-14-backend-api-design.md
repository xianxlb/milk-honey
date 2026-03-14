# Milk & Honey — Backend API Design

## Overview

Backend for a gamified DeFi savings app (hackathon demo). Users create a "city," deposit USDC to earn packs, open packs to reveal random building cards, and merge same-type/same-level cards to level up. Yield is mocked at 5% APY, calculated on the fly. A referral system provides social proof ("your friend earned $X at 5% APY").

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

| Column     | Type   | Notes                         |
|------------|--------|-------------------------------|
| id         | TEXT   | PK, UUID                      |
| city_id    | TEXT   | FK → cities.id                |
| amount     | REAL   | USDC amount                   |
| created_at | INTEGER| Unix timestamp                |

### cards

| Column        | Type   | Notes                              |
|---------------|--------|------------------------------------|
| id            | TEXT   | PK, UUID                          |
| city_id       | TEXT   | FK → cities.id                    |
| building_type | TEXT   | flower-shop, pet-shop, bookshop, farm |
| level         | INTEGER| 0-8                               |
| created_at    | INTEGER| Unix timestamp                    |

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

- Body: `{ name, referralCode? }`
- referralCode is another city's ID
- Returns: city object + own referral code (city ID)

### POST /api/deposit
Deposit USDC and generate packs.

- Body: `{ cityId, amount }`
- Creates deposit record
- Generates 1 pack per $100 (e.g. $350 → 3 packs; $50 remainder deposited but no pack)
- Returns: deposit record + array of unopened packs

### POST /api/packs/:packId/open
Open a pack to reveal a random building card.

- Randomizes building type with equal probability
- Default types: flower-shop, pet-shop, bookshop (33% each)
- Farm unlocks when city prosperity >= $3000 (then 25% each)
- All revealed cards start at level 0
- Creates card record, links to pack
- Returns: revealed card

### POST /api/cards/merge
Merge two same-type, same-level cards into a higher level card.

- Body: `{ cardId1, cardId2 }`
- Validates: same type, same level, same city, level < 8
- Deletes both cards, creates new card at level + 1
- Returns: new merged card

### GET /api/cities/:cityId/portfolio
Dashboard data for a city.

- Returns: all cards, unopened pack count, total deposited, calculated yield, prosperity

### GET /api/referral/:cityId
Social proof data for referral landing page.

- Returns: city name, total yield earned, APY (5%), number of buildings
- Public endpoint (no auth required)

## Yield Calculation

Mocked at 5% APY, calculated on the fly (not stored):

```
yieldEarned = totalDeposits * 0.05 * (now - firstDepositTime) / (365 * 24 * 60 * 60)
```

## Pack Randomization

- Equal probability across available building types
- 3 base types: flower-shop, pet-shop, bookshop
- Farm unlocks at prosperity >= $3000
- All cards from packs are level 0

## Merge Rules

- Two cards of same type + same level → one card at level + 1
- Level 8 is maximum (cannot merge further)

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
