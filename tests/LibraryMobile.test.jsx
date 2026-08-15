import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Library } from '../src/components/pages/Library';

const libraryState = vi.hoisted(() => ({
  error: null,
  library: [],
  loading: false,
  incrementProgress: vi.fn(),
  removeFromLibrary: vi.fn(),
  retry: vi.fn(),
  syncLibraryData: vi.fn(),
  updateStatus: vi.fn(),
}));

const toastApi = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
}));

vi.mock('@/hooks/useAnimeLibrary', () => ({ useAnimeLibrary: () => libraryState }));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/context/ToastContext', () => ({ useToast: () => ({ toast: toastApi }) }));
vi.mock('@/components/library/LibraryOverview', () => ({
  LibraryOverview: () => <div>Resumo da biblioteca</div>,
}));
vi.mock('@/components/library/ContinueWatching', () => ({
  ContinueWatching: () => <div>Continue acompanhando</div>,
}));
vi.mock('@/components/library/LibraryAnimeItem', () => ({
  LibraryAnimeItem: ({ anime, viewMode, onRemove }) => (
    <article>
      {anime.title} — {viewMode}
      <button type="button" onClick={onRemove} aria-label={`Remover ${anime.title}`}>Remover</button>
    </article>
  ),
}));
vi.mock('@/components/ui/ConfirmationModal', () => ({
  ConfirmationModal: ({ isOpen, onClose, onConfirm }) => isOpen ? (
    <div role="dialog" aria-label="Confirmar remoção">
      <button
        type="button"
        onClick={() => {
          void onConfirm();
          onClose();
        }}
      >
        Confirmar remoção
      </button>
    </div>
  ) : null,
}));
vi.mock('@/components/ui/SkeletonCard', () => ({ SkeletonCard: () => <div>Carregando item</div> }));

const library = [
  {
    id: '1',
    title: 'Cowboy Bebop',
    status: 'watching',
    currentEp: 4,
    totalEp: 26,
    genres: ['Romance'],
    type: 'TV',
    year: 1998,
    season: 'spring',
    lastUpdated: { seconds: 20 },
  },
  {
    id: '2',
    title: 'Haikyuu',
    status: 'completed',
    currentEp: 25,
    totalEp: 25,
    genres: ['Sports'],
    type: 'TV',
    year: 2014,
    season: 'spring',
    lastUpdated: { seconds: 10 },
  },
];

function renderLibrary() {
  return render(
    <MemoryRouter>
      <Library />
    </MemoryRouter>,
  );
}

describe('Library mobile experience', () => {
  beforeEach(() => {
    localStorage.clear();
    libraryState.error = null;
    libraryState.library = [];
    libraryState.loading = false;
    libraryState.incrementProgress.mockReset();
    libraryState.removeFromLibrary.mockReset();
    libraryState.retry.mockReset();
    libraryState.syncLibraryData.mockReset();
    libraryState.updateStatus.mockReset();
  });

  it('distinguishes a truly empty library and sends the user to Discover', () => {
    renderLibrary();

    expect(screen.getByRole('heading', { name: 'Sua biblioteca está vazia' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar animes' })).toHaveAttribute('href', '/discover');
    expect(screen.queryByRole('searchbox', { name: 'Pesquisar na biblioteca' })).not.toBeInTheDocument();
  });

  it('distinguishes a read failure from an empty library and retries', async () => {
    const user = userEvent.setup();
    libraryState.error = new Error('permission-denied');

    renderLibrary();

    expect(screen.getByRole('heading', { name: 'Não foi possível carregar sua biblioteca' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sua biblioteca está vazia' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(libraryState.retry).toHaveBeenCalledOnce();
  });

  it('keeps one primary search and exposes advanced filters in an accessible sheet', async () => {
    libraryState.library = library;
    const user = userEvent.setup();
    renderLibrary();

    expect(screen.getAllByRole('searchbox', { name: 'Pesquisar na biblioteca' })).toHaveLength(1);
    expect(screen.getByText('Continue acompanhando')).toBeInTheDocument();

    const trigger = screen.getByRole('button', { name: 'Abrir filtros avançados' });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Filtros avançados' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('combobox', { name: 'Ordenar biblioteca' })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'Filtrar por ano' })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'Filtrar por temporada' })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'Filtrar por formato' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('searchbox')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Romance' }));
    expect(within(dialog).getByRole('button', { name: 'Ver 1 anime' })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Fechar filtros avançados' }));
    expect(screen.queryByRole('dialog', { name: 'Filtros avançados' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(screen.getByText(/Cowboy Bebop/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/Haikyuu —/)).not.toBeInTheDocument());
  });

  it('distinguishes zero filtered results and can restore the collection', async () => {
    libraryState.library = library;
    const user = userEvent.setup();
    renderLibrary();

    await user.type(screen.getByRole('searchbox', { name: 'Pesquisar na biblioteca' }), 'inexistente');

    expect(screen.getByRole('heading', { name: 'Nenhum anime corresponde aos filtros' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar todos os filtros' }));

    expect(screen.queryByRole('heading', { name: 'Nenhum anime corresponde aos filtros' })).not.toBeInTheDocument();
    expect(screen.getByText(/Cowboy Bebop/)).toBeInTheDocument();
    expect(screen.getByText(/Haikyuu/)).toBeInTheDocument();
  });

  it('keeps the confirmation open and avoids success feedback when removal fails', async () => {
    libraryState.library = library;
    libraryState.removeFromLibrary.mockImplementationOnce(async () => {
      toastApi.error('Erro ao remover anime.');
      throw new Error('permission-denied');
    });
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole('button', { name: 'Remover Cowboy Bebop' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar remoção' }));

    await waitFor(() => expect(toastApi.error).toHaveBeenCalled());
    expect(screen.getByRole('dialog', { name: 'Confirmar remoção' })).toBeInTheDocument();
    expect(toastApi.success).not.toHaveBeenCalled();
  });
});
