import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ChevronRight, Lock, Settings2, Sparkles, Trophy } from 'lucide-react';
import { BADGES, getAchievementStats, getBadgeProgress } from '@/constants/badges';
import { useAchievements } from '@/hooks/useAchievements';
import { useUserProfile } from '@/hooks/useUserProfile';
import { BadgesModal } from './BadgesModal';

function findClosestBadge(lockedBadges, stats) {
  return [...lockedBadges].sort((first, second) =>
    getBadgeProgress(second, stats).percentage - getBadgeProgress(first, stats).percentage,
  )[0] || null;
}

export function AchievementBadges({ readOnly = false, publicLibrary = null, publicProfile = null }) {
  const localAchievements = useAchievements();
  const { profile: localProfile } = useUserProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const profile = readOnly ? publicProfile : localProfile;

  const publicAchievementData = useMemo(() => {
    const stats = getAchievementStats(publicLibrary || []);
    const unlockedBadges = BADGES.filter((badge) => badge.requirement(stats));
    const lockedBadges = BADGES.filter((badge) => !badge.requirement(stats));
    return {
      stats,
      unlockedBadges,
      nextBadge: findClosestBadge(lockedBadges, stats),
    };
  }, [publicLibrary]);

  const stats = readOnly ? publicAchievementData.stats : localAchievements.stats;
  const unlockedBadges = readOnly ? publicAchievementData.unlockedBadges : localAchievements.unlockedBadges;
  const nextBadge = readOnly ? publicAchievementData.nextBadge : localAchievements.nextBadge;
  const unlockedIds = new Set(unlockedBadges.map((badge) => badge.id));
  const savedFeatured = Array.isArray(profile?.featuredBadges) ? profile.featuredBadges : null;
  const featuredBadges = (savedFeatured === null ? unlockedBadges.slice(0, 3).map((badge) => badge.id) : savedFeatured)
    .map((id) => BADGES.find((badge) => badge.id === id))
    .filter((badge) => badge && unlockedIds.has(badge.id))
    .slice(0, 3);
  const progressPercentage = Math.round((unlockedBadges.length / BADGES.length) * 100);
  const nextProgress = nextBadge ? getBadgeProgress(nextBadge, stats) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border-color bg-bg-secondary shadow-lg shadow-black/5">
      <div className="relative overflow-hidden border-b border-border-color bg-[radial-gradient(circle_at_85%_10%,rgba(245,158,11,0.18),transparent_36%),linear-gradient(135deg,rgba(99,102,241,0.11),transparent)] p-5 md:p-6">
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20"><Trophy className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">Jornada pessoal</p>
              <h3 className="text-lg font-black text-text-primary">Conquistas</h3>
              <p className="text-xs text-text-secondary">{unlockedBadges.length} de {BADGES.length} desbloqueadas</p>
            </div>
          </div>
          {!readOnly && (
            <button type="button" onClick={() => setIsModalOpen(true)} aria-label="Gerenciar conquistas" className="shrink-0 rounded-xl border border-border-color bg-bg-primary/40 p-2.5 text-text-secondary transition-colors hover:border-button-accent/50 hover:text-text-primary"><Settings2 className="h-4 w-4" /></button>
          )}
        </div>
        <div className="relative mt-5">
          <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-wider text-text-secondary"><span>Progresso geral</span><span>{progressPercentage}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-bg-primary/70"><div className="h-full rounded-full bg-gradient-to-r from-button-accent via-cyan-400 to-amber-300 transition-[width] duration-700" style={{ width: `${progressPercentage}%` }} /></div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <div className="mb-3 flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[0.16em] text-text-secondary">Em destaque</p><span className="text-[10px] text-text-secondary">até 3 no perfil</span></div>
        {featuredBadges.length > 0 ? (
          <div className="grid gap-2">
            {featuredBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div key={badge.id} className={clsx('group flex items-center gap-3 rounded-2xl border p-3 transition-transform hover:-translate-y-0.5', badge.bg, badge.border)}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/15"><Icon className={clsx('h-4 w-4', badge.color)} /></span>
                  <div className="min-w-0 flex-1">
                    <span className={clsx('block text-[9px] font-black uppercase tracking-wider', badge.color)}>{badge.rarity}</span>
                    <p className="mt-0.5 truncate text-sm font-black text-text-primary">{badge.name}</p>
                    <p className="mt-0.5 truncate text-[10px] text-text-secondary">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border-color bg-bg-primary/30 p-5 text-center"><Lock className="mx-auto h-5 w-5 text-text-secondary" /><p className="mt-2 text-sm font-bold text-text-primary">Sua vitrine ainda está vazia</p><p className="mt-1 text-xs text-text-secondary">Desbloqueie uma conquista para começar.</p></div>
        )}

        {nextBadge && nextProgress && (
          <button type="button" onClick={() => !readOnly && setIsModalOpen(true)} disabled={readOnly} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-border-color bg-bg-tertiary/35 p-3 text-left transition-colors enabled:hover:border-button-accent/40">
            <span className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', nextBadge.bg)}><Sparkles className={clsx('h-4 w-4', nextBadge.color)} /></span>
            <div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><p className="truncate text-xs font-black text-text-primary">Próxima: {nextBadge.name}</p><span className="shrink-0 text-[10px] font-bold text-text-secondary">{nextProgress.value}/{nextProgress.target}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-primary"><div className="h-full rounded-full bg-button-accent" style={{ width: `${nextProgress.percentage}%` }} /></div></div>
            {!readOnly && <ChevronRight className="h-4 w-4 text-text-secondary" />}
          </button>
        )}
      </div>

      {!readOnly && <BadgesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
