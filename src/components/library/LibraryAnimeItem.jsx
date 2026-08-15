import { useState } from 'react';
import { LoaderCircle, Plus } from 'lucide-react';
import { AnimeCard } from '@/components/ui/AnimeCard';
import { AnimeListItem } from '@/components/ui/AnimeListItem';

const STATUS_OPTIONS = [
  { value: 'watching', label: 'Assistindo' },
  { value: 'completed', label: 'Concluído' },
  { value: 'plan_to_watch', label: 'Planejo assistir' },
  { value: 'paused', label: 'Pausado' },
  { value: 'dropped', label: 'Dropado' },
];

export function LibraryAnimeItem({ anime, viewMode, onRemove, onIncrement, onStatusChange }) {
  const [pendingAction, setPendingAction] = useState(null);
  const currentEpisode = anime.currentEp || 0;
  const totalEpisodes = anime.totalEp || 0;
  const progress = totalEpisodes > 0 ? Math.min(100, (currentEpisode / totalEpisodes) * 100) : 0;
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
    void runAction('status', () => onStatusChange(anime.id, nextStatus, totalEpisodes));
  };

  return (
    <div className={viewMode === 'grid' ? 'flex h-full flex-col' : 'rounded-2xl border border-transparent bg-bg-secondary p-2'}>
      {viewMode === 'grid' ? (
        <AnimeCard {...anime} onRemove={onRemove} image={anime.image || anime.smallImage} />
      ) : (
        <AnimeListItem {...anime} image={anime.image || anime.smallImage} showPersonalProgress onRemove={onRemove} />
      )}

      {viewMode === 'grid' && (
        <div className="mt-2 rounded-xl border border-border-color bg-bg-secondary p-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-bold">
            <span className="text-text-secondary">Progresso</span>
            <span className="text-right leading-tight text-text-primary">
              <span className="text-primary">{currentEpisode}</span> / {totalEpisodes || '?'} episódios
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary"
            role="progressbar"
            aria-label={`Progresso de ${anime.title}`}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(progress)}
            aria-valuetext={`${currentEpisode} de ${totalEpisodes || 'total desconhecido'} episódios`}
          >
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className={viewMode === 'grid' ? 'mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2' : 'mt-2 flex flex-col gap-2 px-1 pb-1 sm:flex-row sm:justify-end'}>
        <label className="sr-only" htmlFor={`status-${anime.id}`}>Status de {anime.title}</label>
        <select
          id={`status-${anime.id}`}
          value={anime.status || 'plan_to_watch'}
          onChange={handleStatusChange}
          disabled={pendingAction !== null}
          className="min-h-11 min-w-0 rounded-xl border border-border-color bg-bg-tertiary px-2.5 py-2 text-xs font-bold text-text-primary outline-none transition-colors hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary disabled:cursor-wait disabled:opacity-60 sm:px-3"
        >
          {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <button
          type="button"
          onClick={() => void runAction('episode', () => onIncrement(anime.id, currentEpisode, totalEpisodes))}
          disabled={pendingAction !== null || isFinished}
          aria-label={isFinished ? `${anime.title} já foi concluído` : `Adicionar um episódio a ${anime.title}`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-black text-white transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingAction === 'episode' ? <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : <Plus aria-hidden="true" className="h-3.5 w-3.5" />}
          <span>{isFinished ? 'Concluído' : '+1 ep'}</span>
        </button>
      </div>
    </div>
  );
}
