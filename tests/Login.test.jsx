import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Login } from '../src/components/pages/Login';

const authState = vi.hoisted(() => ({
  user: null,
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
  resetPassword: vi.fn(),
  signInGoogle: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('@/components/auth/AuthCoverShowcase', () => ({
  AuthCoverShowcase: () => <aside>Capas em movimento</aside>,
}));

function renderLogin(initialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<div>Perfil autenticado</div>} />
        <Route path="/library" element={<div>Biblioteca autenticada</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function submitCredentials() {
  fireEvent.change(screen.getByLabelText('E-mail'), {
    target: { value: 'pessoa@exemplo.com' },
  });
  fireEvent.change(screen.getByLabelText('Senha'), {
    target: { value: 'senha-segura' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar no meu perfil' }));
}

describe('Login page', () => {
  beforeEach(() => {
    authState.user = null;
    authState.signInEmail.mockReset().mockResolvedValue({ uid: 'email-user' });
    authState.signUpEmail.mockReset().mockResolvedValue({
      user: { uid: 'new-user' },
      verificationSent: true,
    });
    authState.resetPassword.mockReset().mockResolvedValue(undefined);
    authState.signInGoogle.mockReset().mockResolvedValue({ uid: 'google-user' });
  });

  it('returns to the protected destination after signing in', async () => {
    renderLogin({
      pathname: '/login',
      state: { returnTo: '/library' },
    });

    expect(screen.getByText('Entre para continuar para sua biblioteca.')).toBeInTheDocument();

    submitCredentials();

    expect(await screen.findByText('Biblioteca autenticada')).toBeInTheDocument();
  });

  it('sends an authenticated visitor to their profile', async () => {
    authState.user = { uid: 'user-1' };
    renderLogin();

    await waitFor(() => {
      expect(screen.getByText('Perfil autenticado')).toBeInTheDocument();
    });
  });

  it('rejects an external return path and falls back to the profile', async () => {
    renderLogin({
      pathname: '/login',
      state: { returnTo: '//site-malicioso.example' },
    });

    submitCredentials();

    expect(await screen.findByText('Perfil autenticado')).toBeInTheDocument();
  });
});
