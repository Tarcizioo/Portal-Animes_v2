import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Stats } from '../src/components/pages/Stats';

const statsState = vi.hoisted(() => ({
  error: null,
  library: [],
  loading: false,
  retry: vi.fn(),
}));

vi.mock('@/hooks/useAnimeLibrary', () => ({
  useAnimeLibrary: () => ({
    error: statsState.error,
    library: statsState.library,
    loading: statsState.loading,
    retry: statsState.retry,
  }),
}));

vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

vi.mock('@/components/ui/Loader', () => ({
  Loader: () => <div data-testid="loader" />,
}));

vi.mock('@/components/ui/ResponsiveImage', () => ({
  ResponsiveImage: ({ src, alt, className }) => <img src={src} alt={alt} className={className} />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    article: ({ children, whileHover, ...props }) => {
      void whileHover;
      return <article {...props}>{children}</article>;
    },
  },
}));

vi.mock('recharts', () => {
  const ChartRoot = ({ children }) => <div>{children}</div>;
  const ChartPart = () => null;

  return {
    Bar: ChartPart,
    BarChart: ChartRoot,
    CartesianGrid: ChartPart,
    Cell: ChartPart,
    Legend: ChartPart,
    Pie: ChartRoot,
    PieChart: ChartRoot,
    ResponsiveContainer: ChartRoot,
    Tooltip: ChartPart,
    XAxis: ChartPart,
    YAxis: ChartPart,
  };
});

const library = [
  {
    id: '1', title: 'Primeiro', image: '/primeiro.jpg', status: 'watching', currentEp: 6, totalEp: 12,
    score: 8, isFavorite: true, genres: ['Ação', 'Drama'], type: 'TV', year: 2026,
  },
  {
    id: '2', title: 'Segundo', image: '/segundo.jpg', status: 'completed', currentEp: 24, totalEp: 24,
    score: 10, genres: ['Ação'], type: 'Filme', year: 2025,
  },
  {
    id: '3', title: 'Terceiro', image: '/terceiro.jpg', status: 'plan_to_watch', currentEp: 5, totalEp: 0,
    score: 0, genres: ['Drama'], type: 'Filme', year: 2025,
  },
];

function renderStats() {
  return render(
    <MemoryRouter>
      <Stats />
    </MemoryRouter>,
  );
}

describe('Stats', () => {
  beforeEach(() => {
    statsState.library = library;
    statsState.loading = false;
    statsState.error = null;
    statsState.retry.mockReset();
  });

  it('presents episodes and progress as the primary mobile metrics', () => {
    renderStats();

    const summary = screen.getByRole('region', { name: 'Resumo estatístico' });
    expect(within(summary).getByText('Episódios registrados')).toBeInTheDocument();
    expect(within(summary).getByText('Progresso em episódios')).toBeInTheDocument();
    expect(within(summary).getByText('83%')).toBeInTheDocument();
    expect(within(summary).getByText('30 de 36 episódios conhecidos')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Assistindo' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Em andamento' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Tempo$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^\d+(?:[.,]\d+)?\s*(?:horas?|dias?)$/i)).not.toBeInTheDocument();

    screen.getAllByRole('combobox').forEach((select) => {
      expect(select).toHaveClass('min-h-11');
    });
  });

  it('distinguishes an empty filter result and restores the analysis', () => {
    renderStats();

    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'dropped' } });

    expect(screen.getByRole('heading', { name: 'Nenhum título nesse recorte' })).toBeInTheDocument();
    const resetButton = screen.getByRole('button', { name: 'Limpar filtros' });
    expect(resetButton).toHaveClass('min-h-11');

    fireEvent.click(resetButton);
    expect(screen.getByRole('region', { name: 'Resumo estatístico' })).toBeInTheDocument();
  });

  it('keeps loading and empty-library states explicit', () => {
    statsState.loading = true;
    const { rerender } = renderStats();

    expect(screen.getByRole('status')).toHaveAccessibleName('Carregando estatísticas da biblioteca');

    statsState.loading = false;
    statsState.library = [];
    rerender(
      <MemoryRouter>
        <Stats />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Sua história começa na biblioteca.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar catálogo' })).toHaveClass('min-h-11');
  });

  it('distinguishes a library read error and offers retry', () => {
    statsState.error = new Error('permission-denied');
    statsState.library = [];
    renderStats();

    expect(screen.getByRole('heading', { name: 'Não foi possível calcular suas estatísticas' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sua história começa na biblioteca.' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(statsState.retry).toHaveBeenCalledOnce();
  });
});
