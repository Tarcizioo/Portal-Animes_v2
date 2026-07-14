import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  GripVertical,
  LayoutGrid,
  LogIn,
  Monitor,
  RotateCcw,
  X,
} from 'lucide-react';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
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

const DEFAULT_SECTION_ORDER = ['favorites', 'recent', 'heatmap'];
const SECTION_LABELS = {
  favorites: 'Favoritos',
  recent: 'Atividade recente',
  heatmap: 'Mapa de atividade',
};

const EditProfileModal = lazy(() => import('@/components/profile/EditProfileModal').then((module) => ({ default: module.EditProfileModal })));
const ShareProfileModal = lazy(() => import('@/components/profile/ShareProfileModal').then((module) => ({ default: module.ShareProfileModal })));

function SortableSection({ id, isEditing, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isEditing });

  return (
    <section ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? 'relative z-20 opacity-40' : 'relative'}>
      {isEditing && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-dashed border-button-accent/50 bg-button-accent/5 px-3 py-2 text-xs font-black text-text-secondary">
          <button type="button" {...attributes} {...listeners} aria-label={`Reordenar ${SECTION_LABELS[id]}`} className="touch-none cursor-grab rounded-lg p-1.5 text-button-accent hover:bg-button-accent/10 active:cursor-grabbing"><GripVertical className="h-4 w-4" /></button>
          <span>{SECTION_LABELS[id]}</span>
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
];

