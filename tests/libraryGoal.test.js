import { describe, expect, it } from 'vitest';
import { calculateWeeklyGoal, getCurrentWeekKeys, normalizeWeeklyGoal } from '../src/utils/libraryGoal';

describe('weekly library goal', () => {
  it('uses Monday through the reference day as the current week', () => {
    const keys = getCurrentWeekKeys(new Date(2026, 6, 8, 12));
    expect(keys).toEqual(['2026-07-06', '2026-07-07', '2026-07-08']);
  });

  it('calculates watched episodes, remaining episodes and progress', () => {
    const result = calculateWeeklyGoal({
      '2026-07-05': 20,
      '2026-07-06': 2,
      '2026-07-07': 3,
      '2026-07-08': 1,
    }, 12, new Date(2026, 6, 8, 12));

    expect(result).toEqual({ goal: 12, watched: 6, progress: 50, remaining: 6 });
  });

  it('keeps goals inside the supported range', () => {
    expect(normalizeWeeklyGoal(0)).toBe(12);
    expect(normalizeWeeklyGoal(-5)).toBe(1);
    expect(normalizeWeeklyGoal(150)).toBe(100);
  });
});
