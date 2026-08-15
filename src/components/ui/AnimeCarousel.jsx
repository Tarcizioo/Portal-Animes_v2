import { useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AnimeCard } from '@/components/ui/AnimeCard';
import { useAppPreferences } from '@/hooks/useAppPreferences';

import 'swiper/css';
import 'swiper/css/navigation';

function getAnimeMeta(anime, preferEpisodeCount) {
  if (preferEpisodeCount && anime.episodes) {
    return `${anime.episodes} ${anime.episodes === 1 ? 'episódio' : 'episódios'}`;
  }

  if (anime.genre) return anime.genre;
  if (Array.isArray(anime.genres)) {
    return anime.genres
      .map((genre) => genre?.name || genre)
      .filter(Boolean)
      .slice(0, 2)
      .join(', ');
  }

  return '';
}

export function AnimeCarousel({
  id,
  animes,
  title,
  icon: Icon,
  variant = 'default',
  viewAllHref,
  viewAllLabel = 'Ver tudo',
}) {
  const prevButtonRef = useRef(null);
  const nextButtonRef = useRef(null);
  const generatedId = useId();
  const { preferences } = useAppPreferences();
  const isCompact = preferences.carouselDensity === 'compact';
  const isHomeRail = variant === 'home';
  const headingId = `${id || `anime-carousel-${generatedId}`}-title`;

  const connectNavigation = (swiper) => {
    requestAnimationFrame(() => {
      if (swiper.destroyed || !swiper.params || !swiper.params.navigation || !prevButtonRef.current || !nextButtonRef.current) return;

      swiper.params.navigation.prevEl = prevButtonRef.current;
      swiper.params.navigation.nextEl = nextButtonRef.current;
      swiper.navigation.destroy();
      swiper.navigation.init();
      swiper.navigation.update();
    });
  };

  if (!animes || animes.length === 0) return null;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`relative group/carousel ${isHomeRail ? 'mb-8 md:mb-12' : 'mb-12'}`}
    >
      <div className="mb-4 flex items-center justify-between gap-4 px-1">
        <h2 id={headingId} className="flex items-center gap-2 text-xl font-black text-text-primary sm:text-2xl">
          {Icon && <Icon aria-hidden="true" className="h-5 w-5 text-primary sm:h-6 sm:w-6" />}
          {title}
        </h2>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="inline-flex min-h-11 shrink-0 items-center rounded-xl px-2 text-sm font-bold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {viewAllLabel}
          </Link>
        )}
      </div>

      <div className="relative group/arrows">
        <button
          ref={prevButtonRef}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm text-white hover:bg-primary transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 -ml-6 disabled:opacity-0 disabled:pointer-events-none cursor-pointer shadow-lg border border-white/10"
          aria-label={`Voltar em ${title}`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          ref={nextButtonRef}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm text-white hover:bg-primary transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 -mr-6 disabled:opacity-0 disabled:pointer-events-none cursor-pointer shadow-lg border border-white/10"
          aria-label={`Avançar em ${title}`}
        >
          <ArrowRight className="w-6 h-6" />
        </button>

        <Swiper
          modules={[Navigation]}
          loop={animes.length > (isHomeRail ? 3 : (isCompact ? 3 : 2))}
          spaceBetween={20}
          slidesPerView={2}
          navigation
          onSwiper={connectNavigation}
          breakpoints={{
            320: {
              slidesPerView: isHomeRail ? (isCompact ? 3.3 : 3.15) : (isCompact ? 2.7 : 2.3),
              spaceBetween: isHomeRail ? 8 : (isCompact ? 12 : 16),
            },
            360: {
              slidesPerView: isHomeRail ? (isCompact ? 3.55 : 3.35) : (isCompact ? 2.7 : 2.3),
              spaceBetween: isHomeRail ? 10 : (isCompact ? 12 : 16),
            },
            640: { slidesPerView: isCompact ? 4.2 : 3.3, spaceBetween: isCompact ? 14 : 20 },
            1024: { slidesPerView: isCompact ? 5.4 : 4.3, spaceBetween: isCompact ? 16 : 20 },
            1280: { slidesPerView: isCompact ? 6.4 : 5.3, spaceBetween: isCompact ? 16 : 20 },
          }}
          className="!pb-4 !px-1"
        >
          {animes.map((anime) => (
            <SwiperSlide key={anime.id}>
              <AnimeCard
                {...anime}
                genre={getAnimeMeta(anime, isHomeRail)}
                image={anime.image || anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.images?.webp?.small_image_url || anime.images?.jpg?.small_image_url || anime.images?.webp?.image_url || anime.images?.jpg?.image_url}
                showScore={preferences.showScores}
                smallImage={anime.smallImage || anime.images?.webp?.small_image_url || anime.images?.jpg?.small_image_url || anime.images?.webp?.image_url || anime.images?.jpg?.image_url}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
