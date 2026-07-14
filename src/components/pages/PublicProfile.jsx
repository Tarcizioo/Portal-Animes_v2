import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Lock } from 'lucide-react';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { AchievementBadges } from '@/components/profile/AchievementBadges';
import { FavoritesWidget } from '@/components/profile/FavoritesWidget';
import { ProfileActivity } from '@/components/profile/ProfileActivity';
import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap';
import { FollowButton } from '@/components/profile/FollowButton';
import { FollowersModal } from '@/components/profile/FollowersModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { useFollowCounts } from '@/hooks/useFollowCounts';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCompatibility } from '@/hooks/useCompatibility';
import { notifyProfileView } from '@/services/notificationService';

const DEFAULT_SECTION_ORDER = ['favorites', 'recent', 'heatmap'];
const CompatibilityModal = lazy(() => import('@/components/profile/CompatibilityModal').then((module) => ({ default: module.CompatibilityModal })));

export function PublicProfile() {
  const { uid } = useParams();
  const { profile, library, characterFavorites, loading, error } = usePublicProfile(uid);
  const { user: currentUser } = useAuth();
  const { profile: myProfile } = useUserProfile();
  const { followersCount, followingCount, loading: followCountsLoading } = useFollowCounts(uid);
  const [isCompatibilityOpen, setCompatibilityOpen] = useState(false);
  const [followModal, setFollowModal] = useState({ open: false, tab: 'followers' });
  const notifiedProfileRef = useRef(null);
  const isOwnProfile = currentUser?.uid === uid;

  const {
    score: compatibilityScore,
    sharedAnimes,
    sharedCount,
    genreOverlap,
    scoreAffinity,
    commonGenres,
    myAvgScore,
    pubAvgScore,
  } = useCompatibility(!isOwnProfile ? library : []);

  usePageTitle(profile ? `Perfil de ${profile.displayName}` : 'Perfil público');

  useEffect(() => {
    if (loading || !profile || !currentUser || isOwnProfile || notifiedProfileRef.current === uid) return;
    notifiedProfileRef.current = uid;
    notifyProfileView(uid, myProfile, currentUser.uid);
  }, [currentUser, isOwnProfile, loading, myProfile, profile, uid]);

  const sortedFavorites = useMemo(() => {
    const favorites = library?.filter((anime) => anime.isFavorite) || [];
    const order = profile?.favoritesOrder || [];
    if (!order.length) return favorites;
    const orderMap = new Map(order.map((id, index) => [String(id), index]));
    return [...favorites].sort((first, second) => (orderMap.get(String(first.id)) ?? Infinity) - (orderMap.get(String(second.id)) ?? Infinity));
  }, [library, profile?.favoritesOrder]);

  const sectionOrder = useMemo(() => {
    const saved = (profile?.profileSectionOrder || []).filter((id) => DEFAULT_SECTION_ORDER.includes(id));
    return [...saved, ...DEFAULT_SECTION_ORDER.filter((id) => !saved.includes(id))];
  }, [profile?.profileSectionOrder]);

  const renderSection = (id) => {
    if (id === 'favorites') return <FavoritesWidget animeFavorites={sortedFavorites} characterFavorites={characterFavorites} readOnly />;
    if (id === 'recent') return <ProfileActivity library={library} libraryPath={`/u/${uid}/library`} />;
    if (id === 'heatmap') return <ActivityHeatmap activityLog={profile?.activityLog} />;
    return null;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 p-4 pb-10 md:p-8">
        <Skeleton className="h-96 w-full rounded-3xl" />
        <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-24 rounded-2xl" />)}</div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /></div>
      </div>
    );
  }

  if (error || !profile) {
    const isPrivate = error === 'Este perfil é privado.';
    return (
      <div className="flex min-h-[65vh] flex-1 items-center justify-center p-4">
        <div className="max-w-md rounded-3xl border border-border-color bg-bg-secondary p-8 text-center shadow-2xl">
          <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${isPrivate ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{isPrivate ? <Lock className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}</span>
          <h2 className="mt-5 text-2xl font-black text-text-primary">{isPrivate ? 'Perfil privado' : 'Usuário não encontrado'}</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{isPrivate ? 'Esta pessoa optou por manter o perfil e a biblioteca visíveis somente para ela.' : 'O perfil que você procura não existe ou não está mais disponível.'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-5 p-3 pb-10 md:space-y-7 md:p-8">
        <ProfileHeader
          profile={profile}
          readOnly
          onCompatibility={!isOwnProfile && currentUser ? () => setCompatibilityOpen(true) : undefined}
          compatibilityScore={!isOwnProfile && currentUser ? compatibilityScore : null}
          followButton={!isOwnProfile ? <FollowButton targetUid={uid} targetProfile={profile} /> : null}
          followersCount={followersCount}
          followingCount={followingCount}
          countsLoading={followCountsLoading}
          onFollowersClick={() => setFollowModal({ open: true, tab: 'followers' })}
          onFollowingClick={() => setFollowModal({ open: true, tab: 'following' })}
        />

        <ProfileStats library={library} />

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7">
          <main className="min-w-0 space-y-5 md:space-y-7">{sectionOrder.map((id) => <section key={id}>{renderSection(id)}</section>)}</main>
          <aside className="lg:sticky lg:top-6"><AchievementBadges readOnly publicLibrary={library} publicProfile={profile} /></aside>
        </div>
      </div>

      {isCompatibilityOpen && (
        <Suspense fallback={null}>
          <CompatibilityModal
            isOpen
            onClose={() => setCompatibilityOpen(false)}
            score={compatibilityScore ?? 0}
            sharedAnimes={sharedAnimes ?? []}
            sharedCount={sharedCount ?? 0}
            genreOverlap={genreOverlap ?? 0}
            scoreAffinity={scoreAffinity ?? 0}
            commonGenres={commonGenres ?? []}
            myAvgScore={myAvgScore ?? 0}
            pubAvgScore={pubAvgScore ?? 0}
            otherName={profile.displayName || 'este usuário'}
          />
        </Suspense>
      )}

      {followModal.open && <FollowersModal isOpen initialTab={followModal.tab} onClose={() => setFollowModal((current) => ({ ...current, open: false }))} uid={uid} />}
    </>
  );
}
