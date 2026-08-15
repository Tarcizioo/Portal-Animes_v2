import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { BadgesModal } from '../src/components/profile/BadgesModal';
import { EditProfileModal } from '../src/components/profile/EditProfileModal';
import { FollowersModal } from '../src/components/profile/FollowersModal';
import { ShareProfileModal } from '../src/components/profile/ShareProfileModal';
import { UserSearchModal } from '../src/components/profile/UserSearchModal';

const modalTestState = vi.hoisted(() => ({
  achievements: { stats: {}, unlockedBadges: [] },
  profile: { displayName: 'Akira', featuredBadges: [] },
  updateProfileData: vi.fn(),
}));

vi.mock('@/hooks/useModalClose', () => ({ useModalClose: vi.fn() }));
vi.mock('@/hooks/useImageUpload', () => ({
  useImageUpload: () => ({ uploadImage: vi.fn(), uploading: false }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'viewer-1',
      displayName: 'Akira',
      email: 'akira@example.com',
    },
  }),
}));
vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    toast: {
      error: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    },
  }),
}));
vi.mock('@/hooks/useFollowList', () => ({
  useFollowList: () => ({ list: [], loading: false }),
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
  useAchievements: () => modalTestState.achievements,
}));
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: modalTestState.profile,
    updateProfileData: modalTestState.updateProfileData,
  }),
}));
vi.mock('@/services/userSearch', () => ({
  searchPublicUsers: vi.fn(),
}));

function renderInsideLayout(modal) {
  return render(
    <MemoryRouter>
      <div data-testid="layout-shell">
        <aside data-testid="sidebar-shell" className="relative z-30" />
        <main className="relative z-20">{modal}</main>
      </div>
    </MemoryRouter>,
  );
}

function numericZIndex(element) {
  const layerClass = [...element.classList].find((className) => /^z-(?:\d+|\[\d+\])$/.test(className));
  return layerClass ? Number(layerClass.match(/\d+/)?.[0]) : Number.NaN;
}

function expectBodyLevelModal(dialog) {
  const layoutShell = screen.getByTestId('layout-shell');
  const overlay = dialog.closest('.fixed.inset-0');

  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(layoutShell).not.toContainElement(dialog);
  expect(overlay).not.toBeNull();
  expect(overlay?.parentElement).toBe(document.body);
  expect(numericZIndex(overlay)).toBeGreaterThan(30);
}

describe('profile modal layering', () => {
  it('portals profile editing above the sidebar stacking context', () => {
    renderInsideLayout(
      <EditProfileModal
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        profile={{ displayName: 'Akira', favoriteGenres: [], isPublic: false }}
      />,
    );

    expectBodyLevelModal(screen.getByRole('dialog', { name: 'Editar perfil' }));
  });

  it('keeps the followers overlay outside the layout and exposes modal semantics', () => {
    renderInsideLayout(
      <FollowersModal isOpen onClose={vi.fn()} uid="profile-1" />,
    );

    expectBodyLevelModal(screen.getByRole('dialog'));
  });

  it('keeps the achievements overlay outside the layout and above the sidebar', () => {
    renderInsideLayout(<BadgesModal isOpen onClose={vi.fn()} />);

    expectBodyLevelModal(screen.getByRole('dialog', { name: 'Vitrine de conquistas' }));
  });

  it('keeps the share overlay outside the layout and exposes modal semantics', () => {
    renderInsideLayout(
      <ShareProfileModal
        isOpen
        onClose={vi.fn()}
        user={{ uid: 'viewer-1', displayName: 'Akira' }}
        profile={{ displayName: 'Akira' }}
        favorites={[]}
        library={[]}
      />,
    );

    expectBodyLevelModal(screen.getByRole('dialog'));
  });

  it('inherits safe portal layering from the shared modal used by user search', () => {
    renderInsideLayout(<UserSearchModal isOpen onClose={vi.fn()} />);

    expectBodyLevelModal(screen.getByRole('dialog', { name: /explorar comunidade/i }));
  });
});
