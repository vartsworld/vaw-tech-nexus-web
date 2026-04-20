/**
 * Link metadata utilities for auto-fetching page titles and favicons.
 */

/** Extract the domain from a URL string. */
export function extractDomain(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Google Favicon API — always works, no CORS issues. */
export function getFaviconUrl(url: string, size: number = 32): string {
  const domain = extractDomain(url);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

/** Derive a human-readable name from a URL when no title is available. */
export function deriveNameFromUrl(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const domain = u.hostname.replace(/^www\./, '');
    // Use pathname for context if present
    const path = u.pathname.replace(/\/$/, '');
    if (path && path !== '/') {
      const slug = path.split('/').filter(Boolean).pop() || '';
      // Convert slug to title case: "my-page-slug" → "My Page Slug"
      const readable = slug
        .replace(/[-_]/g, ' ')
        .replace(/\.[^.]+$/, '') // remove file extension
        .replace(/\b\w/g, c => c.toUpperCase());
      if (readable.length > 2) return readable;
    }
    // Capitalize domain parts: "docs.google.com" → "Docs Google"
    return domain
      .split('.')
      .slice(0, -1) // remove TLD
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ') || domain;
  } catch {
    return url;
  }
}

/**
 * Attempt to fetch the page <title> using AllOrigins CORS proxy.
 * Falls back to derived name on failure.
 */
export async function fetchLinkTitle(url: string): Promise<string> {
  const fallback = deriveNameFromUrl(url);
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return fallback;

    const html = await res.text();
    // Extract <title>…</title>
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (match && match[1]) {
      const title = match[1].trim().replace(/\s+/g, ' ');
      // Truncate very long titles
      return title.length > 80 ? title.substring(0, 77) + '…' : title;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/** Build a complete link attachment object. */
export interface LinkAttachment {
  name: string;
  url: string;
  type: 'url';
  favicon: string;
  domain: string;
}

export function buildLinkAttachment(
  url: string,
  customName?: string
): LinkAttachment {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  return {
    name: customName || deriveNameFromUrl(normalizedUrl),
    url: normalizedUrl,
    type: 'url',
    favicon: getFaviconUrl(normalizedUrl),
    domain: extractDomain(normalizedUrl),
  };
}
