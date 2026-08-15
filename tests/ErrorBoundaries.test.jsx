import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary';
import { RouteErrorBoundary } from '../src/components/ui/RouteErrorBoundary';

function BrokenContent() {
  throw new Error('Falha de teste');
}

describe('error boundaries', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the global fallback with an accessible retry action and a Lucide icon', () => {
    const { container } = render(
      <ErrorBoundary>
        <BrokenContent />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Ops! Algo deu errado.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar Novamente' })).toHaveClass('min-h-11');
    expect(container.querySelector('.lucide-triangle-alert')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('\u{1F63F}');
  });

  it('shows the route fallback with clear recovery destinations and Lucide icons', () => {
    const { container } = render(
      <MemoryRouter>
        <RouteErrorBoundary>
          <BrokenContent />
        </RouteErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Ops! Esta página teve um problema.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar Novamente' })).toHaveClass('min-h-11');
    expect(screen.getByRole('link', { name: 'Voltar ao Início' })).toHaveAttribute('href', '/');
    expect(container.querySelector('.lucide-triangle-alert')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('\u{1F635}');
  });
});
