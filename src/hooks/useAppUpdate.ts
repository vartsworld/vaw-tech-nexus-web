import { useCallback, useEffect, useRef, useState } from "react";

// Build-time constant injected by vite (see vite.config.ts -> define)
// In dev we fall back to "dev".
const CURRENT_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

const POLL_INTERVAL_MS = 60_000; // check every minute
const VERSION_URL = "/version.json";

interface VersionPayload {
  version: string;
  builtAt?: string;
}

export interface UseAppUpdate {
  /** True when the deployed version differs from the running one */
  updateAvailable: boolean;
  /** Latest version string from the server (or null if not yet fetched) */
  latestVersion: string | null;
  /** Currently running app version */
  currentVersion: string;
  /** True while the very first version check is in flight */
  checking: boolean;
  /** Manually re-check the deployed version */
  checkNow: () => Promise<void>;
  /** Hard-reload the page bypassing caches and unregistering SW */
  applyUpdate: () => Promise<void>;
}

export const useAppUpdate = (): UseAppUpdate => {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkNow = useCallback(async () => {
    try {
      const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data: VersionPayload = await res.json();
      if (!data?.version) return;
      setLatestVersion(data.version);
      // Only flag an update when we have a real (non-"dev") build version
      if (CURRENT_VERSION !== "dev" && data.version !== CURRENT_VERSION) {
        setUpdateAvailable(true);
      } else {
        setUpdateAvailable(false);
      }
    } catch {
      // network glitch — ignore, we'll retry next tick
    } finally {
      setChecking(false);
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    try {
      // Unregister all service workers so the next fetch grabs the fresh assets
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      // Clear all caches (best-effort)
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // ignore — still try to reload
    }
    // Hard reload bypassing cache
    const url = new URL(window.location.href);
    url.searchParams.set("v", Date.now().toString());
    window.location.replace(url.toString());
  }, []);

  useEffect(() => {
    checkNow();
    intervalRef.current = setInterval(checkNow, POLL_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") checkNow();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [checkNow]);

  return {
    updateAvailable,
    latestVersion,
    currentVersion: CURRENT_VERSION,
    checking,
    checkNow,
    applyUpdate,
  };
};
