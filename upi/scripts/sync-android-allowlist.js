import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALLOWED_NOTIFICATION_PACKAGES } from '../packages/common/src/upi-providers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

/**
 * Synchronizes the Android NotificationListener allowlist in Java with the
 * canonical list defined in packages/common/src/upi-providers.js.
 */
export function syncAndroidAllowlist() {
  const serviceFile = path.resolve(
    REPO_ROOT,
    'apps/android-observer-app/app/src/main/java/com/youpi/observer/PaymentNotificationListenerService.java'
  );

  if (!fs.existsSync(serviceFile)) {
    throw new Error(`Target service file not found: ${serviceFile}`);
  }

  let content = fs.readFileSync(serviceFile, 'utf8');

  const javaArrayLines = ALLOWED_NOTIFICATION_PACKAGES
    .map((pkg, i) => `        "${pkg}"${i < ALLOWED_NOTIFICATION_PACKAGES.length - 1 ? ',' : ''}`)
    .join('\n');

  const replacement = `    // Generated from packages/common/src/upi-providers.js - Single Source of Truth
    private static final Set<String> ALLOWED_BANKING_PACKAGES = new HashSet<>(Arrays.asList(
${javaArrayLines}
    ));`;

  // Anchored at the start of a line (with optional leading whitespace) so the generated
  // comment is matched as a whole. The previous pattern could start mid-line, which made
  // the replacement re-indent the block on every run: the script was not idempotent, the
  // committed file stopped matching what the generator produced, and every build left the
  // working tree dirty.
  const regex = /^[ \t]*(?:\/\/[^\n]*\n[ \t]*)?private static final Set<String> ALLOWED_BANKING_PACKAGES = new HashSet<\>\(Arrays\.asList\([\s\S]*?\)\);/m;
  if (!regex.test(content)) {
    throw new Error('Could not match ALLOWED_BANKING_PACKAGES block in PaymentNotificationListenerService.java');
  }

  content = content.replace(regex, replacement);
  fs.writeFileSync(serviceFile, content, 'utf8');
  console.log(`✅ Synchronized ${ALLOWED_NOTIFICATION_PACKAGES.length} banking & UPI packages into PaymentNotificationListenerService.java`);
  return ALLOWED_NOTIFICATION_PACKAGES.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncAndroidAllowlist();
}
