import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { BadgesModal } from '../src/components/profile/BadgesModal';
import { FollowersModal } from '../src/components/profile/FollowersModal';
import { ImageModal } from '../src/components/ui/ImageModal';
import { Modal } from '../src/components/ui/Modal';

const dialogState = vi.hoisted(() => ({
  achievements: { stats: {}, unlockedBadges: [] },
  profile: { featuredBadges: [] },
  updateProfileData: vi.fn(),
}));

vi.mock('@/hooks/useFollowList', () => ({
  useFollowList: () => ({ error: null, list: [], loading: false, retry: vi.fn() }),
}));
vi.mock('@/hooks/useFollow', () => ({
  useFollow: () => ({
    follow: vi.fn(),
    isFollowing: false,
    loading: false,
    mutating: false,
    unfollow: vi.fn(),
  }),
}));
vi.mock('@/hooks/useAchievements', () => ({
  useAchievements: () => dialogState.achievements,
}));
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({ profile: dialogState.profile, updateProfileData: dialogState.updateProfileData }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'viewer-1' } }),
}));
vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    toast: { error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() },
  }),
}));

function BaseModalHarness() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>Abrir modal de teste</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modal acessível">
        <button type="button">Primeira ação</button>
        <button type="button">Última ação</button>
      </Modal>
    </>
  );
}

describe('accessible dialog contract', () => {
  it('traps focus in the base modal, closes on Escape and restores the trigger', async () => {
    const user = userEvent.setup();
    render(<BaseModalHarness />);

    const trigger = screen.getByRole('button', { name: 'Abrir modal de teste' });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Modal acessível' });
    const close = screen.getByRole('button', { name: 'Fechar modal' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(close).toHaveClass('h-11', 'w-11');
    expect(document.body.style.overflow).toBe('hidden');
    await waitFor(() => expect(close).toHaveFocus());

    screen.getByRole('button', { name: 'Última ação' }).focus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Modal acessível' })).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(document.body.style.overflow).toBe('');
  });

  it('initializes focus and handles Escape in FollowersModal', async () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <FollowersModal isOpen onClose={onClose} uid="profile-1" />
      </MemoryRouter>,
    );

    const close = screen.getByRole('button', { name: 'Fechar seguidores' });
    await waitFor(() => expect(close).toHaveFocus());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('initializes focus and handles Escape in BadgesModal', async () => {
    const onClose = vi.fn();
    render(<BadgesModal isOpen onClose={onClose} />);

    const close = screen.getByRole('button', { name: 'Fechar conquistas' });
    await waitFor(() => expect(close).toHaveFocus());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('exposes ImageModal as a focus-managed dialog', async () => {
    const onClose = vi.fn();
    render(<ImageModal isOpen onClose={onClose} imageUrl="https://example.com/banner.jpg" altText="Banner de Akira" />);

    const dialog = screen.getByRole('dialog', { name: 'Visualização de Banner de Akira' });
    const close = screen.getByRole('button', { name: 'Fechar' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(close).toHaveClass('min-h-11');
    await waitFor(() => expect(close).toHaveFocus());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
