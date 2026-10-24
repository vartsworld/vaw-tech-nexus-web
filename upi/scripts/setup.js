#!/usr/bin/env node
/**
 * First-run setup for VAW Pay.
 *   node scripts/setup.js            -> local/dev .env (localhost mode)
 *   node scripts/setup.js --domain vawtech.in [--prefix pay] [--origins https://vawtech.in,https://www.vawtech.in]
 *                                    -> production .env
 * Creates .env (never overwrites), generates every secret once, creates the database and
 * prints the admin token you paste into the Merchant Admin login.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const envPath = path.join(root, '.env');
if (!fs.existsSync(envPath)) {
  let text = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  const domain = (arg('domain') || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (domain) {
    const prefix = (arg('prefix') || 'pay').replace(/[^a-z0-9-]/gi, '') || 'pay';
    const origins = (arg('origins') || `https://${domain} https://www.${domain}`).split(/[,\s]+/).filter(Boolean).join(' ');
    text = text
      .replace(/^VAWPAY_MODE=localhost$/m, '# VAWPAY_MODE=localhost')
      .replace(/^VAWPAY_ALLOW_LOCALHOST_MODE=true$/m, '# VAWPAY_ALLOW_LOCALHOST_MODE=true')
      .replace(/^# CLOUDFLARE_DOMAIN=.*$/m, `CLOUDFLARE_DOMAIN=${domain}`)
      .replace(/^# DEPLOYMENT_PREFIX=.*$/m, `DEPLOYMENT_PREFIX=${prefix}`)
      .replace(/^# CHECKOUT_FRAME_ANCESTORS=.*$/m, `CHECKOUT_FRAME_ANCESTORS=${origins}`);
  }
  fs.writeFileSync(envPath, text, { mode: 0o600 });
  console.log(`Created ${path.relative(process.cwd(), envPath) || '.env'} (${domain ? 'production' : 'localhost'} mode)`);
} else {
  console.log('.env already exists - left untouched');
}

if (typeof process.loadEnvFile === 'function') process.loadEnvFile(envPath);

const secrets = await import('../packages/common/src/secrets.js');
const adminToken = secrets.getAdminToken();
secrets.getObserverToken();
secrets.getEncryptionMasterKey();
secrets.getInternalServiceToken();
secrets.getDeviceCredentialKey();
secrets.getBlindIndexKey();
secrets.getCoinStoreWebhookSecret();
secrets.resolveSecret('android_enrollment_secret', 'ANDROID_ENROLLMENT_SECRET');

const { runMigrations } = await import('../packages/db/src/migrate.js');
const { defaultMerchant } = runMigrations();

console.log('\nSecrets stored in data/.secrets/ (back this folder up together with the database).');
console.log('\n  Merchant Admin login token:\n');
console.log(`    ${adminToken}\n`);
console.log(`  Merchant: ${defaultMerchant.businessName}`);
console.log('\nNext steps:');
console.log('  1. npm start                      (or npm run dev for local work)');
console.log('  2. Open Merchant Admin -> Settings and set your business UPI ID (VPA).');
console.log('  3. Pair an observer (Android app or Gmail) so incoming credits are detected.');
