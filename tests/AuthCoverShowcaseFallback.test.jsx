import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthCoverShowcase } from '../src/components/auth/AuthCoverShowcase';

const queryState = vi.hoisted(() => ({ data: [] }));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: queryState.data }),
}));

vi.mock('@/hooks/useAnimeDiscovery', () => ({
  popularAnimeQueryOptions: { queryKey: ['popular-anime'] },
}));

vi.mock('@/components/ui/ResponsiveImage', () => ({
  ResponsiveImage: ({ src }) => <img data-testid="remote-auth-cover" src={src} alt="" />,
}));

describe('AuthCoverShowcase cover quality', () => {
  beforeEach(() => {
    queryState.data = [
      { id: 1, image: 'https://images.example.com/1.jpg' },
      { id: 2, image: 'https://images.example.com/2.jpg' },
      { id: 3, image: 'https://images.example.com/3.jpg' },
      { id: 4, image: 'https://images.example.com/4.jpg' },
    ];
  });

  it('keeps every real cover and fills only the missing positions with the brand fallback', () => {
    const { container } = render(<AuthCoverShowcase />);

    const realCards = [...container.querySelectorAll('[data-auth-cover-kind="real"]')];
    const fallbackCards = [...container.querySelectorAll('[data-auth-cover-kind="brand-fallback"]')];
    const sources = new Set(realCards.map((card) => card.querySelector('img')?.getAttribute('src')));

    expect(realCards).toHaveLength(8);
    expect(fallbackCards).toHaveLength(28);
    expect(sources).toEqual(new Set(queryState.data.map((cover) => cover.image)));
  });
});
