import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthCoverShowcase } from '@/components/auth/AuthCoverShowcase';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';

function getSafeReturnTo(value) {
  return typeof value === 'string'
    && value.startsWith('/')
    && !value.startsWith('//')
    && !value.startsWith('/login')
    ? value
    : null;
}

function getDestinationLabel(returnTo) {
  if (returnTo?.startsWith('/library')) return 'sua biblioteca';
  if (returnTo?.startsWith('/stats')) return 'suas estat\u00edsticas';
  if (returnTo?.startsWith('/profile')) return 'seu perfil';
  return null;
}

export function Login() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo = getSafeReturnTo(location.state?.returnTo);
  const destination = returnTo || '/profile';

  usePageTitle('Entrar');

  useEffect(() => {
    if (user) navigate(destination, { replace: true });
  }, [destination, navigate, user]);

  const handleAuthenticated = () => {
    navigate(destination, { replace: true });
  };

  return (
    <section
      data-auth-screen
      className="min-h-full bg-[#050505] sm:p-3 lg:flex lg:min-h-screen lg:items-center lg:justify-center lg:p-5"
      aria-label="Acesso ao PortalAnimes"
    >
      <div className="mx-auto grid min-h-screen w-full max-w-[1480px] overflow-hidden bg-[#080808] sm:min-h-[calc(100vh-1.5rem)] sm:rounded-[1.75rem] sm:border sm:border-white/10 sm:shadow-2xl sm:shadow-black/60 lg:h-[calc(100vh-2.5rem)] lg:min-h-[700px] lg:max-h-[980px] lg:grid-cols-[minmax(0,1.15fr)_minmax(440px,0.85fr)]">
        <AuthCoverShowcase />

        <div className="relative flex min-h-[620px] min-w-0 flex-col bg-[#080808] text-white lg:min-h-0">
          <div className="flex justify-end px-5 pt-5 sm:px-8 sm:pt-7 lg:px-10">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao in&iacute;cio
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-4 sm:px-8 lg:overflow-y-auto lg:px-10 lg:py-8">
            <AuthPanel
              destinationLabel={getDestinationLabel(returnTo)}
              onAuthenticated={handleAuthenticated}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
