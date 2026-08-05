import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HeroActionCard } from '../src/components/anime/HeroActionCard';

const anime = {
  id: 1,
  title: 'Cowboy Bebop',
};

function buildTrackedProps(overrides = {}) {
  return {
    anime,
    libraryEntry: {
      id: '1',
      currentEp: 12,
      totalEp: 24,
      score: 0,
      status: 'watching',
      isFavorite: false,
    },
    status: 'watching',
    currentEp: 12,
    totalEp: 24,
    handleStatusChange: vi.fn().mockResolvedValue(undefined),
    updateProgress: vi.fn().mockResolvedValue(undefined),
    toggleFavorite: vi.fn().mockResolvedValue(undefined),
    updateRating: vi.fn().mockResolvedValue(undefined),
    onRemove: vi.fn(),
    ...overrides,
  };
}

describe('HeroActionCard', () => {
  it('offers distinct actions for watching now or planning to watch', async () => {
    const user = userEvent.setup();
    const handleStatusChange = vi.fn().mockResolvedValue(undefined);

    render(
      <HeroActionCard
        anime={anime}
        libraryEntry={null}
        handleStatusChange={handleStatusChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /começar a acompanhar cowboy bebop/i }));
    await waitFor(() => expect(handleStatusChange).toHaveBeenCalledWith('watching'));

    await user.click(screen.getByRole('button', { name: /planejo assistir/i }));
    await waitFor(() => expect(handleStatusChange).toHaveBeenCalledWith('plan_to_watch'));
  });

  it('shows progress and advances the next episode', async () => {
    const user = userEvent.setup();
    const props = buildTrackedProps();

    render(<HeroActionCard {...props} />);

    expect(screen.getByRole('progressbar', { name: /progresso de cowboy bebop/i })).toHaveAttribute('aria-valuenow', '50');

    await user.click(screen.getByRole('button', { name: /marcar próximo episódio como assistido/i }));
    await waitFor(() => expect(props.updateProgress).toHaveBeenCalledWith('1', 13, 24));
  });

  it('moves a planned anime to watching when progress begins', async () => {
    const user = userEvent.setup();
    const props = buildTrackedProps({
      status: 'plan_to_watch',
      currentEp: 0,
      libraryEntry: {
        id: '1',
        currentEp: 0,
        totalEp: 24,
        score: 0,
        status: 'plan_to_watch',
        isFavorite: false,
      },
    });

    render(<HeroActionCard {...props} />);

    await user.click(screen.getByRole('button', { name: /marcar próximo episódio como assistido/i }));

    await waitFor(() => {
      expect(props.handleStatusChange).toHaveBeenCalledWith('watching');
      expect(props.updateProgress).toHaveBeenCalledWith('1', 1, 24);
    });
    expect(props.handleStatusChange.mock.invocationCallOrder[0]).toBeLessThan(props.updateProgress.mock.invocationCallOrder[0]);
  });

  it('reopens a completed anime when progress is corrected and supports personal ratings', async () => {
    const user = userEvent.setup();
    const props = buildTrackedProps({
      status: 'completed',
      currentEp: 24,
      libraryEntry: {
        id: '1',
        currentEp: 24,
        totalEp: 24,
        score: 7,
        status: 'completed',
        isFavorite: true,
      },
    });

    render(<HeroActionCard {...props} />);

    expect(screen.getByRole('button', { name: /anime já concluído/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /diminuir um episódio/i }));
    await waitFor(() => {
      expect(props.handleStatusChange).toHaveBeenCalledWith('watching');
      expect(props.updateProgress).toHaveBeenCalledWith('1', 23, 24);
    });

    await user.click(screen.getByRole('button', { name: /editar sua nota/i }));
    await user.click(screen.getByRole('button', { name: /dar nota 9 de 10/i }));
    await waitFor(() => expect(props.updateRating).toHaveBeenCalledWith(1, 9));
  });
});
