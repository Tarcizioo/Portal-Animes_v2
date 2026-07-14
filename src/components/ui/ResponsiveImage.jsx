import { useState } from 'react';

function getInitial(value) {
  return value?.trim()?.charAt(0)?.toUpperCase() || '?';
}

function ImageWithFallback({
  src,
  fallbackSrc,
  srcSet,
  sizes,
  alt,
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
  width,
  height,
}) {
  const [activeSource, setActiveSource] = useState(src);
  const [hasFailed, setHasFailed] = useState(false);

  const handleError = () => {
    if (fallbackSrc && activeSource !== fallbackSrc) {
      setActiveSource(fallbackSrc);
      return;
    }

    setHasFailed(true);
  };

  if (!activeSource || hasFailed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className} flex items-center justify-center bg-gradient-to-br from-bg-tertiary via-bg-secondary to-primary/30 text-text-secondary`}
      >
        <span aria-hidden="true" className="text-3xl font-black text-white/70">
          {getInitial(alt)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={activeSource}
      srcSet={activeSource === src ? srcSet : undefined}
      sizes={activeSource === src ? sizes : undefined}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      width={width}
      height={height}
      onError={handleError}
      className={className}
    />
  );
}

export function ResponsiveImage(props) {
  return <ImageWithFallback key={props.src || 'missing-image'} {...props} />;
}