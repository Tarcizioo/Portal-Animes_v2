import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAppPreferences } from '@/hooks/useAppPreferences';

function AmbientArtworkImage({ source, fallbackSrc }) {
  const [activeSource, setActiveSource] = useState(source);
  const [hasFailed, setHasFailed] = useState(false);

  if (!activeSource || hasFailed) return null;

  return (
    <img
      src={activeSource}
      alt=""
      width="960"
      height="540"
      loading="eager"
      fetchPriority="low"
      decoding="async"
      onError={() => {
        if (fallbackSrc && activeSource !== fallbackSrc) {
          setActiveSource(fallbackSrc);
          return;
        }

        setHasFailed(true);
      }}
      className="app-ambient-backdrop__image"
    />
  );
}

export function AmbientBackdrop({ artwork, isActive }) {
  const { preferences } = useAppPreferences();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = preferences.reducedMotion || prefersReducedMotion;
  const shouldRender = Boolean(isActive && artwork?.src);

  return (
    <div
      aria-hidden="true"
      data-app-ambient
      data-active={String(shouldRender)}
      className="app-ambient-backdrop"
    >
      <AnimatePresence initial={false}>
        {shouldRender ? (
          <motion.div
            key={artwork.key || artwork.src}
            className="app-ambient-backdrop__transition"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.65, ease: 'easeOut' }}
          >
            <AmbientArtworkImage source={artwork.src} fallbackSrc={artwork.fallbackSrc} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
