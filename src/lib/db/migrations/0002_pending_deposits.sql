CREATE TABLE IF NOT EXISTS "pending_deposits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "wallet_address" text NOT NULL,
  "tx_signature" text NOT NULL UNIQUE,
  "amount_usdc" bigint NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
