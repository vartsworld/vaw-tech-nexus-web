import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startCheckoutServer } from '../index.js';
import { startCoinWalletStore } from '../../../coin-wallet-store/src/index.js';
import { CheckoutServer, escapeHtml, escapeJsString, serializeForScript, renderTemplate } from '../server.js';
import { renderTemplate as renderStoreTemplate } from '../../../coin-wallet-store/src/server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Payloads that must never escape their interpolation context.
const HOSTILE_VALUES = [
  '<script>alert(1)</script>',
  '"><img src=x onerror=alert(1)>',
  "'><svg/onload=alert(1)>",
  '</script><script>alert(1)</script>',
  '"-alert(1)-"',
  "'-alert(1)-'",
  'javascript:alert(1)',
  'JaVaScRiPt:alert(1)',
  '&lt;already escaped&gt;',
  "'); alert(1); //",
  '"); alert(1); //',
  '$& $` $\' $$'
];

// The subset that can break out of its context at all. A payload with no
// markup-significant character (e.g. `javascript:alert(1)`) is inert as text,
// so it is expected to survive verbatim.
const BREAKOUT_VALUES = HOSTILE_VALUES.filter(v => /[<>"'\\]/.test(v));

// Strips <script> bodies so assertions target real markup rather than the
// inert data that legitimately lives inside script blocks.
function markupOnly(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<script></script>');
}

describe('Checkout Portal XSS / Redirect Hardening', () => {
  let serverInstance;
  let baseUrl;
  let storeInstance;
  let storeBaseUrl;

  before(async () => {
    serverInstance = await startCheckoutServer(7198);
    baseUrl = `http://localhost:${serverInstance.port}`;

    storeInstance = await startCoinWalletStore(5097, {
      gatewayApiUrl: 'http://localhost:6193',
      merchantId: '00000000-0000-0000-0000-000000000001',
      webhookSecret: 'xss_probe_secret'
    });
    storeBaseUrl = `http://localhost:${storeInstance.port}`;
  });

  after(async () => {
    await serverInstance.close();
    await storeInstance.close();
  });

  function fetchFrom(base, pathname) {
    return new Promise((resolve, reject) => {
      http.get(`${base}${pathname}`, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text: data }));
      }).on('error', reject);
    });
  }

  function get(pathname) {
    return fetchFrom(baseUrl, pathname);
  }

  function getStore(pathname) {
    return fetchFrom(storeBaseUrl, pathname);
  }

  describe('escapeHtml', () => {
    test('escapes every character that can break out of HTML text or an attribute', () => {
      assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
      assert.equal(escapeHtml('a"b\'c&d'), 'a&quot;b&#39;c&amp;d');
    });

    test('renders null and undefined as empty strings', () => {
      assert.equal(escapeHtml(null), '');
      assert.equal(escapeHtml(undefined), '');
    });
  });

  describe('escapeJsString', () => {
    test('escapes quotes so a value cannot terminate a JS string literal', () => {
      assert.equal(escapeJsString('"'), '\\"');
      assert.equal(escapeJsString("'"), "\\'");
      assert.equal(escapeJsString('\\'), '\\\\');
    });

    test('escapes angle brackets so a value cannot open a new tag', () => {
      assert.equal(escapeJsString('</script>'), '\\u003c/script\\u003e');
      assert.equal(escapeJsString('<script>'), '\\u003cscript\\u003e');
    });

    test('escapes line separators that are invalid in older JS parsers', () => {
      assert.equal(escapeJsString('a\u2028b'), 'a\\u2028b');
      assert.equal(escapeJsString('a\u2029b'), 'a\\u2029b');
    });
  });

  describe('serializeForScript', () => {
    test('escapes < so a JSON script block cannot be terminated early', () => {
      const out = serializeForScript({ evil: '</script><script>alert(1)</script>' });
      assert.equal(out.includes('</script>'), false);
      assert.equal(JSON.parse(out).evil, '</script><script>alert(1)</script>');
    });
  });

  describe('renderTemplate replacement patterns', () => {
    test('inserts $& literally instead of expanding it as a replacement pattern', () => {
      // Escaped, but crucially not expanded: `$&` would have re-inserted "{{X}}".
      const out = renderTemplate('<p>{{X}}</p>', { X: '$& $` $\' $$' });
      assert.equal(out, '<p>$&amp; $` $&#39; $$</p>');
      assert.equal(out.includes('{{X}}'), false);
    });

    test('leaves unknown placeholders untouched', () => {
      assert.equal(renderTemplate('<p>{{X}} {{Y}}</p>', { X: 'ok' }), '<p>ok {{Y}}</p>');
    });

    test('uses HTML escaping for markup placeholders and JS escaping for script ones', () => {
      const out = renderTemplate('{{ORDER_ID}}|{{PAYMENT_ID}}', { ORDER_ID: '<b>', PAYMENT_ID: '<b>' });
      assert.equal(out, '&lt;b&gt;|\\u003cb\\u003e');
    });
  });

  describe('GET /checkout/:id with a hostile payment id', () => {
    test('does not let the path segment break out of the PAYMENT_ID literal', async () => {
      const hostile = encodeURIComponent('x";alert(1);//');
      const res = await get(`/checkout/${hostile}`);

      assert.equal(res.status, 200);
      // The quote can never close the literal, so the injected code is not code.
      assert.equal(res.text.includes('";alert(1);//"'), false);
      assert.ok(res.text.includes('const PAYMENT_ID = "'));
    });

    test('does not let the path segment inject a script tag', async () => {
      const hostile = encodeURIComponent('</script><script>alert(1)</script>');
      const res = await get(`/checkout/${hostile}`);

      assert.equal(res.status, 200);
      assert.equal(res.text.includes('</script><script>alert(1)'), false);
    });

    test('sends a frame-ancestors Content-Security-Policy on the checkout page', async () => {
      const res = await get('/checkout/pay_xss_probe');
      const csp = res.headers['content-security-policy'];
      assert.ok(csp, 'expected a Content-Security-Policy header');
      assert.ok(csp.includes('frame-ancestors'));
    });
  });

  describe('CheckoutServer.renderHtml with hostile payment state', () => {
    const server = new CheckoutServer({ apiBaseUrl: 'http://localhost:6100' });

    test('neutralises hostile merchant branding in HTML text contexts', () => {
      for (const payload of BREAKOUT_VALUES) {
        const html = server.renderHtml('pay_1', {
          merchantName: payload,
          orderId: payload,
          amount: '499.00',
          branding: { appName: payload, sidebarNotice: payload, counterInstructions: payload }
        });

        // The raw payload must not survive anywhere in real markup: escaping
        // turns every <, >, " and ' into an entity.
        assert.equal(markupOnly(html).includes(payload), false, `payload leaked: ${payload}`);
      }
    });

    test('neutralises hostile amounts embedded inside script string literals', () => {
      // Only tag-forming payloads are checked verbatim here: a quote-only value
      // is escaped to \', which still contains the original quote characters.
      const tagForming = BREAKOUT_VALUES.filter(v => /[<>]/.test(v));

      for (const payload of tagForming) {
        const html = server.renderHtml('pay_1', { orderId: 'ORDER-1', amount: payload });

        assert.equal(html.includes('</script><script>'), false, `payload leaked: ${payload}`);
        // escapeJsString rewrites < and >, so no raw tag can appear anywhere.
        assert.equal(html.includes(payload), false, `payload leaked verbatim: ${payload}`);
      }
    });

    test('keeps replacement-pattern metacharacters out of the replacement logic', () => {
      const html = server.renderHtml('pay_1', {
        merchantName: '$& $` $\' $$',
        orderId: '$& $` $\' $$'
      });

      // $& would otherwise expand to the matched placeholder token itself.
      assert.equal(html.includes('$&'), true);
      assert.equal(html.includes('{{ORDER_ID}}'), false);
      assert.equal(html.includes('{{MERCHANT_NAME}}'), false);
    });

    test('still renders ordinary values unchanged', () => {
      const html = server.renderHtml('pay_plain', {
        merchantName: 'Acme & Co',
        orderId: 'ORDER-1001',
        amount: '499.00'
      });

      assert.ok(html.includes('const PAYMENT_ID = "pay_plain";'));
      assert.ok(html.includes('Acme &amp; Co'));
      assert.ok(html.includes('ORDER-1001'));
    });
  });

  describe('checkout.html redirect sanitisation', () => {
    const view = fs.readFileSync(path.join(__dirname, '..', 'views', 'checkout.html'), 'utf8');

    test('sanitizeRedirectUrl only accepts http and https', () => {
      assert.ok(view.includes('function sanitizeRedirectUrl(candidate)'));
      assert.ok(view.includes("parsed.protocol !== 'http:' && parsed.protocol !== 'https:'"));
    });

    test('every store-return URL is passed through the sanitiser', () => {
      assert.ok(view.includes('sanitizeRedirectUrl(state.cancelUrl)'));
      assert.ok(view.includes('sanitizeRedirectUrl(cancelParam)'));
      assert.ok(view.includes('sanitizeRedirectUrl(qUrl)'));
    });

    test('the case-sensitive javascript: prefix check is gone', () => {
      assert.equal(view.includes("startsWith('javascript:')"), false);
      assert.ok(view.includes('sanitizeRedirectUrl(storeUrl)'));
    });

    test('no postMessage is broadcast to a wildcard origin', () => {
      assert.equal(/postMessage\([^)]*['"]\*['"]\)/.test(view), false);
      assert.ok(view.includes('function postToMerchant(message)'));
      // Payment data must never be broadcast: when the merchant origin cannot be
      // resolved the message is dropped instead of posted to '*'.
      assert.ok(view.includes('if (!target) return;'));
      assert.ok(view.includes('window.parent.postMessage(message, target);'));
    });

    test('the SDK declares its own origin for referrer-less embeds', () => {
      const sdk = fs.readFileSync(
        path.join(__dirname, '../../../../packages/merchant-sdk/src/vawpay.js'),
        'utf8'
      );
      assert.ok(sdk.includes('vawpayParentOrigin='));
    });

    test('the parent message listener validates the sender origin', () => {
      assert.ok(view.includes("e.data.event !== 'vawpay.request_cancel'"));
      assert.ok(view.includes('if (merchantOrigin && e.origin !== merchantOrigin) return;'));
    });
  });

  describe('merchant-sdk message listener origin checks', () => {
    for (const file of ['vawpay.js', 'vawpay-checkout.js']) {
      test(`${file} ignores messages from an unexpected origin`, () => {
        const src = fs.readFileSync(
          path.join(__dirname, '../../../../packages/merchant-sdk/src', file),
          'utf8'
        );
        assert.ok(src.includes('_checkoutOrigin()'));
        assert.ok(src.includes('if (expectedOrigin && e.origin !== expectedOrigin) return;'));
      });
    }
  });

  describe('coin-wallet-store outcome pages', () => {
    test('query parameters are HTML escaped on /order-success', async () => {
      const payload = encodeURIComponent('<script>alert(1)</script>');
      const res = await getStore(`/order-success?order_id=${payload}&utr=${payload}&mode=${payload}`);

      assert.equal(res.status, 200);
      assert.equal(res.text.includes('<script>alert(1)</script>'), false);
      assert.ok(res.text.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    });

    test('query parameters are HTML escaped on /order-failed', async () => {
      const payload = encodeURIComponent('"><img src=x onerror=alert(1)>');
      const res = await getStore(`/order-failed?order_id=${payload}&reason=${payload}`);

      assert.equal(res.status, 200);
      assert.equal(res.text.includes('onerror=alert(1)>'), false);
      assert.ok(res.text.includes('&lt;img src=x onerror=alert(1)&gt;'));
    });

    test('query parameters are HTML escaped on the remaining outcome pages', async () => {
      const payload = encodeURIComponent("'><svg/onload=alert(1)>");
      for (const route of ['/order-suspicious', '/order-expired', '/order-cancelled']) {
        const res = await getStore(`${route}?order_id=${payload}`);
        assert.equal(res.status, 200);
        assert.equal(res.text.includes('<svg/onload=alert(1)>'), false, `leaked on ${route}`);
      }
    });

    test('store renderTemplate inserts replacement patterns literally', () => {
      // Escaped, but `$&` must not be expanded back into the placeholder token.
      const out = renderStoreTemplate('<p>{{X}}</p>', { X: '$& $` $\' $$' });
      assert.equal(out, '<p>$&amp; $` $&#39; $$</p>');
      assert.equal(out.includes('{{X}}'), false);
    });
  });

  describe('merchant-admin escaping helpers', () => {
    const view = fs.readFileSync(
      path.join(__dirname, '../../../merchant-admin/src/views/admin.html'),
      'utf8'
    );

    // Evaluate the real helper implementations lifted out of admin.html.
    const helpers = new Function(`
      ${view.match(/function escapeHtml\(str\) \{[\s\S]*?\n    \}/)[0]}
      ${view.match(/function escapeHtmlValue\(str\) \{[\s\S]*?\n    \}/)[0]}
      ${view.match(/function escapeAttribute\(str\) \{[\s\S]*?\n    \}/)[0]}
      ${view.match(/function jsArg\(value\) \{[\s\S]*?\n    \}/)[0]}
      return { escapeHtml, escapeHtmlValue, escapeAttribute, jsArg };
    `)();

    test('jsArg produces a single JS string literal for a quote-breakout payload', () => {
      const attr = helpers.jsArg('x"); alert(1); //');
      // Browser decodes entities before running the handler, so decode and check
      // that what lands in JS is exactly one string literal.
      const decoded = attr
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&');
      assert.equal(decoded, '"x\\"); alert(1); //"');
      assert.doesNotThrow(() => new Function(`return (${decoded});`));
    });

    test('jsArg neutralises a quote-and-comment breakout', () => {
      const attr = helpers.jsArg("'); alert(1); //");
      const decoded = attr
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&');
      assert.doesNotThrow(() => new Function(`return (${decoded});`));
      assert.equal(new Function(`return (${decoded});`)(), "'); alert(1); //");
    });

    test('jsArg leaves an ordinary value readable', () => {
      // Entities are decoded by the HTML parser before the handler runs, so this
      // reaches JS as exactly the string literal "pay_abc123".
      assert.equal(helpers.jsArg('pay_abc123'), '&quot;pay_abc123&quot;');
    });

    test('the previously unescaped sinks are all escaped', () => {
      // Both escapeHtml and escapeHtmlValue escape for HTML text content; either is acceptable.
      const has = (a, b) => view.includes(a) || (b !== undefined && view.includes(b));
      assert.ok(has('Order #${escapeHtml(q.orderId)}', 'Order #${escapeHtmlValue(q.orderId)}'));
      assert.ok(has('<td>${escapeHtml(p.method)}</td>', '<td>${escapeHtmlValue(p.method)}</td>'));
      assert.ok(has('${escapeHtml(customerText)}', '${escapeHtmlValue(customerText)}'));
      assert.ok(view.includes('onclick="confirmCounterPayment(${jsArg(p.id)}, ${jsArg(p.method)})"'));
      assert.ok(view.includes('onclick="viewBanDetails(${jsArg(u.id)})"'));
      assert.ok(view.includes('onclick="viewBanDetails(${jsArg(e.customerId)})"'));
      assert.ok(view.includes('onclick="deleteVpa(${jsArg(a.id)}, ${jsArg(a.upiId)})"'));
    });

    test('no unescaped interpolation is left in an inline event handler', () => {
      const handlers = view.match(/onclick="[^"]*\$\{[^"]*"/g) || [];
      assert.ok(handlers.length > 0, 'expected to find inline handlers to check');
      for (const handler of handlers) {
        // jsArg builds a single string literal that survives HTML entity decoding.
        // escapeHtml inside a handler argument is NOT safe: the browser decodes
        // entities before the handler runs, so a quote still breaks out.
        assert.ok(
          /\$\{jsArg\(/.test(handler),
          `handler argument is not built with jsArg: ${handler}`
        );
      }
    });

    test('every previously reported escapeHtml-in-handler sink now uses jsArg', () => {
      assert.ok(view.includes('promptUnbanCustomer(${jsArg(u.id)}, ${jsArg(u.name || \'\')}, ${jsArg(u.phone || u.mobileNumber || \'\')})'));
      assert.ok(view.includes("copyText(${jsArg(r.hostname || '')}, 'Hostname copied to clipboard!')"));
      assert.ok(view.includes("copyText(${jsArg(r.serviceUrl)}, 'Service URL copied to clipboard!')"));
      assert.equal(view.includes("onclick=\"promptUnbanCustomer('${u.id}'"), false);
      assert.equal(view.includes("copyText('${escapeHtml("), false);
    });

    test('the Gmail OAuth popup listener checks source and origin', () => {
      assert.ok(view.includes('if (event.source !== googleAuthPopup) return;'));
      assert.ok(view.includes('if (event.origin !== window.location.origin) return;'));
    });
  });
});
