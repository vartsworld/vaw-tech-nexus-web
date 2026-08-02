import { describe, it, expect } from 'vitest';
import { extractDomain, getFaviconUrl, deriveNameFromUrl } from '../linkMetadata';

describe('extractDomain', () => {
  it('should extract domain correctly for http URL', () => {
    expect(extractDomain('http://example.com/path')).toBe('example.com');
  });

  it('should extract domain correctly for https URL', () => {
    expect(extractDomain('https://example.com/path')).toBe('example.com');
  });

  it('should extract domain correctly for URL without protocol', () => {
    expect(extractDomain('example.com/path')).toBe('example.com');
  });

  it('should remove www. prefix', () => {
    expect(extractDomain('https://www.example.com/path')).toBe('example.com');
  });

  it('should return original string if URL parsing fails', () => {
    // This is an invalid URL string that will cause new URL() to throw
    expect(extractDomain('https://%')).toBe('https://%');
  });
});

describe('getFaviconUrl', () => {
  it('should generate a Google Favicon URL for a given URL', () => {
    expect(getFaviconUrl('https://example.com')).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=32');
  });

  it('should allow custom sizes', () => {
    expect(getFaviconUrl('https://example.com', 64)).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=64');
  });

  it('should handle URLs without protocols', () => {
    expect(getFaviconUrl('example.com')).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=32');
  });

  it('should URL encode domains appropriately', () => {
    expect(getFaviconUrl('https://example.com/test?a=1&b=2')).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=32');
  });
});

describe('deriveNameFromUrl', () => {
  it('should derive a name from a simple domain', () => {
    expect(deriveNameFromUrl('https://example.com')).toBe('Example');
  });

  it('should derive a name from a subdomain', () => {
    expect(deriveNameFromUrl('https://docs.google.com')).toBe('Docs Google');
  });

  it('should derive a name from a URL with a path slug', () => {
    expect(deriveNameFromUrl('https://example.com/my-page-slug')).toBe('My Page Slug');
  });

  it('should ignore trailing slashes on paths', () => {
    expect(deriveNameFromUrl('https://example.com/my-page-slug/')).toBe('My Page Slug');
  });

  it('should handle file extensions in the slug', () => {
    expect(deriveNameFromUrl('https://example.com/document.pdf')).toBe('Document');
  });

  it('should fallback to domain name if slug is too short', () => {
    expect(deriveNameFromUrl('https://example.com/a')).toBe('Example');
  });

  it('should work without http/https protocol prefix', () => {
    expect(deriveNameFromUrl('example.com/my-path')).toBe('My Path');
  });

  it('should return original string if URL parsing fails', () => {
    expect(deriveNameFromUrl('https://%')).toBe('https://%');
  });
});
