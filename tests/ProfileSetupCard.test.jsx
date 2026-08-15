import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfileSetupCard } from '../src/components/profile/ProfileSetupCard';

const createActions = () => ({
  onEditIdentity: vi.fn(),
  onEditAppearance: vi.fn(),
  onEditPreferences: vi.fn(),
  onEditPrivacy: vi.fn(),
  onOpenAccount: vi.fn(),
});

describe('ProfileSetupCard', () => {
  it('calculates completion from profile data and keeps account outside the percentage', () => {
    render(
      <ProfileSetupCard
        profile={{
          displayName: 'Akira',
          about: 'Fã de ficção científica',
          favoriteGenres: [],
          isPublic: false,
        }}
        favoriteCount={1}
        {...createActions()}
      />,
    );

    expect(screen.getByRole('progressbar', { name: /conclusão do perfil/i })).toHaveAttribute('aria-valuenow', '75');
    expect(screen.getByRole('button', { name: /revisar identidade/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /completar visual/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /revisar seus gostos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /revisar privacidade/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /conta e segurança/i })).toBeInTheDocument();
  });

  it('shows the checklist progress and calls the matching actions', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    render(
      <ProfileSetupCard
        profile={{ displayName: 'Akira', about: 'Fã de anime', isPublic: true }}
        favoriteCount={0}
        {...actions}
      />,
    );

    expect(screen.getByRole('progressbar', { name: /conclusão do perfil/i })).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByRole('progressbar', { name: /conclusão do perfil/i })).toHaveAttribute('aria-valuetext', '2 de 4 etapas concluídas');

    await user.click(screen.getByRole('button', { name: /completar visual/i }));
    await user.click(screen.getByRole('button', { name: /completar seus gostos/i }));
    await user.click(screen.getByRole('button', { name: /conta e segurança/i }));

    expect(actions.onEditAppearance).toHaveBeenCalledOnce();
    expect(actions.onEditPreferences).toHaveBeenCalledOnce();
    expect(actions.onOpenAccount).toHaveBeenCalledOnce();
  });

  it('uses a compact confirmation when every profile step is complete', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    render(
      <ProfileSetupCard
        profile={{
          displayName: 'Akira',
          about: 'Fã de anime',
          bannerURL: 'https://example.com/banner.jpg',
          favoriteGenres: ['Sci-Fi'],
          isPublic: true,
        }}
        favoriteCount={0}
        {...actions}
      />,
    );

    expect(screen.getByRole('heading', { name: /perfil completo/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /conclusão do perfil/i })).toHaveAttribute('aria-valuenow', '100');
    expect(screen.queryByRole('list', { name: /etapas de configuração/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /revisar perfil/i }));
    await user.click(screen.getByRole('button', { name: /^conta$/i }));

    expect(actions.onEditIdentity).toHaveBeenCalledOnce();
    expect(actions.onOpenAccount).toHaveBeenCalledOnce();
  });
});
