import http from 'node:http';
import { verifyHmac } from '@vawpay/common';

export const TOOLS_DEFINITIONS = [
  {
    name: 'vawpay_check_gateway_health',
    description: 'Check the health and operational status of all local VAW Pay services (Payment Core API, Checkout Portal, Observers).',
    inputSchema: {
      type: 'object',
      properties: {
        host: {
          type: 'string',
          description: 'Ignored. The probe only ever targets the local gateway.',
          description: 'Host to check (defaults to 127.0.0.1)',
          default: '127.0.0.1'
        }
      }
    }
  },
  {
    name: 'vawpay_verify_webhook',
    description: 'Verify HMAC-SHA256 signature for a VAW Pay webhook delivery payload.',
    inputSchema: {
      type: 'object',
      properties: {
        rawPayload: {
          type: 'string',
          description: 'The raw, unparsed request payload string'
        },
        signature: {
          type: 'string',
          description: 'The received X-Gateway-Signature header (sha256=<hex>)'
        },
        secret: {
          type: 'string',
          description: 'The merchant webhook secret'
        },
        timestamp: {
          type: 'string',
          description: 'The received X-Gateway-Timestamp header in ms'
        },
        maxAgeSeconds: {
          type: 'number',
          description: 'Maximum permitted age in seconds (default 300)',
          default: 300
        }
      },
      required: ['rawPayload', 'signature', 'secret']
    }
  },
  {
    name: 'vawpay_simulate_bank_notification',
    description: 'Format an incoming Indian bank SMS credit notification as text. This only returns the message body - it does NOT deliver anything to the observers or the gateway, so it can never mark a payment as settled.',
    inputSchema: {
      type: 'object',
      properties: {
        bank: {
          type: 'string',
          enum: ['HDFC', 'SBI', 'ICICI', 'AXIS', 'KOTAK', 'PNB'],
          description: 'Target bank sender template to format'
        },
        amount: {
          type: 'number',
          description: 'Amount in INR (e.g. 499.00)'
        },
        utr: {
          type: 'string',
          description: '12-digit bank reference number (UTR / RRN)'
        },
        accountLastDigits: {
          type: 'string',
          description: 'Last 3-4 digits of receiving account',
          default: '1234'
        }
      },
      required: ['bank', 'amount', 'utr']
    }
  }
];

/** The only hosts the health probe may target. */
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

export function verifyWebhookSignature({ rawPayload, signature, secret, timestamp, maxAgeSeconds = 300 }) {
  if (!rawPayload || !signature || !secret) {
    return { valid: false, error: 'MISSING_REQUIRED_PARAMS' };
  }

  if (timestamp) {
    const tsNum = Number(timestamp);
    if (!Number.isNaN(tsNum)) {
      const now = Date.now();
      const diffMs = Math.abs(now - tsNum);
      if (diffMs > maxAgeSeconds * 1000) {
        return { valid: false, error: 'WEBHOOK_TIMESTAMP_EXPIRED', ageSeconds: Math.round(diffMs / 1000) };
      }
    }
  }

  const sig = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  if (!/^[0-9a-fA-F]+$/.test(sig) || sig.length % 2 !== 0) {
    return { valid: false, error: 'INVALID_SIGNATURE_FORMAT' };
  }

  // Use the shared verifier so this tool can never drift from the contract the gateway
  // and the merchant SDK implement: HMAC-SHA256(secret, rawBody), constant-time compare.
  // The length is checked first so a truncated signature is reported distinctly.
  if (sig.length !== 64) {
    return { valid: false, error: 'SIGNATURE_LENGTH_MISMATCH' };
  }
  const matches = verifyHmac(rawPayload, secret, sig);
  return { valid: matches, error: matches ? null : 'INVALID_SIGNATURE' };
}

export function generateBankSmsText({ bank, amount, utr, accountLastDigits = '1234' }) {
  const amtFormatted = Number(amount).toFixed(2);
  switch (bank.toUpperCase()) {
    case 'HDFC':
      return `Dear Customer, INR ${amtFormatted} credited to account **${accountLastDigits} on ${new Date().toISOString().slice(0, 10)} by UPI/${utr}/VAW Pay. Avl bal INR 25,000.00.`;
    case 'SBI':
      return `Your A/C ${accountLastDigits} Credited by Rs ${amtFormatted} on ${new Date().toISOString().slice(0, 10)} by UPI/Ref no ${utr} - SBI.`;
    case 'ICICI':
      return `Dear Customer, Acct XX${accountLastDigits} is credited with Rs ${amtFormatted} on ${new Date().toISOString().slice(0, 10)}. UPI:${utr}.`;
    case 'AXIS':
      return `INR ${amtFormatted} credited to Axis Bank A/c no. XX${accountLastDigits} on ${new Date().toISOString().slice(0, 10)} by UPI ref ${utr}.`;
    case 'KOTAK':
      return `Rs ${amtFormatted} credited to Kotak Bank A/C XX${accountLastDigits} on ${new Date().toISOString().slice(0, 10)} (UPI Ref no ${utr}).`;
    case 'PNB':
      return `A/C *${accountLastDigits} credited with INR ${amtFormatted} on ${new Date().toISOString().slice(0, 10)} via UPI/${utr}. PNB.`;
    default:
      return `Credit of INR ${amtFormatted} received in A/C *${accountLastDigits} via UPI ref ${utr}.`;
  }
}

/**
 * Probes a local gateway port. The host is deliberately NOT caller-controlled: the tool
 * exists to report the health of the gateway running next to it, and letting a caller
 * choose the host would turn it into an arbitrary GET probe of other hosts.
 */
export async function checkPortHealth(port, host = '127.0.0.1') {
  const targetHost = LOOPBACK_HOSTS.has(String(host)) ? String(host) : '127.0.0.1';
  return new Promise((resolve) => {
    try {
      const req = http.request({ host: targetHost, port, path: '/health', method: 'GET', timeout: 800 }, (res) => {
        res.resume();
        resolve({ port, online: res.statusCode >= 200 && res.statusCode < 500, statusCode: res.statusCode });
      });
      req.on('error', (err) => {
        try { req.destroy(err); } catch (_) {}
        resolve({ port, online: false, error: err.code || 'CONNECTION_REFUSED' });
      });
      req.on('timeout', () => {
        try {
          req.destroy(new Error('TIMEOUT'));
          req.socket?.destroy();
        } catch (_) {}
        resolve({ port, online: false, error: 'TIMEOUT' });
      });
      req.end();
    } catch (err) {
      resolve({ port, online: false, error: err.code || 'REQUEST_FAILED' });
    }
  });
}
