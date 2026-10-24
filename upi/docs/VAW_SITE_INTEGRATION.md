# VAW website integration

HR creates a payment link from a pricing request in the HR dashboard. The customer pays through VAW Pay. The gateway then calls the website's webhook, which marks the request **Paid** (with the bank UTR) in HR's view.

```
HR dashboard ──vaw-pay-create──▶ VAW Pay  POST /api/v1/payments  (X-Merchant-Key)
     ▲                                  │ checkoutUrl
     │                                  ▼
 payment_requests  ◀──vaw-pay-webhook── VAW Pay (signed webhook: SUCCESS / FAILED / EXPIRED / CANCELLED)
```

Links are created by HR only, deliberately. A public "pay now" button would let anyone open gateway sessions and block the single-slot queue for a VPA. The amount also comes from HR, not from the browser.

## Pieces

| Piece | Path |
|---|---|
| Table and RLS | `supabase/migrations/20261024120000_payment_requests.sql` |
| Create link (HR only) | `supabase/functions/vaw-pay-create` |
| Webhook receiver (public, HMAC-verified) | `supabase/functions/vaw-pay-webhook` |
| Shared helpers | `supabase/functions/_shared/vawpay.ts` |
| UI | `src/components/hr/PaymentLinkControl.tsx`, `src/hooks/usePaymentRequests.ts`, `src/components/hr/PricingRequests.tsx` |
| Contract test | `upi/apps/payment-api/src/__tests__/vaw-site-integration.test.js` |

## Set-up

1. Run the gateway somewhere public (see the VAW Pay README) and set the real receiving UPI ID in Merchant admin.
2. Apply the migration (Supabase SQL editor or `supabase db push`).
3. Set the function secrets:
   ```bash
   supabase secrets set VAW_PAY_API_URL=https://pay.vawtech.com \
                        VAW_PAY_MERCHANT_KEY=<gateway merchant key> \
                        VAW_PAY_WEBHOOK_SECRET=<gateway merchant webhook secret>
   ```
   In the gateway the merchant webhook secret also works as the merchant key, so the two values can be the same.
4. Deploy: `supabase functions deploy vaw-pay-create vaw-pay-webhook`. `supabase/config.toml` already turns off JWT verification for the webhook only.
5. In the gateway (Merchant admin → Developer & Infrastructure Hub → Webhooks & Secrets) set the merchant webhook URL to `https://ecexzlqjobqajfhxmiaa.supabase.co/functions/v1/vaw-pay-webhook` and the same secret as above.
6. `VAW_PAY_API_URL` must be the URL the **gateway** puts in `checkoutUrl`. Customers open that link, so it has to be public.

## Behaviour

- One unpaid link per request and amount is reused. A request that is already paid refuses new links.
- The webhook checks the HMAC signature on the raw body, then the order id and that the confirmed amount equals the amount requested. A mismatch returns 409 and is logged, and the request stays unpaid.
- **Paid is final.** A late FAILED or EXPIRED delivery can't undo it.
- Unknown events or orders get 200 so the gateway stops retrying. A failed database write returns 500 so the gateway retries (for up to an hour).
- If the migration has not been applied, the HR page hides the payment controls instead of erroring.

## What is and isn't tested

- Tested: the gateway's real webhook (signature, payload, metadata round trip, amount) against the same helper code the function uses.
- **Not tested:** the Deno edge functions themselves, running against a real Supabase project, and a real bank credit. Do a ₹1 payment end to end before relying on it, and reconcile with the bank statement.
