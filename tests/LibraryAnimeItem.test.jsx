import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LibraryAnimeItem } from '../src/components/library/LibraryAnimeItem';

vi.mock('@/components/ui/AnimeCard', () => ({
  AnimeCard: ({ title }) => <div>{title}</div>,
}));

vi.mock('@/components/ui/AnimeListItem', () => ({
  AnimeListItem: ({ title }) => <div>{title}</div>,
}));

const anime = {
  id: '1',
  title: 'Cowboy Bebop',
  status: 'watching',
  currentEp: 4,
  totalEp: 26,
};

describe('LibraryAnimeItem', () => {
  it('increments progress and updates status with the current anime data', async () => {
    const user = userEvent.setup();
    const onIncrement = vi.fn().mockResolvedValue(undefined);
    const onStatusChange = vi.fn().mockResolvedValue(undefined);
    render(<LibraryAnimeItem anime={anime} viewMode="grid" onIncrement={onIncrement} onStatusChange={onStatusChange} />);

    await user.click(screen.getByRole('button', { name: /adicionar um episodio/i }));
    await waitFor(() => expect(onIncrement).toHaveBeenCalledWith('1', 4, 26));

    await user.selectOptions(screen.getByRole('combobox', { name: /status de cowboy bebop/i }), 'paused');
    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('1', 'paused', 26));
  });

  it('disables progress updates for a completed anime', () => {
    render(
      <LibraryAnimeItem
        anime={{ ...anime, status: 'completed', currentEp: 26 }}
        viewMode="grid"
        onIncrement={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /ja foi concluido/i })).toBeDisabled();
  });
});
