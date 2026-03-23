CREATE TABLE IF NOT EXISTS "withdrawals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "wallet_address" text NOT NULL REFERENCES "users"("wallet_address"),
  "amount_usdc" bigint NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "cooldown_seconds" integer NOT NULL DEFAULT 0,
  "initiated_tx" text NOT NULL,
  "completed_tx" text,
  "initiated_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS "withdrawals_one_pending_per_user"
  ON "withdrawals" ("wallet_address")
  WHERE status = 'pending';
