import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfileHeader } from '../src/components/profile/ProfileHeader';
import { SettingsModal } from '../src/components/settings/SettingsModal';

vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ toast: { success: vi.fn(), error: vi.fn() } }),
}));

vi.mock('@/hooks/useModalClose', () => ({ useModalClose: vi.fn() }));
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    deleteAccount: vi.fn(),
    user: {
      displayName: 'Akira',
      email: 'akira@example.com',
      metadata: {},
      providerData: [{ providerId: 'password' }],
    },
  }),
}));
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({ profile: { displayName: 'Akira' } }),
}));
vi.mock('@/hooks/useAppPreferences', () => ({
  useAppPreferences: () => ({ preferences: {}, updatePreference: vi.fn(), resetPreferences: vi.fn() }),
}));
vi.mock('@/hooks/useAnimeLibrary', () => ({
  useAnimeLibrary: () => ({ library: [] }),
}));

describe('profile editing entry points', () => {
  it('opens the identity tab from the primary profile edit action', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(
      <ProfileHeader
        user={{ displayName: 'Akira', metadata: {} }}
        profile={{ displayName: 'Akira' }}
        onEdit={onEdit}
        onShare={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /editar perfil/i }));

    expect(onEdit).toHaveBeenCalledWith('identity');
  });

  it('keeps edit primary and exposes share/settings as touch-sized secondary actions', () => {
    render(
      <ProfileHeader
        user={{ displayName: 'Akira', metadata: {} }}
        profile={{ displayName: 'Akira' }}
        onEdit={vi.fn()}
        onShare={vi.fn()}
        onSettings={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /editar perfil/i })).toHaveClass('min-h-11');
    expect(screen.getByRole('button', { name: /compartilhar perfil/i })).toHaveClass('h-11', 'min-w-11');
    expect(screen.getByRole('button', { name: /abrir configurações/i })).toHaveClass('h-11', 'min-w-11');
  });

  it('does not leak private profile actions in read-only mode', () => {
    render(
      <ProfileHeader
        profile={{ displayName: 'Mika' }}
        readOnly
        onCompatibility={vi.fn()}
        compatibilityScore={82}
        followButton={<button type="button">Seguir Mika</button>}
      />,
    );

    expect(screen.queryByRole('button', { name: /editar perfil/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /compartilhar perfil/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /configurações/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /82% compatível/i })).toHaveClass('min-h-11');
    expect(screen.getByRole('button', { name: 'Seguir Mika' })).toBeInTheDocument();
  });

  it('opens settings directly on a valid requested tab', () => {
    render(<SettingsModal isOpen initialTab="account" onClose={vi.fn()} />);

    expect(screen.getByText('Conta conectada')).toBeInTheDocument();
    expect(screen.queryByText('Seu portal, seu clima.')).not.toBeInTheDocument();
  });

  it('falls back to appearance for an unknown settings tab', () => {
    render(<SettingsModal isOpen initialTab="unknown" onClose={vi.fn()} />);

    expect(screen.getByText('Seu portal, seu clima.')).toBeInTheDocument();
    expect(screen.queryByText('Conta conectada')).not.toBeInTheDocument();
  });
});
