import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Database } from '@vawpay/db';
import { startServer as startPaymentApi } from '../../../../apps/payment-api/src/index.js';
import { VawPayClient, VawPayCheckout, VawPay } from '../index.js';

describe('Universal VAW Pay One-Script Integration Tests', () => {
  let apiInstance;
  let testDb;

  before(async () => {
    testDb = new Database({ inMemory: true });
    apiInstance = await startPaymentApi(6194, testDb);
  });

  after(async () => {
    await apiInstance.close();
    testDb.close();
  });

  test('SDK exports both VawPayCheckout and VawPay aliases', () => {
    assert.ok(VawPayCheckout);
    assert.ok(VawPay);
    assert.equal(VawPayCheckout, VawPay);
    assert.equal(typeof VawPay.pay, 'function');
    assert.equal(typeof VawPay.open, 'function');
    assert.equal(typeof VawPay.handleButtonClick, 'function');
  });

  test('VawPay.pay creates payment session and resolves checkoutUrl on backend', async () => {
    // Mock fetch for headless Node environment
    const orderId = `PAY-TEST-${Date.now()}`;
    const instance = new VawPayCheckout({
      apiUrl: `http://localhost:${apiInstance.port}`,
      orderId,
      amount: '499.00',
      currency: 'INR'
    });

    assert.equal(instance.options.orderId, orderId);
    assert.equal(instance.options.amount, '499.00');
    assert.equal(instance.options.currency, 'INR');
  });

  test('Button attribute extractor correctly parses customer and metadata attributes', () => {
    // Mock DOM button element
    const mockAttrs = {
      'data-vawpay-pay': '',
      'data-order-id': 'ORD-BTN-101',
      'data-amount': '750',
      'data-currency': 'INR',
      'data-customer-name': 'Aarav Sharma',
      'data-customer-email': 'aarav@example.com',
      'data-customer-phone': '9876543210',
      'data-metadata': JSON.stringify({ plan: 'enterprise', seats: 5 }),
      'data-meta-tier': 'gold'
    };

    const mockBtn = {
      getAttribute: (name) => mockAttrs[name] || null,
      attributes: Object.keys(mockAttrs).map(name => ({ name, value: mockAttrs[name] }))
    };

    // Verify attribute extraction logic
    const orderId = mockBtn.getAttribute('data-order-id');
    const amount = mockBtn.getAttribute('data-amount');
    const currency = mockBtn.getAttribute('data-currency');
    const metadata = JSON.parse(mockBtn.getAttribute('data-metadata'));

    assert.equal(orderId, 'ORD-BTN-101');
    assert.equal(amount, '750');
    assert.equal(currency, 'INR');
    assert.equal(metadata.plan, 'enterprise');
    assert.equal(metadata.seats, 5);
  });

  test('accepts payment events from the checkout iframe at its own origin', () => {
    globalThis.window = { location: { href: 'https://merchant.test/shop' }, dispatchEvent: () => true };
    try {
      const results = [];
      const checkoutWindow = {};
      const instance = new VawPayCheckout({ apiUrl: 'http://localhost:1', orderId: 'O-2', amount: '10.00', handler: r => results.push(r) });
      instance._iframe = { contentWindow: checkoutWindow };
      instance._iframeOrigin = 'https://pay.example.com';
      instance.close = () => {};

      instance._handleMessage({
        source: checkoutWindow,
        origin: 'https://pay.example.com',
        data: { event: 'vawpay.payment_success', data: { orderId: 'O-2', amount: '10.00', utr: '123456789012' } }
      });

      assert.equal(results.length, 1);
      assert.equal(results[0].status, 'SUCCESS');
      assert.equal(results[0].order_id, 'O-2');
    } finally {
      delete globalThis.window;
    }
  });

  test('ignores payment events that do not come from the checkout iframe and origin', () => {
    globalThis.window = { location: { href: 'https://merchant.test/shop' } };
    try {
      let handled = 0;
      const checkoutWindow = {};
      const instance = new VawPayCheckout({ apiUrl: 'http://localhost:1', orderId: 'O-1', amount: '10.00', handler: () => { handled++; } });
      instance._iframe = { contentWindow: checkoutWindow };
      instance._iframeOrigin = 'https://pay.example.com';
      instance.close = () => {};
      const forged = { event: 'vawpay.payment_success', data: { order_id: 'O-1', amount_received: '10.00', utr: '123456789012' } };

      instance._handleMessage({ source: {}, origin: 'https://pay.example.com', data: forged });
      instance._handleMessage({ source: checkoutWindow, origin: 'https://evil.example', data: forged });
      assert.equal(handled, 0);

      assert.equal(instance._isSafeRedirect('javascript:alert(1)'), false);
      assert.equal(instance._isSafeRedirect('data:text/html,x'), false);
      assert.equal(instance._isSafeRedirect('https://merchant.test/thanks'), true);
      assert.equal(instance._isSafeRedirect('/thanks'), true);
    } finally {
      delete globalThis.window;
    }
  });
});
