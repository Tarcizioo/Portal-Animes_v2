import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Home } from '../src/components/pages/Home';

const state = vi.hoisted(() => ({
  user: null,
  home: {},
  library: [],
  libraryLoading: false,
  incrementProgress: vi.fn(),
  recommendations: [],
  recommendationsLoading: false,
  recommendationsFetching: false,
  recommendationsError: null,
  refetchRecommendations: vi.fn(),
  useHomeContent: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: state.user }),
}));

vi.mock('@/hooks/useAnimeDiscovery', () => ({
  useHomeContent: (...args) => {
    state.useHomeContent(...args);
    return state.home;
  },
}));

vi.mock('@/hooks/useAnimeLibrary', () => ({
  useAnimeLibrary: () => ({
    library: state.library,
    loading: state.libraryLoading,
    incrementProgress: state.incrementProgress,
  }),
}));

vi.mock('@/hooks/useRecommendations', () => ({
  useRecommendations: () => ({
    data: state.recommendations,
    isLoading: state.recommendationsLoading,
    isFetching: state.recommendationsFetching,
    error: state.recommendationsError,
    refetch: state.refetchRecommendations,
  }),
}));

vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

vi.mock('@/components/home/Hero', () => ({
  Hero: () => <section data-testid="hero">Hero</section>,
}));

vi.mock('@/components/library/ContinueWatching', () => ({
  ContinueWatching: ({ onIncrement }) => (
    <section data-testid="continue-watching">
      Continue acompanhando
      <button type="button" onClick={() => onIncrement('1', 8, 12)}>Somar episódio</button>
    </section>
  ),
  ContinueWatchingEmpty: () => <section data-testid="continue-empty">Sem progresso</section>,
  ContinueWatchingSkeleton: () => <section data-testid="continue-loading">Carregando progresso</section>,
}));

vi.mock('@/components/ui/AnimeCarousel', () => ({
  AnimeCarousel: ({ id, title, variant }) => (
    <section data-testid={`carousel-${id}`} data-variant={variant}>{title}</section>
  ),
}));

const featuredAnime = { id: 10, title: 'Horizonte Carmesim' };
const popularAnime = { id: 20, title: 'Além do Céu' };
const libraryAnime = {
  id: '1',
  title: 'Ecos do Amanhã',
  status: 'watching',
  currentEp: 8,
  totalEp: 12,
  lastUpdated: { seconds: 10 },
};

function renderHome() {
  return render(<MemoryRouter><Home /></MemoryRouter>);
}

describe('Home', () => {
  beforeEach(() => {
    state.user = null;
    state.home = {
      featuredAnimes: [featuredAnime],
      popularAnimes: [popularAnime],
      seasonalAnimes: [],
      loading: false,
      error: null,
      isRefreshing: false,
      refetch: vi.fn(),
    };
    state.library = [];
    state.libraryLoading = false;
    state.incrementProgress.mockReset().mockResolvedValue(undefined);
    state.recommendations = [];
    state.recommendationsLoading = false;
    state.recommendationsFetching = false;
    state.recommendationsError = null;
    state.refetchRecommendations.mockReset();
    state.useHomeContent.mockReset();
  });

  it('keeps the hero first and shows real authenticated sections without genre rows', () => {
    state.user = { uid: 'user-1' };
    state.library = [libraryAnime];
    state.recommendations = Array.from({ length: 4 }, (_, index) => ({ id: 100 + index, title: `Recomendação ${index + 1}` }));

    const { container } = renderHome();

    const hero = screen.getByTestId('hero');
    const continueWatching = screen.getByTestId('continue-watching');
    expect(hero.compareDocumentPosition(continueWatching) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId('carousel-recommendations')).toHaveTextContent('Para você');
    expect(screen.getByTestId('carousel-recommendations')).toHaveAttribute('data-variant', 'home');
    expect(screen.queryByTestId('carousel-popular')).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent('Romance e Amor');
    expect(container).not.toHaveTextContent('Esportes & Competição');
    expect(state.useHomeContent).toHaveBeenCalledWith({ includeGenreRows: false });

    fireEvent.click(screen.getByRole('button', { name: 'Somar episódio' }));
    expect(state.incrementProgress).toHaveBeenCalledWith('1', 8, 12, { source: 'home_continue_watching' });
  });

  it('uses a single editorial fallback for visitors', () => {
    renderHome();

    expect(screen.getByTestId('carousel-popular')).toHaveTextContent('Em alta');
    expect(screen.queryByTestId('carousel-recommendations')).not.toBeInTheDocument();
    expect(screen.queryByTestId('continue-watching')).not.toBeInTheDocument();
    expect(screen.queryByTestId('continue-empty')).not.toBeInTheDocument();
  });

  it('keeps library progress available while the hero is loading', () => {
    state.user = { uid: 'user-1' };
    state.library = [libraryAnime];
    state.home = {
      ...state.home,
      featuredAnimes: [],
      popularAnimes: [],
      loading: true,
    };

    renderHome();

    expect(screen.getByTestId('home-hero-loading')).toBeInTheDocument();
    expect(screen.getByTestId('continue-watching')).toBeInTheDocument();
  });
});
