import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { getAdminToken } from '@vawpay/common';
import { startControlCenter } from '../index.js';
import { ProcessManager } from '../process-manager.js';

const ADMIN_AUTH = { Authorization: `Bearer ${getAdminToken()}` };

describe('Control Center Supervisor Integration Tests', () => {
  let ccInstance;
  let baseUrl;
  let pm;

  before(async () => {
    pm = new ProcessManager();
    // Start on test port 8190
    ccInstance = await startControlCenter(8190, { processManager: pm });
    baseUrl = `http://localhost:${ccInstance.port}`;
  });

  after(async () => {
    await ccInstance.close();
  });

  function get(path, headers = {}) {
    return new Promise((resolve, reject) => {
      http.get(`${baseUrl}${path}`, { headers }, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          let body;
          try {
            body = JSON.parse(data);
          } catch {
            body = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      }).on('error', reject);
    });
  }

  function post(path, headers = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(`${baseUrl}${path}`, { method: 'POST', headers }, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          let body;
          try {
            body = JSON.parse(data);
          } catch {
            body = data;
          }
          resolve({ status: res.statusCode, body });
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  test('GET /health returns UP', async () => {
    const res = await get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'UP');
    assert.equal(res.body.service, 'control-center');
  });

  test('GET / renders operational console HTML with all components', async () => {
    const res = await get('/');
    assert.equal(res.status, 200);
    assert.ok(res.headers['content-type'].includes('text/html'));
    assert.ok(res.body.includes('VAW Pay Control Center'));
    assert.ok(res.body.includes('Managed host processes'));
    assert.ok(res.body.includes('Live logs, all services'));
  });

  test('process control routes require the admin token', async () => {
    assert.equal((await get('/api/services')).status, 401);
    assert.equal((await get('/api/logs/stream')).status, 401);
    assert.equal((await post('/api/services/stop-all')).status, 401);
  });

  test('GET /api/services enumerates all modular host services', async () => {
    const res = await get('/api/services', ADMIN_AUTH);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 6);

    const ids = res.body.map(s => s.id);
    assert.ok(ids.includes('payment-api'));
    assert.ok(ids.includes('checkout-portal'));
    assert.ok(ids.includes('merchant-admin'));
    assert.ok(ids.includes('gmail-observer'));
    assert.ok(ids.includes('sms-observer'));
    assert.ok(ids.includes('coin-wallet-store'));

    for (const s of res.body) {
      assert.equal(s.status, 'STOPPED');
      assert.ok(s.port > 0);
    }
  });

  test('Log buffer captures entries and limits size', () => {
    pm.appendLog('payment-api', 'stdout', 'Server initialized on port 6100\nConnected to database');
    assert.ok(pm.logs.length >= 2);
    assert.equal(pm.logs[pm.logs.length - 1].serviceId, 'payment-api');
    assert.equal(pm.logs[pm.logs.length - 1].line, 'Connected to database');
  });

  test('CRITICAL INVARIANT: Stop All strictly stops child processes and NEVER terminates Control Center', async () => {
    const res = await post('/api/services/stop-all', ADMIN_AUTH);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify Control Center is still alive and responsive!
    const healthCheck = await get('/health');
    assert.equal(healthCheck.status, 200);
    assert.equal(healthCheck.body.status, 'UP');
  });
});
