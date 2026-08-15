import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ShareProfileModal } from '../src/components/profile/ShareProfileModal';

describe('ShareProfileModal local fallbacks', () => {
  it('renders brand and initials without requesting generic external images', () => {
    const { baseElement } = render(
      <ShareProfileModal
        isOpen
        onClose={vi.fn()}
        user={{ uid: 'user-1', displayName: 'Ana Maria' }}
        profile={{ displayName: 'Ana Maria' }}
        favorites={[]}
        library={[]}
      />,
    );

    expect(screen.getByRole('img', { name: 'Banner padrão do PortalAnimes' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Avatar de Ana Maria' })).toHaveTextContent('AM');
    expect(baseElement.querySelector('[data-share-card-fallback="banner"]')).toBeInTheDocument();
    expect(baseElement.querySelector('[data-share-card-fallback="avatar"]')).toBeInTheDocument();
    expect(document.body.innerHTML).not.toMatch(/placehold\.co|via\.placeholder/i);
  });
});
