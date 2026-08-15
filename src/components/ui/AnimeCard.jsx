import { Star, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

const getGenreLabel = (genre, genres) => {
  if (genre) return genre;
  if (!Array.isArray(genres)) return '';
  return genres
    .map((item) => (typeof item === 'object' ? item.name : item))
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ');
};

export function AnimeCard({ id, title, genre, genres, image, smallImage, score, onRemove, showScore = true }) {
  const genreLabel = getGenreLabel(genre, genres);

  return (
    <article className="group relative min-w-0">
      <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-xl shadow-lg transition-all duration-300 group-hover:shadow-xl">
        <Link
          to={`/anime/${id}`}
          aria-label={`Ver detalhes de ${title}`}
          className="block h-full w-full overflow-hidden rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        >
          <ResponsiveImage
            src={image}
            fallbackSrc={smallImage}
            srcSet={smallImage && smallImage !== image ? `${smallImage} 100w, ${image} 460w` : undefined}
            sizes="(max-width: 639px) 42vw, (max-width: 1023px) 30vw, (max-width: 1279px) 23vw, 19vw"
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.02] group-active:scale-[0.98]"
          />
          <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 opacity-0 transition-opacity duration-300 md:group-hover:opacity-100">
            <span className="hidden translate-y-4 text-sm font-bold text-white opacity-0 transition-all delay-75 duration-300 md:block md:group-hover:translate-y-0 md:group-hover:opacity-100">
              Ver detalhes
            </span>
          </span>
        </Link>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${title} da biblioteca`}
            title="Remover da biblioteca"
            className="absolute left-2 top-2 z-10 grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-black/70 p-0 text-white shadow-lg backdrop-blur-md transition-colors hover:border-red-500 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 md:-translate-x-1 md:bg-red-500/20 md:text-red-400 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100 md:group-focus-within:translate-x-0 md:group-focus-within:opacity-100"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </button>
        )}

        {showScore && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-white/10 bg-black/70 px-2 py-1 text-white shadow-sm backdrop-blur-md" aria-label={score != null ? `Nota ${score}` : 'Sem nota'}>
            <Star aria-hidden="true" className={`h-3 w-3 ${score ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-white/70'}`} />
            <span className="text-xs font-bold">{score != null ? score : 'N/A'}</span>
          </div>
        )}
      </div>

      <Link to={`/anime/${id}`} className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <h3 className="truncate font-bold text-text-primary transition-colors duration-300 group-hover:text-primary">{title}</h3>
        {genreLabel && <p className="mt-1 truncate text-xs text-text-secondary">{genreLabel}</p>}
      </Link>
    </article>
  );
}
