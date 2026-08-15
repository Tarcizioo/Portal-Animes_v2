import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalSearch } from '../src/components/pages/GlobalSearch';

const apiMocks = vi.hoisted(() => ({
  searchStudios: vi.fn(),
  searchCatalog: vi.fn(),
}));

vi.mock('@/services/anilistApi', () => ({
  anilistApi: apiMocks,
}));

vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

function LocationResult() {
  const location = useLocation();
  return <output data-testid="location-result">{location.pathname}{location.search}</output>;
}

function renderSearch(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/search" element={<><GlobalSearch /><LocationResult /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GlobalSearch internal search', () => {
  beforeEach(() => {
    apiMocks.searchStudios.mockResolvedValue({ data: [] });
    apiMocks.searchCatalog.mockResolvedValue({ anime: [], characters: [], people: [] });
  });

  it('keeps the studio category selected and submits a real query from the page', async () => {
    const user = userEvent.setup();
    renderSearch('/search?type=studio');

    const searchbox = screen.getByRole('searchbox', { name: 'Buscar estúdios' });
    expect(searchbox).toHaveValue('');
    expect(screen.getByRole('heading', { name: 'Buscar estúdios' })).toBeInTheDocument();

    await user.type(searchbox, '  Kyoto Animation  ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => {
      expect(screen.getByTestId('location-result')).toHaveTextContent('/search?q=Kyoto+Animation&type=studio');
    });
    await waitFor(() => {
      expect(apiMocks.searchStudios).toHaveBeenCalledWith(
        'Kyoto Animation',
        25,
        expect.objectContaining({ signal: expect.any(Object) }),
      );
    });
    expect(screen.getByRole('searchbox', { name: 'Buscar estúdios' })).toHaveValue('Kyoto Animation');
    expect(apiMocks.searchCatalog).not.toHaveBeenCalled();
  });
});
