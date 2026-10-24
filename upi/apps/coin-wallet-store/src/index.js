import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CoinWalletStoreServer } from './server.js';

export function startCoinWalletStore(port = null, options = {}) {
  const finalPort = port || Number(process.env.COIN_STORE_PORT || 5000);
  const storeServer = new CoinWalletStoreServer(options);
  const rawServer = storeServer.createServer();

  // Bind to loopback unless explicitly overridden. These services hold admin/observer
  // credentials and are reached through a local Cloudflare Tunnel, so exposing every
  // network interface is unnecessary.
  const bindHost = process.env.VAWPAY_BIND_HOST || '127.0.0.1';

  return new Promise(resolve => {
    const instance = rawServer.listen(finalPort, bindHost, () => {
      console.log(`[Coin Wallet Store] Demo Store online at http://localhost:${finalPort}`);
      resolve({
        server: storeServer,
        port: finalPort,
        close: () => new Promise(cb => instance.close(cb))
      });
    });
  });
}

// Auto-run if executed directly as main script
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startCoinWalletStore();
}
