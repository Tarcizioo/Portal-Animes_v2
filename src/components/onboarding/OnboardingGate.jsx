import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Loader } from '@/components/ui/Loader';

function getSafeReturnTo(value) {
  return typeof value === 'string'
    && value.startsWith('/')
    && !value.startsWith('//')
    && !value.startsWith('/login')
    && !value.startsWith('/onboarding')
    ? value
    : null;
}

export function OnboardingGate({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile();
  const location = useLocation();
  const isOnboardingPath = location.pathname === '/onboarding';

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#050505]" aria-label="Preparando seu perfil">
        <Loader />
      </div>
    );
  }

  if (!user && isOnboardingPath) {
    return <Navigate to="/login" replace state={{ returnTo: '/onboarding' }} />;
  }

  // O onboarding melhora a experiência, mas não é uma barreira de autorização.
  // Se o perfil não puder ser lido, preserve a rota atual em vez de assumir
  // incorretamente que o usuário ainda não concluiu a configuração.
  if (user && profileError) {
    return children;
  }

  if (user && profile?.hasCompletedOnboarding !== true && !isOnboardingPath) {
    const currentDestination = `${location.pathname}${location.search}${location.hash}`;
    const requestedDestination = getSafeReturnTo(location.state?.returnTo);
    return (
      <Navigate
        to="/onboarding"
        replace
        state={{ returnTo: requestedDestination || getSafeReturnTo(currentDestination) || '/profile' }}
      />
    );
  }

  if (user && profile?.hasCompletedOnboarding === true && isOnboardingPath) {
    const destination = getSafeReturnTo(location.state?.returnTo) || '/profile';
    return <Navigate to={destination} replace />;
  }

  return children;
}
