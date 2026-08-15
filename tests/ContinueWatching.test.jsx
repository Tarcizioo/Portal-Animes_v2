import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ContinueWatching } from '../src/components/library/ContinueWatching';
import { selectContinueWatching } from '../src/components/library/selectContinueWatching';

const watchingAnime = {
  id: '1',
  title: 'Ecos do Amanhã',
  image: 'https://example.com/ecos.jpg',
  status: 'watching',
  currentEp: 8,
  totalEp: 12,
  lastUpdated: { seconds: 20 },
};

describe('selectContinueWatching', () => {
  it('keeps only active progress, orders it by recency and respects the limit', () => {
    const result = selectContinueWatching([
      watchingAnime,
      { ...watchingAnime, id: '2', title: 'Mais recente', currentEp: 2, lastProgressAt: { seconds: 30 } },
      { ...watchingAnime, id: '3', status: 'completed', currentEp: 12 },
      { ...watchingAnime, id: '4', status: 'plan_to_watch', currentEp: 0 },
      { ...watchingAnime, id: '5', currentEp: 12 },
    ], 2);

    expect(result.map((anime) => anime.id)).toEqual(['2', '1']);
  });
});

describe('ContinueWatching', () => {
  it('shows episode progress and increments only the selected item', async () => {
    let finishUpdate;
    const onIncrement = vi.fn(() => new Promise((resolve) => {
      finishUpdate = resolve;
    }));

    render(
      <MemoryRouter>
        <ContinueWatching
          variant="home"
          animes={[
            watchingAnime,
            { ...watchingAnime, id: '2', title: 'Jornada de Liora', currentEp: 3, totalEp: 24 },
          ]}
          onIncrement={onIncrement}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Continue acompanhando' })).toBeInTheDocument();
    expect(screen.getAllByText(/Episódio/, { exact: false }).length).toBeGreaterThan(1);
    expect(screen.getByText('4 episódios restantes')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Progresso de Ecos do Amanhã' })).toHaveAttribute('aria-valuenow', '67');
    expect(screen.queryByText(/continue assistindo/i)).not.toBeInTheDocument();

    const firstButton = screen.getByRole('button', { name: 'Adicionar um episódio ao progresso de Ecos do Amanhã' });
    const secondButton = screen.getByRole('button', { name: 'Adicionar um episódio ao progresso de Jornada de Liora' });
    fireEvent.click(firstButton);

    expect(onIncrement).toHaveBeenCalledWith('1', 8, 12);
    expect(firstButton).toBeDisabled();
    expect(secondButton).toBeEnabled();

    finishUpdate();
    await waitFor(() => expect(firstButton).toBeEnabled());
  });
});
