import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { CompatibilityModal } from '../src/components/profile/CompatibilityModal';
import { EditProfileModal } from '../src/components/profile/EditProfileModal';
import { ShareProfileModal } from '../src/components/profile/ShareProfileModal';
import { SettingsModal } from '../src/components/settings/SettingsModal';
import { ImageCropModal } from '../src/components/ui/ImageCropModal';

const modalState = vi.hoisted(() => ({
  deleteAccount: vi.fn(),
  exportCSV: vi.fn(),
  exportJSON: vi.fn(),
  html2canvas: vi.fn(),
  resetPreferences: vi.fn(),
  setTheme: vi.fn(),
  updatePreference: vi.fn(),
  updateNotificationPref: vi.fn(),
  updateNotificationPrefs: vi.fn(),
  uploadImage: vi.fn(),
}));

vi.mock('html2canvas', () => ({ default: modalState.html2canvas }));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    deleteAccount: modalState.deleteAccount,
    user: {
      uid: 'viewer-1',
      displayName: 'Akira',
      email: 'akira@example.com',
      metadata: {},
      providerData: [{ providerId: 'password' }],
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
vi.mock('@/hooks/useImageUpload', () => ({
  useImageUpload: () => ({ uploadImage: modalState.uploadImage, uploading: false }),
}));
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: modalState.setTheme }),
}));
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({ profile: { displayName: 'Akira' } }),
}));
vi.mock('@/hooks/useAppPreferences', () => ({
  useAppPreferences: () => ({
    preferences: {
      autoPlayHero: true,
      carouselDensity: 'comfortable',
      hideReadNotifications: false,
      reducedMotion: false,
      showScores: true,
    },
    resetPreferences: modalState.resetPreferences,
    updatePreference: modalState.updatePreference,
  }),
}));
vi.mock('@/hooks/useAnimeLibrary', () => ({
  useAnimeLibrary: () => ({ library: [] }),
}));
vi.mock('@/hooks/useLibraryBackup', () => ({
  useLibraryBackup: () => ({
    commitImport: vi.fn(),
    exportCSV: modalState.exportCSV,
    exportJSON: modalState.exportJSON,
    parseJSON: vi.fn(),
    parseMAL: vi.fn(),
  }),
}));
vi.mock('@/hooks/useNotificationPrefs', () => ({
  useNotificationPrefs: () => ({
    loading: false,
    prefs: { comment_like: true, new_follower: true, profile_view: true },
    updatePref: modalState.updateNotificationPref,
    updatePrefs: modalState.updateNotificationPrefs,
  }),
}));

beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:profile-card'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

function modalLayer(dialog) {
  return dialog.closest('.fixed.inset-0');
}

