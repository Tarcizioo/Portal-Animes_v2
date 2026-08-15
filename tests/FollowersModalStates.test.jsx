import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FollowersModal } from '../src/components/profile/FollowersModal';

const states = vi.hoisted(() => ({
  followers: { list: [], loading: false, error: null, retry: vi.fn() },
  following: { list: [], loading: false, error: null, retry: vi.fn() },
}));

vi.mock('@/hooks/useModalClose', () => ({ useModalClose: vi.fn() }));
vi.mock('@/hooks/useFollowList', () => ({
  useFollowList: (_uid, type) => states[type],
}));
vi.mock('@/hooks/useFollow', () => ({
  useFollow: () => ({
    follow: vi.fn(),
    unfollow: vi.fn(),
    isFollowing: false,
    loading: false,
    mutating: false,
  }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'viewer-1' } }),
}));
vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() } }),
}));

function renderModal(initialTab = 'followers') {
  return render(
    <MemoryRouter>
      <FollowersModal isOpen onClose={vi.fn()} uid="profile-1" initialTab={initialTab} />
    </MemoryRouter>,
  );
}

describe('FollowersModal responsive states', () => {
  beforeEach(() => {
    states.followers = { list: [], loading: false, error: null, retry: vi.fn() };
    states.following = { list: [], loading: false, error: null, retry: vi.fn() };
  });

  it('distinguishes a subscription error from an empty social list and retries', async () => {
    const user = userEvent.setup();
    states.followers.error = new Error('offline');
    renderModal();

    const dialog = screen.getByRole('dialog', { name: 'Seguidores e seguindo' });
    expect(dialog).toHaveClass('rounded-t-3xl', 'sm:rounded-3xl');
    expect(dialog.closest('.fixed.inset-0')).toHaveClass('items-end', 'sm:items-center');
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar esta lista');
    expect(screen.queryByText('Nenhum seguidor ainda.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(states.followers.retry).toHaveBeenCalledOnce();
  });

  it('shows an explicit empty state when the subscription succeeds without results', () => {
    renderModal();

    expect(screen.getByText('Nenhum seguidor ainda.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps follow actions touch-sized when a list has people', async () => {
    const user = userEvent.setup();
    states.following.list = [{ uid: 'person-2', displayName: 'Mika', photoURL: null }];
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Seguindo' }));

    expect(screen.getByRole('link', { name: 'Mika' })).toHaveAttribute('href', '/u/person-2');
    expect(screen.getByRole('button', { name: 'Seguir Mika' })).toHaveClass('min-h-11');
  });
});
