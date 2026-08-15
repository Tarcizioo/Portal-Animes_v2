import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AchievementBadges } from '../src/components/profile/AchievementBadges';
import { BADGES } from '../src/constants/badges';

const state = vi.hoisted(() => ({
  achievements: { stats: {}, unlockedBadges: [], nextBadge: null },
  profile: { featuredBadges: [] },
}));

vi.mock('@/hooks/useAchievements', () => ({
  useAchievements: () => state.achievements,
}));

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({ profile: state.profile, updateProfileData: vi.fn() }),
}));

vi.mock('@/hooks/useModalClose', () => ({ useModalClose: vi.fn() }));
vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ toast: { error: vi.fn(), warning: vi.fn() } }),
}));

describe('AchievementBadges mobile showcase', () => {
  beforeEach(() => {
    state.achievements = {
      stats: {
        totalAnimes: 60,
        completedAnimes: 60,
        episodesWatched: 600,
        ratedAnimes: 25,
        favoriteAnimes: 10,
        uniqueGenres: 12,
      },
      unlockedBadges: BADGES.slice(0, 5),
      nextBadge: BADGES[5],
    };
    state.profile = { featuredBadges: BADGES.slice(0, 3).map((badge) => badge.id) };
  });

  it('renders exactly three featured achievements inside a bounded responsive grid', () => {
    render(<AchievementBadges />);

    const showcase = screen.getByTestId('featured-badges-grid');
    expect(showcase).toHaveClass('max-w-full', 'sm:grid-cols-[repeat(3,minmax(0,1fr))]');
    expect(showcase.children).toHaveLength(3);
    [...showcase.children].forEach((card) => expect(card).toHaveClass('min-w-0', 'max-w-full'));
    expect(screen.getByRole('button', { name: 'Gerenciar conquistas' })).toHaveClass('h-11', 'w-11');
  });

  it('does not expose achievement management on a public profile', () => {
    render(<AchievementBadges readOnly publicLibrary={[]} publicProfile={{ featuredBadges: [] }} />);

    expect(screen.queryByRole('button', { name: 'Gerenciar conquistas' })).not.toBeInTheDocument();
  });
});
