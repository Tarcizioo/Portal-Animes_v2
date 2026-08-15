import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  BarChart3,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  GripVertical,
  LayoutGrid,
  Monitor,
  RotateCcw,
  UserRoundSearch,
  X,
} from 'lucide-react';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSetupCard } from '@/components/profile/ProfileSetupCard';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { AchievementBadges } from '@/components/profile/AchievementBadges';
import { FavoritesWidget } from '@/components/profile/FavoritesWidget';
import { ProfileActivity } from '@/components/profile/ProfileActivity';
import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap';
import { FollowersModal } from '@/components/profile/FollowersModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAnimeLibrary } from '@/hooks/useAnimeLibrary';
import { useCharacterLibrary } from '@/hooks/useCharacterLibrary';
import { useFavoriteStudios } from '@/hooks/useFavoriteStudios';
import { useFollowCounts } from '@/hooks/useFollowCounts';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  DEFAULT_PROFILE_SECTION_ORDER,
  moveProfileSection,
  normalizeProfileSectionOrder,
} from '@/components/profile/profileSectionOrder';

const SECTION_LABELS = {
  favorites: 'Favoritos',
  journey: 'Jornada',
  recent: 'Atividade recente',
  heatmap: 'Mapa de atividade',
};

const EditProfileModal = lazy(() => import('@/components/profile/EditProfileModal').then((module) => ({ default: module.EditProfileModal })));
const ShareProfileModal = lazy(() => import('@/components/profile/ShareProfileModal').then((module) => ({ default: module.ShareProfileModal })));
const SettingsModal = lazy(() => import('@/components/settings/SettingsModal').then((module) => ({ default: module.SettingsModal })));
const UserSearchModal = lazy(() => import('@/components/profile/UserSearchModal').then((module) => ({ default: module.UserSearchModal })));

function SortableSection({ id, isEditing, position, total, onMove, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isEditing });

  return (
    <section ref={setNodeRef} data-profile-section={id} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? 'relative z-20 min-w-0 opacity-40' : 'relative min-w-0'}>
      {isEditing && (
        <div className="mb-2 flex min-w-0 flex-wrap items-center gap-1.5 rounded-xl border border-dashed border-button-accent/50 bg-button-accent/5 px-2 py-2 text-xs font-black text-text-secondary sm:px-3">
          <button type="button" {...attributes} {...listeners} aria-label={`Reordenar ${SECTION_LABELS[id]}`} className="grid h-11 w-11 touch-none cursor-grab place-items-center rounded-lg text-button-accent hover:bg-button-accent/10 active:cursor-grabbing"><GripVertical className="h-4 w-4" /></button>
          <span className="min-w-0 flex-1 truncate">{SECTION_LABELS[id]}</span>
          <button type="button" onClick={() => onMove(id, -1)} disabled={position === 0} aria-label={`Mover ${SECTION_LABELS[id]} para cima`} className="grid h-11 w-11 place-items-center rounded-lg text-text-secondary hover:bg-button-accent/10 hover:text-button-accent disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" onClick={() => onMove(id, 1)} disabled={position === total - 1} aria-label={`Mover ${SECTION_LABELS[id]} para baixo`} className="grid h-11 w-11 place-items-center rounded-lg text-text-secondary hover:bg-button-accent/10 hover:text-button-accent disabled:cursor-not-allowed disabled:opacity-30"><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      )}
      {children}
    </section>
  );
}

const QUICK_LINKS = [
  { to: '/library', label: 'Minha biblioteca', description: 'Organizar títulos', icon: BookOpen },
  { to: '/stats', label: 'Estatísticas', description: 'Ver sua jornada', icon: BarChart3 },
  { to: '/catalog', label: 'Explorar catálogo', description: 'Encontrar algo novo', icon: Compass },
  { id: 'community', label: 'Comunidade', description: 'Encontrar outros perfis', icon: UserRoundSearch },
];

