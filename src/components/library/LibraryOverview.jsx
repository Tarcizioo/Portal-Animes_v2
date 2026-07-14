import { createElement, useMemo } from 'react';
import { CheckCircle2, Eye, Library, PlayCircle } from 'lucide-react';

export function LibraryOverview({ library }) {
  const overview = useMemo(() => {
    const watching = library.filter((anime) => anime.status === 'watching').length;
    const completed = library.filter((anime) => anime.status === 'completed').length;
    const watchedEpisodes = library.reduce((total, anime) => total + (anime.currentEp || 0), 0);
    const knownEpisodes = library.reduce((total, anime) => total + (anime.totalEp || 0), 0);
    const watchedKnownEpisodes = library.reduce((total, anime) => {
      if (!anime.totalEp) return total;
      return total + Math.min(anime.currentEp || 0, anime.totalEp);
    }, 0);
    const progress = knownEpisodes > 0 ? Math.round((watchedKnownEpisodes / knownEpisodes) * 100) : 0;

    return { watching, completed, watchedEpisodes, progress };
  }, [library]);

  const stats = [
    { label: 'Na biblioteca', value: library.length, detail: 'titulos salvos', icon: Library, color: 'text-primary bg-primary/10' },
    { label: 'Assistindo', value: overview.watching, detail: 'em andamento', icon: PlayCircle, color: 'text-emerald-400 bg-emerald-500/10' },
    { label: 'Concluidos', value: overview.completed, detail: 'finalizados', icon: CheckCircle2, color: 'text-sky-400 bg-sky-500/10' },
    { label: 'Episodios vistos', value: overview.watchedEpisodes.toLocaleString('pt-BR'), detail: `${overview.progress}% do progresso conhecido`, icon: Eye, color: 'text-amber-400 bg-amber-500/10' },
  ];

  return (
    <section aria-label="Resumo da biblioteca" className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {stats.map(({ label, value, detail, icon, color }) => (
        <article key={label} className="rounded-2xl border border-border-color bg-bg-secondary p-4 shadow-lg shadow-black/5 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">{label}</span>
            <span className={`rounded-xl p-2 ${color}`} aria-hidden="true">
              {createElement(icon, { className: 'h-4 w-4' })}
            </span>
          </div>
          <strong className="block text-2xl font-black text-text-primary sm:text-3xl">{value}</strong>
          <span className="mt-1 block text-xs text-text-secondary">{detail}</span>
        </article>
      ))}
    </section>
  );
}