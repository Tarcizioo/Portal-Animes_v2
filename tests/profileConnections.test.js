import { describe, expect, it } from 'vitest';
import {
  formatConnectionHandle,
  getConnectionHref,
  normalizeConnectionValue,
} from '../src/utils/profileConnections';

describe('profile connections', () => {
  it('accepts usernames and complete social URLs', () => {
    expect(normalizeConnectionValue('twitter', '@tarcizio_nt')).toBe('tarcizio_nt');
    expect(normalizeConnectionValue('twitter', 'https://x.com/tarcizio_nt?ref=profile')).toBe('tarcizio_nt');
    expect(normalizeConnectionValue('instagram', 'instagram.com/tarcizio.nt/')).toBe('tarcizio.nt');
  });

  it('formats display handles and safe destination URLs', () => {
    expect(formatConnectionHandle('discord', '@tarcizio.dev')).toBe('tarcizio.dev');
    expect(formatConnectionHandle('instagram', 'tarcizio.nt')).toBe('@tarcizio.nt');
    expect(getConnectionHref('twitter', '@anime fan')).toBe('https://x.com/animefan');
    expect(getConnectionHref('discord', 'tarcizio.dev')).toBeNull();
  });

  it('rejects unsupported profile URLs without crashing on malformed text', () => {
    expect(normalizeConnectionValue('twitter', 'https://example.com/alguem')).toBe('');
    expect(() => normalizeConnectionValue('instagram', '%E0%A4%A')).not.toThrow();
    expect(normalizeConnectionValue('instagram', '%E0%A4%A')).toBe('%E0%A4%A');
  });
});
