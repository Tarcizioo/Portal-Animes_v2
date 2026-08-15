import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Profile } from '../src/components/pages/Profile';

const profileState = vi.hoisted(() => ({
  updateProfileData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'viewer-1', displayName: 'Akira' }, loading: false }),
}));
vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ toast: { error: vi.fn(), success: vi.fn() } }),
}));
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { displayName: 'Akira', profileSectionOrder: [] },
    loading: false,
    updateProfileData: profileState.updateProfileData,
  }),
}));
vi.mock('@/hooks/useAnimeLibrary', () => ({
  useAnimeLibrary: () => ({ library: [], loading: false, updateAnimeImage: vi.fn() }),
}));
vi.mock('@/hooks/useCharacterLibrary', () => ({
  useCharacterLibrary: () => ({ characterLibrary: [], updateCharacterImage: vi.fn() }),
}));
vi.mock('@/hooks/useFavoriteStudios', () => ({
  useFavoriteStudios: () => ({ favoriteStudios: [], toggleFavorite: vi.fn() }),
}));
vi.mock('@/hooks/useFollowCounts', () => ({
  useFollowCounts: () => ({ followersCount: 2, followingCount: 3, loading: false }),
}));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

vi.mock('@/components/profile/ProfileHeader', () => ({
  ProfileHeader: ({ onSettings }) => (
    <div data-testid="profile-header">
      <button type="button" onClick={onSettings}>Abrir configurações no cabeçalho</button>
    </div>
  ),
}));
vi.mock('@/components/profile/ProfileStats', () => ({
  ProfileStats: () => <div data-testid="profile-stats">Resumo 2 por 2</div>,
}));
vi.mock('@/components/profile/ProfileSetupCard', () => ({
  ProfileSetupCard: () => <div data-testid="profile-setup">Configuração do perfil</div>,
}));
vi.mock('@/components/profile/FavoritesWidget', () => ({
  FavoritesWidget: () => <div>Bloco Favoritos</div>,
}));
vi.mock('@/components/profile/AchievementBadges', () => ({
  AchievementBadges: () => <div>Bloco Jornada</div>,
}));
vi.mock('@/components/profile/ProfileActivity', () => ({
  ProfileActivity: () => <div>Bloco Atividade recente</div>,
}));
vi.mock('@/components/profile/ActivityHeatmap', () => ({
  ActivityHeatmap: () => <div>Bloco Mapa de atividade</div>,
}));
vi.mock('@/components/profile/FollowersModal', () => ({ FollowersModal: () => null }));
vi.mock('@/components/settings/SettingsModal', () => ({
  SettingsModal: ({ isOpen }) => (isOpen ? <div role="dialog" aria-label="Configurações">Configurações</div> : null),
}));
vi.mock('@/components/profile/UserSearchModal', () => ({
  UserSearchModal: ({ isOpen }) => (isOpen ? <div role="dialog" aria-label="Explorar comunidade">Explorar comunidade</div> : null),
}));

function sectionOrder() {
  return [...document.querySelectorAll('[data-profile-section]')]
    .map((section) => section.getAttribute('data-profile-section'));
}

describe('Profile mobile structure', () => {
  it('places stats before setup and keeps Favorites, Journey and Activity in one reorderable flow', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Profile /></MemoryRouter>);

    const stats = screen.getByTestId('profile-stats');
    const setup = screen.getByTestId('profile-setup');
    expect(stats.compareDocumentPosition(setup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sectionOrder()).toEqual(['favorites', 'journey', 'recent', 'heatmap']);

    await user.click(screen.getByRole('button', { name: 'Organizar perfil' }));
    expect(screen.getByRole('button', { name: 'Mover Favoritos para cima' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mover Mapa de atividade para baixo' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Mover Favoritos para baixo' }));
    expect(sectionOrder()).toEqual(['journey', 'favorites', 'recent', 'heatmap']);
  });

  it('keeps settings and community reachable from the mobile profile', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Profile /></MemoryRouter>);

    await user.click(screen.getByRole('button', { name: 'Abrir configurações no cabeçalho' }));
    expect(await screen.findByRole('dialog', { name: 'Configurações' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Comunidade/ }));
    expect(await screen.findByRole('dialog', { name: 'Explorar comunidade' })).toBeInTheDocument();
  });
});
