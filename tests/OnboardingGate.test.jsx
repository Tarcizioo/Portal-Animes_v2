import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingGate } from '../src/components/onboarding/OnboardingGate';

const gateState = vi.hoisted(() => ({
  authLoading: false,
  profile: null,
  profileError: null,
  profileLoading: false,
  user: null,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: gateState.user,
    loading: gateState.authLoading,
  }),
}));

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: gateState.profile,
    error: gateState.profileError,
    loading: gateState.profileLoading,
  }),
}));

vi.mock('@/components/ui/Loader', () => ({
  Loader: () => <div>Carregando gate</div>,
}));

function LocationProbe() {
  const location = useLocation();

  return (
    <div>
      <span>Rota atual: {location.pathname}{location.search}{location.hash}</span>
      <span>Retorno: {location.state?.returnTo || 'nenhum'}</span>
    </div>
  );
}

function renderGate(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <OnboardingGate>
        <LocationProbe />
      </OnboardingGate>
    </MemoryRouter>,
  );
}

describe('OnboardingGate', () => {
  beforeEach(() => {
    gateState.authLoading = false;
    gateState.profile = null;
    gateState.profileError = null;
    gateState.profileLoading = false;
    gateState.user = null;
  });

  it('redirects an incomplete user to onboarding and preserves the full destination', async () => {
    gateState.user = { uid: 'user-incomplete' };
    gateState.profile = { hasCompletedOnboarding: false };

    renderGate('/library?status=watching#next');

    await waitFor(() => {
      expect(screen.getByText('Rota atual: /onboarding')).toBeInTheDocument();
    });
    expect(screen.getByText('Retorno: /library?status=watching#next')).toBeInTheDocument();
  });

  it('preserves the protected destination while authentication finishes on login', async () => {
    gateState.user = { uid: 'user-incomplete' };
    gateState.profile = { hasCompletedOnboarding: false };

    renderGate({
      pathname: '/login',
      state: { returnTo: '/library?status=watching' },
    });

    await waitFor(() => {
      expect(screen.getByText('Rota atual: /onboarding')).toBeInTheDocument();
    });
    expect(screen.getByText('Retorno: /library?status=watching')).toBeInTheDocument();
  });

  it('does not reopen onboarding for a completed user', async () => {
    gateState.user = { uid: 'user-complete' };
    gateState.profile = { hasCompletedOnboarding: true };

    renderGate({
      pathname: '/onboarding',
      state: { returnTo: '/library?status=completed' },
    });

    await waitFor(() => {
      expect(screen.getByText('Rota atual: /library?status=completed')).toBeInTheDocument();
    });
    expect(screen.getByText('Retorno: nenhum')).toBeInTheDocument();
  });

  it('keeps the requested route when the profile read fails', () => {
    gateState.user = { uid: 'user-with-read-error' };
    gateState.profileError = new Error('permission-denied');

    renderGate('/library?status=watching');

    expect(screen.getByText('Rota atual: /library?status=watching')).toBeInTheDocument();
    expect(screen.getByText('Retorno: nenhum')).toBeInTheDocument();
  });

  it('sends a visitor from onboarding to login with the onboarding return path', async () => {
    renderGate('/onboarding');

    await waitFor(() => {
      expect(screen.getByText('Rota atual: /login')).toBeInTheDocument();
    });
    expect(screen.getByText('Retorno: /onboarding')).toBeInTheDocument();
  });
});
