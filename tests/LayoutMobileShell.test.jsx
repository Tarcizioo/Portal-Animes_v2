import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Layout } from '../src/components/layout/Layout';

vi.mock('@/components/layout/AmbientBackdrop', () => ({
  AmbientBackdrop: () => <div data-testid="ambient-backdrop" />,
}));
vi.mock('@/components/layout/BottomNav', () => ({
  BottomNav: () => <nav data-testid="bottom-nav" />,
}));
vi.mock('@/components/layout/Footer', () => ({
  Footer: () => <footer data-testid="footer" />,
}));
vi.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="header" />,
}));
vi.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar" />,
}));
vi.mock('@/context/HeroAmbientContext', () => ({
  HeroAmbientProvider: ({ children }) => children,
}));
vi.mock('@/hooks/usePresence', () => ({ usePresence: vi.fn() }));

function renderLayout(pathname) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Layout><div>Conteúdo da página</div></Layout>
    </MemoryRouter>,
  );
}

describe('Layout mobile shell', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback();
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    HTMLElement.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reserves bottom-nav and safe-area space for every regular page', () => {
    renderLayout('/library');

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('data-layout-variant', 'default');
    expect(main).toHaveClass('pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]', 'md:pb-0');
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it.each(['/login', '/onboarding'])('keeps %s dedicated and free from navigation chrome', (pathname) => {
    renderLayout(pathname);

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('data-layout-variant', 'auth');
    expect(main).not.toHaveClass('pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]');
    expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
    expect(screen.getByText('Conteúdo da página').parentElement).toHaveClass('min-h-full', 'flex-1');
  });
});
