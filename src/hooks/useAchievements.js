import { useEffect, useMemo } from 'react';
import { BADGES, getAchievementStats, getBadgeProgress } from '@/constants/badges';
import { useAnimeLibrary } from '@/hooks/useAnimeLibrary';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

function getClosestBadge(lockedBadges, stats) {
  return [...lockedBadges].sort((first, second) => {
    const firstProgress = getBadgeProgress(first, stats);
    const secondProgress = getBadgeProgress(second, stats);
    return secondProgress.percentage - firstProgress.percentage
      || (firstProgress.target - firstProgress.current) - (secondProgress.target - secondProgress.current);
  })[0] || null;
}

export function useAchievements() {
  const { library, loading } = useAnimeLibrary();
  const { user } = useAuth();
  const { toast } = useToast();
  const stats = useMemo(() => getAchievementStats(library), [library]);

  const { unlockedBadges, lockedBadges } = useMemo(() => {
    const unlocked = [];
    const locked = [];
    BADGES.forEach((badge) => (badge.requirement(stats) ? unlocked.push(badge) : locked.push(badge)));
    return { unlockedBadges: unlocked, lockedBadges: locked };
  }, [stats]);

  useEffect(() => {
    if (!user?.uid || loading) return;
    const storageKey = `known_badges:${user.uid}`;
    const unlockedIds = unlockedBadges.map((badge) => badge.id);
    const saved = localStorage.getItem(storageKey);

    if (saved === null) {
      localStorage.setItem(storageKey, JSON.stringify(unlockedIds));
      return;
    }

    let knownBadges = [];
    try {
      knownBadges = JSON.parse(saved);
    } catch {
      knownBadges = [];
    }

    const newBadges = unlockedBadges.filter((badge) => !knownBadges.includes(badge.id));
    newBadges.forEach((badge) => toast.success(badge.name, 'Nova conquista desbloqueada'));
    if (newBadges.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify([...new Set([...knownBadges, ...unlockedIds])]));
    }
  }, [loading, toast, unlockedBadges, user?.uid]);

  const nextBadge = useMemo(() => getClosestBadge(lockedBadges, stats), [lockedBadges, stats]);

  return {
    stats,
    loading,
    unlockedBadges,
    lockedBadges,
    nextBadge,
    nextBadgeProgress: nextBadge ? getBadgeProgress(nextBadge, stats) : null,
    totalBadges: BADGES.length,
    progressPercentage: Math.round((unlockedBadges.length / BADGES.length) * 100),
  };
}
