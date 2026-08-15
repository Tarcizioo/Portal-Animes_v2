import { BarChart2, Compass, RefreshCw, Sparkles, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Hero } from '@/components/home/Hero';
import {
  ContinueWatching,
  ContinueWatchingEmpty,
  ContinueWatchingSkeleton,
} from '@/components/library/ContinueWatching';
import { selectContinueWatching } from '@/components/library/selectContinueWatching';
import { AnimeCarousel } from '@/components/ui/AnimeCarousel';
import { useAuth } from '@/context/AuthContext';
import { useAnimeLibrary } from '@/hooks/useAnimeLibrary';
import { useHomeContent } from '@/hooks/useAnimeDiscovery';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRecommendations } from '@/hooks/useRecommendations';

function HomeHeroSkeleton() {
  return (
    <div
      data-testid="home-hero-loading"
      aria-label="Carregando destaques"
      aria-busy="true"
      className="hero-card relative min-h-[20.5rem] w-full animate-pulse overflow-hidden rounded-[1.75rem] bg-bg-secondary sm:min-h-96 sm:rounded-[2rem] md:min-h-[40.625rem] lg:min-h-[44rem]"
    >
      <div className="absolute inset-0 bg-bg-tertiary/50" />
      <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 sm:p-8 lg:p-12">
        <div className="h-7 w-44 rounded-full bg-bg-secondary" />
        <div className="h-9 w-3/4 max-w-xl rounded-lg bg-bg-secondary sm:h-14" />
        <div className="flex gap-2">
          <div className="h-8 w-20 rounded-full bg-bg-secondary" />
          <div className="h-8 w-24 rounded-full bg-bg-secondary" />
        </div>
        <div className="h-4 w-4/5 max-w-2xl rounded bg-bg-secondary" />
        <div className="flex gap-2 pt-1">
          <div className="h-12 flex-1 rounded-xl bg-bg-secondary sm:max-w-44" />
          <div className="h-12 flex-1 rounded-xl bg-bg-secondary sm:max-w-40" />
        </div>
      </div>
    </div>
  );
}

function HomeHeroUnavailable({ isRefreshing, onRetry }) {
  return (
    <section
      data-testid="home-hero-error"
      className="flex min-h-80 flex-col items-center justify-center rounded-[1.75rem] border border-border-color bg-bg-secondary/70 px-6 py-12 text-center shadow-xl sm:rounded-[2rem] md:min-h-[32rem]"
      role="alert"
    >
      <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary" aria-hidden="true">
        <WifiOff className="h-7 w-7" />
      </span>
      <h1 className="text-2xl font-black text-text-primary">Destaques indisponíveis</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
        Sua biblioteca continua disponível. Tente carregar os destaques novamente em alguns instantes.
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRefreshing}
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-bold text-text-on-primary shadow-lg shadow-primary/20 disabled:cursor-wait disabled:opacity-60"
      >
        <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Tentando novamente...' : 'Tentar novamente'}
      </button>
    </section>
  );
}

function HomeRailSkeleton({ title }) {
  return (
    <section aria-label={`Carregando ${title}`} aria-busy="true" className="space-y-4">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-bg-tertiary" />
      <div className="flex gap-2.5 overflow-hidden sm:gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="w-[30%] shrink-0 sm:w-[24%] lg:w-[19%]">
            <div className="aspect-[2/3] animate-pulse rounded-xl bg-bg-tertiary" />
            <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-bg-tertiary" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-bg-tertiary/70" />
          </div>
        ))}
      </div>
    </section>
  );
}

function RecommendationError({ onRetry, isRetrying }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-color bg-bg-secondary/70 p-4 sm:flex-row sm:items-center sm:justify-between" role="alert">
      <div>
        <p className="font-bold text-text-primary">Não foi possível montar suas recomendações</p>
        <p className="mt-1 text-sm text-text-secondary">Você ainda pode explorar os títulos em alta enquanto tentamos novamente.</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border-color px-4 text-sm font-bold text-primary hover:border-primary disabled:cursor-wait disabled:opacity-60"
      >
        <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
        Tentar novamente
      </button>
    </div>
  );
}

export function Home() {
  const {
    featuredAnimes,
    popularAnimes,
    seasonalAnimes,
    loading,
    error,
    isRefreshing,
    refetch,
  } = useHomeContent({ includeGenreRows: false });
  const { user } = useAuth();
  const {
    library,
    loading: libraryLoading,
    incrementProgress,
  } = useAnimeLibrary();
  const {
    data: recommendations = [],
    isLoading: recommendationsLoading,
    isFetching: recommendationsFetching,
    error: recommendationsError,
    refetch: refetchRecommendations,
  } = useRecommendations(library, {
    enabled: Boolean(user) && !libraryLoading && !loading,
  });

  const continueWatching = selectContinueWatching(library, 4);
  const hasDiscoveryContent = featuredAnimes.length > 0 || popularAnimes.length > 0 || seasonalAnimes.length > 0;
  const heroIsLoading = loading && featuredAnimes.length === 0;
  const hasPersonalizedRecommendations = Boolean(user) && recommendations.length > 0;
  const showRecommendationLoading = Boolean(user) && (libraryLoading || recommendationsLoading);
  const showEditorialFallback = !user || (!showRecommendationLoading && !hasPersonalizedRecommendations);

  usePageTitle('Início');

  const handleIncrementProgress = (animeId, currentEpisode, totalEpisodes) => (
    incrementProgress(animeId, currentEpisode, totalEpisodes, { source: 'home_continue_watching' })
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 pb-6 pt-2 sm:space-y-8 sm:px-6 sm:pt-4 md:space-y-10 lg:px-10 lg:pb-10 lg:pt-6">
      {heroIsLoading ? (
        <HomeHeroSkeleton />
      ) : featuredAnimes.length > 0 ? (
        <Hero animes={featuredAnimes} />
      ) : (
        <HomeHeroUnavailable isRefreshing={isRefreshing} onRetry={refetch} />
      )}

      {user && (
        libraryLoading ? (
          <ContinueWatchingSkeleton variant="home" />
        ) : continueWatching.length > 0 ? (
          <ContinueWatching
            animes={continueWatching}
            onIncrement={handleIncrementProgress}
            variant="home"
            viewAllHref="/library"
          />
        ) : (
          <ContinueWatchingEmpty />
        )
      )}

      {showRecommendationLoading && <HomeRailSkeleton title="Para você" />}

      {user && recommendationsError && !recommendationsLoading && (
        <RecommendationError onRetry={refetchRecommendations} isRetrying={recommendationsFetching} />
      )}

      {hasPersonalizedRecommendations && (
        <AnimeCarousel
          id="recommendations"
          title="Para você"
          icon={Sparkles}
          animes={recommendations}
          variant="home"
          viewAllHref="/discover"
        />
      )}

      {showEditorialFallback && popularAnimes.length > 0 && (
        <AnimeCarousel
          id="popular"
          title="Em alta"
          icon={BarChart2}
          animes={popularAnimes}
          variant="home"
          viewAllHref="/catalog?orderBy=popularity"
        />
      )}

      {!heroIsLoading && error && !hasDiscoveryContent && (
        <Link
          to="/discover"
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border-color bg-bg-secondary px-4 font-bold text-primary"
        >
          <Compass aria-hidden="true" className="h-5 w-5" />
          Abrir Descobrir
        </Link>
      )}
    </div>
  );
}
