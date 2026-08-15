import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { HomeJourneySnapshot } from '../src/components/home/HomeJourneySnapshot';

function renderSnapshot(library) {
  return render(
    <MemoryRouter>
      <HomeJourneySnapshot library={library} />
    </MemoryRouter>,
  );
}

describe('HomeJourneySnapshot', () => {
  it('does not render without local library entries', () => {
    const { container, rerender } = renderSnapshot([]);

    expect(container).toBeEmptyDOMElement();

    rerender(
      <MemoryRouter>
        <HomeJourneySnapshot />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('summarizes the local journey and links to the detailed statistics', () => {
    renderSnapshot([
      { id: 1, currentEp: 12, status: 'completed', isFavorite: true },
      { id: 2, currentEp: 7, status: 'watching', isFavorite: false },
      { id: 3, currentEp: 24, status: 'completed', isFavorite: true },
      { id: 4, currentEp: null, status: 'plan_to_watch' },
    ]);

    expect(screen.getByRole('region', { name: 'Sua jornada' })).toBeInTheDocument();
    expect(screen.getByText('Episódios registrados').nextElementSibling).toHaveTextContent('43');
    expect(screen.getByText('Títulos na biblioteca').nextElementSibling).toHaveTextContent('4');
    expect(screen.getByText('Concluídos').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByText('Favoritos').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByRole('link', { name: 'Ver estatísticas' })).toHaveAttribute('href', '/stats');
  });
});
