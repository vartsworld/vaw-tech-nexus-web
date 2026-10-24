import crypto from 'node:crypto';
import {
  safeEqual,
  issueDeviceCredential,
  verifyDeviceCredential,
  createDeviceChallenge,
  consumeDeviceChallenge
} from '@vawpay/common';

export {
  issueDeviceCredential,
  verifyDeviceCredential,
  createDeviceChallenge,
  consumeDeviceChallenge
};

/**
 * Normalizes privacy-conscious browser/device signals into a canonical dictionary.
 * @param {Record<string, any>} signals
 */
export function normalizeDeviceSignals(signals = {}) {
  const ua = (signals.userAgent || '').toString().trim().replace(/\s+/g, ' ');
  const platform = (signals.platform || '').toString().trim().toLowerCase();
  const language = (signals.language || '').toString().trim().toLowerCase();
  const timezone = (signals.timezone || '').toString().trim();

  let screenSig = signals.screenSignature || '';
  if (!screenSig && signals.screenWidth && signals.screenHeight) {
    screenSig = `${signals.screenWidth}x${signals.screenHeight}x${signals.screenColorDepth || 24}`;
  }

  const hardwareConcurrency = Math.max(0, parseInt(signals.hardwareConcurrency, 10) || 0);
  const deviceMemory = Math.max(0, parseFloat(signals.deviceMemory) || 0);
  const webglRenderer = (signals.webglRenderer || signals.webgl || '').toString().trim().toLowerCase();
  const canvasSignature = (signals.canvasSignature || '').toString().trim();

  return {
    canvasSignature,
    deviceMemory,
    hardwareConcurrency,
    language,
    platform,
    screenSignature: screenSig,
    timezone,
    userAgent: ua,
    webglRenderer
  };
}

/**
 * Generates a stable SHA-256 hash of normalized browser/device signals.
 * @param {Record<string, any>} signals
 * @returns {string} SHA-256 hexadecimal hash
 */
export function generateFingerprintHash(signals = {}) {
  const normalized = normalizeDeviceSignals(signals);
  // Canonical serialization: keys sorted deterministically
  const canonicalString = JSON.stringify(normalized, Object.keys(normalized).sort());
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

/**
 * Imports a public key from base64 SPKI, DER buffer, or JWK.
 * @param {string|object} publicKeyInput
 * @returns {crypto.KeyObject}
 */
export function importDevicePublicKey(publicKeyInput) {
  if (!publicKeyInput) {
    throw new Error('Public key is required');
  }

  if (typeof publicKeyInput === 'object' && publicKeyInput.kty) {
    return crypto.createPublicKey({
      key: publicKeyInput,
      format: 'jwk'
    });
  }

  const str = String(publicKeyInput).trim();

  // If PEM format
  if (str.includes('BEGIN PUBLIC KEY')) {
    return crypto.createPublicKey(str);
  }

  // If JSON JWK string
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      return crypto.createPublicKey({ key: parsed, format: 'jwk' });
    } catch {}
  }

  // Otherwise assume base64 SPKI (DER)
  const derBuffer = Buffer.from(str, 'base64');
  return crypto.createPublicKey({
    key: derBuffer,
    format: 'der',
    type: 'spki'
  });
}

const DEFAULT_SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;
const DEFAULT_SIGNATURE_CLOCK_SKEW_MS = 60 * 1000;
const usedSignatureNonces = new Map();

function pruneSignatureNonces(now = Date.now()) {
  if (usedSignatureNonces.size < 256) return;
  for (const [k, exp] of usedSignatureNonces.entries()) {
    if (exp <= now) usedSignatureNonces.delete(k);
  }
}

/**
 * Extracts and validates the anti-replay `{ nonce, timestamp }` metadata from a signed payload.
 * Payloads must be a JSON string/object `{ nonce, timestamp, ... }` or `<nonce>:<timestamp>[:...]`.
 * @param {string|Buffer|object} dataToVerify
 * @param {{ maxAgeMs?: number, maxClockSkewMs?: number, expectedDeviceId?: string, expectedChallenge?: string }} [options]
 * @returns {{ canonicalBuffer: Buffer, nonce: string, timestamp: number } | null}
 */
