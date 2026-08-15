import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Header } from '../src/components/layout/Header';

const headerState = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => headerState.navigate };
});

vi.mock('@/hooks/useSearch', async () => {
  const React = await import('react');
  const fixtures = [
    { id: 20, image: 'naruto.jpg', kind: 'anime', score: 8.1, status: 'Finalizado', title: 'Naruto', year: 2002 },
    { id: 85, image: 'kakashi.jpg', kind: 'character', title: 'Kakashi Hatake' },
  ];

  return {
    useSearch: () => {
      const [query, setQueryState] = React.useState('');
      const [type, setType] = React.useState('all');
      const [results, setResults] = React.useState([]);
      const setQuery = (value) => {
        setQueryState(value);
        setResults(value.trim().length >= 2 ? fixtures : []);
      };
      return { isSearching: false, query, results, setQuery, setResults, setType, type };
    },
  };
});

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { displayName: 'Akira' } }),
}));
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({ profile: { displayName: 'Akira' } }),
}));
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({ unreadCount: 0 }),
}));
vi.mock('@/components/notifications/NotificationDropdown', () => ({
  NotificationDropdown: () => null,
}));

describe('Header mobile quick search accessibility', () => {
  it('preserves the mobile brand and exposes a focus-managed keyboard search dialog', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header showMobileBrand hideOnMobile />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'PortalAnimes — Início' })).toBeInTheDocument();
    expect(document.querySelector('[data-app-header]')).toHaveClass('hidden', 'md:flex');

    const opener = screen.getByRole('button', { name: 'Abrir busca' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Busca rápida' });
    const searchbox = screen.getByRole('searchbox', { name: /buscar animes, personagens/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    await waitFor(() => expect(searchbox).toHaveFocus());

    await user.type(searchbox, 'na');
    const naruto = screen.getByRole('button', { name: /Naruto/i });
    expect(naruto).toBeInTheDocument();

    screen.getByRole('button', { name: 'Ver todos os resultados' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Fechar busca' })).toHaveFocus();

    naruto.focus();
    await user.keyboard('{Enter}');
    expect(headerState.navigate).toHaveBeenLastCalledWith('/anime/20');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Busca rápida' })).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
    expect(document.body.style.overflow).toBe('');

    await user.click(opener);
    const reopenedSearchbox = screen.getByRole('searchbox', { name: /buscar animes, personagens/i });
    await user.type(reopenedSearchbox, 'na');
    await user.keyboard('{ArrowDown}');
    expect(reopenedSearchbox).toHaveAttribute('aria-activedescendant', 'mobile-search-result-0');
    await user.keyboard('{Enter}');
    expect(headerState.navigate).toHaveBeenLastCalledWith('/anime/20');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Busca rápida' })).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());

    await user.click(opener);
    const escapeSearchbox = screen.getByRole('searchbox', { name: /buscar animes, personagens/i });
    await waitFor(() => expect(escapeSearchbox).toHaveFocus());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Busca rápida' })).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
  });
});
