import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimeDetails } from '../src/components/pages/AnimeDetails';

const mocks = vi.hoisted(() => ({
  addToLibrary: vi.fn(),
  updateProgress: vi.fn(),
  updateStatus: vi.fn(),
  updateRating: vi.fn(),
  toggleFavorite: vi.fn(),
  removeFromLibrary: vi.fn(),
  toastWarning: vi.fn(),
  trackProductEvent: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '21' }),
  Link: ({ children }) => children,
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const motionElement = (tag) => React.forwardRef(function MotionElement({
    initial: _initial,
    animate: _animate,
    exit: _exit,
    transition: _transition,
    whileHover: _whileHover,
    whileInView: _whileInView,
    viewport: _viewport,
    ...props
  }, ref) {
    return React.createElement(tag, { ...props, ref });
  });

  return {
    AnimatePresence: ({ children }) => children,
    motion: {
      div: motionElement('div'),
      img: motionElement('img'),
      section: motionElement('section'),
    },
  };
});

vi.mock('@/hooks/useAnimeInfo', () => ({
  useAnimeInfo: () => ({
    anime: {
      id: 21,
      title: 'Frieren',
      episodes: 12,
      episodesList: [{ mal_id: 1, title: 'The Journey Begins' }],
      images: { jpg: { large_image_url: 'https://example.test/frieren.jpg' } },
      recommendations: [],
      relations: [],
    },
    characters: [],
    recommendations: [],
    staff: [],
    loading: false,
    extrasLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

vi.mock('@/hooks/useAnimeLibrary', () => ({
  useAnimeLibrary: () => ({
    library: [],
    addToLibrary: mocks.addToLibrary,
    updateProgress: mocks.updateProgress,
    updateStatus: mocks.updateStatus,
    updateRating: mocks.updateRating,
    toggleFavorite: mocks.toggleFavorite,
    removeFromLibrary: mocks.removeFromLibrary,
  }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ warning: mocks.toastWarning }),
}));

vi.mock('@/services/productAnalytics', () => ({
  PRODUCT_EVENTS: { ANIME_OPENED: 'anime_opened' },
  trackProductEvent: mocks.trackProductEvent,
}));

vi.mock('@/components/anime/HeroActionCard', () => ({ HeroActionCard: () => null }));
vi.mock('@/components/anime/InfoRow', () => ({ InfoRow: () => null }));
vi.mock('@/components/anime/StatsCard', () => ({ StatsCard: () => null }));
vi.mock('@/components/anime/EpisodesList', () => ({
  EpisodesList: ({ onUpdateProgress }) => (
    <button type="button" onClick={() => onUpdateProgress(3)}>
      Marcar episodio 3
    </button>
  ),
}));
vi.mock('@/components/anime/AnimeSidebar', () => ({ AnimeSidebar: () => null }));
vi.mock('@/components/anime/AnimeRelations', () => ({ AnimeRelations: () => null }));
vi.mock('@/components/ui/ConfirmationModal', () => ({ ConfirmationModal: () => null }));
vi.mock('@/components/comments/CommentsSection', () => ({ CommentsSection: () => null }));
vi.mock('@/components/ui/Loader', () => ({ Loader: () => null }));

describe('AnimeDetails episode progress', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    mocks.addToLibrary.mockResolvedValue(undefined);
    mocks.updateProgress.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('waits for a missing anime to be added before updating its progress', async () => {
    const user = userEvent.setup();
    let resolveAdd;
    mocks.addToLibrary.mockImplementation(() => new Promise((resolve) => {
      resolveAdd = resolve;
    }));

    render(<AnimeDetails />);
    await user.click(screen.getByRole('button', { name: /marcar episodio 3/i }));

    expect(mocks.addToLibrary).toHaveBeenCalledWith(
      expect.objectContaining({ id: 21, title: 'Frieren' }),
      'watching',
      { source: 'anime_details' },
    );
    expect(mocks.updateProgress).not.toHaveBeenCalled();

    await act(async () => resolveAdd());

    await waitFor(() => {
      expect(mocks.updateProgress).toHaveBeenCalledWith(
        21,
        3,
        12,
        { source: 'anime_details' },
      );
    });
    expect(mocks.addToLibrary.mock.invocationCallOrder[0])
      .toBeLessThan(mocks.updateProgress.mock.invocationCallOrder[0]);
  });

  it('does not update progress when adding the anime fails', async () => {
    const user = userEvent.setup();
    const addError = new Error('Firestore unavailable');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.addToLibrary.mockRejectedValue(addError);

    render(<AnimeDetails />);
    await user.click(screen.getByRole('button', { name: /marcar episodio 3/i }));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Erro ao marcar episódio:', addError);
    });
    expect(mocks.updateProgress).not.toHaveBeenCalled();
  });
});
