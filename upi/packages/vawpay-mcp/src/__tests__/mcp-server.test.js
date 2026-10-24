import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { VawPayMcpServer } from '../index.js';
import { verifyWebhookSignature, generateBankSmsText } from '../tools.js';

describe('VAW Pay MCP Server', () => {
  test('initializes with protocolVersion and serverInfo', async () => {
    const server = new VawPayMcpServer();
    const res = await server.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize'
    });

    assert.equal(res.id, 1);
    assert.equal(res.result.serverInfo.name, 'vawpay-mcp-server');
    assert.ok(res.result.capabilities.tools);
  });

  test('lists registered MCP tools', async () => {
    const server = new VawPayMcpServer();
    const res = await server.handleRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    });

    assert.equal(res.id, 2);
    const toolNames = res.result.tools.map((t) => t.name);
    assert.ok(toolNames.includes('vawpay_check_gateway_health'));
    assert.ok(toolNames.includes('vawpay_verify_webhook'));
    assert.ok(toolNames.includes('vawpay_simulate_bank_notification'));
  });

  test('verifies valid HMAC webhook signature', async () => {
    const secret = 'test-secret-12345';
    const payload = JSON.stringify({ event: 'SUCCESS', amount: '499.00', utr: '123456789012' });
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const result = verifyWebhookSignature({
      rawPayload: payload,
      signature: `sha256=${hmac}`,
      secret
    });

    assert.equal(result.valid, true);
    assert.equal(result.error, null);
  });

  test('rejects tampered or invalid webhook signature', async () => {
    const secret = 'test-secret-12345';
    const payload = JSON.stringify({ event: 'SUCCESS', amount: '499.00', utr: '123456789012' });

    const result = verifyWebhookSignature({
      rawPayload: payload,
      signature: 'sha256=0000000000000000000000000000000000000000000000000000000000000000',
      secret
    });

    assert.equal(result.valid, false);
    assert.equal(result.error, 'INVALID_SIGNATURE');
  });

  test('rejects malformed or non-hex webhook signature', async () => {
    const result = verifyWebhookSignature({
      rawPayload: '{"test":1}',
      signature: 'sha256=not-a-valid-hex-signature!',
      secret: 'test-secret'
    });

    assert.equal(result.valid, false);
    assert.equal(result.error, 'INVALID_SIGNATURE_FORMAT');
  });

  test('rejects signature with mismatched length safely', async () => {
    const result = verifyWebhookSignature({
      rawPayload: '{"test":1}',
      signature: 'sha256=aabbcc', // 3 bytes vs 32 bytes
      secret: 'test-secret'
    });

    assert.equal(result.valid, false);
    assert.equal(result.error, 'SIGNATURE_LENGTH_MISMATCH');
  });

  test('rejects webhook timestamp beyond maxAgeSeconds', async () => {
    const secret = 'test-secret-12345';
    const payload = JSON.stringify({ event: 'SUCCESS' });
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const staleTimestamp = Date.now() - 600 * 1000; // 10 minutes ago

    const result = verifyWebhookSignature({
      rawPayload: payload,
      signature: hmac,
      secret,
      timestamp: String(staleTimestamp),
      maxAgeSeconds: 300
    });

    assert.equal(result.valid, false);
    assert.equal(result.error, 'WEBHOOK_TIMESTAMP_EXPIRED');
  });

  test('generates realistic bank SMS text and simulated webhook payload', async () => {
    const server = new VawPayMcpServer();
    const res = await server.handleRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'vawpay_simulate_bank_notification',
        arguments: {
          bank: 'HDFC',
          amount: 499.00,
          utr: '987654321012',
          accountLastDigits: '4321'
        }
      }
    });

    assert.equal(res.id, 3);
    const parsed = JSON.parse(res.result.content[0].text);
    assert.equal(parsed.bank, 'HDFC');
    assert.ok(parsed.generatedSms.includes('INR 499.00'));
    assert.ok(parsed.generatedSms.includes('987654321012'));
    assert.equal(parsed.simulatedWebhookPayload.sender, 'VK-HDFCBK');
  });

  test('executes vawpay_check_gateway_health tool and returns services status matrix', async () => {
    const server = new VawPayMcpServer();
    const res = await server.handleRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'vawpay_check_gateway_health',
        arguments: { host: '127.0.0.1' }
      }
    });

    assert.equal(res.id, 4);
    assert.ok(res.result.content[0].text);
    const parsed = JSON.parse(res.result.content[0].text);
    assert.equal(parsed.host, '127.0.0.1');
    assert.ok(Array.isArray(parsed.services));
    assert.equal(parsed.services.length, 6);
    assert.ok(parsed.services.every((s) => typeof s.port === 'number' && typeof s.online === 'boolean'));
  });

  test('returns error for unknown tool call', async () => {
    const server = new VawPayMcpServer();
    const res = await server.handleRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'unknown_tool',
        arguments: {}
      }
    });

    assert.equal(res.id, 4);
    assert.equal(res.error.code, -32601);
  });
});
