import { ArrowRight, CalendarDays, Inbox, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

function ReleaseSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-color bg-bg-secondary" aria-label="Carregando lançamentos de hoje">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex min-h-24 animate-pulse items-center gap-4 border-b border-border-color p-3 last:border-b-0">
          <div className="h-16 w-24 rounded-xl bg-bg-tertiary" />
          <div className="flex-1 space-y-2"><div className="h-4 w-1/2 rounded bg-bg-tertiary" /><div className="h-3 w-24 rounded bg-bg-tertiary/70" /></div>
        </div>
      ))}
    </div>
  );
}

export function TodayReleases({ releases = [], loading, error, onRetry }) {
  const visibleReleases = releases.slice(0, 3);

  return (
    <section aria-labelledby="today-releases-title">
      <header className="mb-3 flex min-h-11 items-center justify-between gap-4">
        <h2 id="today-releases-title" className="flex items-center gap-1.5 text-base font-black tracking-tight text-text-primary sm:gap-2 sm:text-xl">
          <CalendarDays className="h-[1.125rem] w-[1.125rem] text-primary sm:h-5 sm:w-5" aria-hidden="true" /> Lançamentos hoje
        </h2>
        <Link to="/calendar" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2 text-xs font-black text-primary hover:bg-primary/10 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm">
          Ver semana <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      {loading && visibleReleases.length === 0 ? <ReleaseSkeleton /> : null}

      {!loading && error && visibleReleases.length === 0 ? (
        <div role="alert" className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 px-5 text-center">
          <p className="text-sm font-bold text-text-primary">Não foi possível consultar os episódios de hoje.</p>
          <button type="button" onClick={onRetry} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-color px-4 text-xs font-black text-text-secondary hover:border-primary/40 hover:text-text-primary">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Tentar novamente
          </button>
        </div>
      ) : null}

      {!loading && !error && visibleReleases.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border-color bg-bg-secondary/40 px-5 text-center">
          <Inbox className="h-6 w-6 text-text-secondary/50" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold text-text-primary">Nenhum episódio agendado para hoje.</p>
          <p className="mt-1 text-xs text-text-secondary">Veja a semana completa para conferir os próximos dias.</p>
        </div>
      ) : null}

      {visibleReleases.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border-color bg-bg-secondary shadow-lg shadow-black/5" data-testid="today-release-list">
          {visibleReleases.map((anime) => (
            <Link key={anime.id} to={`/anime/${anime.id}`} className="group flex min-h-24 items-center gap-4 border-b border-border-color p-3 transition-colors last:border-b-0 hover:bg-bg-tertiary/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:p-4">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-border-color bg-bg-tertiary sm:h-20 sm:w-32">
                <ResponsiveImage src={anime.banner || anime.image} fallbackSrc={anime.image || anime.smallImage} alt="" sizes="128px" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-black text-text-primary transition-colors group-hover:text-primary sm:text-base">{anime.title}</h3>
                <p className="mt-1 text-xs text-text-secondary">{anime.episode ? `Episódio ${anime.episode}` : 'Novo episódio'}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
