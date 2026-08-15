import { ArrowRight, Inbox, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

function AnimeRailCard({ anime }) {
  const firstGenre = Array.isArray(anime.genres)
    ? anime.genres.map((genre) => (typeof genre === 'string' ? genre : genre?.name)).find(Boolean)
    : null;
  const detail = anime.episodes
    ? `${anime.episodes} episódios`
    : anime.year
      ? `Temporada ${anime.year}`
      : firstGenre || 'Anime do catálogo';

  return (
    <Link to={`/anime/${anime.id}`} className="group min-w-0 snap-start focus-visible:outline-none">
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-border-color bg-bg-tertiary shadow-lg shadow-black/10 transition-transform duration-300 group-hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-primary">
        <ResponsiveImage
          src={anime.image}
          fallbackSrc={anime.smallImage}
          srcSet={anime.smallImage && anime.smallImage !== anime.image ? `${anime.smallImage} 100w, ${anime.image} 460w` : undefined}
          sizes="(max-width: 639px) 28vw, (max-width: 1023px) 160px, 192px"
          alt={anime.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
        />
      </div>
      <h3 className="mt-2 line-clamp-2 text-[11px] font-bold leading-tight text-text-primary transition-colors group-hover:text-primary sm:text-sm">
        {anime.title}
      </h3>
      <p className="mt-1 truncate text-[10px] text-text-secondary sm:text-xs">{detail}</p>
    </Link>
  );
}

function RailSkeleton() {
  return (
    <div className="grid grid-flow-col gap-3 overflow-hidden pr-8 [grid-auto-columns:calc((100%_-_3.75rem)/3)] sm:[grid-auto-columns:10.5rem] lg:[grid-auto-columns:12rem]" aria-label="Carregando títulos">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="min-w-0 animate-pulse">
          <div className="aspect-[2/3] rounded-2xl bg-bg-tertiary" />
          <div className="mt-2 h-3 rounded bg-bg-tertiary" />
          <div className="mt-2 h-2.5 w-2/3 rounded bg-bg-tertiary/70" />
        </div>
      ))}
    </div>
  );
}

export function DiscoverRail({
  title,
  icon: Icon,
  animes = [],
  actionTo,
  actionLabel = 'Ver tudo',
  loading = false,
  error = null,
  onRetry,
  sectionId,
}) {
  return (
    <section aria-labelledby={`${sectionId}-title`} className="min-w-0">
      <header className="mb-2 flex min-h-11 items-center justify-between gap-2 sm:mb-4 sm:gap-4">
        <h2 id={`${sectionId}-title`} className="flex min-w-0 items-center gap-1.5 text-base font-black tracking-tight text-text-primary sm:gap-2 sm:text-xl">
          {Icon ? <Icon className="h-[1.125rem] w-[1.125rem] shrink-0 text-primary sm:h-5 sm:w-5" aria-hidden="true" /> : null}
          <span className="truncate">{title}</span>
        </h2>
        {actionTo ? (
          <Link to={actionTo} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2 text-xs font-black text-primary transition-colors hover:bg-primary/10 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm">
            {actionLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </header>

      {loading && animes.length === 0 ? <RailSkeleton /> : null}

      {!loading && error && animes.length === 0 ? (
        <div role="alert" className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 px-5 text-center">
          <p className="text-sm font-bold text-text-primary">Não foi possível carregar esta seleção.</p>
          <button type="button" onClick={onRetry} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-color px-4 text-xs font-black text-text-secondary hover:border-primary/40 hover:text-text-primary">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Tentar novamente
          </button>
        </div>
      ) : null}

      {!loading && !error && animes.length === 0 ? (
        <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-border-color bg-bg-secondary/40 px-5 text-center">
          <Inbox className="h-6 w-6 text-text-secondary/50" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold text-text-primary">Nenhum título nesta seleção agora.</p>
          <p className="mt-1 text-xs text-text-secondary">Outras áreas de Descobrir continuam disponíveis.</p>
        </div>
      ) : null}

      {animes.length > 0 ? (
        <div className="no-scrollbar grid snap-x snap-mandatory grid-flow-col gap-3 overflow-x-auto overscroll-x-contain pb-2 pr-8 [grid-auto-columns:calc((100%_-_3.75rem)/3)] sm:gap-4 sm:[grid-auto-columns:10.5rem] lg:[grid-auto-columns:12rem]" data-testid={`${sectionId}-rail`}>
          {animes.map((anime) => <AnimeRailCard key={anime.id} anime={anime} />)}
        </div>
      ) : null}
    </section>
  );
}
