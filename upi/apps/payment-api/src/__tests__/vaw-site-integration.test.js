// Contract test for the VAW website integration (supabase/functions/vaw-pay-*).
// The edge functions run on Deno, so this test drives the REAL gateway and feeds its webhook
// through the same pure helpers the `vaw-pay-webhook` function uses (supabase/functions/_shared/vawpay.ts):
// signature check, event mapping, amount check and the "paid is final" rule.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { Database, MerchantRepository } from '@vawpay/db';
import { startServer } from '../index.js';
import { ObserverSource } from '@vawpay/common';
import { TEST_OBSERVER_TOKEN, authHeaders } from '../../../../scripts/test-support.js';
import {
  buildOrderId, canTransition, paiseToRupeesString, rupeesToPaise, statusForEvent, verifyGatewaySignature
} from '../../../../../supabase/functions/_shared/vawpay.ts';

const SECRET = 'vaw-site-webhook-secret-0123456789abcdef';

describe('VAW site integration: payment link -> gateway -> signed webhook', () => {
  let api, base, db, receiver, received;

  before(async () => {
    db = new Database({ inMemory: true });
    api = await startServer(6298, db);
    base = `http://127.0.0.1:${api.port}`;
    received = [];
    receiver = http.createServer((req, res) => {
      let raw = '';
      req.on('data', (c) => { raw += c; });
      req.on('end', () => { received.push({ raw, headers: req.headers }); res.writeHead(200).end('{"ok":true}'); });
    });
    await new Promise((r) => receiver.listen(0, '127.0.0.1', r));
    const repo = new MerchantRepository(db);
    const merchant = repo.findAll()[0];
    repo.update(merchant.id, { webhookUrl: `http://127.0.0.1:${receiver.address().port}/hook`, webhookSecret: SECRET });
  });

  after(async () => {
    await api.close();
    await new Promise((r) => receiver.close(r));
    db.close();
  });

  test('helpers: amounts, order ids, event mapping, finality', () => {
    assert.equal(rupeesToPaise('1499'), 149900);
    assert.equal(rupeesToPaise(1499.5), 149950);
    assert.equal(rupeesToPaise(0), null);
    assert.equal(rupeesToPaise('abc'), null);
    assert.equal(rupeesToPaise(-5), null);
    assert.equal(paiseToRupeesString(149900), '1499.00');
    const id = '0f8fad5b-d9cb-469f-a165-70867728950e';
    assert.match(buildOrderId(id, 1), /^VAW-0F8FAD5B-1$/);
    assert.notEqual(buildOrderId(id, 1), buildOrderId(id, 2));
    assert.equal(statusForEvent('SUCCESS'), 'paid');
    assert.equal(statusForEvent('EXPIRED'), 'expired');
    assert.equal(statusForEvent('SOMETHING_ELSE'), null);
    assert.equal(canTransition('pending', 'paid'), true);
    assert.equal(canTransition('paid', 'expired'), false);
  });

  test('a payment link is paid: gateway delivers a webhook that verifies and matches', async () => {
    const inquiryId = '0f8fad5b-d9cb-469f-a165-70867728950e';
    const orderId = buildOrderId(inquiryId);
    const amountPaise = rupeesToPaise(1499);

    // vaw-pay-create does exactly this call.
    const created = await fetch(`${base}/api/v1/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Merchant-Key': SECRET, ...authHeaders() },
      body: JSON.stringify({
        orderId, amount: paiseToRupeesString(amountPaise), currency: 'INR', autoActivate: true,
        metadata: { source: 'vaw-site', inquiryId }
      })
    });
    assert.equal(created.status, 201);
    const payment = await created.json();
    assert.ok(payment.paymentId && payment.checkoutUrl.includes(payment.paymentId));

    // Customer taps "I have paid", then the bank alert arrives.
    const done = await fetch(`${base}/api/v1/checkout/${payment.paymentId}/payment-done`, { method: 'POST' });
    assert.equal(done.status, 200);
    const accountId = db.queryOne('SELECT id FROM payment_receiving_accounts LIMIT 1').id;
    const obs = await fetch(`${base}/api/v1/pollers/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        source: ObserverSource.GOOGLE_MESSAGES, receivingAccountId: accountId, amount: '1499.00',
        utr: 'UTR-VAW-0001', rawText: 'A/C credited by Rs 1499.00 via UPI/UTR-VAW-0001', observedAt: new Date().toISOString()
      })
    });
    assert.equal(obs.status, 200);

    // Wait for the delivery.
    for (let i = 0; i < 50 && received.length === 0; i++) await new Promise((r) => setTimeout(r, 100));
    assert.ok(received.length >= 1, 'webhook was delivered');
    const hook = received[0];
    const body = JSON.parse(hook.raw);

    assert.equal(await verifyGatewaySignature(SECRET, hook.raw, hook.headers['x-gateway-signature']), true);
    assert.equal(await verifyGatewaySignature('wrong-secret', hook.raw, hook.headers['x-gateway-signature']), false);
    assert.equal(await verifyGatewaySignature(SECRET, hook.raw + ' ', hook.headers['x-gateway-signature']), false, 'tampered body rejected');
    assert.equal(await verifyGatewaySignature(SECRET, hook.raw, null), false);

    assert.equal(statusForEvent(body.event), 'paid');
    assert.equal(body.orderId, orderId);
    assert.equal(body.paymentId, payment.paymentId);
    assert.equal(body.amountPaise, amountPaise);
    assert.equal(body.utr, 'UTR-VAW-0001');
    assert.equal(body.metadata.inquiryId, inquiryId, 'metadata round-trips so the site can match the request');
  });
});
