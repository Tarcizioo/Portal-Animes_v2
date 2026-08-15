import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { FavoritesWidget } from '../src/components/profile/FavoritesWidget';

vi.mock('@/components/ui/ResponsiveImage', () => ({
  ResponsiveImage: ({ alt }) => <img alt={alt} />,
}));

vi.mock('@/components/profile/ImageSelectModal', () => ({
  ImageSelectModal: ({ isOpen, item }) => (isOpen ? <div role="dialog">Imagem de {item?.title}</div> : null),
}));

const favorites = [
  { id: 1, title: 'Cowboy Bebop', image: 'bebop.jpg' },
  { id: 2, title: 'Monster', image: 'monster.jpg' },
  { id: 3, title: 'Frieren', image: 'frieren.jpg' },
];

function renderWidget(props = {}) {
  return render(
    <MemoryRouter>
      <FavoritesWidget
        animeFavorites={favorites}
        characterFavorites={[]}
        onReorderAnimes={vi.fn()}
        onReorderCharacters={vi.fn()}
        onUpdateImage={vi.fn()}
        onSetPreferredView={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('FavoritesWidget mobile controls', () => {
  it('keeps reorder and image actions separate from the cover with touch-sized controls', async () => {
    const user = userEvent.setup();
    renderWidget();

    const organize = screen.getByRole('button', { name: 'Organizar' });
    const pin = screen.getByRole('button', { name: 'Definir como aba padrão' });
    expect(organize).toHaveClass('min-h-11');
    expect(pin).toHaveClass('h-11', 'w-11');

    await user.click(organize);

    const drag = screen.getByRole('button', { name: 'Reordenar Cowboy Bebop' });
    const image = screen.getByRole('button', { name: 'Trocar imagem de Cowboy Bebop' });
    expect(drag).toHaveClass('h-11', 'touch-none');
    expect(image).toHaveClass('h-11');
    expect(drag.closest('[aria-label="Ações de Cowboy Bebop"]')).toBe(image.closest('[aria-label="Ações de Cowboy Bebop"]'));

    await user.click(image);
    expect(screen.getByRole('dialog')).toHaveTextContent('Imagem de Cowboy Bebop');
  });

  it('does not expose private organization controls on public profiles', () => {
    renderWidget({ readOnly: true });

    expect(screen.queryByRole('button', { name: 'Organizar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /aba padrão/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reordenar Cowboy Bebop/ })).not.toBeInTheDocument();
  });
});
