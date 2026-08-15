import { ArrowRight, Compass, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

function HeroSkeleton() {
  return <div className="min-h-[12.5rem] animate-pulse rounded-3xl border border-border-color bg-bg-secondary sm:min-h-80" aria-label="Carregando destaque da temporada" />;
}

export function DiscoverHero({ anime, loading, error, onRetry }) {
  return (
    <section aria-labelledby="season-highlight-title">
      <h2 id="season-highlight-title" className="mb-2 text-base font-black tracking-tight text-text-primary sm:mb-3 sm:text-xl">Destaque da temporada</h2>

      {loading && !anime ? <HeroSkeleton /> : null}

      {!loading && error && !anime ? (
        <div role="alert" className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 px-6 text-center">
          <p className="font-bold text-text-primary">O destaque da temporada está indisponível.</p>
          <button type="button" onClick={onRetry} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-color px-4 text-xs font-black text-text-secondary hover:border-primary/40 hover:text-text-primary">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Tentar novamente
          </button>
        </div>
      ) : null}

      {!loading && !error && !anime ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border-color bg-bg-secondary/40 px-6 text-center">
          <Compass className="h-7 w-7 text-text-secondary/50" aria-hidden="true" />
          <p className="mt-3 font-bold text-text-primary">A próxima temporada está sendo organizada.</p>
          <p className="mt-1 text-xs text-text-secondary">Explore os populares enquanto novos títulos chegam ao catálogo.</p>
        </div>
      ) : null}

      {anime ? (
        <article className="relative min-h-[12.5rem] overflow-hidden rounded-3xl border border-border-color bg-bg-secondary shadow-2xl shadow-black/20 sm:min-h-80 lg:min-h-[360px]">
          <ResponsiveImage
            src={anime.banner || anime.image}
            fallbackSrc={anime.image || anime.smallImage}
            alt=""
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/5" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:border-t sm:border-white/10 sm:bg-black/75 sm:p-7 sm:backdrop-blur-sm lg:max-w-2xl lg:rounded-tr-3xl">
            <h3 className="line-clamp-2 text-xl font-black tracking-tight text-white sm:text-3xl">{anime.title}</h3>
            <p className="mt-1 text-xs font-medium text-white/70 sm:mt-2 sm:text-sm">
              {[anime.year ? `Temporada ${anime.year}` : null, anime.genres?.[0]].filter(Boolean).join(' • ') || 'Destaque do catálogo'}
            </p>
            <Link to={`/anime/${anime.id}`} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-black text-primary transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:mt-4 sm:bg-primary sm:px-4 sm:text-white sm:shadow-lg sm:shadow-primary/25">
              Ver detalhes <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </article>
      ) : null}
    </section>
  );
}
