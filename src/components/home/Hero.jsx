import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Calendar, CircleCheck, Heart, Info, Plus, Star, TrendingUp } from 'lucide-react';
import { useAnimeLibrary } from '@/hooks/useAnimeLibrary';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useHeroAmbientPublisher } from '@/context/HeroAmbientContext';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { useAppPreferences } from '@/hooks/useAppPreferences';
import { resetPointerGlow, trackPointerGlow } from '@/utils/pointerGlow';

const MotionLink = motion.create(Link);
const HERO_SLIDE_DURATION = 8000;
const HERO_EASE = [0.22, 1, 0.36, 1];

const HERO_ICON_MAP = {
  Award,
  TrendingUp,
  Heart,
  Calendar,
};

const FOREGROUND_VARIANTS = {
  enter: {},
  active: {},
  exit: {},
};

const POSTER_VARIANTS = {
  enter: (direction) => ({ opacity: 0, x: direction * 24, scale: 0.985 }),
  active: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.5, ease: HERO_EASE },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction * -16,
    scale: 0.99,
    transition: { duration: 0.18, ease: 'easeIn' },
  }),
};

const CONTENT_VARIANTS = {
  enter: (direction) => ({ opacity: 0, x: direction * 18 }),
  active: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.42,
      ease: HERO_EASE,
      delayChildren: 0.08,
      staggerChildren: 0.055,
    },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction * -10,
    y: -6,
    transition: { duration: 0.18, ease: 'easeIn' },
  }),
};

const CONTENT_ITEM_VARIANTS = {
  enter: { opacity: 0, y: 16 },
  active: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: HERO_EASE },
  },
  exit: { opacity: 0, y: -6, transition: { duration: 0.14, ease: 'easeIn' } },
};

function HeroBackground({ source, fallbackSrc, reduceMotion, priority }) {
  const [activeSource, setActiveSource] = useState(source);
  const [hasFailed, setHasFailed] = useState(false);

  if (!activeSource || hasFailed) return null;

  return (
    <motion.img
      initial={reduceMotion ? false : { scale: 1.02 }}
      animate={{ scale: reduceMotion ? 1.02 : 1.065 }}
      transition={{ duration: reduceMotion ? 0 : 8.2, ease: 'linear' }}
      src={activeSource}
      alt=""
      width="1920"
      height="1080"
      fetchPriority={priority ? 'high' : 'auto'}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => {
        if (fallbackSrc && activeSource !== fallbackSrc) {
          setActiveSource(fallbackSrc);
          return;
        }

        setHasFailed(true);
      }}
      className="hero-backdrop-image h-full w-full object-cover opacity-75 md:opacity-80"
    />
  );
}

