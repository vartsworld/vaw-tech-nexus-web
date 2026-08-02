import { describe, it, expect } from 'vitest';
import { deriveNameFromUrl } from './linkMetadata';

describe('deriveNameFromUrl', () => {
  it('derives name from a standard URL without path', () => {
    expect(deriveNameFromUrl('https://example.com')).toBe('Example');
  });

  it('derives name from a standard URL with www without path', () => {
    expect(deriveNameFromUrl('https://www.example.com')).toBe('Example');
  });

  it('adds https:// if missing', () => {
    expect(deriveNameFromUrl('example.com')).toBe('Example');
  });

  it('derives name from URL with path slug', () => {
    expect(deriveNameFromUrl('https://example.com/some-page-slug')).toBe('Some Page Slug');
  });

  it('derives name from URL with path slug containing file extension', () => {
    expect(deriveNameFromUrl('https://example.com/document.pdf')).toBe('Document');
  });

  it('derives name from URL with multiple path segments using the last one', () => {
    expect(deriveNameFromUrl('https://example.com/path/to/some-page-slug')).toBe('Some Page Slug');
  });

  it('falls back to domain capitalization if slug is very short', () => {
    expect(deriveNameFromUrl('https://example.com/a')).toBe('Example');
    expect(deriveNameFromUrl('https://example.com/ab')).toBe('Example'); // length <= 2
  });

  it('handles domains without dots (like localhost)', () => {
    expect(deriveNameFromUrl('http://localhost')).toBe('localhost'); // localhost length is 9, but split gives ['localhost'], slice(0,-1) gives [] -> join('') is '' -> fallback to 'localhost'
    expect(deriveNameFromUrl('http://localhost:3000')).toBe('localhost');
  });

  it('capitalizes domain parts if there are multiple', () => {
    expect(deriveNameFromUrl('https://docs.google.com')).toBe('Docs Google');
    expect(deriveNameFromUrl('https://my.sub.domain.com')).toBe('My Sub Domain');
  });

  it('handles mixed underscores and dashes in path', () => {
    expect(deriveNameFromUrl('https://example.com/my_page-slug')).toBe('My Page Slug');
  });

  it('handles trailing slashes in paths', () => {
    expect(deriveNameFromUrl('https://example.com/path/to/my-page/')).toBe('My Page');
    expect(deriveNameFromUrl('https://example.com/')).toBe('Example');
  });

  it('returns original string on invalid URL', () => {
    expect(deriveNameFromUrl('not a valid url')).toBe('not a valid url');
  });
});