function QuickAccessItem({ item, onOpenCommunity }) {
  const Icon = item.icon;
  const content = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-button-accent/10 text-button-accent"><Icon className="h-4 w-4" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className="block text-xs font-black text-text-primary">{item.label}</span><span className="block text-[10px] text-text-secondary">{item.description}</span></span>
      <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </>
  );
  const className = 'group flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent';

  if (item.to) return <Link to={item.to} className={className}>{content}</Link>;
  return <button type="button" onClick={onOpenCommunity} className={className}>{content}</button>;
}

export function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { profile, loading: profileLoading, updateProfileData } = useUserProfile();
  const { library, loading: libraryLoading, updateAnimeImage } = useAnimeLibrary();
  const { characterLibrary, updateCharacterImage } = useCharacterLibrary();
  const { favoriteStudios, toggleFavorite } = useFavoriteStudios();
  const { followersCount, followingCount, loading: followCountsLoading } = useFollowCounts(user?.uid);
  const [editModal, setEditModal] = useState({ open: false, initialTab: 'appearance' });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [followModal, setFollowModal] = useState({ open: false, tab: 'followers' });
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_PROFILE_SECTION_ORDER);
  const [savedOrder, setSavedOrder] = useState(DEFAULT_PROFILE_SECTION_ORDER);
  const [activeDragId, setActiveDragId] = useState(null);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const profileSectionOrderKey = JSON.stringify(profile?.profileSectionOrder ?? null);

  usePageTitle('Meu Perfil');

  useEffect(() => {
    const savedProfileSectionOrder = JSON.parse(profileSectionOrderKey);
    const normalized = normalizeProfileSectionOrder(savedProfileSectionOrder);
    setSectionOrder(normalized);
    setSavedOrder(normalized);
  }, [profileSectionOrderKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sortedFavorites = useMemo(() => {
    const favorites = library?.filter((anime) => anime.isFavorite) || [];
    const order = profile?.favoritesOrder || [];
    if (!order.length) return favorites;
    const orderMap = new Map(order.map((id, index) => [String(id), index]));
    return [...favorites].sort((first, second) => (orderMap.get(String(first.id)) ?? Infinity) - (orderMap.get(String(second.id)) ?? Infinity));
  }, [library, profile?.favoritesOrder]);

  const sortedCharacterFavorites = useMemo(() => {
    const favorites = characterLibrary || [];
    const order = profile?.favoriteCharactersOrder || [];
    if (!order.length) return favorites;
    const orderMap = new Map(order.map((id, index) => [String(id), index]));
    return [...favorites].sort((first, second) => (orderMap.get(String(first.id)) ?? Infinity) - (orderMap.get(String(second.id)) ?? Infinity));
  }, [characterLibrary, profile?.favoriteCharactersOrder]);

  const handleSaveLayout = async () => {
    setIsSavingLayout(true);
    try {
      await updateProfileData({ profileSectionOrder: sectionOrder });
      setSavedOrder(sectionOrder);
      setIsEditingLayout(false);
    } catch (error) {
      console.error('Falha ao salvar a organização do perfil:', error);
    } finally {
      setIsSavingLayout(false);
    }
  };

  const handleCancelLayout = () => {
    setSectionOrder(savedOrder);
    setIsEditingLayout(false);
  };

  const handleMoveSection = useCallback((id, direction) => {
    setSectionOrder((current) => moveProfileSection(current, id, direction));
  }, []);

  const handleFavoritesReorder = useCallback(async (ids) => {
    await updateProfileData({ favoritesOrder: ids });
  }, [updateProfileData]);

  const handleCharacterFavoritesReorder = useCallback(async (ids) => {
    await updateProfileData({ favoriteCharactersOrder: ids });
  }, [updateProfileData]);

  const handleSetPreferredView = useCallback(async (view) => {
    await updateProfileData({ preferredFavoritesView: view });
  }, [updateProfileData]);

  const handleUpdateImage = useCallback(async (type, id, url) => {
    try {
      if (type === 'anime') await updateAnimeImage(id, url);
      else await updateCharacterImage(id, url);
      toast.success('Imagem atualizada.', 'Favoritos');
    } catch (error) {
      console.error('Erro ao atualizar imagem:', error);
      toast.error('Não foi possível atualizar a imagem.', 'Favoritos');
      throw error;
    }
  }, [toast, updateAnimeImage, updateCharacterImage]);

  const renderSection = (id) => {
    if (id === 'favorites') {
      return (
        <FavoritesWidget
          animeFavorites={sortedFavorites}
          characterFavorites={sortedCharacterFavorites}
          onReorderAnimes={handleFavoritesReorder}
          onReorderCharacters={handleCharacterFavoritesReorder}
          onUpdateImage={handleUpdateImage}
          preferredView={profile?.preferredFavoritesView}
          onSetPreferredView={handleSetPreferredView}
        />
      );
    }
    if (id === 'journey') return <AchievementBadges />;
    if (id === 'recent') return <ProfileActivity library={library} libraryPath="/library" isOwnProfile />;
    if (id === 'heatmap') return <ActivityHeatmap activityLog={profile?.activityLog} />;
    return null;
  };

  const loading = authLoading || (user && (profileLoading || libraryLoading));

  if (loading) {
    return (
      <div className="mx-auto min-w-0 max-w-7xl space-y-5 overflow-x-clip p-3 pb-10 md:p-8">
        <Skeleton className="h-80 w-full rounded-3xl sm:h-96" />
        <div className="grid grid-cols-2 gap-2.5">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-24 rounded-2xl" />)}</div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /></div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto min-w-0 max-w-7xl space-y-5 overflow-x-clip p-3 pb-10 md:space-y-7 md:p-8">
        <ProfileHeader
          user={user}
          profile={profile}
          onEdit={(initialTab) => setEditModal({ open: true, initialTab })}
          onShare={() => setIsShareModalOpen(true)}
          onSettings={() => setIsSettingsModalOpen(true)}
          followersCount={followersCount}
          followingCount={followingCount}
          countsLoading={followCountsLoading}
          onFollowersClick={() => setFollowModal({ open: true, tab: 'followers' })}
          onFollowingClick={() => setFollowModal({ open: true, tab: 'following' })}
        />

        <ProfileStats library={library} />

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7">
          <div className="min-w-0 space-y-5 md:space-y-7">
            <ProfileSetupCard
              profile={profile}
              favoriteCount={sortedFavorites.length}
              onEditIdentity={() => setEditModal({ open: true, initialTab: 'identity' })}
              onEditAppearance={() => setEditModal({ open: true, initialTab: 'appearance' })}
              onEditPreferences={() => setEditModal({ open: true, initialTab: 'identity' })}
              onEditPrivacy={() => setEditModal({ open: true, initialTab: 'privacy' })}
              onOpenAccount={() => setIsSettingsModalOpen(true)}
            />

            <div className="flex min-h-11 items-center justify-end">
              <AnimatePresence mode="wait">
                {isEditingLayout ? (
                  <Motion.div key="editing" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-button-accent/20 bg-button-accent/5 p-2.5">
                    <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-black text-button-accent"><GripVertical className="h-4 w-4 shrink-0" aria-hidden="true" /> <span className="truncate">Organize por gesto ou pelos botões</span></span>
                    <div className="ml-auto grid grid-cols-2 gap-2"><button type="button" onClick={handleCancelLayout} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-text-secondary hover:text-text-primary"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Cancelar</button><button type="button" onClick={handleSaveLayout} disabled={isSavingLayout} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-black text-white disabled:opacity-60"><Check className="h-3.5 w-3.5" aria-hidden="true" /> {isSavingLayout ? 'Salvando...' : 'Salvar'}</button></div>
                  </Motion.div>
                ) : (
                  <Motion.button key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} type="button" onClick={() => setIsEditingLayout(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-color bg-bg-secondary px-3 text-xs font-black text-text-secondary transition-colors hover:border-button-accent/40 hover:text-text-primary"><LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" /> Organizar perfil</Motion.button>
                )}
              </AnimatePresence>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({ active }) => setActiveDragId(active.id)} onDragEnd={({ active, over }) => {
              setActiveDragId(null);
              if (!over || active.id === over.id) return;
              setSectionOrder((current) => arrayMove(current, current.indexOf(active.id), current.indexOf(over.id)));
            }}>
              <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                <div className="min-w-0 space-y-5 md:space-y-7">{sectionOrder.map((id, index) => <SortableSection key={id} id={id} isEditing={isEditingLayout} position={index} total={sectionOrder.length} onMove={handleMoveSection}>{renderSection(id)}</SortableSection>)}</div>
              </SortableContext>
              <DragOverlay>{activeDragId ? <div className="flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border-2 border-button-accent bg-bg-secondary p-4 shadow-2xl"><GripVertical className="h-5 w-5 shrink-0 text-button-accent" /><span className="truncate font-black text-text-primary">{SECTION_LABELS[activeDragId]}</span></div> : null}</DragOverlay>
            </DndContext>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <div className="min-w-0 rounded-2xl border border-border-color bg-bg-secondary p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-black text-text-primary"><Monitor className="h-4 w-4 text-button-accent" /> Estúdios favoritos</h3><span className="text-[10px] font-bold text-text-secondary">{favoriteStudios?.length || 0}</span></div>
              {favoriteStudios?.length > 0 ? (
                <div className="space-y-2">
                  {favoriteStudios.slice(0, 3).map((studio) => (
                    <div key={studio.mal_id || studio.id} className="group flex min-w-0 items-center gap-2 rounded-xl border border-border-color bg-bg-tertiary/45 p-2">
                      <Link to={`/studio/${studio.mal_id || studio.id}`} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white p-1.5">{studio.image ? <img src={studio.image} alt="" className="h-full w-full object-contain" /> : <Monitor className="m-auto h-full w-6 text-zinc-300" aria-hidden="true" />}</div>
                        <span className="truncate text-xs font-bold text-text-secondary group-hover:text-text-primary">{studio.name}</span>
                      </Link>
                      <button type="button" onClick={() => toggleFavorite(studio)} aria-label={`Remover ${studio.name} dos favoritos`} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-red-500/10 hover:text-red-400"><X className="h-4 w-4" aria-hidden="true" /></button>
                    </div>
                  ))}
                </div>
              ) : <p className="rounded-xl border border-dashed border-border-color p-4 text-center text-xs text-text-secondary">Seus estúdios seguidos aparecerão aqui.</p>}
            </div>

            <div className="rounded-2xl border border-border-color bg-bg-secondary p-3">
              <p className="px-2 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.16em] text-text-secondary">Atalhos</p>
              {QUICK_LINKS.map((item) => <QuickAccessItem key={item.to || item.id} item={item} onOpenCommunity={() => setIsUserSearchOpen(true)} />)}
            </div>
          </aside>
        </div>
      </div>

      <Suspense fallback={null}>
        {editModal.open && <EditProfileModal isOpen initialTab={editModal.initialTab} onClose={() => setEditModal((current) => ({ ...current, open: false }))} profile={profile} onSave={updateProfileData} />}
        {isShareModalOpen && <ShareProfileModal isOpen onClose={() => setIsShareModalOpen(false)} user={user} profile={profile} favorites={sortedFavorites} library={library} />}
        {isSettingsModalOpen && <SettingsModal isOpen initialTab="account" onClose={() => setIsSettingsModalOpen(false)} />}
        {isUserSearchOpen && <UserSearchModal isOpen onClose={() => setIsUserSearchOpen(false)} />}
      </Suspense>

      {followModal.open && <FollowersModal isOpen initialTab={followModal.tab} onClose={() => setFollowModal((current) => ({ ...current, open: false }))} uid={user.uid} />}
    </>
  );
}
