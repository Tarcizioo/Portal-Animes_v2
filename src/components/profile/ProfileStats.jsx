import { CheckCircle2, LibraryBig, ListChecks, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

const STAT_STYLES = {
  episodes: 'bg-button-accent/15 text-button-accent ring-button-accent/25',
  library: 'bg-button-accent/10 text-button-accent ring-button-accent/15',
  completed: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/15',
  score: 'bg-amber-400/10 text-amber-300 ring-amber-400/15',
};

export function ProfileStats({ library = [], isLoading = false }) {
  if (isLoading) {
    return <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-24 rounded-2xl" />)}</div>;
  }

  const items = Array.isArray(library) ? library : [];
  const completed = items.filter((anime) => anime.status === 'completed').length;
  const episodes = items.reduce((total, anime) => total + Number(anime.currentEp || 0), 0);
  const rated = items.filter((anime) => Number(anime.score || 0) > 0);
  const meanScore = rated.length > 0
    ? (rated.reduce((total, anime) => total + Number(anime.score), 0) / rated.length).toFixed(1)
    : '—';
  const stats = [
    { id: 'episodes', label: 'Episódios registrados', value: episodes.toLocaleString('pt-BR'), icon: ListChecks },
    { id: 'library', label: 'Na biblioteca', value: items.length, icon: LibraryBig },
    { id: 'completed', label: 'Concluídos', value: completed, icon: CheckCircle2 },
    { id: 'score', label: 'Nota média', value: meanScore, icon: Star },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.id} data-stat-id={stat.id} className={`group relative min-w-0 overflow-hidden rounded-2xl border bg-bg-secondary p-3.5 shadow-lg shadow-black/5 transition-transform hover:-translate-y-0.5 sm:p-5 ${stat.id === 'episodes' ? 'border-button-accent/30 ring-1 ring-button-accent/10' : 'border-border-color'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="min-h-7 text-[9px] font-black uppercase leading-tight tracking-[0.11em] text-text-secondary sm:min-h-0 sm:text-[10px] sm:tracking-[0.14em]">{stat.label}</p><p className="mt-1.5 truncate text-2xl font-black tracking-tight text-text-primary sm:mt-2 sm:text-3xl">{stat.value}</p></div>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${STAT_STYLES[stat.id]}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
