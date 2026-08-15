import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AnimeCard } from '../src/components/ui/AnimeCard';
import { AnimeListItem } from '../src/components/ui/AnimeListItem';

vi.mock('@/components/ui/ResponsiveImage', () => ({
  ResponsiveImage: ({ alt }) => <img alt={alt} />,
}));

function renderInsideRouter(element) {
  return render(<MemoryRouter>{element}</MemoryRouter>);
}

describe('library card accessibility', () => {
  it('keeps the grid remove action outside detail links and touch sized', () => {
    renderInsideRouter(
      <AnimeCard id="1" title="Cowboy Bebop" image="cover.jpg" genres={['Sci-Fi']} onRemove={vi.fn()} />,
    );

    const removeButton = screen.getByRole('button', { name: 'Remover Cowboy Bebop da biblioteca' });
    expect(removeButton.closest('a')).toBeNull();
    expect(removeButton).toHaveClass('h-11', 'w-11');
  });

  it('keeps list actions outside links and exposes semantic progress', () => {
    renderInsideRouter(
      <AnimeListItem
        id="2"
        title="Haikyuu"
        image="cover.jpg"
        status="paused"
        currentEp={10}
        totalEp={25}
        showPersonalProgress
        onRemove={vi.fn()}
      />,
    );

    const removeButton = screen.getByRole('button', { name: 'Remover Haikyuu da biblioteca' });
    expect(removeButton.closest('a')).toBeNull();
    expect(removeButton).toHaveClass('h-11', 'w-11', 'opacity-100');
    expect(screen.getByRole('progressbar', { name: 'Progresso de Haikyuu' })).toHaveAttribute('aria-valuetext', '10 de 25 episódios');
    expect(screen.getAllByText('Pausado').length).toBeGreaterThan(0);
  });
});
