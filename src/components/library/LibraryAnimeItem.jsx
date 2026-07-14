import { useState } from 'react';
import { LoaderCircle, Plus } from 'lucide-react';
import { AnimeCard } from '@/components/ui/AnimeCard';
import { AnimeListItem } from '@/components/ui/AnimeListItem';

const STATUS_OPTIONS = [
  { value: 'watching', label: 'Assistindo' },
  { value: 'completed', label: 'Concluido' },
  { value: 'plan_to_watch', label: 'Planejo assistir' },
  { value: 'paused', label: 'Pausado' },
  { value: 'dropped', label: 'Dropado' },
];

export function LibraryAnimeItem({ anime, viewMode, onRemove, onIncrement, onStatusChange }) {
  const [pendingAction, setPendingAction] = useState(null);
  const currentEpisode = anime.currentEp || 0;
  const totalEpisodes = anime.totalEp || 0;
  const isFinished = anime.status === 'completed' || (totalEpisodes > 0 && currentEpisode >= totalEpisodes);

  const runAction = async (action, callback) => {
    setPendingAction(action);
    try {
      await callback();
    } finally {
      setPendingAction(null);
    }
  };

  const handleStatusChange = (event) => {
    const nextStatus = event.target.value;
    runAction('status', () => onStatusChange(anime.id, nextStatus, totalEpisodes));
  };

  return (
    <article className={viewMode === 'grid' ? 'flex h-full flex-col' : 'rounded-2xl border border-transparent bg-bg-secondary/30 p-2'}>
      {viewMode === 'grid' ? (
        <AnimeCard {...anime} onRemove={onRemove} image={anime.image || anime.smallImage} />
      ) : (
        <AnimeListItem {...anime} image={anime.image || anime.smallImage} showPersonalProgress onRemove={onRemove} />
      )}

      <div className={viewMode === 'grid' ? 'mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2' : 'mt-2 flex flex-col gap-2 px-1 pb-1 sm:flex-row sm:justify-end'}>
        <label className="sr-only" htmlFor={`status-${anime.id}`}>Status de {anime.title}</label>
        <select
          id={`status-${anime.id}`}
          value={anime.status || 'plan_to_watch'}
          onChange={handleStatusChange}
          disabled={pendingAction !== null}
          className="min-w-0 rounded-xl border border-border-color bg-bg-tertiary px-2.5 py-2 text-xs font-bold text-text-primary outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-wait disabled:opacity-60 sm:px-3"
        >
          {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <button
          type="button"
          onClick={() => runAction('episode', () => onIncrement(anime.id, currentEpisode, totalEpisodes))}
          disabled={pendingAction !== null || isFinished}
          aria-label={isFinished ? `${anime.title} ja foi concluido` : `Adicionar um episodio a ${anime.title}`}
          className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-black text-white transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingAction === 'episode' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          <span>{isFinished ? 'Concluido' : '+1 ep'}</span>
        </button>
      </div>
    </article>
  );
}
