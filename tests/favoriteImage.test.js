import { describe, expect, it } from 'vitest';
import { estimateDataUrlBytes, normalizeImageUrl } from '../src/utils/favoriteImage';

describe('favorite image helpers', () => {
  it('accepts HTTPS image URLs', () => {
    expect(normalizeImageUrl(' https://example.com/cover.jpg ')).toBe('https://example.com/cover.jpg');
  });

  it('rejects malformed and insecure URLs', () => {
    expect(() => normalizeImageUrl('not-a-url')).toThrow('URL valida');
    expect(() => normalizeImageUrl('http://example.com/cover.jpg')).toThrow('HTTPS');
  });

  it('estimates decoded base64 size', () => {
    expect(estimateDataUrlBytes('data:image/webp;base64,AAAA')).toBe(3);
  });
});
