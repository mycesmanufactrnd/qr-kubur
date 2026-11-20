# Billplz payment flow (active gateway)

Since 2026-10-21 every payment page (`DonationPage`, `TahlilRequestPage`, `DeathCharityUserPayment`,
`OrganisationDetails`, `QuickLink/QuickDonation`, `QuickLink/QuickTahlil`) calls
`trpc.billplz.createBill`. Billplz is the only payment gateway.

One platform-wide Billplz collection (`BILLPLZ_COLLECTION_ID`). Per-recipient bank accounts in
payment config are for manual payout (`billplz.saveTransactionAccount`), not separate gateway
accounts. `db/seeder/gateway/billplzSeeder.ts`
(per-entity API keys) is never called.

## Flow

1. `billplz.createBill` (input incl. `returnTo`) →
   `POST /v3/bills` with `reference_1` = our order no (`DON-…` etc.),
   `redirect_url` = `BILLPLZ_REDIRECT_URL/<returnTo>`.
2. Billplz → `POST /api/payment/billplz/callback` (form-encoded, must be publicly reachable).
3. Payer's browser → `GET /api/payment/billplz/redirect/:returnTo?billplz[id]=…` → backend
   verifies, then 302s to `BILLPLZ_RETURN_URL_*` with `?status_id=1|3&order_id=&billcode=` — the
   query shape the pages parse (`status_id` decoded via `paymentStatus` in `src/utils/enums.ts`).
4. Both 2 and 3 fetch the bill (`GET /v3/bills/:id`, the only way to get `reference_1` back) and
   upsert `OnlineTransaction` by `billcode` (= Billplz bill id). Native polling
   (`src/utils/payment.ts`) uses `billplz.getTransactionStatusByOrderNo`, a DB lookup by order no.

## Pitfalls

- **X-Signature**: every callback/redirect is HMAC-SHA256 verified (`isValidXSignature`). Redirect
  keys are signed as `billplzid`, `billplzpaid`… (brackets dropped). Sort is plain lowercase
  code-unit order — not `localeCompare`. Verified against the docs example.
- `BILLPLZ_BASE_URL` must end in `/api/v3` (code appends `/bills`).
- Billplz amount is in cents; `OnlineTransaction.orderamount` stores RM.
- Billplz only calls back on payment; a failed attempt is recorded via the redirect instead. A late
  unpaid record never downgrades a `success` row.
- Bill creation fails (422) if `callback_url` is not a valid URL, so in dev `BACKEND_NGROK_URL` must
  be set.
- Prod `.env` is written from the `PROD_ENV_FILE` GitHub secret — Billplz vars must be added there.

Parent: [[index|payments/]].
