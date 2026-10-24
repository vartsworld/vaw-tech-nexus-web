# VAW Pay

Self-hosted UPI payment gateway for VAW Technologies. Customers pay with any UPI app, straight to our business account, with no gateway fee. VAW Pay confirms each payment by reading the bank's credit alert (Android SMS observer or Gmail observer).

It is a fork of the open-source YouPI-PG project, rebranded and adapted for VAW Technologies. See [NOTICE.md](NOTICE.md).

> **Read this before taking real money.** VAW Pay is not a certified payment aggregator and is not NPCI-approved. A payment is confirmed by parsing a bank alert, which is not as strong as a bank API.
> - Keep volume low. The upstream guideline is at most **20 transactions per day per receiving account**.
> - **Reconcile against the bank statement.** Treat the gateway status as a convenience, not as proof of settlement.
> - The queue is single-slot per UPI ID, so only one payer can be mid-checkout per VPA at a time.
> - Check your bank's terms for collecting business payments on a UPI ID, and take legal/compliance advice before serving third parties.
> - The prebuilt Android observer APK (`apps/android-observer-app/youpi-sms-gateway.apk`) comes from upstream, is unaudited and was not rebuilt here. Its package name and app label still say "YouPI".

## Services

| Service | Port | Purpose |
|---|---|---|
| Payment API | 6100 | REST API (`openapi.yaml`), webhooks |
| Checkout portal | 7000 | Customer payment page, `/checkout/:id` |
| Merchant admin | 6001 | Branding, UPI IDs, ledger, observers, security |
| Control centre | 8090 | Start/stop/restart services |
| SMS observer / Gmail observer | 6002 / 6003 | Payment detection |
| Demo store | 5000 | Optional demo, can be stopped |

## Run locally

Requires Node 24 or newer (it uses the built-in `node:sqlite`).

```bash
cd upi
npm install
npm run setup     # creates .env and data/, generates secrets in data/.secrets/
npm run dev       # localhost mode, all services
```

Open <http://localhost:6001>. The admin token is in `data/.secrets/admin_api_token`.

**Before the first real payment**, in Merchant admin go to *Store Settings → Receiving Accounts* and replace the placeholder `merchant@upi` with the business UPI ID. In production mode the API refuses to create payments (`503 RECEIVING_ACCOUNT_NOT_CONFIGURED`) while the placeholder is still active.

Tests: `npm test` stops at the first failure. To run every suite, loop `VAWPAY_MODE=localhost NODE_ENV=test node --test <file>` over the `*.test.js` files. `whatsapp-berry-auth.test.js` needs the native `better-sqlite3` build, which can fail on restricted machines.

## Create a payment

```bash
curl -X POST http://localhost:6100/api/v1/payments \
  -H 'content-type: application/json' \
  -d '{"orderId":"INV-1001","amount":"1499.00"}'
# -> { paymentId, checkoutUrl, status, ... }
```

Send the customer to `checkoutUrl`. For a non-default merchant, send `X-Merchant-Key` (or a signed order token). See `docs/MERCHANT_INTEGRATION.md` and `openapi.yaml`.

### Webhooks

The gateway POSTs to the merchant webhook URL with these headers:

- `X-Gateway-Signature: sha256=<hex>`: HMAC-SHA256 of the raw body with the webhook secret.
- `X-Gateway-Signature-V2`: HMAC over `timestamp.rawBody`.
- `X-Gateway-Timestamp` and `X-Gateway-Delivery-Id`.

The payload has `event`, `orderId`, `amount`, `amountPaise`, `utr`, `paymentId`, `deliveryId` and `timestamp`. Failed deliveries are retried for up to an hour. Always verify the signature and treat deliveries as at-least-once (dedupe on `deliveryId`).

## Deploy

It must run as a long-lived Node process (VPS, container, or a home server), not on a static or serverless host.

- `docker compose up -d` (see `docker-compose.yml`). Data lives in the `vawpay-data` volume, so back it up.
- Production mode (`npm start`) expects a Cloudflare Tunnel domain (`CLOUDFLARE_DOMAIN`). To sit behind your own Nginx or Caddy instead, set `VAWPAY_MODE=localhost` and `VAWPAY_ALLOW_LOCALHOST_MODE=true` explicitly, and proxy only 6100 and 7000 publicly. Keep 6001 and 8090 private (VPN or SSH tunnel).
- Details: `docs/DEPLOYMENT.md`, `docs/CONFIGURATION.md`, `docs/OPERATIONS_TROUBLESHOOTING.md`.

## VAW website integration

The VAW site's pricing requests can generate a payment link here and mark the request paid from the webhook. See [docs/VAW_SITE_INTEGRATION.md](docs/VAW_SITE_INTEGRATION.md).

## Layout

`apps/` services, `packages/` shared libraries (`common`, `db`, `core`, `merchant-sdk`, `observer-sdk`, `vawpay-mcp`), `docs/` guides, `scripts/` setup/dev/start/test tooling. The original upstream README is kept at `docs/UPSTREAM_README.md` for reference. Its links and demo screenshots are upstream's.