export function parseSignedDevicePayload(dataToVerify, options = {}) {
  if (dataToVerify === null || dataToVerify === undefined) return null;

  const maxAgeMs = Number.isFinite(options.maxAgeMs) ? options.maxAgeMs : DEFAULT_SIGNATURE_MAX_AGE_MS;
  const maxClockSkewMs = Number.isFinite(options.maxClockSkewMs) ? options.maxClockSkewMs : DEFAULT_SIGNATURE_CLOCK_SKEW_MS;

  let rawString;
  let parsedObj = null;

  if (Buffer.isBuffer(dataToVerify)) {
    rawString = dataToVerify.toString('utf8');
  } else if (typeof dataToVerify === 'object') {
    parsedObj = dataToVerify;
    rawString = JSON.stringify(dataToVerify);
  } else if (typeof dataToVerify === 'string') {
    rawString = dataToVerify;
  } else {
    return null;
  }

  if (!parsedObj && rawString.trim().startsWith('{') && rawString.trim().endsWith('}')) {
    try {
      parsedObj = JSON.parse(rawString);
    } catch {
      return null;
    }
  }

  let nonce = null;
  let rawTs = null;

  if (parsedObj && typeof parsedObj === 'object') {
    nonce = typeof parsedObj.nonce === 'string' ? parsedObj.nonce.trim() : null;
    rawTs = parsedObj.timestamp ?? parsedObj.ts ?? parsedObj.issuedAt;
    if (options.expectedDeviceId && parsedObj.deviceId && parsedObj.deviceId !== options.expectedDeviceId) {
      return null;
    }
    if (options.expectedChallenge && parsedObj.challenge !== options.expectedChallenge) {
      return null;
    }
  } else {
    // Support colon-separated `<nonce>:<timestamp>[:<challenge>...]`
    const parts = rawString.split(':');
    if (parts.length < 2) return null;
    nonce = parts[0].trim();
    rawTs = parts[1].trim();
    if (options.expectedChallenge && !parts.slice(2).includes(options.expectedChallenge)) {
      return null;
    }
  }

  if (!nonce || nonce.length < 8 || nonce.length > 256) {
    return null;
  }

  let timestampMs = NaN;
  if (typeof rawTs === 'number' && Number.isFinite(rawTs)) {
    timestampMs = rawTs >= 1e9 && rawTs < 1e11 ? rawTs * 1000 : rawTs;
  } else if (typeof rawTs === 'string' && rawTs.trim()) {
    const num = Number(rawTs.trim());
    if (Number.isFinite(num)) {
      timestampMs = num >= 1e9 && num < 1e11 ? num * 1000 : num;
    } else {
      timestampMs = Date.parse(rawTs.trim());
    }
  }

  if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
    return null;
  }

  const now = Date.now();
  if (now - timestampMs > maxAgeMs) {
    return null;
  }
  if (timestampMs - now > maxClockSkewMs) {
    return null;
  }

  const canonicalBuffer = Buffer.isBuffer(dataToVerify)
    ? dataToVerify
    : Buffer.from(rawString, 'utf8');

  return { canonicalBuffer, nonce, timestamp: timestampMs };
}

/**
 * Verifies an ECDSA P-256 signature generated by browser Web Crypto.
 * Requires a fresh timestamp and single-use nonce in the signed payload.
 * @param {string|object} publicKey
 * @param {string|Buffer|object} dataToVerify
 * @param {string} signatureBase64
 * @param {{ maxAgeMs?: number, maxClockSkewMs?: number, expectedDeviceId?: string, expectedChallenge?: string }} [options]
 * @returns {boolean}
 */