export function Hero({ animes = [] }) {
  const { library, addToLibrary } = useAnimeLibrary();
  const { user } = useAuth();
  const { toast } = useToast();
  const { preferences } = useAppPreferences();
  const publishAmbient = useHeroAmbientPublisher();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = preferences.reducedMotion || prefersReducedMotion;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [isInteractionPaused, setIsInteractionPaused] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Se não houver array ou estiver vazio, previne erro
  const safeAnimes = Array.isArray(animes) ? animes : [];
  const anime = safeAnimes[currentIndex];
  const preferredBackground = anime?.banner || anime?.trailer?.images?.maximum_image_url || anime?.image || anime?.smallImage;
  const posterSource = anime?.image || anime?.smallImage;
  const ambientSource = anime?.smallImage || anime?.images?.webp?.image_url || anime?.images?.jpg?.image_url || posterSource || preferredBackground;
  const ambientFallbackSource = posterSource || preferredBackground;
  const ambientKey = ambientSource || String(anime?.uniqueId || anime?.id || currentIndex);
  const slideKey = anime?.uniqueId || anime?.mal_id || anime?.id || currentIndex;
  const isAutoPlayPaused = (
    reduceMotion
    || !preferences.autoPlayHero
    || isInteractionPaused
    || !isDocumentVisible
    || safeAnimes.length <= 1
  );

  useEffect(() => {
    if (!ambientSource) {
      publishAmbient(null);
      return undefined;
    }

    publishAmbient({
      key: ambientKey,
      src: ambientSource,
      fallbackSrc: ambientFallbackSource,
    });

    return () => {
      publishAmbient((currentArtwork) => currentArtwork?.key === ambientKey ? null : currentArtwork);
    };
  }, [ambientFallbackSource, ambientKey, ambientSource, publishAmbient]);

  const isInLibrary = library?.some(item => item.id === String(anime?.id || anime?.mal_id));

  useEffect(() => {
    if (isAutoPlayPaused) return undefined;

    const timer = setTimeout(() => {
      setSlideDirection(1);
      setCurrentIndex((prev) => (prev + 1) % safeAnimes.length);
    }, HERO_SLIDE_DURATION);

    return () => clearTimeout(timer);
  }, [currentIndex, isAutoPlayPaused, safeAnimes.length]);

  const handleSelectSlide = (nextIndex) => {
    if (nextIndex === currentIndex) return;

    const forwardDistance = (nextIndex - currentIndex + safeAnimes.length) % safeAnimes.length;
    const backwardDistance = (currentIndex - nextIndex + safeAnimes.length) % safeAnimes.length;
    setSlideDirection(forwardDistance <= backwardDistance ? 1 : -1);
    setCurrentIndex(nextIndex);
  };

  const handleAddToList = async () => {
    if (!user) {
      toast.warning("Faça login para adicionar à sua lista!");
      return;
    }
    try {
      await addToLibrary(anime, 'plan_to_watch', { source: 'home_hero' });
      toast.success("Adicionado à lista com sucesso!");
    } catch {
      toast.error("Erro ao adicionar à lista.");
    }
  };



  /* Loading State */
  if (safeAnimes.length === 0) {
    return (
      <section data-home-hero data-header-hero className="hero-stage relative w-full">
        <div
          className="hero-card hero-frame hero-loading flex w-full !min-h-[20.5rem] animate-pulse items-center justify-center rounded-[1.75rem] border border-white/5 bg-[#121214] sm:!min-h-96 sm:rounded-[2rem] md:!min-h-[clamp(40.625rem,calc(100svh-6.5rem),47.5rem)] md:rounded-[2.5rem] lg:!min-h-[clamp(44rem,calc(100svh-7.5rem),52rem)]"
          role="status"
        >
          <span className="font-medium text-gray-500">Carregando destaques...</span>
        </div>
      </section>
    );
  }

  return (
    <section
      data-home-hero
      data-header-hero
      data-autoplay-paused={String(isAutoPlayPaused)}
      className="hero-stage relative w-full"
      onMouseEnter={() => setIsInteractionPaused(true)}
      onMouseLeave={() => setIsInteractionPaused(false)}
      onFocusCapture={() => setIsInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsInteractionPaused(false);
        }
      }}
    >
      <div className="hero-card hero-frame group relative z-10 flex w-full !min-h-[20.5rem] items-end overflow-hidden rounded-[1.75rem] sm:!min-h-96 sm:rounded-[2rem] md:!min-h-[clamp(40.625rem,calc(100svh-6.5rem),47.5rem)] md:rounded-[2.5rem] lg:!min-h-[clamp(44rem,calc(100svh-7.5rem),52rem)] xl:items-center">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={slideKey}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.65, ease: HERO_EASE }}
            className="absolute inset-0 z-0"
          >
            <div className="absolute inset-0 overflow-hidden bg-[#121214]">
              <HeroBackground
                source={preferredBackground}
                fallbackSrc={posterSource}
                reduceMotion={reduceMotion}
                priority={currentIndex === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/45 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#121214] via-[#121214]/60 to-transparent" />
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence initial={false} mode="wait" custom={slideDirection}>
          <motion.div
            key={slideKey}
            custom={slideDirection}
            variants={FOREGROUND_VARIANTS}
            initial={reduceMotion ? false : 'enter'}
            animate="active"
            exit={reduceMotion ? undefined : 'exit'}
            className="relative z-10 mr-auto flex w-full max-w-full flex-col items-start gap-3 p-4 sm:gap-5 sm:p-6 md:max-w-[95%] md:items-end md:p-8 xl:max-w-[92%] xl:flex-row xl:items-center xl:gap-12 xl:p-12"
          >
            <motion.div
              custom={slideDirection}
              variants={POSTER_VARIANTS}
              className="hero-poster hidden aspect-[2/3] w-[320px] flex-shrink-0 overflow-hidden rounded-2xl border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-[border-color,box-shadow] group-hover:border-white/30 xl:block 2xl:w-[340px]"
            >
              <ResponsiveImage
                src={anime.image || anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.smallImage}
                fallbackSrc={anime.smallImage || anime.images?.webp?.image_url || anime.images?.jpg?.image_url}
                srcSet={anime.smallImage && anime.image ? anime.smallImage + ' 100w, ' + anime.image + ' 460w' : undefined}
                sizes="(min-width: 1536px) 340px, 320px"
                alt={anime.title}
                width="340"
                height="510"
                loading="eager"
                fetchPriority={currentIndex === 0 ? 'high' : 'auto'}
                className="h-full w-full object-cover"
              />
            </motion.div>

            <motion.div
              custom={slideDirection}
              variants={CONTENT_VARIANTS}
              className="w-full flex-1 space-y-2.5 pb-10 text-left sm:space-y-4 sm:pb-12 md:space-y-6 md:pb-16 md:text-center xl:pb-0 xl:text-left"
            >
              <motion.div
                variants={CONTENT_ITEM_VARIANTS}
                className="flex min-h-8 flex-wrap items-center justify-start gap-2 md:justify-center md:gap-3 xl:justify-start"
              >
                {(() => {
                  if (!anime.heroLabel) return null;

                  const IconComponent = HERO_ICON_MAP[anime.heroIcon] || Award;

                  return (
                    <span className={'flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-bold tracking-wide backdrop-blur-md ' + (anime.heroColor || 'text-white')}>
                      <IconComponent className="h-3.5 w-3.5" /> {anime.heroLabel}
                    </span>
                  );
                })()}
              </motion.div>

              <motion.h1
                variants={CONTENT_ITEM_VARIANTS}
                className="line-clamp-2 text-2xl font-black leading-[1.04] text-white drop-shadow-2xl sm:text-4xl md:line-clamp-3 md:text-6xl md:leading-[0.9] lg:text-7xl"
              >
                {anime.title}
              </motion.h1>

              <motion.div
                variants={CONTENT_ITEM_VARIANTS}
                className="flex flex-wrap justify-start gap-2 md:justify-center xl:justify-start"
              >
                <span className="flex cursor-default items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-bold text-yellow-400 backdrop-blur-md">
                  <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" /> {anime.score ?? 'N/A'}
                </span>
                <span className="flex cursor-default items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-bold text-gray-200 backdrop-blur-md">
                  <Calendar aria-hidden="true" className="h-3.5 w-3.5" /> {anime.year || 'N/A'}
                </span>
                {anime.genres && anime.genres.slice(0, 3).map((genre, index) => (
                  <span
                    key={String(genre?.mal_id || index)}
                    className={`${index > 0 ? 'hidden sm:inline-flex' : 'inline-flex'} rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-gray-200 backdrop-blur-md md:px-4 md:text-sm`}
                  >
                    {genre?.name || genre}
                  </span>
                ))}
              </motion.div>

              <motion.p
                variants={CONTENT_ITEM_VARIANTS}
                className="line-clamp-2 max-w-2xl text-xs font-light leading-relaxed text-gray-200 drop-shadow-md sm:text-sm md:mx-auto md:line-clamp-4 md:text-lg xl:mx-0"
              >
                {anime.synopsis}
              </motion.p>

              <motion.div
                variants={CONTENT_ITEM_VARIANTS}
                className="flex w-full flex-nowrap items-center justify-start gap-2 pt-1 md:w-auto md:flex-wrap md:justify-center md:gap-4 md:pt-4 xl:justify-start"
              >
                <MotionLink
                  to={'/anime/' + (anime.mal_id || anime.id)}
                  whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  className="hero-action pointer-glow pointer-glow--hero flex min-h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white !px-2 !py-3 text-xs font-bold text-black shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-[background-color,box-shadow,color] hover:bg-white/90 min-[360px]:gap-2 min-[360px]:!px-3 min-[360px]:text-sm md:min-h-0 md:flex-none md:!px-8 md:!py-4 md:text-base"
                  onPointerMove={trackPointerGlow}
                  onPointerLeave={resetPointerGlow}
                >
                  <Info aria-hidden="true" className="h-4 w-4 shrink-0 min-[360px]:h-5 min-[360px]:w-5" /> <span className="truncate">Ver detalhes</span>
                </MotionLink>

                {!isInLibrary ? (
                  <motion.button
                    type="button"
                    onClick={handleAddToList}
                    whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    className="hero-action hero-action--secondary pointer-glow pointer-glow--hero flex min-h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 !px-2 !py-3 text-xs font-bold text-white backdrop-blur-md transition-[background-color,border-color,box-shadow,color] hover:border-white/30 min-[360px]:gap-2 min-[360px]:!px-3 min-[360px]:text-sm md:min-h-0 md:flex-none md:!px-8 md:!py-4 md:text-base"
                    onPointerMove={trackPointerGlow}
                    onPointerLeave={resetPointerGlow}
                  >
                    <Plus aria-hidden="true" className="h-4 w-4 shrink-0 min-[360px]:h-5 min-[360px]:w-5" /> <span className="truncate">Minha lista</span>
                  </motion.button>
                ) : (
                  <div className="flex min-h-12 min-w-0 flex-1 cursor-default items-center justify-center gap-1.5 rounded-xl border border-green-500/30 bg-green-500/20 px-2 py-3 text-xs font-bold text-green-400 backdrop-blur-md min-[360px]:gap-2 min-[360px]:px-3 min-[360px]:text-sm md:min-h-0 md:flex-none md:px-8 md:py-4 md:text-base">
                    <CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0 min-[360px]:h-5 min-[360px]:w-5" /> <span className="truncate">Na sua lista</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div
          className="absolute bottom-1 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 sm:bottom-4 sm:gap-1"
          role="group"
          aria-label="Navegação dos destaques"
        >
          {safeAnimes.map((slideAnime, idx) => {
            const isActive = idx === currentIndex;

            return (
              <button
                key={slideAnime.uniqueId || slideAnime.mal_id || slideAnime.id || idx}
                type="button"
                onClick={() => handleSelectSlide(idx)}
                aria-label={(isActive ? 'Destaque atual' : 'Ir para o destaque') + ' ' + (idx + 1) + ': ' + (slideAnime.title || 'sem título')}
                aria-current={isActive ? 'true' : undefined}
                className="hero-indicator relative grid h-10 w-8 place-items-center rounded-full sm:h-11 sm:w-12"
              >
                <span
                  aria-hidden="true"
                  className={
                    isActive
                      ? 'hero-indicator__track h-1.5 w-7 rounded-full bg-white transition-[width,background-color] duration-300 sm:w-10'
                      : 'hero-indicator__track h-1.5 w-2 rounded-full bg-white/30 transition-[width,background-color] duration-300 sm:w-4'
                  }
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
