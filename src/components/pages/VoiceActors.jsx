import { useEffect, useMemo, useRef } from 'react';
import { useTopPeople } from '@/hooks/usePeople';
import { usePageTitle } from '@/hooks/usePageTitle';
import { VoiceActorCard } from '@/components/ui/VoiceActorCard';
import { Link } from 'react-router-dom';
import { AlertCircle, Mic2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { dedupeByMalId } from '@/utils/dedupeByMalId';

function PersonProfileLink({ person, children }) {
  return <Link to={`/person/${person.mal_id}`}>{children}</Link>;
}

export function VoiceActors() {
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading,
    error,
    refetch,
  } = useTopPeople();
  
  usePageTitle('Top Dubladores');

  // Intersection Observer for Infinite Scroll
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && !error) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 } // Trigger when 10% of the sentinel is visible
    );

    const loadMoreElement = loadMoreRef.current;
    if (loadMoreElement) observer.observe(loadMoreElement);

    return () => {
      if (loadMoreElement) observer.unobserve(loadMoreElement);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, error]);

  // Skeleton Loading Component
  const SkeletonCard = () => (
    <div className="flex flex-col gap-3 rounded-xl overflow-hidden bg-bg-secondary p-4 animate-pulse border border-white/5">
        <div className="w-full aspect-[2/3] bg-white/5 rounded-lg" />
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
    </div>
  );

  const people = useMemo(() => {
    const allPeople = data?.pages.flatMap((page) => page.data || []) || [];
    return dedupeByMalId(allPeople);
  }, [data]);

  return (
    <div className="min-h-screen p-6 lg:p-10 space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-text-primary flex items-center gap-3">
            <Mic2 className="w-8 h-8 text-primary" /> Top Pessoas da Indústria
          </h1>
          <p className="text-text-secondary mt-2 text-lg">
            As pessoas mais populares da indústria de animes.
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <div>
            <h2 className="font-bold text-text-primary">Nao foi possivel carregar as pessoas</h2>
            <p className="mt-1 text-sm text-text-secondary">A API pode estar instavel. Tente novamente em alguns segundos.</p>
          </div>
          <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {people.map((person, index) => (
          <motion.div
            key={`${person.mal_id}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: (index % 20) * 0.05 }}
          >
            <PersonProfileLink person={person}>
              <VoiceActorCard person={person} index={index} />
            </PersonProfileLink>
          </motion.div>
        ))}
        
        {/* Loading Skeletons (Initial or Appending) */}
        {(isLoading || isFetchingNextPage) && (
             Array.from({ length: 10 }).map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
             ))
        )}
      </div>

      {/* Sentinel Element for Infinite Scroll */}
      <div ref={loadMoreRef} className="h-10 w-full flex items-center justify-center p-4">
      </div>
      
    </div>
  );
}
