import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Onboarding } from '../src/components/pages/Onboarding';

const onboardingState = vi.hoisted(() => ({
  completeOnboarding: vi.fn(),
  profile: null,
  profileLoading: false,
  saveOnboardingProgress: vi.fn(),
  search: {
    error: null,
    results: [],
    retry: vi.fn(),
    status: 'idle',
  },
  signOut: vi.fn(),
  trackProductEvent: vi.fn(),
  user: null,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: onboardingState.user,
    signOut: onboardingState.signOut,
  }),
}));

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: onboardingState.profile,
    loading: onboardingState.profileLoading,
  }),
}));

vi.mock('@/hooks/useOnboardingAnimeSearch', () => ({
  useOnboardingAnimeSearch: () => onboardingState.search,
}));

vi.mock('@/services/onboardingService', () => ({
  completeOnboarding: onboardingState.completeOnboarding,
  saveOnboardingProgress: onboardingState.saveOnboardingProgress,
}));

vi.mock('@/services/productAnalytics', () => ({
  PRODUCT_EVENTS: { ONBOARDING_COMPLETED: 'onboarding_completed' },
  trackProductEvent: onboardingState.trackProductEvent,
}));

vi.mock('@/components/auth/AuthCoverShowcase', () => ({
  AuthCoverShowcase: () => <aside>Capas em movimento</aside>,
}));

vi.mock('@/components/ui/ResponsiveImage', () => ({
  ResponsiveImage: ({ alt = '', ...props }) => <img alt={alt} {...props} />,
}));

const animeResult = {
  mal_id: 5114,
  title: 'Fullmetal Alchemist: Brotherhood',
  title_english: 'Fullmetal Alchemist: Brotherhood',
  type: 'TV',
  year: 2009,
  images: {
    webp: { large_image_url: 'https://example.test/fullmetal.webp' },
  },
};

function deferred() {
  let reject;
  let resolve;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function renderOnboarding(initialEntry = '/onboarding') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/profile" element={<div>Perfil configurado</div>} />
        <Route path="/library" element={<div>Biblioteca de destino</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function advanceToFavorite() {
  fireEvent.click(await screen.findByRole('button', { name: 'Continuar para privacidade' }));

  await waitFor(() => {
    expect(onboardingState.saveOnboardingProgress).toHaveBeenNthCalledWith(1, {
      uid: 'user-1',
      step: 'privacy',
      displayName: 'Usuário Teste',
      about: 'Gosto de aventura',
    });
  });

  fireEvent.click(await screen.findByRole('button', { name: /Perfil público/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar e continuar' }));

  await waitFor(() => {
    expect(onboardingState.saveOnboardingProgress).toHaveBeenNthCalledWith(2, {
      uid: 'user-1',
      step: 'favorite',
      displayName: 'Usuário Teste',
      about: 'Gosto de aventura',
      isPublic: true,
    });
  });

  expect(await screen.findByRole('heading', { name: 'Escolha seu primeiro favorito.' })).toBeInTheDocument();
}

describe('Onboarding page flow and analytics', () => {
  beforeEach(() => {
    onboardingState.user = {
      uid: 'user-1',
      displayName: 'Usuário Teste',
    };
    onboardingState.profileLoading = false;
    onboardingState.profile = {
      displayName: 'Usuário Teste',
      about: 'Gosto de aventura',
      hasCompletedOnboarding: false,
      isPublic: false,
      onboardingStep: 'identity',
    };
    onboardingState.search = {
      error: null,
      results: [animeResult],
      retry: vi.fn(),
      status: 'success',
    };
    onboardingState.completeOnboarding.mockReset().mockResolvedValue(undefined);
    onboardingState.saveOnboardingProgress.mockReset().mockResolvedValue(undefined);
    onboardingState.signOut.mockReset().mockResolvedValue(undefined);
    onboardingState.trackProductEvent.mockReset();
  });

  it('advances through identity and privacy, exposes selectable results, and skips a selected favorite explicitly', async () => {
    const completion = deferred();
    onboardingState.completeOnboarding.mockReturnValueOnce(completion.promise);

    renderOnboarding({
      pathname: '/onboarding',
      state: { returnTo: '/library' },
    });

    await advanceToFavorite();

    const result = screen.getByRole('option', { name: /Fullmetal Alchemist: Brotherhood/ });
    expect(result).toHaveAttribute('aria-selected', 'false');
    fireEvent.click(result);
    expect(result).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Continuar sem favorito' }));

    expect(onboardingState.completeOnboarding).toHaveBeenCalledWith({
      uid: 'user-1',
      displayName: 'Usuário Teste',
      about: 'Gosto de aventura',
      isPublic: true,
      favoriteAnime: null,
    });
    expect(onboardingState.trackProductEvent).not.toHaveBeenCalled();
    expect(screen.queryByText('Biblioteca de destino')).not.toBeInTheDocument();

    await act(async () => completion.resolve());

    await waitFor(() => {
      expect(onboardingState.trackProductEvent).toHaveBeenCalledWith('onboarding_completed', {
        favorite_selected: false,
        library_imported: false,
        import_source: 'none',
      });
      expect(screen.getByText('Biblioteca de destino')).toBeInTheDocument();
    });
  });

  it('keeps the user on the final step and does not track analytics when completion fails', async () => {
    onboardingState.profile = {
      ...onboardingState.profile,
      isPublic: true,
      onboardingStep: 'favorite',
    };
    onboardingState.completeOnboarding.mockRejectedValueOnce(new Error('offline'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderOnboarding();

    const result = await screen.findByRole('option', { name: /Fullmetal Alchemist: Brotherhood/ });
    fireEvent.click(result);
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar meu perfil' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Seu perfil não foi concluído. Nada foi perdido — tente novamente.');
    expect(screen.getByRole('heading', { name: 'Escolha seu primeiro favorito.' })).toBeInTheDocument();
    expect(onboardingState.trackProductEvent).not.toHaveBeenCalled();
    expect(screen.queryByText('Perfil configurado')).not.toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('tracks a successful selected favorite only after persistence and then navigates', async () => {
    onboardingState.profile = {
      ...onboardingState.profile,
      isPublic: false,
      onboardingStep: 'favorite',
    };
    const completion = deferred();
    onboardingState.completeOnboarding.mockReturnValueOnce(completion.promise);

    renderOnboarding();

    fireEvent.click(await screen.findByRole('option', { name: /Fullmetal Alchemist: Brotherhood/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar meu perfil' }));

    expect(onboardingState.completeOnboarding).toHaveBeenCalledWith(expect.objectContaining({
      favoriteAnime: animeResult,
    }));
    expect(onboardingState.trackProductEvent).not.toHaveBeenCalled();

    await act(async () => completion.resolve());

    await waitFor(() => {
      expect(onboardingState.trackProductEvent).toHaveBeenCalledWith('onboarding_completed', {
        favorite_selected: true,
        library_imported: false,
        import_source: 'none',
      });
      expect(screen.getByText('Perfil configurado')).toBeInTheDocument();
    });
  });
});
