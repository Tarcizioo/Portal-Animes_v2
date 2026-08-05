import { BarChart2, Calendar, Zap, Heart, Theater, Skull, Smile, Wand2, Rocket, Trophy, Sparkles, RefreshCw, WifiOff } from 'lucide-react';

import { Hero } from "@/components/home/Hero";
import { AnimeCarousel } from '@/components/ui/AnimeCarousel';
import { LazyAnimeCarousel } from '@/components/home/LazyAnimeCarousel';

import { useHomeContent } from '@/hooks/useAnimeDiscovery';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useAnimeLibrary } from '@/hooks/useAnimeLibrary';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SkeletonHero } from '@/components/ui/SkeletonHero';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

const genreCategories = [
  { id: 'action', title: 'Ação e Adrenalina', icon: Zap, genreId: 1 },
  { id: 'romance', title: 'Romance e Amor', icon: Heart, genreId: 22 },
  { id: 'drama', title: 'Drama e Emoção', icon: Theater, genreId: 8 },
  { id: 'horror', title: 'Terror e Suspense', icon: Skull, genreId: 14 },
  { id: 'comedy', title: 'Comédia e Diversão', icon: Smile, genreId: 4 },
  { id: 'fantasy', title: 'Mundo da Fantasia', icon: Wand2, genreId: 10 },
  { id: 'scifi', title: 'Ficção Científica', icon: Rocket, genreId: 24 },
  { id: 'sports', title: 'Esportes & Competição', icon: Trophy, genreId: 30 },
];

const genreNamesById = {
  1: 'Action',
  4: 'Comedy',
  8: 'Drama',
  10: 'Fantasy',
  14: 'Horror',
  22: 'Romance',
  24: 'Sci-Fi',
  30: 'Sports',
};

function uniqueAnimes(animes) {
  return Array.from(new Map((animes || []).filter((anime) => anime?.id).map((anime) => [anime.id, anime])).values());
}

function buildGenreCarousels(animes, genreRows = {}) {
  const directRows = {
    horror: genreRows.horror,
    scifi: genreRows.scifi,
    sports: genreRows.sports,
  };

  return genreCategories.map((category) => {
    const fallback = animes.filter((anime) => (
      anime.genreIds?.includes(category.genreId)
      || anime.genres?.includes(genreNamesById[category.genreId])
    ));
    const direct = directRows[category.id] || [];

    return {
      ...category,
      animes: uniqueAnimes(direct.length ? [...direct, ...fallback] : fallback).slice(0, 18),
    };
  });
}
export function Home() {
  const {
    featuredAnimes,
    popularAnimes,
    seasonalAnimes,
    genreRows,
    loading,
    error,
    isRefreshing,
    refetch,
  } = useHomeContent();

  const { user } = useAuth();
  const { library } = useAnimeLibrary();
  const { data: recommendations } = useRecommendations(library, { enabled: !loading });

  const homeAnimePool = [...popularAnimes, ...seasonalAnimes].filter((anime, index, allAnimes) =>
    allAnimes.findIndex((item) => item.id === anime.id) === index
  );
  const genreCarousels = buildGenreCarousels(homeAnimePool, genreRows);
  const hasHomeContent = featuredAnimes.length > 0 || popularAnimes.length > 0 || seasonalAnimes.length > 0;

  usePageTitle('Início');

  if (!loading && error && !hasHomeContent) {
    return (
      <div className="p-6 lg:p-10">
        <section className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center rounded-3xl border border-border-color bg-bg-secondary/70 px-6 text-center shadow-xl">
          <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-primary">
            <WifiOff className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-text-primary">Os destaques estao indisponiveis</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
            A fonte de animes pode estar instavel ou em pausa. Sua biblioteca continua disponivel enquanto tentamos carregar novamente.
          </p>
          <button
            type="button"
            onClick={refetch}
            disabled={isRefreshing}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Tentando novamente...' : 'Tentar novamente'}
          </button>
        </section>
      </div>
    );
  }

  return (

    <div className="space-y-12 px-6 pb-6 pt-4 lg:px-10 lg:pb-10 lg:pt-6">
      {loading ? (
        <>
          <SkeletonHero />
          <div className="space-y-4">
            <div className="h-8 w-48 bg-bg-tertiary rounded animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {[...Array(5)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-8 w-64 bg-bg-tertiary rounded animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {[...Array(5)].map((_, i) => (
                <SkeletonCard key={i + 10} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <Hero animes={featuredAnimes || []} />

          {/* Recommendations - only for logged in users */}
          {user && recommendations?.length > 0 && (
            <AnimeCarousel
              id="recommendations"
              title="Recomendados Para Você"
              icon={Sparkles}
              animes={recommendations}
            />
          )}

          <AnimeCarousel
            id="popular"
            title="Animes Populares"
            icon={BarChart2}
            animes={popularAnimes}
          />

          <AnimeCarousel
            id="seasonal"
            title="Lançamentos da Temporada"
            icon={Calendar}
            animes={seasonalAnimes}
          />

          {/* --- CAROUSEIS (Lazy Loaded) --- */}
          {genreCarousels.map((category) => (
            <LazyAnimeCarousel
              key={category.id}
              id={category.id}
              title={category.title}
              icon={category.icon}
              animes={category.animes}
            />
          ))}
        </>
      )}
    </div>

  );
}

