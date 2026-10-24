import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ControlCenterServer } from './server.js';
import { ProcessManager } from './process-manager.js';

export function startControlCenter(port = null, options = {}) {
  const finalPort = port || Number(process.env.CONTROL_CENTER_PORT || 8090);
  const processManager = options.processManager || new ProcessManager();
  const server = new ControlCenterServer({ processManager });
  const rawServer = server.createServer();

  // Bind to loopback unless explicitly overridden. These services hold admin/observer
  // credentials and are reached through a local Cloudflare Tunnel, so exposing every
  // network interface is unnecessary.
  const bindHost = process.env.VAWPAY_BIND_HOST || '127.0.0.1';

  return new Promise(resolve => {
    const instance = rawServer.listen(finalPort, bindHost, () => {
      console.log(`[Control Center] Supervisor listening on http://localhost:${finalPort}`);
      resolve({
        server,
        processManager,
        port: finalPort,
        close: async () => {
          await processManager.stopAll();
          return new Promise(cb => instance.close(cb));
        }
      });
    });
  });
}

// Auto-run if executed directly as main script
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startControlCenter();
}
