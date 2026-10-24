import { HttpServer } from '../server.js';
import {
  generateFingerprintHash,
  normalizeDeviceSignals,
  verifyDeviceSignature,
  createDeviceChallenge,
  consumeDeviceChallenge
} from '@vawpay/core';

/**
 * Resolves a verified customer ID strictly from a valid customer session token.
 */
function resolveAuthenticatedCustomerId(req, body, ctx) {
  if (!ctx.customerSessionRepo) return null;
  let token = body?.token || req.headers['x-customer-token'] || null;
  if (!token) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }
  if (!token || typeof token !== 'string') return null;
  const authCtx = ctx.customerSessionRepo.findByToken(token.trim());
  return authCtx?.customer?.id || null;
}

/**
 * Registers device identity and cryptographic binding routes.
 * @param {HttpServer} server
 * @param {{
 *   deviceRepo: import('@vawpay/db').DeviceRepository,
 *   customerRepo: import('@vawpay/db').CustomerRepository,
 *   customerSessionRepo?: import('@vawpay/db').CustomerSessionRepository,
 *   auditRepo?: import('@vawpay/db').AuditLogRepository
 * }} ctx
 */
export function registerDeviceRoutes(server, ctx) {
  // 0. POST /api/v1/devices/challenge
  server.post('/api/v1/devices/challenge', async (req, res) => {
    const body = await HttpServer.parseBody(req).catch(() => ({}));
    const { publicKey, deviceId } = body;

    if (!publicKey && !deviceId) {
      HttpServer.json(res, 400, { error: 'publicKey or deviceId is required' });
      return;
    }

    const existing = publicKey
      ? ctx.deviceRepo.findByPublicKey(String(publicKey).trim())
      : ctx.deviceRepo.findById(String(deviceId).trim());

    if (!existing || existing.status !== 'ACTIVE') {
      HttpServer.json(res, 404, { error: 'Device not found or inactive' });
      return;
    }

    const challenge = createDeviceChallenge(existing.id);
    HttpServer.json(res, 200, {
      success: true,
      deviceId: existing.id,
      challenge
    });
  });

  // 1. POST /api/v1/devices/register
  server.post('/api/v1/devices/register', async (req, res) => {
    const body = await HttpServer.parseBody(req).catch(() => ({}));
    const { publicKey, signals, challenge, signature, payload } = body;

    if (!publicKey || typeof publicKey !== 'string' || !publicKey.trim()) {
      HttpServer.json(res, 400, { error: 'Device public key is required for registration.' });
      return;
    }

    const trimmedPublicKey = publicKey.trim();
    if (trimmedPublicKey.startsWith('adhoc_')) {
      HttpServer.json(res, 400, { error: 'Invalid device public key format.' });
      return;
    }

    // Resolve or generate fingerprint hash
    const clientSignals = signals || {};
    if (!clientSignals.userAgent && req.headers['user-agent']) {
      clientSignals.userAgent = req.headers['user-agent'];
    }
    if (!clientSignals.language && req.headers['accept-language']) {
      clientSignals.language = req.headers['accept-language'].split(',')[0];
    }

    const fingerprintHash = body.fingerprintHash || generateFingerprintHash(clientSignals);
    const normalized = normalizeDeviceSignals(clientSignals);

    // Optional customer association strictly from verified customer session token (never bare customerId)
    const customerId = resolveAuthenticatedCustomerId(req, body, ctx);

    // Check if device with this exact public key already exists
    const existing = ctx.deviceRepo.findByPublicKey(trimmedPublicKey);
    if (existing) {
      if (existing.status !== 'ACTIVE') {
        HttpServer.json(res, 403, { error: 'DEVICE_REVOKED', message: 'Device has been revoked or deactivated.' });
        return;
      }

      // Never return or rotate a deviceToken for an existing publicKey unless the caller
      // proves possession of the private key by signing a valid server-issued challenge.
      const hasChallengeProof =
        typeof challenge === 'string' &&
        challenge.trim().length > 0 &&
        typeof signature === 'string' &&
        signature.trim().length > 0 &&
        payload !== undefined &&
        payload !== null;

      if (!hasChallengeProof) {
        const freshChallenge = createDeviceChallenge(existing.id);
        HttpServer.json(res, 409, {
          error: 'DEVICE_ALREADY_REGISTERED',
          code: 'CHALLENGE_REQUIRED',
          message: 'This public key is already registered. Sign the server challenge with your private key to rotate credentials.',
          deviceId: existing.id,
          challenge: freshChallenge,
          isExisting: true
        });
        return;
      }

      const challengeOk = consumeDeviceChallenge(challenge.trim(), existing.id);
      const sigOk = challengeOk && verifyDeviceSignature(
        existing.publicKey,
        payload,
        signature,
        { expectedDeviceId: existing.id, expectedChallenge: challenge.trim() }
      );

      if (!sigOk) {
        HttpServer.json(res, 401, {
          error: 'DEVICE_CHALLENGE_FAILED',
          message: 'Failed to verify private-key ownership for existing device public key.'
        });
        return;
      }

      if (customerId && !existing.customerId) {
        ctx.deviceRepo.associateCustomer(existing.id, customerId);
      }
      ctx.deviceRepo.touch(existing.id);
      const rotatedToken = ctx.deviceRepo.rotateToken(existing.id);

      HttpServer.json(res, 200, {
        success: true,
        deviceId: existing.id,
        deviceToken: rotatedToken,
        fingerprintHash: existing.fingerprintHash,
        status: existing.status,
        isExisting: true
      });
      return;
    }

    // Register new device
    const device = ctx.deviceRepo.create({
      customerId,
      publicKey: trimmedPublicKey,
      fingerprintHash,
      userAgent: normalized.userAgent,
      platform: normalized.platform,
      browser: normalized.webglRenderer ? 'WebBrowser' : null,
      timezone: normalized.timezone,
      language: normalized.language,
      screenSignature: normalized.screenSignature
    });

    if (ctx.auditRepo) {
      ctx.auditRepo.log({
        entityType: 'DEVICE',
        entityId: device.id,
        action: 'DEVICE_REGISTERED',
        actorType: customerId ? 'CUSTOMER' : 'SYSTEM',
        actorId: customerId || 'ANONYMOUS',
        details: {
          fingerprintHash: device.fingerprintHash,
          platform: normalized.platform,
          screenSignature: normalized.screenSignature
        }
      });
    }

    HttpServer.json(res, 201, {
      success: true,
      deviceId: device.id,
      deviceToken: device.deviceToken,
      fingerprintHash: device.fingerprintHash,
      status: device.status,
      isExisting: false
    });
  });

  // 2. POST /api/v1/devices/verify
  server.post('/api/v1/devices/verify', async (req, res) => {
    const body = await HttpServer.parseBody(req).catch(() => ({}));
    const { deviceId, payload, signature, deviceToken } = body;

    if (!deviceId || typeof deviceId !== 'string') {
      HttpServer.json(res, 400, { valid: false, error: 'deviceId is required' });
      return;
    }

    const device = ctx.deviceRepo.findById(deviceId);
    if (!device || device.status !== 'ACTIVE' || (typeof device.publicKey === 'string' && device.publicKey.startsWith('adhoc_'))) {
      HttpServer.json(res, 404, { valid: false, error: 'Device not found or inactive' });
      return;
    }

    const hasToken = typeof deviceToken === 'string' && deviceToken.trim().length > 0;
    const hasSig = typeof signature === 'string' && signature.trim().length > 0;
    const hasPayload = payload !== undefined && payload !== null && String(payload).trim().length > 0;

    // Require at least one cryptographic credential; never default to valid: true!
    if (!hasToken && !hasSig) {
      HttpServer.json(res, 401, {
        valid: false,
        error: 'DEVICE_CREDENTIALS_REQUIRED',
        message: 'A deviceToken or cryptographic signature with payload is required.',
        deviceId: device.id,
        tokenValid: false,
        signatureValid: false
      });
      return;
    }

    if ((hasSig && !hasPayload) || (!hasSig && hasPayload)) {
      HttpServer.json(res, 401, {
        valid: false,
        error: 'DEVICE_SIGNATURE_INVALID',
        message: 'Both signature and payload are required for signature verification.',
        deviceId: device.id,
        tokenValid: false,
        signatureValid: false
      });
      return;
    }

    const tokenValid = hasToken ? ctx.deviceRepo.verifyToken(device.id, deviceToken.trim()) : true;
    const signatureValid = hasSig
      ? verifyDeviceSignature(device.publicKey, payload, signature, { expectedDeviceId: device.id })
      : true;

    const isValid = tokenValid && signatureValid;

    HttpServer.json(res, isValid ? 200 : 401, {
      valid: isValid,
      deviceId: device.id,
      customerId: device.customerId,
      tokenValid: hasToken ? tokenValid : false,
      signatureValid: hasSig ? signatureValid : false
    });
  });

  // 3. GET /api/v1/devices/:id
  server.get('/api/v1/devices/:id', async (req, res, params) => {
    const device = ctx.deviceRepo.findById(params.id);
    if (!device) {
      HttpServer.json(res, 404, { error: 'Device not found' });
      return;
    }

    HttpServer.json(res, 200, {
      id: device.id,
      customerId: device.customerId,
      fingerprintHash: device.fingerprintHash,
      platform: device.platform,
      timezone: device.timezone,
      language: device.language,
      status: device.status,
      createdAt: device.createdAt,
      lastSeenAt: device.lastSeenAt
    });
  });

  // 4. GET /api/v1/devices/customer/:customerId
  server.get('/api/v1/devices/customer/:customerId', async (req, res, params) => {
    const devices = ctx.deviceRepo.findByCustomerId(params.customerId);
    HttpServer.json(res, 200, {
      customerId: params.customerId,
      count: devices.length,
      devices: devices.map(d => ({
        id: d.id,
        fingerprintHash: d.fingerprintHash,
        platform: d.platform,
        timezone: d.timezone,
        status: d.status,
        createdAt: d.createdAt,
        lastSeenAt: d.lastSeenAt
      }))
    });
  });
}
