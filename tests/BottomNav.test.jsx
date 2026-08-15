import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BottomNav } from '../src/components/layout/BottomNav';

const authState = vi.hoisted(() => ({ user: { uid: 'user-1' } }));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authState,
}));

function renderNav(pathname = '/') {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <BottomNav />
    </MemoryRouter>,
  );
}

describe('BottomNav', () => {
  beforeEach(() => {
    authState.user = { uid: 'user-1' };
  });

  it('renders the four approved destinations in a safe floating capsule', () => {
    renderNav();

    const nav = screen.getByRole('navigation', { name: 'Navegação principal' });
    const links = within(nav).getAllByRole('link');

    expect(links).toHaveLength(4);
    expect(links.map((link) => link.textContent)).toEqual([
      'Início',
      'Descobrir',
      'Biblioteca',
      'Perfil',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/discover',
      '/library',
      '/profile',
    ]);
    links.forEach((link) => {
      expect(link).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    });
    expect(nav).toHaveClass('rounded-full', 'inset-x-3', 'z-50');
    expect(nav).toHaveStyle({ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' });
    expect(screen.queryByText('Menu')).not.toBeInTheDocument();
  });

  it.each([
    ['/discover/season/summer', 'Descobrir'],
    ['/catalog', 'Descobrir'],
    ['/calendar', 'Descobrir'],
    ['/characters/25', 'Descobrir'],
    ['/library/completed', 'Biblioteca'],
    ['/stats', 'Perfil'],
  ])('marks %s under the related primary destination', (pathname, label) => {
    renderNav(pathname);

    expect(screen.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('link').filter((link) => link.hasAttribute('aria-current'))).toHaveLength(1);
  });

  it('sends a visitor to dedicated login without changing the library destination', () => {
    authState.user = null;
    renderNav('/login');

    expect(screen.queryByRole('link', { name: 'Perfil' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Biblioteca' })).toHaveAttribute('href', '/library');
  });
});