export function Profile() {
  const { user, signInGoogle, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { profile, loading: profileLoading, updateProfileData } = useUserProfile();
  const { library, loading: libraryLoading, updateAnimeImage } = useAnimeLibrary();
  const { characterLibrary, updateCharacterImage } = useCharacterLibrary();
  const { favoriteStudios, toggleFavorite } = useFavoriteStudios();
  const { followersCount, followingCount, loading: followCountsLoading } = useFollowCounts(user?.uid);
  const [editModal, setEditModal] = useState({ open: false, initialTab: 'appearance' });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [followModal, setFollowModal] = useState({ open: false, tab: 'followers' });
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_SECTION_ORDER);
  const [savedOrder, setSavedOrder] = useState(DEFAULT_SECTION_ORDER);
  const [activeDragId, setActiveDragId] = useState(null);
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  usePageTitle('Meu Perfil');

  useEffect(() => {
    const saved = profile?.profileSectionOrder || [];
    const validSaved = saved.filter((id) => DEFAULT_SECTION_ORDER.includes(id));
    const merged = [...validSaved, ...DEFAULT_SECTION_ORDER.filter((id) => !validSaved.includes(id))];
    setSectionOrder(merged);
    setSavedOrder(merged);
  }, [profile?.profileSectionOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
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
    if (id === 'recent') return <ProfileActivity library={library} libraryPath="/library" isOwnProfile />;
    if (id === 'heatmap') return <ActivityHeatmap activityLog={profile?.activityLog} />;
    return null;
  };

  const loading = authLoading || (user && (profileLoading || libraryLoading));

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 p-3 pb-10 md:p-8">
        <Skeleton className="h-96 w-full rounded-3xl" />
        <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-24 rounded-2xl" />)}</div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[65vh] flex-1 items-center justify-center p-4">
        <div className="max-w-md rounded-3xl border border-border-color bg-bg-secondary p-8 text-center shadow-2xl">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-button-accent/10 text-button-accent"><LogIn className="h-7 w-7" /></span>
          <h2 className="mt-5 text-2xl font-black text-text-primary">Seu perfil começa aqui</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">Entre para organizar sua biblioteca, montar sua vitrine e acompanhar conquistas.</p>
          <button type="button" onClick={signInGoogle} className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-button-accent px-5 py-3 text-sm font-black text-text-on-primary shadow-lg shadow-button-accent/20"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-5 w-5 rounded-full bg-white p-0.5" /> Entrar com Google</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-5 p-3 pb-10 md:space-y-7 md:p-8">
        <ProfileHeader
          user={user}
          profile={profile}
          onEdit={(initialTab) => setEditModal({ open: true, initialTab })}
          onShare={() => setIsShareModalOpen(true)}
          followersCount={followersCount}
          followingCount={followingCount}
          countsLoading={followCountsLoading}
          onFollowersClick={() => setFollowModal({ open: true, tab: 'followers' })}
          onFollowingClick={() => setFollowModal({ open: true, tab: 'following' })}
        />

        <ProfileStats library={library} />

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7">
          <div className="min-w-0">
            <div className="mb-4 flex min-h-9 items-center justify-end">
              <AnimatePresence mode="wait">
                {isEditingLayout ? (
                  <Motion.div key="editing" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex w-full items-center gap-2 rounded-2xl border border-button-accent/20 bg-button-accent/5 p-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-black text-button-accent"><GripVertical className="h-4 w-4" /> Arraste para organizar</span>
                    <div className="ml-auto flex gap-2"><button type="button" onClick={handleCancelLayout} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-text-secondary hover:text-text-primary"><RotateCcw className="h-3.5 w-3.5" /> Cancelar</button><button type="button" onClick={handleSaveLayout} disabled={isSavingLayout} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-white disabled:opacity-60"><Check className="h-3.5 w-3.5" /> {isSavingLayout ? 'Salvando...' : 'Salvar'}</button></div>
                  </Motion.div>
                ) : (
                  <Motion.button key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} type="button" onClick={() => setIsEditingLayout(true)} className="inline-flex items-center gap-2 rounded-xl border border-border-color bg-bg-secondary px-3 py-2 text-xs font-black text-text-secondary transition-colors hover:border-button-accent/40 hover:text-text-primary"><LayoutGrid className="h-3.5 w-3.5" /> Organizar perfil</Motion.button>
                )}
              </AnimatePresence>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({ active }) => setActiveDragId(active.id)} onDragEnd={({ active, over }) => {
              setActiveDragId(null);
              if (!over || active.id === over.id) return;
              setSectionOrder((current) => arrayMove(current, current.indexOf(active.id), current.indexOf(over.id)));
            }}>
              <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-5 md:space-y-7">{sectionOrder.map((id) => <SortableSection key={id} id={id} isEditing={isEditingLayout}>{renderSection(id)}</SortableSection>)}</div>
              </SortableContext>
              <DragOverlay>{activeDragId ? <div className="flex items-center gap-3 rounded-2xl border-2 border-button-accent bg-bg-secondary p-4 shadow-2xl"><GripVertical className="h-5 w-5 text-button-accent" /><span className="font-black text-text-primary">{SECTION_LABELS[activeDragId]}</span></div> : null}</DragOverlay>
            </DndContext>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <AchievementBadges />

            <div className="rounded-2xl border border-border-color bg-bg-secondary p-5">
              <div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-black text-text-primary"><Monitor className="h-4 w-4 text-button-accent" /> Estúdios favoritos</h3><span className="text-[10px] font-bold text-text-secondary">{favoriteStudios?.length || 0}</span></div>
              {favoriteStudios?.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {favoriteStudios.slice(0, 6).map((studio) => (
                    <div key={studio.mal_id || studio.id} className="group relative">
                      <Link to={`/studio/${studio.mal_id || studio.id}`} className="block rounded-xl border border-transparent bg-bg-tertiary p-2 text-center transition-colors hover:border-button-accent/40">
                        <div className="aspect-square overflow-hidden rounded-lg bg-white p-1.5">{studio.image ? <img src={studio.image} alt={studio.name} className="h-full w-full object-contain" /> : <Monitor className="m-auto h-full w-7 text-zinc-300" />}</div>
                        <span className="mt-1.5 block truncate text-[9px] font-bold text-text-secondary group-hover:text-text-primary">{studio.name}</span>
                      </Link>
                      <button type="button" onClick={() => toggleFavorite(studio)} aria-label={`Remover ${studio.name} dos favoritos`} className="absolute right-1.5 top-1.5 rounded-full bg-black/65 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              ) : <p className="rounded-xl border border-dashed border-border-color p-4 text-center text-xs text-text-secondary">Seus estúdios seguidos aparecerão aqui.</p>}
            </div>

            <div className="rounded-2xl border border-border-color bg-bg-secondary p-3">
              <p className="px-2 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.16em] text-text-secondary">Atalhos</p>
              {QUICK_LINKS.map((item) => { const Icon = item.icon; return <Link key={item.to} to={item.to} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-bg-tertiary"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-button-accent/10 text-button-accent"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-black text-text-primary">{item.label}</span><span className="block text-[10px] text-text-secondary">{item.description}</span></span><ChevronRight className="h-4 w-4 text-text-secondary transition-transform group-hover:translate-x-0.5" /></Link>; })}
            </div>
          </aside>
        </div>
      </div>

      <Suspense fallback={null}>
        {editModal.open && <EditProfileModal isOpen initialTab={editModal.initialTab} onClose={() => setEditModal((current) => ({ ...current, open: false }))} profile={profile} onSave={updateProfileData} />}
        {isShareModalOpen && <ShareProfileModal isOpen onClose={() => setIsShareModalOpen(false)} user={user} profile={profile} favorites={sortedFavorites} library={library} />}
      </Suspense>

      {followModal.open && <FollowersModal isOpen initialTab={followModal.tab} onClose={() => setFollowModal((current) => ({ ...current, open: false }))} uid={user.uid} />}
    </>
  );
}
