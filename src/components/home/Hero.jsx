import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Info, Plus, Star, PlayCircle, TrendingUp, Calendar, Heart, Award } from 'lucide-react';
import { useAnimeLibrary } from '@/hooks/useAnimeLibrary';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { useAppPreferences } from '@/hooks/useAppPreferences';

const MotionLink = motion(Link);

function HeroBackground({ source, fallbackSrc, isInitialRender }) {
  const [activeSource, setActiveSource] = useState(source);
  const [hasFailed, setHasFailed] = useState(false);

  if (!activeSource || hasFailed) return null;

  return (
    <motion.img
      initial={isInitialRender ? { scale: 1.05, filter: "blur(0px)" } : { scale: 1.1, filter: "blur(10px)" }}
      animate={{ scale: 1.05, filter: "blur(0px)" }}
      transition={{ duration: 8, ease: "linear" }}
      src={activeSource}
      alt=""
      width="1920"
      height="1080"
      fetchPriority={isInitialRender ? "high" : "auto"}
      loading={isInitialRender ? "eager" : "lazy"}
      decoding="async"
      onError={() => {
        if (fallbackSrc && activeSource !== fallbackSrc) {
          setActiveSource(fallbackSrc);
          return;
        }

        setHasFailed(true);
      }}
      className="w-full h-full object-cover opacity-60 md:opacity-80 will-change-transform"
    />
  );
}

export function Hero({ animes = [] }) {
  const { library, addToLibrary } = useAnimeLibrary();
  const { user } = useAuth();
  const { toast } = useToast();
  const { preferences } = useAppPreferences();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    // Small timeout to ensure the first paint happens without animation, then enable future animations
    const timer = setTimeout(() => {
      setIsInitialRender(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Se não houver array ou estiver vazio, previne erro
  const safeAnimes = Array.isArray(animes) ? animes : [];
  const anime = safeAnimes[currentIndex];
  const preferredBackground = anime?.banner || anime?.trailer?.images?.maximum_image_url || anime?.image || anime?.smallImage;
  const posterSource = anime?.image || anime?.smallImage;

  const isInLibrary = library?.some(item => item.id === String(anime?.id || anime?.mal_id));

  // Auto-slide effect
  useEffect(() => {
    if (!preferences.autoPlayHero || safeAnimes.length <= 1) return undefined;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % safeAnimes.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [preferences.autoPlayHero, safeAnimes.length]);

  const handleAddToList = async () => {
    if (!user) {
      toast.warning("Faça login para adicionar à sua lista!");
      return;
    }
    try {
      await addToLibrary(anime);
      toast.success("Adicionado à lista com sucesso!");
    } catch {
      toast.error("Erro ao adicionar à lista.");
    }
  };



  /* Loading State */
  if (safeAnimes.length === 0) {
    return (
      <div className="w-full h-[650px] rounded-3xl bg-[#121214] animate-pulse flex items-center justify-center border border-white/5">
        <span className="text-gray-500 font-medium">Carregando destaques...</span>
      </div>
    );
  }

  return (
    <section className="relative w-full overflow-hidden rounded-[2.5rem] shadow-2xl group min-h-[650px] flex items-end md:items-center">

      {/* --- CAROUSEL ANIMATION WRAPPER --- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={anime.uniqueId || anime.id} 
          initial={isInitialRender ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-0 will-change-[opacity]"
        >
          {/* Background Image */}
          <div className="absolute inset-0 overflow-hidden bg-[#121214]">
            <HeroBackground
              source={preferredBackground}
              fallbackSrc={posterSource}
              isInitialRender={isInitialRender}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#121214] via-[#121214]/60 to-transparent" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* --- CONTENT (Fica por cima) --- */}
      <div className="relative z-10 p-6 md:p-12 w-full max-w-[95%] lg:max-w-[90%] flex flex-col md:flex-row items-end md:items-center gap-6 md:gap-12 mr-auto">

        {/* POSTER (Left Side) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={anime.uniqueId || anime.id}
            initial={isInitialRender ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, delay: isInitialRender ? 0 : 0.2 }}
            className="hidden md:block flex-shrink-0 w-[300px] aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-2 border-white/10 group-hover:border-white/30 transition-all will-change-[opacity,transform]"
          >
            <ResponsiveImage
              src={anime.image || anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.smallImage}
              fallbackSrc={anime.smallImage || anime.images?.webp?.image_url || anime.images?.jpg?.image_url}
              srcSet={anime.smallImage && anime.image ? `${anime.smallImage} 280w, ${anime.image} 560w` : undefined}
              sizes="300px"
              alt={anime.title}
              width="300"
              height="450"
              loading="eager"
              fetchPriority={isInitialRender ? "high" : "auto"}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* INFO (Right Side) */}
        <div className="flex-1 space-y-6 text-center md:text-left pb-16 md:pb-0">

          <AnimatePresence mode="wait">
            <motion.div
              key={anime.uniqueId || anime.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {/* Dynamic Label Badge */}
                {(() => {
                  if (!anime.heroLabel) return null;
                  
                  const iconMap = {
                    "Award": Award,
                    "TrendingUp": TrendingUp,
                    "Heart": Heart,
                    "Calendar": Calendar
                  };
                  
                  const IconComponent = iconMap[anime.heroIcon] || Award;

                  return (
                    <span className={`bg-black/30 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${anime.heroColor || "text-white"}`}>
                      <IconComponent className="w-3.5 h-3.5" /> {anime.heroLabel}
                    </span>
                  );
                })()}
                <span className="bg-black/30 backdrop-blur-md border border-white/10 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-default">
                  <Star className="w-3.5 h-3.5 fill-current" /> {anime.score || 'N/A'}
                </span>
                <span className="bg-black/30 backdrop-blur-md border border-white/10 text-gray-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-default">
                  <Calendar className="w-3.5 h-3.5" /> {anime.year || 'N/A'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.9] drop-shadow-2xl line-clamp-2 md:line-clamp-3">
                {anime.title}
              </h1>

              {/* Genres */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {anime.genres && anime.genres.slice(0, 3).map((genre, index) => (
                  <span
                    key={`${genre?.mal_id || index}`}
                    className="text-gray-200 font-medium text-xs md:text-sm px-4 py-1.5 rounded-full border border-white/10 bg-black/20 backdrop-blur-md"
                  >
                    {genre?.name || genre}
                  </span>
                ))}
              </div>

              {/* Synopsis */}
              <p className="text-gray-300 text-sm md:text-lg leading-relaxed line-clamp-3 md:line-clamp-4 max-w-2xl mx-auto md:mx-0 font-light drop-shadow-md">
                {anime.synopsis}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                <MotionLink
                  to={`/anime/${anime.mal_id || anime.id}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-black hover:bg-white/90 px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                >
                  <Info className="w-5 h-5" /> Ver Detalhes
                </MotionLink>

                {!isInLibrary ? (
                  <motion.button
                    onClick={handleAddToList}
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/5 backdrop-blur-md text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all border border-white/10 hover:border-white/30"
                  >
                    <Plus className="w-5 h-5" /> Minha Lista
                  </motion.button>
                ) : (
                  <div className="flex items-center gap-2 px-8 py-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-bold backdrop-blur-md cursor-default">
                    <PlayCircle className="w-5 h-5" /> Na sua Lista
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* --- INDICATORS (Dots) --- */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {safeAnimes.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Ir para o slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? "w-12 bg-white" : "w-4 bg-white/30 hover:bg-white/60 focus:bg-white/60"
              }`}
          />
        ))}
      </div>

    </section>
  );
}