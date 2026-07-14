import { Star, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

export function AnimeCard({ id, title, genre, image, smallImage, score, onRemove, showScore = true }) {
  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove();
  };

  return (
    <Link to={`/anime/${id}`} className="block group relative cursor-pointer">
      <div
        className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-lg group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
      >
        <ResponsiveImage
          src={image}
          fallbackSrc={smallImage}
          srcSet={smallImage && smallImage !== image ? `${smallImage} 280w, ${image} 560w` : undefined}
          sizes="(max-width: 639px) 42vw, (max-width: 1023px) 30vw, (max-width: 1279px) 23vw, 19vw"
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 will-change-transform"
        />

        {/* Overlay com Gradiente e Glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <span className="text-white text-sm font-bold opacity-0 md:group-hover:opacity-100 transform translate-y-4 md:group-hover:translate-y-0 transition-all duration-300 delay-75 hidden md:block">
            Ver Detalhes
          </span>
        </div>

        {/* Botão Remover (Lixeira) - Só aparece se onRemove existir */}
        {onRemove && (
          <button
            onClick={handleRemove}
            className="absolute top-2 left-2 p-2 rounded-lg backdrop-blur-md border transition-all z-10 shadow-lg
              opacity-100 md:opacity-0 md:group-hover:opacity-100 
              bg-black/60 border-white/10 text-white/90
              md:bg-red-500/20 md:border-red-500/30 md:text-red-500
              md:transform md:-translate-x-2 md:group-hover:translate-x-0
              hover:bg-red-500 hover:border-red-500 hover:text-white"
            title="Remover da Biblioteca"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Nota (Badge) com Glassmorphism Visual */}
        {showScore && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
          <Star className={`w-3 h-3 ${score ? 'text-yellow-400 fill-yellow-400' : 'text-text-secondary fill-transparent'}`} />
          <span className="text-white text-xs font-bold">{score != null ? score : 'N/A'}</span>
        </div>
        )}
      </div>

      {/* Título e Gênero */}
      <div className="space-y-1">
        <h3 className="text-text-primary font-bold truncate group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        <p className="text-text-secondary text-xs truncate">
          {genre}
        </p>
      </div>
    </Link>
  );
}
