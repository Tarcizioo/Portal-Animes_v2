import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimeCarousel } from '../src/components/ui/AnimeCarousel';

const state = vi.hoisted(() => ({
  preferences: { carouselDensity: 'comfortable', showScores: true },
  swiperProps: null,
}));

vi.mock('swiper/react', () => ({
  Swiper: ({ children, ...props }) => {
    state.swiperProps = props;
    return <div data-testid="swiper">{children}</div>;
  },
  SwiperSlide: ({ children }) => <div>{children}</div>,
}));

vi.mock('swiper/modules', () => ({ Navigation: {} }));

vi.mock('@/hooks/useAppPreferences', () => ({
  useAppPreferences: () => ({ preferences: state.preferences }),
}));

vi.mock('@/components/ui/AnimeCard', () => ({
  AnimeCard: ({ title, genre }) => <div data-testid="anime-card" data-meta={genre}>{title}</div>,
}));

const animes = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  title: `Anime ${index + 1}`,
  episodes: index === 0 ? 12 : 24,
}));

describe('AnimeCarousel', () => {
  beforeEach(() => {
    state.preferences = { carouselDensity: 'comfortable', showScores: true };
    state.swiperProps = null;
  });

  it('uses the Home rail density with three full covers and a visible next cover', () => {
    render(
      <MemoryRouter>
        <AnimeCarousel id="for-you" title="Para você" animes={animes} variant="home" viewAllHref="/discover" />
      </MemoryRouter>,
    );

    expect(state.swiperProps.breakpoints[320]).toMatchObject({ slidesPerView: 3.15, spaceBetween: 8 });
    expect(state.swiperProps.breakpoints[360]).toMatchObject({ slidesPerView: 3.35, spaceBetween: 10 });
    expect(screen.getAllByTestId('anime-card')[0]).toHaveAttribute('data-meta', '12 episódios');
    expect(screen.getByRole('link', { name: 'Ver tudo' })).toHaveAttribute('href', '/discover');
  });

  it('preserves the comfortable density for default carousels', () => {
    render(
      <MemoryRouter>
        <AnimeCarousel id="popular" title="Populares" animes={animes} />
      </MemoryRouter>,
    );

    expect(state.swiperProps.breakpoints[320]).toMatchObject({ slidesPerView: 2.3, spaceBetween: 16 });
    expect(state.swiperProps.breakpoints[360]).toMatchObject({ slidesPerView: 2.3, spaceBetween: 16 });
  });
});
