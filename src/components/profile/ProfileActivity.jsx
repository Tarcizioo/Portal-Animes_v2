import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3 } from 'lucide-react';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

const STATUS_CONFIG = {
  watching: { label: 'Assistindo', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  completed: { label: 'Concluído', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  plan_to_watch: { label: 'Planejado', color: 'text-zinc-300 bg-zinc-500/10 border-zinc-500/20' },
  paused: { label: 'Pausado', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  dropped: { label: 'Dropado', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

function formatRelativeDate(timestamp) {
  const seconds = timestamp?.seconds;
  if (!seconds) return 'Atualizado recentemente';

  const differenceInDays = Math.round((seconds * 1000 - Date.now()) / 86400000);
  if (Math.abs(differenceInDays) < 1) return 'Atualizado hoje';
  if (Math.abs(differenceInDays) < 30) {
    return new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }).format(differenceInDays, 'day');
  }

  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(seconds * 1000);
}

export function ProfileActivity({ library, libraryPath, isOwnProfile = false }) {
  const recentAnimes = useMemo(() => (
    [...(library || [])]
      .sort((a, b) => (b.lastUpdated?.seconds || 0) - (a.lastUpdated?.seconds || 0))
      .slice(0, 6)
  ), [library]);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border-color bg-bg-secondary p-4 sm:p-6" aria-labelledby="recent-activity-title">
      <div className="mb-5 flex min-w-0 items-center justify-between gap-2 sm:gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.16em] text-button-accent">Linha do tempo</span>
          <h3 id="recent-activity-title" className="mt-1 flex items-center gap-2 font-bold text-text-primary">
            <Clock3 className="h-4 w-4 text-button-accent" aria-hidden="true" />
            Atividade recente
          </h3>
        </div>
        <Link to={libraryPath} className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2 text-xs font-bold text-button-accent hover:bg-button-accent/10 hover:text-text-primary">
          Ver biblioteca
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>

      {recentAnimes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-color bg-bg-primary/30 px-5 py-10 text-center">
          <Clock3 className="mx-auto h-8 w-8 text-text-secondary/50" aria-hidden="true" />
          <p className="mt-3 font-bold text-text-primary">Nenhuma atividade por enquanto</p>
          <p className="mt-1 text-sm text-text-secondary">
            {isOwnProfile ? 'Adicione um anime ou atualize um episódio para iniciar sua linha do tempo.' : 'As próximas atualizações da biblioteca aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {recentAnimes.map((anime) => {
            const status = STATUS_CONFIG[anime.status] || STATUS_CONFIG.plan_to_watch;
            const currentEpisode = anime.currentEp || 0;
            const totalEpisodes = anime.totalEp || 0;
            const progress = totalEpisodes > 0 ? Math.min(100, Math.round((currentEpisode / totalEpisodes) * 100)) : 0;

            return (
              <Link key={anime.id} to={`/anime/${anime.id}`} className="group flex min-w-0 gap-3 overflow-hidden rounded-xl border border-border-color bg-bg-primary/35 p-3 transition-colors hover:border-primary/40 hover:bg-bg-tertiary/50">
                <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-bg-tertiary">
                  <ResponsiveImage src={anime.image || anime.smallImage} alt={anime.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" sizes="64px" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="line-clamp-2 text-sm font-bold leading-tight text-text-primary group-hover:text-primary">{anime.title}</span>
                  <span className={`mt-2 w-fit rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${status.color}`}>{status.label}</span>
                  {totalEpisodes > 0 && (
                    <div className="mt-auto pt-2">
                      <div className="mb-1 flex justify-between text-[10px] text-text-secondary">
                        <span>{currentEpisode}/{totalEpisodes} episódios</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-bg-tertiary" role="progressbar" aria-label={`Progresso de ${anime.title}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
                        <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                  <span className="mt-2 text-[10px] text-text-secondary">{formatRelativeDate(anime.lastUpdated)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
