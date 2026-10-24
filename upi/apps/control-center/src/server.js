import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ProcessManager } from './process-manager.js';
import { getAdminToken, safeEqual } from '@vawpay/common';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Security headers applied to every response served by the control center. */
const BASE_SECURITY_HEADERS = Object.freeze({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'"
});

/** Routes reachable without a credential (liveness probe and the dashboard shell). */
const PUBLIC_PATHS = new Set(['/health', '/', '/dashboard', '/fonts/dm-sans.woff2', '/fonts/sora.woff2']);

/** True when the caller presented the admin bearer token in constant time (or ?token= on GET SSE). */
function hasAdminToken(req, url = null, pathname = '') {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers?.['authorization'] || '');
  if (match) {
    return safeEqual(match[1].trim(), getAdminToken());
  }
  // NOTE: the stream token is deliberately NOT accepted from a query parameter. A
  // credential in the URL ends up in access logs, browser history and Referer headers.
  // The dashboards now open the stream with fetch() so the token travels in the
  // Authorization header only.
  return false;
}

export class ControlCenterServer {
  /**
   * @param {{ processManager?: ProcessManager }} [options={}]
   */
  constructor(options = {}) {
    this.processManager = options.processManager || new ProcessManager();
    this.htmlTemplatePath = path.join(__dirname, 'views', 'dashboard.html');
    this.template = fs.readFileSync(this.htmlTemplatePath, 'utf8');
    this.sseClients = new Set();

    // Broadcast log events to all connected SSE clients
    this.processManager.on('log', (logEntry) => {
      this.broadcastSse('log', logEntry);
    });

    this.processManager.on('status_change', (change) => {
      this.broadcastSse('status_change', change);
    });
  }

  broadcastSse(event, data) {
    if (this.sseClients.size === 0) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch {
        this.sseClients.delete(client);
      }
    }
  }

  createServer() {
    return http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = url.pathname;
      const method = req.method.toUpperCase();

      if (method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end();
        return;
      }

      // GET /health
      if (pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'UP', service: 'control-center' }));
        return;
      }

      // Every remaining route controls processes, streams service logs or exposes internal
      // state. Without a token these are a remote denial-of-service and a log-exfiltration
      // primitive, so the admin bearer is required.
      if (!PUBLIC_PATHS.has(pathname) && !hasAdminToken(req, url, pathname)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }));
        return;
      }

      // GET /api/services
      if (pathname === '/api/services' && method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(this.processManager.getServicesStatus()));
        return;
      }

      // POST /api/services/start-all
      if (pathname === '/api/services/start-all' && method === 'POST') {
        await this.processManager.startAll();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: true, message: 'All services starting' }));
        return;
      }

      // POST /api/services/stop-all
      if (pathname === '/api/services/stop-all' && method === 'POST') {
        await this.processManager.stopAll();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: true, message: 'All services stopping' }));
        return;
      }

      // POST /api/services/:id/start
      const startMatch = pathname.match(/^\/api\/services\/([a-zA-Z0-9_\-]+)\/start$/);
      if (startMatch && method === 'POST') {
        const id = startMatch[1];
        try {
          const svc = await this.processManager.startService(id);
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: true, service: svc.id, status: svc.status }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // POST /api/services/:id/stop
      const stopMatch = pathname.match(/^\/api\/services\/([a-zA-Z0-9_\-]+)\/stop$/);
      if (stopMatch && method === 'POST') {
        const id = stopMatch[1];
        try {
          const svc = await this.processManager.stopService(id);
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: true, service: svc.id, status: svc.status }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // POST /api/services/:id/restart
      const restartMatch = pathname.match(/^\/api\/services\/([a-zA-Z0-9_\-]+)\/restart$/);
      if (restartMatch && method === 'POST') {
        const id = restartMatch[1];
        try {
          const svc = await this.processManager.restartService(id);
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: true, service: svc.id, status: svc.status }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // GET /api/logs/stream (SSE)
      if (pathname === '/api/logs/stream') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          // Not wildcard: EventSource cannot send an Authorization header from a browser
          // dashboard, but the stream still carries every service's stdout/stderr.
          'Access-Control-Allow-Origin': 'null',
          ...BASE_SECURITY_HEADERS
        });

        // Send existing logs
        for (const log of this.processManager.logs.slice(-50)) {
          res.write(`event: log\ndata: ${JSON.stringify(log)}\n\n`);
        }

        this.sseClients.add(res);

        const pingTimer = setInterval(() => {
          try { res.write(': keepalive\n\n'); } catch { clearInterval(pingTimer); }
        }, 15000);
        if (pingTimer.unref) pingTimer.unref();

        res.on('close', () => {
          clearInterval(pingTimer);
          this.sseClients.delete(res);
        });
        return;
      }

      // Self-hosted UI fonts (CSP blocks third-party font CDNs)
      const fontMatch = /^\/fonts\/(dm-sans|sora)\.woff2$/.exec(pathname);
      if (fontMatch && method === 'GET') {
        const fontPath = path.resolve(__dirname, '../public/fonts', `${fontMatch[1]}.woff2`);
        if (fs.existsSync(fontPath)) {
          res.writeHead(200, {
            'Content-Type': 'font/woff2',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff'
          });
          fs.createReadStream(fontPath).pipe(res);
          return;
        }
      }

      // Web Dashboard View: GET /
      if (pathname === '/' || pathname === '/dashboard') {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
          ...BASE_SECURITY_HEADERS
        });
        res.end(this.template);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Control Center Route Not Found');
    });
  }
}
