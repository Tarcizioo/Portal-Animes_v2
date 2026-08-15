import { CheckCircle2, Heart, Library, ListVideo } from 'lucide-react';
import { Link } from 'react-router-dom';

const METRIC_STYLES = {
  episodes: 'bg-primary/10 text-primary',
  titles: 'bg-sky-500/10 text-sky-400',
  completed: 'bg-emerald-500/10 text-emerald-400',
  favorites: 'bg-rose-500/10 text-rose-400',
};

function getEpisodeCount(anime) {
  const currentEpisode = Number(anime?.currentEp);
  return Number.isFinite(currentEpisode) && currentEpisode > 0 ? currentEpisode : 0;
}

export function HomeJourneySnapshot({ library = [] }) {
  if (!Array.isArray(library) || library.length === 0) return null;

  const metrics = [
    {
      label: 'Episódios registrados',
      value: library.reduce((total, anime) => total + getEpisodeCount(anime), 0),
      icon: ListVideo,
      color: METRIC_STYLES.episodes,
    },
    {
      label: 'Títulos na biblioteca',
      value: library.length,
      icon: Library,
      color: METRIC_STYLES.titles,
    },
    {
      label: 'Concluídos',
      value: library.filter((anime) => anime?.status === 'completed').length,
      icon: CheckCircle2,
      color: METRIC_STYLES.completed,
    },
    {
      label: 'Favoritos',
      value: library.filter((anime) => anime?.isFavorite === true).length,
      icon: Heart,
      color: METRIC_STYLES.favorites,
    },
  ];

  return (
    <section aria-labelledby="home-journey-title" className="space-y-3 sm:space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary sm:text-xs">
            Seu progresso
          </p>
          <h2 id="home-journey-title" className="mt-0.5 text-xl font-black tracking-tight text-text-primary sm:text-2xl">
            Sua jornada
          </h2>
        </div>

        <Link
          to="/stats"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary sm:px-4 sm:text-sm"
        >
          Ver estatísticas
        </Link>
      </header>

      <dl className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-border-color bg-bg-secondary/75 p-3 shadow-lg shadow-black/5 sm:p-4"
          >
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`} aria-hidden="true">
              <Icon className="h-[1.125rem] w-[1.125rem]" />
            </span>
            <div className="flex min-w-0 flex-col">
              <dt className="order-2 mt-1 text-[10px] font-semibold leading-tight text-text-secondary sm:text-xs">
                {label}
              </dt>
              <dd className="order-1 text-xl font-black leading-none text-text-primary sm:text-2xl">
                {value.toLocaleString('pt-BR')}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
