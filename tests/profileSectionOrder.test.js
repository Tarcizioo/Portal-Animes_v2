import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROFILE_SECTION_ORDER,
  moveProfileSection,
  normalizeProfileSectionOrder,
} from '../src/components/profile/profileSectionOrder';

describe('profile section order', () => {
  it('uses the mobile hierarchy for a profile without saved preferences', () => {
    expect(normalizeProfileSectionOrder()).toEqual([
      'favorites',
      'journey',
      'recent',
      'heatmap',
    ]);
    expect(DEFAULT_PROFILE_SECTION_ORDER).toHaveLength(4);
  });

  it('inserts Journey after Favorites for a legacy saved order', () => {
    expect(normalizeProfileSectionOrder(['recent', 'favorites', 'heatmap'])).toEqual([
      'recent',
      'favorites',
      'journey',
      'heatmap',
    ]);
  });

  it('deduplicates invalid values and moves sections without mutating the source', () => {
    const source = ['favorites', 'journey', 'recent', 'heatmap'];
    const moved = moveProfileSection(source, 'journey', 1);

    expect(moved).toEqual(['favorites', 'recent', 'journey', 'heatmap']);
    expect(source).toEqual(['favorites', 'journey', 'recent', 'heatmap']);
    expect(moveProfileSection(source, 'favorites', -1)).toBe(source);
    expect(normalizeProfileSectionOrder(['favorites', 'favorites', 'unknown'])).toEqual(source);
  });
});
