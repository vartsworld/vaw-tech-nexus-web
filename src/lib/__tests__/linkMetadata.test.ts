import { describe, it, expect } from 'vitest';
import { extractDomain } from '../linkMetadata';

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
