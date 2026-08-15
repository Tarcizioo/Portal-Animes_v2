import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { AuthCoverShowcase } from '@/components/auth/AuthCoverShowcase';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useOnboardingAnimeSearch } from '@/hooks/useOnboardingAnimeSearch';
import { usePageTitle } from '@/hooks/usePageTitle';
import { completeOnboarding, saveOnboardingProgress } from '@/services/onboardingService';
import { PRODUCT_EVENTS, trackProductEvent } from '@/services/productAnalytics';

const STEPS = ['identity', 'privacy', 'favorite'];
const STEP_LABELS = {
  identity: 'Seu perfil',
  privacy: 'Privacidade',
  favorite: 'Primeiro favorito',
};

function getSafeReturnTo(value) {
  return typeof value === 'string'
    && value.startsWith('/')
    && !value.startsWith('//')
    && !value.startsWith('/login')
    && !value.startsWith('/onboarding')
    ? value
    : null;
}

function getInitialStep(profile) {
  return STEPS.includes(profile?.onboardingStep) ? profile.onboardingStep : 'identity';
}

function getAnimeImage(anime) {
  return anime?.images?.webp?.large_image_url
    || anime?.images?.jpg?.large_image_url
    || anime?.images?.webp?.image_url
    || anime?.images?.jpg?.image_url
    || anime?.image
    || '';
}