describe('mobile profile flows', () => {
  it('keeps the edit draft, aligns onboarding limits and confirms discarding it', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <EditProfileModal
        isOpen
        initialTab="identity"
        onClose={onClose}
        onSave={vi.fn()}
        profile={{ displayName: 'Akira', about: '', favoriteGenres: [], isPublic: false }}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Editar perfil' });
    expect(dialog).toHaveClass('h-[100dvh]');
    expect(modalLayer(dialog)).toHaveClass('z-[150]');
    expect(document.body.style.overflow).toBe('hidden');

    const name = screen.getByLabelText('Nome de exibição');
    const bio = screen.getByLabelText('Bio');
    expect(name).toHaveAttribute('minlength', '2');
    expect(name).toHaveAttribute('maxlength', '50');
    expect(bio).toHaveAttribute('maxlength', '500');

    await user.clear(name);
    await user.type(name, 'Akira Nova');
    await user.click(screen.getByRole('button', { name: /voltar e fechar edição/i }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog', { name: 'Descartar alterações?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continuar editando' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /voltar e fechar edição/i }));
    await user.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps all settings destinations and distinguishes local from synchronized data', async () => {
    const user = userEvent.setup();
    render(<SettingsModal isOpen onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: 'Configurações do PortalAnimes' });
    expect(dialog).toHaveClass('h-[100dvh]');
    expect(modalLayer(dialog)).toHaveClass('z-[150]');
    expect(screen.getByText('8 opções')).toBeInTheDocument();
    expect(screen.getByText('Neste dispositivo')).toBeInTheDocument();

    const navigation = screen.getByRole('navigation', { name: 'Seções de configurações' });
    await user.click(within(navigation).getByRole('button', { name: /biblioteca/i }));
    expect(await screen.findByRole('button', { name: 'Selecionar arquivo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exportar json/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exportar csv/i })).toBeInTheDocument();
    expect(screen.getByText('Sincronizado com sua conta')).toBeInTheDocument();

    await user.click(within(navigation).getByRole('button', { name: /notificações/i }));
    expect(await screen.findByText(/categorias ativas/i)).toBeInTheDocument();
    expect(screen.getByText('As alterações são sincronizadas no seu perfil.')).toBeInTheDocument();
  });

  it('renders the share card at 320px without time metrics or emoji and exports a sharp PNG', async () => {
    modalState.html2canvas.mockResolvedValue({
      toBlob: (callback) => callback(new Blob(['png'], { type: 'image/png' })),
    });
    const user = userEvent.setup();

    render(
      <ShareProfileModal
        isOpen
        onClose={vi.fn()}
        user={{ uid: 'viewer-1', displayName: 'Akira' }}
        profile={{ displayName: 'Akira' }}
        favorites={[]}
        library={[
          { currentEp: 12, status: 'completed' },
          { currentEp: 4, status: 'watching' },
        ]}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Compartilhar Perfil' });
    expect(dialog).toHaveClass('h-[100dvh]');
    expect(modalLayer(dialog)).toHaveClass('z-[160]');
    expect(screen.getByText('Episódios')).toBeInTheDocument();
    expect(screen.getByText('Concluídos')).toBeInTheDocument();
    expect(screen.queryByText('Dias')).not.toBeInTheDocument();
    expect(dialog).not.toHaveTextContent(/[😀-🙏🌀-🫿]/u);

    const preview = document.querySelector('[style*="max-width: 560px"]');
    expect(preview).toHaveStyle({ width: '100%', maxWidth: '560px' });

    await user.click(screen.getByRole('button', { name: 'Baixar PNG' }));
    await waitFor(() => expect(modalState.html2canvas).toHaveBeenCalledOnce());
    expect(modalState.html2canvas.mock.calls[0][1].scale).toBeGreaterThanOrEqual(3);
    expect(await screen.findByText(/alta resolução/i)).toBeInTheDocument();
  });

  it('uses a responsive, emoji-free compatibility dialog with accessible progress', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <CompatibilityModal
          isOpen
          onClose={onClose}
          score={84}
          sharedAnimes={[]}
          sharedCount={0}
          genreOverlap={70}
          scoreAffinity={80}
          otherName="Mika"
        />
      </MemoryRouter>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Compatibilidade com Mika' });
    expect(dialog).toHaveClass('h-[100dvh]');
    expect(modalLayer(dialog)).toHaveClass('z-[160]');
    expect(screen.getByText('Combinação excelente')).toBeInTheDocument();
    expect(dialog).not.toHaveTextContent(/[😀-🙏🌀-🫿]/u);
    expect(screen.getByRole('progressbar', { name: /gêneros sobrepostos/i })).toHaveAttribute('aria-valuenow', '70');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps image crop above edit and exposes safe full-screen controls', () => {
    render(
      <ImageCropModal
        imageSrc="data:image/png;base64,iVBORw0KGgo="
        type="avatar"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Foto de perfil' });
    expect(dialog).toHaveClass('h-[100dvh]');
    expect(modalLayer(dialog)).toHaveClass('z-[190]');
    expect(screen.getByRole('button', { name: /voltar sem usar o recorte/i })).toHaveClass('h-11', 'w-11');
  });
});
