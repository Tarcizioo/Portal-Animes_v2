import { Calendar, CheckCircle, Clock, Film, MonitorPlay, PlayCircle, Star, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

const getStatusInfo = (status) => {
  const normalized = status?.toLowerCase()?.replace(/\s/g, '_');
  switch (normalized) {
    case 'currently_airing':
    case 'airing':
    case 'watching':
      return { label: 'Assistindo', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: PlayCircle };
    case 'finished_airing':
    case 'completed':
      return { label: 'Concluído', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: CheckCircle };
    case 'upcoming':
    case 'plan_to_watch':
      return { label: 'Planejado', color: 'text-text-secondary bg-bg-tertiary border-border-color', icon: Clock };
    case 'paused':
    case 'on_hold':
      return { label: 'Pausado', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock };
    case 'dropped':
      return { label: 'Dropado', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: X };
    default:
      return { label: status || 'Desconhecido', color: 'text-text-secondary bg-bg-tertiary border-border-color', icon: null };
  }
};

export function AnimeListItem({
  id, title, image, smallImage, score, synopsis, status, year, episodes, totalEp, type, genres,
  showPersonalProgress, currentEp, userScore, onRemove, role,
}) {
  const truncatedSynopsis = synopsis?.length > 200 ? `${synopsis.substring(0, 200)}...` : synopsis;
  const statusInfo = getStatusInfo(status);
  const StatusIcon = statusInfo.icon;
  const totalEpisodes = totalEp || episodes || 0;
  const currentEpisode = currentEp || 0;
  const progressPercentage = totalEpisodes > 0 ? Math.min(100, (currentEpisode / totalEpisodes) * 100) : 0;
  const genresToRender = Array.isArray(genres)
    ? genres.map((genre) => (typeof genre === 'object' ? genre.name : genre))
    : typeof genres === 'string' ? genres.split(', ').filter(Boolean) : [];

  return (
    <article className="group relative flex min-w-0 flex-row gap-3 overflow-hidden rounded-xl border border-border-color bg-bg-secondary p-3 transition-all hover:border-button-accent hover:bg-bg-tertiary hover:shadow-lg sm:gap-4">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-button-accent/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <Link
        to={`/anime/${id}`}
        aria-label={`Ver detalhes de ${title}`}
        className="relative z-10 aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-lg shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-[100px]"
      >
        <ResponsiveImage
          src={image}
          fallbackSrc={smallImage}
          srcSet={smallImage && smallImage !== image ? `${smallImage} 100w, ${image} 460w` : undefined}
          sizes="(max-width: 639px) 96px, 100px"
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {!showPersonalProgress && score > 0 && (
          <span className="absolute right-1 top-1 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            <Star aria-hidden="true" className="h-3 w-3 fill-yellow-500 text-yellow-500" /> {score}
          </span>
        )}
      </Link>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col py-0.5">
        <div className="mb-1 flex items-start justify-between gap-2">
          <Link to={`/anime/${id}`} className="min-w-0 rounded text-text-primary transition-colors hover:text-button-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <h3 className="line-clamp-2 text-base font-bold leading-tight sm:line-clamp-1 sm:text-lg">{title}</h3>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            {role && (
              <span className={clsx('hidden rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider sm:inline-flex', role === 'Main' ? 'bg-primary text-white' : 'border border-border-color bg-bg-tertiary text-text-secondary')}>
                {role === 'Main' ? 'Principal' : 'Suporte'}
              </span>
            )}
            {status && (
              <span className={clsx('hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider sm:flex', statusInfo.color)}>
                {StatusIcon && <StatusIcon aria-hidden="true" className="h-3 w-3" />}
                {statusInfo.label}
              </span>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Remover ${title} da biblioteca`}
                title="Remover da biblioteca"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500/10 p-0 text-red-500 opacity-100 transition-colors hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mb-1.5 flex gap-2 sm:hidden">
          {role && <span className={clsx('rounded px-1.5 py-0.5 text-[10px] font-black uppercase', role === 'Main' ? 'bg-primary text-white' : 'border border-border-color bg-bg-tertiary text-text-secondary')}>{role === 'Main' ? 'Principal' : 'Suporte'}</span>}
          {status && <span className={clsx('rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase', statusInfo.color)}>{statusInfo.label}</span>}
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
          {type && <span className="flex items-center gap-1"><MonitorPlay aria-hidden="true" className="h-3 w-3" /> {type}</span>}
          {year && <span className="flex items-center gap-1"><Calendar aria-hidden="true" className="h-3 w-3" /> {year}</span>}
          {totalEpisodes > 0 && <span className="flex items-center gap-1"><Film aria-hidden="true" className="h-3 w-3" /> {totalEpisodes} eps</span>}
        </div>

        {showPersonalProgress && (
          <div className="mb-2 rounded-lg bg-bg-tertiary p-1.5 sm:mb-4 sm:p-2">
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold sm:text-xs">
              <span className="text-text-primary"><span className="hidden sm:inline">Progresso: </span><span className="text-button-accent">{currentEpisode}</span> / {totalEpisodes || '?'}</span>
              {(userScore || score) > 0 && <span className="flex items-center gap-1 text-yellow-500"><Star aria-hidden="true" className="h-3 w-3 fill-current" /> {userScore || score}</span>}
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-bg-primary"
              role="progressbar"
              aria-label={`Progresso de ${title}`}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={Math.round(progressPercentage)}
              aria-valuetext={`${currentEpisode} de ${totalEpisodes || 'total desconhecido'} episódios`}
            >
              <div className="h-full rounded-full bg-button-accent transition-[width] duration-500" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>
        )}

        {!showPersonalProgress && truncatedSynopsis && <p className="mb-auto hidden line-clamp-2 text-xs leading-relaxed text-text-secondary sm:block">{truncatedSynopsis}</p>}

        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {genresToRender.slice(0, 3).map((genre) => (
            <span key={genre} className="rounded border border-border-color bg-bg-tertiary px-1.5 py-0.5 text-[9px] font-bold uppercase text-text-secondary sm:text-[10px]">{genre}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
