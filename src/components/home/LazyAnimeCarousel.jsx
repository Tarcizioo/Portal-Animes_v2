import { useState, useRef, useEffect } from 'react';
import { AnimeCarousel } from '@/components/ui/AnimeCarousel';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

export function LazyAnimeCarousel({ id, title, icon: Icon, animes }) {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '100px' }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);


    if (!animes?.length) return null;

    if (isVisible) {
        return (
            <div ref={containerRef} className="min-h-[340px]">
                <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
                    <AnimeCarousel
                        id={id}
                        title={title}
                        icon={Icon}
                        animes={animes}
                    />
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="min-h-[340px]">
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-6 px-1">
                    {Icon && <Icon className="w-6 h-6 text-primary/40 animate-pulse" />}
                    <div className="h-8 w-48 bg-bg-tertiary rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-y-8 gap-x-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}