export function verifyDeviceSignature(publicKey, dataToVerify, signatureBase64, options = {}) {
  try {
    if (!publicKey || !signatureBase64) return false;

    const parsed = parseSignedDevicePayload(dataToVerify, options);
    if (!parsed) return false;

    const keyObject = importDevicePublicKey(publicKey);
    const dataBuffer = parsed.canonicalBuffer;
    const sigStr = String(signatureBase64).trim();
    if (!sigStr) return false;
    const sigBuffer = Buffer.from(sigStr, 'base64');
    if (sigBuffer.length === 0) return false;

    const keyDer = keyObject.export({ format: 'der', type: 'spki' });
    const keyFp = crypto.createHash('sha256').update(keyDer).digest('hex').slice(0, 32);
    const nonceKey = `${keyFp}:${parsed.nonce}`;
    const now = Date.now();
    pruneSignatureNonces(now);

    const existingExp = usedSignatureNonces.get(nonceKey);
    if (existingExp && existingExp > now) {
      return false;
    }

    let verified = false;

    // Try ieee-p1363 (standard Web Crypto ECDSA output: r || s, 64 bytes)
    try {
      verified = crypto.verify(
        'SHA256',
        dataBuffer,
        { key: keyObject, dsaEncoding: 'ieee-p1363' },
        sigBuffer
      );
    } catch {}

    // Fallback to standard DER encoding
    if (!verified) {
      try {
        verified = crypto.verify(
          'SHA256',
          dataBuffer,
          keyObject,
          sigBuffer
        );
      } catch {}
    }

    if (!verified) return false;

    const maxAgeMs = Number.isFinite(options.maxAgeMs) ? options.maxAgeMs : DEFAULT_SIGNATURE_MAX_AGE_MS;
    usedSignatureNonces.set(nonceKey, now + maxAgeMs);
    return true;
  } catch (err) {
    console.warn('[DeviceSecurity] Signature verification error:', err.message);
    return false;
  }
}

/**
 * Verifies that a device exists, is ACTIVE, is not an adhoc placeholder, and that the
 * caller presented a valid cryptographic credential (token or ECDSA signature).
 * @param {{
 *   deviceId: string,
 *   deviceToken?: string|null,
 *   deviceSignature?: string|null,
 *   signaturePayload?: string|object|null,
 *   deviceRepo: any
 * }} params
 * @returns {{ valid: boolean, error?: string, message?: string, device?: any }}
 */
export function verifyRegisteredDeviceCredentials({
  deviceId,
  deviceToken,
  deviceSignature,
  signaturePayload,
  deviceRepo
}) {
  if (!deviceId || typeof deviceId !== 'string') {
    return {
      valid: false,
      error: 'DEVICE_ID_REQUIRED',
      message: 'A registered deviceId is required.'
    };
  }
  if (!deviceRepo) {
    return {
      valid: false,
      error: 'DEVICE_REPO_UNAVAILABLE',
      message: 'Device repository is required for device verification.'
    };
  }

  const dev = deviceRepo.findById(deviceId);
  if (!dev || dev.status !== 'ACTIVE' || (typeof dev.publicKey === 'string' && dev.publicKey.startsWith('adhoc_'))) {
    return {
      valid: false,
      error: 'DEVICE_REVOKED',
      message: 'The device is unregistered, revoked, or invalid.'
    };
  }

  const hasToken = typeof deviceToken === 'string' && deviceToken.trim().length > 0;
  const hasSig = typeof deviceSignature === 'string' && deviceSignature.trim().length > 0;
  const hasPayload = signaturePayload !== undefined && signaturePayload !== null && String(signaturePayload).trim().length > 0;

  if (!hasToken && !hasSig) {
    return {
      valid: false,
      error: 'DEVICE_CREDENTIALS_REQUIRED',
      message: 'Device authentication credential (token or cryptographic signature) is required.'
    };
  }

  if ((hasSig && !hasPayload) || (!hasSig && hasPayload)) {
    return {
      valid: false,
      error: 'DEVICE_SIGNATURE_INVALID',
      message: 'Both device signature and signed payload are required for signature verification.'
    };
  }

  if (hasToken) {
    let tokenOk = false;
    if (typeof deviceRepo.verifyToken === 'function') {
      tokenOk = deviceRepo.verifyToken(deviceId, deviceToken.trim());
    } else if (dev.deviceToken) {
      tokenOk = safeEqual(dev.deviceToken, deviceToken.trim()) && verifyDeviceCredential(deviceId, deviceToken.trim());
    } else {
      tokenOk = verifyDeviceCredential(deviceId, deviceToken.trim());
    }
    if (!tokenOk) {
      return {
        valid: false,
        error: 'DEVICE_TOKEN_INVALID',
        message: 'Device token failed verification.'
      };
    }
  }

  if (hasSig) {
    const sigOk = verifyDeviceSignature(dev.publicKey, signaturePayload, deviceSignature, {
      expectedDeviceId: deviceId
    });
    if (!sigOk) {
      return {
        valid: false,
        error: 'DEVICE_SIGNATURE_INVALID',
        message: 'Device cryptographic signature failed verification.'
      };
    }
  }

  return { valid: true, device: dev };
}

