import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivityHeatmap } from '../src/components/profile/ActivityHeatmap';
import { buildActivityWeeks } from '../src/components/profile/activityHeatmapUtils';

describe('ActivityHeatmap', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = vi.fn(() => ({ matches: true }));
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.unstubAllGlobals();
  });

  it('prioritizes six months on narrow screens and keeps twelve months available', async () => {
    const user = userEvent.setup();
    render(<ActivityHeatmap activityLog={{ '2026-08-15': 2 }} />);

    expect(screen.getByRole('button', { name: '6 meses' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('activity-heatmap-scroll')).toHaveClass('overflow-x-auto', 'max-w-full');

    await user.click(screen.getByRole('button', { name: '12 meses' }));

    expect(screen.getByRole('button', { name: '12 meses' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Deslize o mapa/)).toBeInTheDocument();
  });

  it('builds exact six and twelve month week sets', () => {
    const referenceDate = new Date('2026-08-15T12:00:00');
    expect(buildActivityWeeks(26, referenceDate)).toHaveLength(26);
    expect(buildActivityWeeks(52, referenceDate)).toHaveLength(52);
    expect(buildActivityWeeks(26, referenceDate).every((week) => week.length === 7)).toBe(true);
  });
});
