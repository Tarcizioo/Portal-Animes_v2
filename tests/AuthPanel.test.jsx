import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthPanel } from '../src/components/auth/AuthPanel';

const authApi = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
  resetPassword: vi.fn(),
  signInGoogle: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authApi,
}));

function renderPanel(props = {}) {
  return render(
    <MemoryRouter>
      <AuthPanel {...props} />
    </MemoryRouter>,
  );
}

describe('AuthPanel', () => {
  beforeEach(() => {
    authApi.signInEmail.mockReset().mockResolvedValue({ uid: 'email-user' });
    authApi.signUpEmail.mockReset().mockResolvedValue({
      user: { uid: 'new-user' },
      verificationSent: true,
    });
    authApi.resetPassword.mockReset().mockResolvedValue(undefined);
    authApi.signInGoogle.mockReset().mockResolvedValue({ uid: 'google-user' });
  });

  it('enters with an email and password without opening Google', async () => {
    const user = userEvent.setup();
    const onAuthenticated = vi.fn();
    renderPanel({ onAuthenticated });

    await user.type(screen.getByLabelText('E-mail'), ' pessoa@exemplo.com ');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar no meu perfil' }));

    await waitFor(() => {
      expect(authApi.signInEmail).toHaveBeenCalledWith('pessoa@exemplo.com', 'senha-segura');
    });
    expect(authApi.signInGoogle).not.toHaveBeenCalled();
    expect(onAuthenticated).toHaveBeenCalledWith({ uid: 'email-user' });
  });

  it('validates and creates an account with a public display name', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('tab', { name: 'Criar conta' }));
    await user.type(screen.getByLabelText('Como você quer aparecer?'), 'Sakura');
    await user.type(screen.getByLabelText('E-mail'), 'sakura@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-forte');
    await user.type(screen.getByLabelText('Confirme a senha'), 'outra-senha');
    await user.click(screen.getByRole('button', { name: 'Criar meu perfil' }));

    expect(screen.getByRole('alert')).toHaveTextContent('As senhas não coincidem');
    expect(authApi.signUpEmail).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Confirme a senha'));
    await user.type(screen.getByLabelText('Confirme a senha'), 'senha-forte');
    await user.click(screen.getByRole('button', { name: 'Criar meu perfil' }));

    await waitFor(() => {
      expect(authApi.signUpEmail).toHaveBeenCalledWith({
        displayName: 'Sakura',
        email: 'sakura@exemplo.com',
        password: 'senha-forte',
      });
    });
  });

  it('sends a generic password recovery response', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.type(screen.getByLabelText('E-mail'), 'conta@exemplo.com');
    await user.click(screen.getByRole('button', { name: 'Esqueci minha senha' }));
    await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));

    await waitFor(() => expect(authApi.resetPassword).toHaveBeenCalledWith('conta@exemplo.com'));
    expect(screen.getByRole('status')).toHaveTextContent('Se existir uma conta');
  });

  it('keeps Google as an explicit alternative', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Continuar com Google' }));

    await waitFor(() => expect(authApi.signInGoogle).toHaveBeenCalledTimes(1));
    expect(authApi.signInEmail).not.toHaveBeenCalled();
  });

  it('translates Firebase errors without exposing the raw message', async () => {
    const user = userEvent.setup();
    authApi.signInEmail.mockRejectedValue({
      code: 'auth/invalid-credential',
      message: 'Firebase: internal credential details',
    });
    renderPanel();

    await user.type(screen.getByLabelText('E-mail'), 'pessoa@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-invalida');
    await user.click(screen.getByRole('button', { name: 'Entrar no meu perfil' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos');
    expect(screen.getByRole('alert')).not.toHaveTextContent('Firebase');
  });
});
