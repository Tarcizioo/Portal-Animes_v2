import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProfileStats } from '../src/components/profile/ProfileStats';

describe('ProfileStats mobile summary', () => {
  it('keeps a 2 by 2 summary with episodes as the primary metric', () => {
    const { container } = render(
      <ProfileStats library={[
        { id: 1, status: 'completed', currentEp: 12, score: 9 },
        { id: 2, status: 'watching', currentEp: 5, score: 7 },
      ]} />,
    );

    const grid = container.firstElementChild;
    const stats = [...container.querySelectorAll('[data-stat-id]')];
    expect(grid).toHaveClass('grid-cols-2', 'lg:grid-cols-4');
    expect(stats.map((item) => item.dataset.statId)).toEqual([
      'episodes',
      'library',
      'completed',
      'score',
    ]);
    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('Episódios registrados')).toBeInTheDocument();
  });
});
