# Milk & Honey — Backend API

## Quick Start

```bash
git pull origin main
npm install
npm run dev
```

Server runs at `http://localhost:3000`. All endpoints return JSON.

---

## Endpoints

### 1. Create a City (User Account)

```
POST /api/cities
```

```json
{ "name": "My City", "referralCode": "optional-city-id" }
```

Response `201`:
```json
{
  "id": "uuid",
  "name": "My City",
  "referralCode": "uuid",
  "createdAt": 1710400000
}
```

The `referralCode` in the response IS the city's `id` — share it for referrals.

---

### 2. Deposit & Get Packs

```
POST /api/deposit
```

```json
{ "cityId": "uuid", "amount": 300 }
```

`amount` is in **dollars**. Every $100 generates 1 pack (e.g. $300 = 3 packs, $50 leftover earns yield but no pack).

Response `201`:
```json
{
  "deposit": { "id": "uuid", "amount": 30000, "createdAt": 1710400000 },
  "packs": [
    { "id": "uuid", "cardId": null, "createdAt": 1710400000 }
  ]
}
```

Note: `deposit.amount` is stored in **cents**.

---

### 3. Open a Pack

```
POST /api/packs/:packId/open
```

No request body needed. Reveals a random level-0 building card.

Building types: `flower-shop`, `pet-shop`, `bookshop` (equal chance). `farm` unlocks at $3000+ total deposits.

Response `200`:
```json
{
  "pack": { "id": "uuid", "cardId": "uuid", "openedAt": 1710400000 },
  "card": { "id": "uuid", "buildingType": "flower-shop", "level": 0, "createdAt": 1710400000 }
}
```

---

### 4. Merge Two Cards

```
POST /api/cards/merge
```

```json
{ "cardId1": "uuid", "cardId2": "uuid" }
```

Both cards must be **same type + same level**. Deletes both, creates one card at level + 1. Max level is 8.

Response `200`:
```json
{
  "card": { "id": "uuid", "buildingType": "flower-shop", "level": 1, "createdAt": 1710400000 }
}
```

---

### 5. Get Portfolio (Dashboard)

```
GET /api/cities/:cityId/portfolio
```

Response `200`:
```json
{
  "city": { "id": "uuid", "name": "My City", "createdAt": 1710400000 },
  "cards": [
    { "id": "uuid", "buildingType": "pet-shop", "level": 0, "createdAt": 1710400000 }
  ],
  "packs": [
    { "id": "uuid", "cardId": null, "createdAt": 1710400000 }
  ],
  "stats": {
    "totalDepositedCents": 30000,
    "yieldEarnedCents": 42,
    "apyPercent": 5,
    "prosperity": 300,
    "cardCount": 2,
    "unopenedPackCount": 1
  }
}
```

`packs` only includes unopened packs. `yieldEarnedCents` ticks up in real-time (5% APY calculated per-second from each deposit's creation time).

---

### 6. Referral Social Proof

```
GET /api/referral/:cityId
```

Public endpoint — no auth. This is what the referred user sees.

Response `200`:
```json
{
  "cityName": "Xian City",
  "yieldEarned": 1.23,
  "apyPercent": 5,
  "cardCount": 7
}
```

`yieldEarned` is in **dollars**.

---

## Demo Flow

```
1. Xian creates city           POST /api/cities { name: "Xian City" }
2. Xian deposits $300           POST /api/deposit { cityId, amount: 300 }
3. Xian opens 3 packs           POST /api/packs/:id/open  (×3)
4. Xian merges matching cards    POST /api/cards/merge { cardId1, cardId2 }
5. Sister clicks referral link   GET /api/referral/:xianCityId
6. Sister signs up               POST /api/cities { name: "Sister", referralCode: xianCityId }
7. Sister deposits & plays       ...same flow
```

## Errors

All errors return `{ "error": "message" }` with appropriate HTTP status:
- `400` — bad input or validation failure
- `404` — city/pack/card not found

## Notes

- Yield is **mocked** at 5% APY (no real blockchain calls)
- Data persists in `milk-honey.db` (SQLite file, gitignored)
- Delete `milk-honey.db` to reset all data
