import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../src/components/ui/ProtectedRoute';

const authState = vi.hoisted(() => ({
  user: null,
  loading: false,
}));

const toastApi = vi.hoisted(() => ({
  warning: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ toast: toastApi }),
}));

function LoginDestination() {
  const location = useLocation();
  return <div>Destino: {location.state?.returnTo}</div>;
}

function renderRoute(initialEntry = '/library?status=watching') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/library"
          element={(
            <ProtectedRoute>
              <div>Biblioteca privada</div>
            </ProtectedRoute>
          )}
        />
        <Route path="/login" element={<LoginDestination />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authState.user = null;
    authState.loading = false;
    toastApi.warning.mockReset();
  });

  it('takes guests to the dedicated login screen and preserves the destination', () => {
    renderRoute();

    expect(screen.getByText('Destino: /library?status=watching')).toBeInTheDocument();
    expect(toastApi.warning).toHaveBeenCalledWith('Entre para continuar.', 'Acesso restrito');
  });

  it('renders protected content for authenticated users', () => {
    authState.user = { uid: 'user-1' };
    renderRoute('/library');

    expect(screen.getByText('Biblioteca privada')).toBeInTheDocument();
  });
});
