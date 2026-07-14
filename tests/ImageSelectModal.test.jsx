import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/imageGallery', () => ({
  fetchFavoriteImageGallery: vi.fn(),
}));

import { ImageSelectModal } from '../src/components/profile/ImageSelectModal';
import { fetchFavoriteImageGallery } from '../src/services/imageGallery';

function renderModal(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ImageSelectModal
        isOpen
        onClose={vi.fn()}
        onSelect={vi.fn()}
        type="character"
        item={{
          id: 'anilist-character-45627',
          name: 'Levi',
          image: 'https://example.com/current-levi.jpg',
        }}
        {...props}
      />
    </QueryClientProvider>
  );
}

describe('ImageSelectModal', () => {
  beforeEach(() => {
    fetchFavoriteImageGallery.mockReset();
  });

  it('keeps the current card image selectable while alternatives are loading', () => {
    fetchFavoriteImageGallery.mockReturnValue(new Promise(() => {}));
    const onSelect = vi.fn().mockResolvedValue(undefined);

    renderModal({ onSelect });

    const currentImageButton = screen.getByRole('button', { name: 'Manter imagem de Levi' });
    expect(currentImageButton).toBeInTheDocument();
    expect(screen.getAllByAltText('Levi')).not.toHaveLength(0);

    fireEvent.click(currentImageButton);
    expect(onSelect).toHaveBeenCalledWith('https://example.com/current-levi.jpg');
  });
});
