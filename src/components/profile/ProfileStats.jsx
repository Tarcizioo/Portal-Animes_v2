import { CheckCircle2, LibraryBig, PlaySquare, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

const STAT_STYLES = {
  library: 'bg-button-accent/10 text-button-accent ring-button-accent/15',
  completed: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/15',
  episodes: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/15',
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
    { id: 'library', label: 'Na biblioteca', value: items.length, icon: LibraryBig },
    { id: 'completed', label: 'Concluídos', value: completed, icon: CheckCircle2 },
    { id: 'episodes', label: 'Episódios vistos', value: episodes.toLocaleString('pt-BR'), icon: PlaySquare },
    { id: 'score', label: 'Nota média', value: meanScore, icon: Star },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.id} className="group relative overflow-hidden rounded-2xl border border-border-color bg-bg-secondary p-4 shadow-lg shadow-black/5 transition-transform hover:-translate-y-0.5 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-text-secondary">{stat.label}</p><p className="mt-2 text-2xl font-black tracking-tight text-text-primary sm:text-3xl">{stat.value}</p></div>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${STAT_STYLES[stat.id]}`}><Icon className="h-4 w-4" /></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
