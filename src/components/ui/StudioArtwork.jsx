import { useState } from 'react';
import { Building2 } from 'lucide-react';

function getStudioImage(studio) {
  return studio?.image
    || studio?.images?.webp?.image_url
    || studio?.images?.jpg?.image_url
    || null;
}

export function StudioArtwork({ studio, className = '', compact = false }) {
  const image = getStudioImage(studio);
  const [failedSource, setFailedSource] = useState(null);
  const name = studio?.title || studio?.name || 'Estúdio';
  const showFallback = !image || failedSource === image;

  if (showFallback) {
    return (
      <div
        role="img"
        aria-label={`Sem imagem para ${name}`}
        data-studio-artwork-fallback
        className={`${className} flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-bg-tertiary via-bg-secondary to-primary/15 text-text-secondary`}
      >
        <Building2 className={compact ? 'h-5 w-5' : 'h-8 w-8'} aria-hidden="true" />
        <span className={compact ? 'sr-only' : 'text-[10px] font-bold'}>Imagem indisponível</span>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      loading="lazy"
      onError={() => setFailedSource(image)}
      className={className}
    />
  );
}