function StepProgress({ activeStep }) {
  const activeIndex = STEPS.indexOf(activeStep);

  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Progresso da configuração do perfil">
      {STEPS.map((step, index) => {
        const complete = index < activeIndex;
        const active = index === activeIndex;
        return (
          <li key={step} aria-current={active ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full transition-colors ${index <= activeIndex ? 'bg-white' : 'bg-white/15'}`} />
            <span className={`mt-2 hidden text-[10px] font-bold sm:block ${active ? 'text-white' : 'text-white/40'}`}>
              {complete ? 'Concluído' : STEP_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function OnboardingExperience({ user, profile, signOut }) {
  const location = useLocation();
  const navigate = useNavigate();
  const titleRef = useRef(null);
  const submitLockRef = useRef(false);
  const initialStep = getInitialStep(profile);
  const [step, setStep] = useState(initialStep);
  const [displayName, setDisplayName] = useState(profile.displayName || user.displayName || '');
  const [about, setAbout] = useState(profile.about || '');
  const [isPublic, setIsPublic] = useState(profile.isPublic === true);
  const [privacyConfirmed, setPrivacyConfirmed] = useState(initialStep === 'favorite');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [status, setStatus] = useState('ready');
  const [errorMessage, setErrorMessage] = useState('');
  const search = useOnboardingAnimeSearch(searchQuery);
  const returnTo = getSafeReturnTo(location.state?.returnTo) || '/profile';
  const activeIndex = STEPS.indexOf(step);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => titleRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [step]);

  const runTransition = async (nextStep, extraData = {}) => {
    if (status === 'saving') return;
    setStatus('saving');
    setErrorMessage('');
    try {
      await saveOnboardingProgress({
        uid: user.uid,
        step: nextStep,
        displayName: displayName.trim(),
        about: about.trim(),
        ...extraData,
      });
      setStep(nextStep);
      setStatus('ready');
    } catch (error) {
      console.error('Erro ao salvar progresso do onboarding:', error);
      setErrorMessage('Não foi possível salvar esta etapa. Confira sua conexão e tente novamente.');
      setStatus('error');
    }
  };

  const handleIdentitySubmit = async (event) => {
    event.preventDefault();
    const normalizedName = displayName.trim();
    if (normalizedName.length < 2) {
      setErrorMessage('Escolha um nome com pelo menos 2 caracteres.');
      return;
    }
    await runTransition('privacy');
  };

  const handlePrivacySubmit = async () => {
    if (!privacyConfirmed) {
      setErrorMessage('Escolha quem poderá ver o seu perfil.');
      return;
    }
    await runTransition('favorite', { isPublic });
  };

  const handleBack = async () => {
    if (activeIndex <= 0 || status === 'saving') return;
    const previousStep = STEPS[activeIndex - 1];
    await runTransition(previousStep, step === 'favorite' ? { isPublic } : {});
  };

  const handleFinish = async (favoriteAnime) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setStatus('saving');
    setErrorMessage('');

    try {
      await completeOnboarding({
        uid: user.uid,
        displayName: displayName.trim(),
        about: about.trim(),
        isPublic,
        favoriteAnime,
      });
      void trackProductEvent(PRODUCT_EVENTS.ONBOARDING_COMPLETED, {
        favorite_selected: Boolean(favoriteAnime),
        library_imported: false,
        import_source: 'none',
      });
      navigate(returnTo, { replace: true });
    } catch (error) {
      console.error('Erro ao concluir onboarding:', error);
      setErrorMessage('Seu perfil não foi concluído. Nada foi perdido — tente novamente.');
      setStatus('error');
      submitLockRef.current = false;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const choosePrivacy = (nextValue) => {
    setIsPublic(nextValue);
    setPrivacyConfirmed(true);
    setErrorMessage('');
  };

  const isSaving = status === 'saving';

  return (
    <section
      data-auth-screen
      className="min-h-full bg-[#050505] sm:p-3 lg:flex lg:min-h-screen lg:items-center lg:justify-center lg:p-5"
      aria-label="Configuração inicial do PortalAnimes"
    >
      <div className="mx-auto grid min-h-screen w-full max-w-[1480px] overflow-hidden bg-[#080808] sm:min-h-[calc(100vh-1.5rem)] sm:rounded-[1.75rem] sm:border sm:border-white/10 sm:shadow-2xl sm:shadow-black/60 lg:h-[calc(100vh-2.5rem)] lg:min-h-[700px] lg:max-h-[980px] lg:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)]">
        <AuthCoverShowcase />

        <main className="relative flex min-h-[680px] min-w-0 flex-col bg-[#080808] px-5 pb-8 pt-5 text-white sm:px-8 lg:min-h-0 lg:px-10 lg:py-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                Etapa {activeIndex + 1} de {STEPS.length}
              </p>
              <p className="mt-1 text-xs font-bold text-white/70">{STEP_LABELS[step]}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSaving}
              className="min-h-11 rounded-full border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
            >
              Sair da conta
            </button>
          </div>

          <div className="mt-5">
            <StepProgress activeStep={step} />
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center py-8 lg:overflow-y-auto">
            <div className="w-full max-w-lg">
              {step === 'identity' && (
                <form onSubmit={handleIdentitySubmit} aria-busy={isSaving}>
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                    <UserRound className="h-4 w-4" /> Comece pela sua identidade
                  </span>
                  <h1 ref={titleRef} tabIndex={-1} className="mt-3 text-3xl font-black tracking-tight outline-none sm:text-4xl">
                    Como você quer aparecer?
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Confirme seu nome e conte um pouco sobre sua relação com animes. Você poderá mudar tudo depois.
                  </p>

                  <div className="mt-7 space-y-5">
                    <div>
                      <label htmlFor="onboarding-name" className="text-xs font-black text-white/85">Nome de exibição</label>
                      <input
                        id="onboarding-name"
                        type="text"
                        value={displayName}
                        onChange={(event) => { setDisplayName(event.target.value); setErrorMessage(''); }}
                        minLength={2}
                        maxLength={50}
                        autoComplete="name"
                        disabled={isSaving}
                        className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-white/[0.045] px-4 text-sm font-semibold text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/35 focus:ring-4 focus:ring-white/5"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <label htmlFor="onboarding-about" className="text-xs font-black text-white/85">Sobre você <span className="font-medium text-white/35">(opcional)</span></label>
                        <span className="text-[10px] font-bold text-white/35">{about.length}/500</span>
                      </div>
                      <textarea
                        id="onboarding-about"
                        value={about}
                        onChange={(event) => setAbout(event.target.value)}
                        maxLength={500}
                        rows={4}
                        disabled={isSaving}
                        placeholder="Ex.: gosto de fantasia, histórias emocionantes e sempre aceito recomendações."
                        className="mt-2 w-full resize-none rounded-xl border border-white/12 bg-white/[0.045] px-4 py-3 text-sm leading-6 text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/35 focus:ring-4 focus:ring-white/5"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={isSaving || displayName.trim().length < 2} className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-45">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Continuar para privacidade
                  </button>
                </form>
              )}

              {step === 'privacy' && (
                <div>
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                    <ShieldCheck className="h-4 w-4" /> Você está no controle
                  </span>
                  <h1 ref={titleRef} tabIndex={-1} className="mt-3 text-3xl font-black tracking-tight outline-none sm:text-4xl">
                    Quem pode ver sua jornada?
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Isso controla a exibição do seu perfil, favoritos, biblioteca e conexões sociais.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2" role="group" aria-label="Visibilidade do perfil">
                    <button
                      type="button"
                      aria-pressed={privacyConfirmed && isPublic}
                      onClick={() => choosePrivacy(true)}
                      disabled={isSaving}
                      className={`rounded-2xl border p-5 text-left transition-colors ${privacyConfirmed && isPublic ? 'border-white bg-white text-black' : 'border-white/12 bg-white/[0.035] text-white hover:border-white/25'}`}
                    >
                      <Eye className="h-5 w-5" />
                      <span className="mt-5 block text-sm font-black">Perfil público</span>
                      <span className={`mt-1 block text-xs leading-5 ${privacyConfirmed && isPublic ? 'text-black/60' : 'text-white/45'}`}>
                        Pessoas podem encontrar seu perfil e conhecer seus favoritos.
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={privacyConfirmed && !isPublic}
                      onClick={() => choosePrivacy(false)}
                      disabled={isSaving}
                      className={`rounded-2xl border p-5 text-left transition-colors ${privacyConfirmed && !isPublic ? 'border-white bg-white text-black' : 'border-white/12 bg-white/[0.035] text-white hover:border-white/25'}`}
                    >
                      <EyeOff className="h-5 w-5" />
                      <span className="mt-5 block text-sm font-black">Perfil privado</span>
                      <span className={`mt-1 block text-xs leading-5 ${privacyConfirmed && !isPublic ? 'text-black/60' : 'text-white/45'}`}>
                        Só você acessa sua jornada até decidir torná-la pública.
                      </span>
                    </button>
                  </div>

                  <div className="mt-7 flex gap-3">
                    <button type="button" onClick={handleBack} disabled={isSaving} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 px-4 text-xs font-black text-white/65 hover:border-white/25 hover:text-white disabled:opacity-45">
                      <ArrowLeft className="h-4 w-4" /> Voltar
                    </button>
                    <button type="button" onClick={handlePrivacySubmit} disabled={isSaving || !privacyConfirmed} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-45">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                      Salvar e continuar
                    </button>
                  </div>
                </div>
              )}

              {step === 'favorite' && (
                <div>
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                    <CheckCircle2 className="h-4 w-4" /> Último toque
                  </span>
                  <h1 ref={titleRef} tabIndex={-1} className="mt-3 text-3xl font-black tracking-tight outline-none sm:text-4xl">
                    Escolha seu primeiro favorito.
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    É opcional, mas ajuda a deixar seu perfil com a sua cara desde o começo.
                  </p>

                  <div className="mt-6">
                    <label htmlFor="onboarding-anime-search" className="text-xs font-black text-white/85">Buscar anime</label>
                    <div className="relative mt-2">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <input
                        id="onboarding-anime-search"
                        type="search"
                        value={searchQuery}
                        onChange={(event) => { setSearchQuery(event.target.value); setSelectedAnime(null); }}
                        disabled={isSaving}
                        placeholder="Digite pelo menos 3 caracteres"
                        className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.045] pl-11 pr-11 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-white/35 focus:ring-4 focus:ring-white/5"
                      />
                      {search.status === 'searching' && <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/60" />}
                    </div>
                  </div>

                  <div className="mt-3 min-h-24" aria-live="polite">
                    {search.status === 'error' && (
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">
                        <span>{search.error}</span>
                        <button type="button" onClick={search.retry} className="shrink-0 font-black underline">Tentar novamente</button>
                      </div>
                    )}

                    {search.status === 'success' && search.results.length === 0 && (
                      <p className="rounded-xl border border-dashed border-white/12 p-4 text-center text-xs text-white/45">Nenhum anime encontrado.</p>
                    )}

                    {search.results.length > 0 && (
                      <div className="custom-scrollbar max-h-60 space-y-2 overflow-y-auto pr-1" role="listbox" aria-label="Resultados de anime">
                        {search.results.map((anime) => {
                          const animeId = anime.mal_id || anime.id;
                          const selected = String(selectedAnime?.mal_id || selectedAnime?.id) === String(animeId);
                          return (
                            <button
                              key={animeId}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => setSelectedAnime(anime)}
                              className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors ${selected ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.035] text-white hover:border-white/25'}`}
                            >
                              <ResponsiveImage src={getAnimeImage(anime)} alt="" width={48} height={68} className="h-14 w-10 shrink-0 rounded-lg object-cover" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-black">{anime.title_english || anime.title}</span>
                                <span className={`mt-1 block text-[10px] ${selected ? 'text-black/55' : 'text-white/40'}`}>{anime.year || 'Ano não informado'} · {anime.type || 'Anime'}</span>
                              </span>
                              {selected && <Check className="h-4 w-4 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" onClick={handleBack} disabled={isSaving} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 px-4 text-xs font-black text-white/65 hover:border-white/25 hover:text-white disabled:opacity-45">
                      <ArrowLeft className="h-4 w-4" /> Voltar
                    </button>
                    <button type="button" onClick={() => handleFinish(null)} disabled={isSaving} className="h-12 rounded-xl border border-white/12 px-4 text-xs font-black text-white/65 hover:border-white/25 hover:text-white disabled:opacity-45">
                      Continuar sem favorito
                    </button>
                    <button type="button" onClick={() => handleFinish(selectedAnime)} disabled={isSaving || !selectedAnime} className="flex h-12 min-w-44 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-45">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Finalizar meu perfil
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs font-semibold leading-5 text-red-200">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}

export function Onboarding() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useUserProfile();

  usePageTitle('Configure seu perfil');

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#050505] text-white">
        <Loader2 className="h-7 w-7 animate-spin" aria-label="Carregando perfil" />
      </div>
    );
  }

  return (
    <OnboardingExperience
      key={user.uid}
      user={user}
      profile={profile || {}}
      signOut={signOut}
    />
  );
}
