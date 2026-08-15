import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Home } from '../src/components/pages/Home';

const state = vi.hoisted(() => ({
  user: null,
  home: {},
  library: [],
  libraryLoading: false,
  libraryError: null,
  retryLibrary: vi.fn(),
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
    error: state.libraryError,
    retry: state.retryLibrary,
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

vi.mock('@/components/home/HomeJourneySnapshot', () => ({
  HomeJourneySnapshot: () => <section data-testid="home-journey-snapshot">Sua jornada</section>,
}));

vi.mock('@/components/ui/AnimeCarousel', () => ({
  AnimeCarousel: ({ id, title, variant, animes = [] }) => (
    <section
      data-testid={`carousel-${id}`}
      data-variant={variant}
      data-anime-ids={animes.map((anime) => anime.id).join(',')}
    >
      {title}
    </section>
  ),
}));

const featuredAnime = { id: 10, title: 'Horizonte Carmesim' };
const popularAnime = { id: 20, title: 'Além do Céu' };
const seasonalAnime = { id: 30, title: 'Primavera Infinita' };
const libraryAnime = {
  id: '1',
  title: 'Ecos do Amanhã',
  status: 'watching',
  currentEp: 8,
  totalEp: 12,
  lastUpdated: { seconds: 10 },
};
const plannedAnime = {
  id: '2',
  title: 'Promessa Estelar',
  status: 'plan_to_watch',
  currentEp: 0,
  totalEp: 24,
  isFavorite: true,
  lastUpdated: { seconds: 30 },
};
const pausedAnime = {
  id: '3',
  title: 'Cidade de Vidro',
  status: 'paused',
  currentEp: 4,
  totalEp: 12,
  lastUpdated: { seconds: 20 },
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
      seasonalAnimes: [seasonalAnime],
      loading: false,
      error: null,
      isRefreshing: false,
      refetch: vi.fn(),
    };
    state.library = [];
    state.libraryLoading = false;
    state.libraryError = null;
    state.retryLibrary.mockReset();
    state.incrementProgress.mockReset().mockResolvedValue(undefined);
    state.recommendations = [];
    state.recommendationsLoading = false;
    state.recommendationsFetching = false;
    state.recommendationsError = null;
    state.refetchRecommendations.mockReset();
    state.useHomeContent.mockReset();
  });

  it('orders the expanded authenticated home after the hero and progress', () => {
    state.user = { uid: 'user-1' };
    state.library = [libraryAnime, plannedAnime, pausedAnime];
    state.recommendations = Array.from({ length: 4 }, (_, index) => ({ id: 100 + index, title: `Recomendação ${index + 1}` }));

    const { container } = renderHome();

    const expectedOrder = [
      screen.getByTestId('hero'),
      screen.getByTestId('continue-watching'),
      screen.getByTestId('carousel-next-choices'),
      screen.getByTestId('carousel-recommendations'),
      screen.getByTestId('home-journey-snapshot'),
      screen.getByTestId('carousel-acclaimed'),
      screen.getByTestId('carousel-seasonal-highlights'),
    ];

    expectedOrder.slice(1).forEach((section, index) => {
      expect(expectedOrder[index].compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    expect(screen.getByTestId('carousel-next-choices')).toHaveTextContent('Sua próxima escolha');
    expect(screen.getByTestId('carousel-recommendations')).toHaveTextContent('Para você');
    expect(screen.getByTestId('carousel-recommendations')).toHaveAttribute('data-variant', 'home');
    expect(screen.getByTestId('carousel-acclaimed')).toHaveTextContent('Aclamados pela comunidade');
    expect(screen.getByTestId('carousel-acclaimed')).toHaveAttribute('data-anime-ids', String(popularAnime.id));
    expect(screen.getByTestId('carousel-seasonal-highlights')).toHaveTextContent('Destaques da temporada');
    expect(container).not.toHaveTextContent('Romance e Amor');
    expect(container).not.toHaveTextContent('Esportes & Competição');
    expect(state.useHomeContent).toHaveBeenCalledWith({ includeGenreRows: false });

    fireEvent.click(screen.getByRole('button', { name: 'Somar episódio' }));
    expect(state.incrementProgress).toHaveBeenCalledWith('1', 8, 12, { source: 'home_continue_watching' });
  });

  it('shows both editorial rails to visitors without personalized sections', () => {
    renderHome();

    expect(screen.getByTestId('carousel-acclaimed')).toHaveTextContent('Aclamados pela comunidade');
    expect(screen.getByTestId('carousel-acclaimed')).toHaveAttribute('data-anime-ids', String(popularAnime.id));
    expect(screen.getByTestId('carousel-seasonal-highlights')).toHaveTextContent('Destaques da temporada');
    expect(screen.getByTestId('carousel-seasonal-highlights')).toHaveAttribute('data-anime-ids', String(seasonalAnime.id));
    expect(screen.queryByTestId('carousel-recommendations')).not.toBeInTheDocument();
    expect(screen.queryByTestId('carousel-next-choices')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-journey-snapshot')).not.toBeInTheDocument();
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

  it('shows a recoverable library error instead of a false empty state', () => {
    state.user = { uid: 'user-1' };
    state.libraryError = new Error('offline');

    renderHome();

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível atualizar sua biblioteca');
    expect(screen.queryByTestId('continue-empty')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(state.retryLibrary).toHaveBeenCalledOnce();
  });
});
