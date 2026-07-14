import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AnimeCard } from '@/components/ui/AnimeCard';
import { useAppPreferences } from '@/hooks/useAppPreferences';

import 'swiper/css';
import 'swiper/css/navigation';

export function AnimeCarousel({ animes, title, icon: Icon }) {
  const prevButtonRef = useRef(null);
  const nextButtonRef = useRef(null);
  const { preferences } = useAppPreferences();
  const isCompact = preferences.carouselDensity === 'compact';

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
    <section className="mb-12 relative group/carousel">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          {Icon && <Icon className="text-primary w-6 h-6" />}
          {title}
        </h3>
      </div>

      <div className="relative group/arrows">
        <button
          ref={prevButtonRef}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm text-white hover:bg-primary transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 -ml-6 disabled:opacity-0 disabled:pointer-events-none cursor-pointer shadow-lg border border-white/10"
          aria-label="Previous slide"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          ref={nextButtonRef}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm text-white hover:bg-primary transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 -mr-6 disabled:opacity-0 disabled:pointer-events-none cursor-pointer shadow-lg border border-white/10"
          aria-label="Next slide"
        >
          <ArrowRight className="w-6 h-6" />
        </button>

        <Swiper
          modules={[Navigation]}
          loop={animes.length > (isCompact ? 3 : 2)}
          spaceBetween={20}
          slidesPerView={2}
          navigation
          onSwiper={connectNavigation}
          breakpoints={{
            320: { slidesPerView: isCompact ? 2.7 : 2.3, spaceBetween: isCompact ? 12 : 16 },
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