/**
 * Validates whether the requesting device matches the payment session's bound device.
 * @param {{
 *   session: any,
 *   requestingDeviceId?: string|null,
 *   deviceToken?: string|null,
 *   deviceSignature?: string|null,
 *   signaturePayload?: string|null,
 *   deviceRepo?: any
 * }} options
 * @returns {{
 *   allowed: boolean,
 *   shouldBind?: boolean,
 *   error?: string,
 *   session_id?: string,
 *   action?: string,
 *   message?: string,
 *   boundDeviceId?: string|null,
 *   requestingDeviceId?: string|null
 * }}
 */
export function validateSessionDeviceAccess(options) {
  const { session, requestingDeviceId, deviceToken, deviceSignature, signaturePayload, deviceRepo } = options || {};

  if (!session) {
    return {
      allowed: false,
      error: 'SESSION_NOT_FOUND',
      message: 'Payment session not found'
    };
  }

  const boundDeviceId = session.deviceId;

  // If session is not yet bound to any device:
  // Only allow binding if the caller presents a registered, cryptographically verified device.
  if (!boundDeviceId) {
    if (!requestingDeviceId) {
      return {
        allowed: false,
        error: 'DEVICE_ID_REQUIRED',
        session_id: session.id,
        action: 'REGISTER_DEVICE',
        message: 'A registered device identity is required to access or bind this checkout session.',
        boundDeviceId: null,
        requestingDeviceId: null
      };
    }

    const credCheck = verifyRegisteredDeviceCredentials({
      deviceId: requestingDeviceId,
      deviceToken,
      deviceSignature,
      signaturePayload,
      deviceRepo
    });

    if (!credCheck.valid) {
      return {
        allowed: false,
        error: credCheck.error === 'DEVICE_SIGNATURE_INVALID' ? 'DEVICE_SIGNATURE_INVALID' : 'DUPLICATE_SESSION_DETECTED',
        session_id: session.id,
        action: 'END_SESSION_AND_CREATE_NEW',
        message: credCheck.message || 'Valid registered device credentials are required.',
        boundDeviceId: null,
        requestingDeviceId
      };
    }

    return {
      allowed: true,
      shouldBind: true,
      requestingDeviceId
    };
  }

  // If requesting device ID is missing or does not match bound device
  if (!requestingDeviceId || requestingDeviceId !== boundDeviceId) {
    return {
      allowed: false,
      error: 'DUPLICATE_SESSION_DETECTED',
      session_id: session.id,
      action: 'END_SESSION_AND_CREATE_NEW',
      message: 'This payment session was created on another device. For security reasons, this session cannot be continued from this device.',
      boundDeviceId,
      requestingDeviceId: requestingDeviceId || null
    };
  }

  // Verify the bound device is registered, active, and that the caller supplied a valid token or signature
  const credCheck = verifyRegisteredDeviceCredentials({
    deviceId: boundDeviceId,
    deviceToken,
    deviceSignature,
    signaturePayload,
    deviceRepo
  });

  if (!credCheck.valid) {
    if (credCheck.error === 'DEVICE_REVOKED') {
      return {
        allowed: false,
        error: 'DEVICE_REVOKED',
        session_id: session.id,
        action: 'END_SESSION_AND_CREATE_NEW',
        message: 'The device registered for this payment session has been revoked or is invalid.'
      };
    }
    if (credCheck.error === 'DEVICE_SIGNATURE_INVALID') {
      return {
        allowed: false,
        error: 'DEVICE_SIGNATURE_INVALID',
        session_id: session.id,
        action: 'END_SESSION_AND_CREATE_NEW',
        message: 'Device cryptographic signature failed verification.'
      };
    }
    return {
      allowed: false,
      error: 'DUPLICATE_SESSION_DETECTED',
      session_id: session.id,
      action: 'END_SESSION_AND_CREATE_NEW',
      message: 'This payment session was created on another device. For security reasons, this session cannot be continued from this device.',
      boundDeviceId,
      requestingDeviceId
    };
  }

  return {
    allowed: true,
    boundDeviceId,
    requestingDeviceId
  };
}
