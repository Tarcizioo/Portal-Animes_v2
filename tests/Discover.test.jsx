import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Discover } from '../src/components/pages/Discover';

const mocks = vi.hoisted(() => ({
  useDiscoverContent: vi.fn(),
}));

vi.mock('@/hooks/useDiscoverContent', () => ({
  useDiscoverContent: mocks.useDiscoverContent,
}));

vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

vi.mock('@/components/ui/ResponsiveImage', () => ({
  ResponsiveImage: ({ alt = '', src, className }) => <img alt={alt} src={src} className={className} />,
}));

const EDITORIAL_ROWS = [
  ['action', 'Ação e Adrenalina', 1],
  ['romance', 'Romance e Amor', 22],
  ['drama', 'Drama e Emoção', 8],
  ['horror', 'Terror e Suspense', 14],
  ['comedy', 'Comédia e Diversão', 4],
  ['fantasy', 'Mundo da Fantasia', 10],
  ['scifi', 'Ficção Científica', 24],
  ['sports', 'Esportes & Competição', 30],
];

function anime(id, title = `Anime ${id}`) {
  return {
    id,
    title,
    image: `https://images.example.com/${id}.jpg`,
    year: 2026,
    genres: ['Action'],
  };
}

function makeDiscoverState() {
  const railAnimes = [anime(11), anime(12), anime(13), anime(14)];

  return {
    season: 'summer',
    year: 2026,
    seasonHighlight: anime(1, 'Destaque principal'),
    newSeasonalAnimes: railAnimes,
    todayReleases: [
      { ...anime(21, 'Episódio um'), episode: 4 },
      { ...anime(22, 'Episódio dois'), episode: 8 },
      { ...anime(23, 'Episódio três'), episode: 12 },
      { ...anime(24, 'Episódio quatro'), episode: 2 },
    ],
    genreRows: EDITORIAL_ROWS.map(([id, title, genreId]) => ({ id, title, genreId, animes: railAnimes })),
    discoveryLoading: false,
    discoveryError: null,
    retryDiscovery: vi.fn(),
    releasesLoading: false,
    releasesError: null,
    retryReleases: vi.fn(),
  };
}

function withoutContent(overrides = {}) {
  const state = makeDiscoverState();
  return {
    ...state,
    seasonHighlight: null,
    newSeasonalAnimes: [],
    todayReleases: [],
    genreRows: state.genreRows.map((row) => ({ ...row, animes: [] })),
    ...overrides,
  };
}

function LocationResult() {
  const location = useLocation();
  return <output data-testid="location-result">{location.pathname}{location.search}</output>;
}

function renderDiscover() {
  return render(
    <MemoryRouter initialEntries={['/discover']}>
      <Routes>
        <Route path="/discover" element={<Discover />} />
        <Route path="/search" element={<LocationResult />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Discover', () => {
  beforeEach(() => {
    mocks.useDiscoverContent.mockReturnValue(makeDiscoverState());
  });

  it('renders the approved discovery structure and all eight editorial rails', () => {
    renderDiscover();

    expect(screen.getByRole('heading', { name: 'Destaque da temporada' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Novos nesta temporada' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lançamentos hoje' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Além dos animes' })).toBeInTheDocument();

    EDITORIAL_ROWS.forEach(([, title]) => {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /Personagens/ })).toHaveAttribute('href', '/characters');
    expect(screen.getByRole('link', { name: /Pessoas/ })).toHaveAttribute('href', '/people');
    expect(screen.getByRole('link', { name: /Estúdios/ })).toHaveAttribute('href', '/search?type=studio');
  });

  it('limits today to exactly three releases and links to the full calendar', () => {
    renderDiscover();

    const todayList = screen.getByTestId('today-release-list');
    expect(within(todayList).getAllByRole('link')).toHaveLength(3);
    expect(within(todayList).queryByText('Episódio quatro')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver semana/ })).toHaveAttribute('href', '/calendar');
  });

  it('connects shortcuts to real catalog filters', () => {
    renderDiscover();

    expect(screen.getByRole('link', { name: /^Gêneros:/ })).toHaveAttribute('href', '/catalog?genre=1&orderBy=popularity');
    expect(screen.getByRole('link', { name: /^Temporada:/ })).toHaveAttribute('href', '/catalog?season=summer&year=2026&orderBy=newest');
    expect(screen.getByRole('link', { name: /^Populares:/ })).toHaveAttribute('href', '/catalog?orderBy=popularity');
    expect(screen.getByRole('link', { name: /^Formatos:/ })).toHaveAttribute('href', '/catalog?type=tv&orderBy=popularity');
  });

  it('submits a trimmed query to the existing global search', async () => {
    const user = userEvent.setup();
    renderDiscover();

    await user.type(screen.getByRole('searchbox', { name: 'Buscar no universo dos animes' }), '  Cowboy Bebop  ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getByTestId('location-result')).toHaveTextContent('/search?q=Cowboy%20Bebop&type=all');
  });

  it('shows progressive loading feedback for each content group', () => {
    mocks.useDiscoverContent.mockReturnValue(withoutContent({
      discoveryLoading: true,
      releasesLoading: true,
    }));
    renderDiscover();

    expect(screen.getByLabelText('Carregando destaque da temporada')).toBeInTheDocument();
    expect(screen.getByLabelText('Carregando lançamentos de hoje')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Carregando títulos')).toHaveLength(9);
  });

  it('keeps retryable errors local to their sections', () => {
    const error = new Error('indisponível');
    mocks.useDiscoverContent.mockReturnValue(withoutContent({
      discoveryError: error,
      releasesError: error,
    }));
    renderDiscover();

    expect(screen.getByText('O destaque da temporada está indisponível.')).toBeInTheDocument();
    expect(screen.getByText('Não foi possível consultar os episódios de hoje.')).toBeInTheDocument();
    expect(screen.getAllByText('Não foi possível carregar esta seleção.')).toHaveLength(9);
  });

  it('shows useful empty states without hiding the rest of discovery', () => {
    mocks.useDiscoverContent.mockReturnValue(withoutContent());
    renderDiscover();

    expect(screen.getByText('A próxima temporada está sendo organizada.')).toBeInTheDocument();
    expect(screen.getByText('Nenhum episódio agendado para hoje.')).toBeInTheDocument();
    expect(screen.getAllByText('Nenhum título nesta seleção agora.')).toHaveLength(9);
    expect(screen.getByRole('heading', { name: 'Além dos animes' })).toBeInTheDocument();
  });
});
