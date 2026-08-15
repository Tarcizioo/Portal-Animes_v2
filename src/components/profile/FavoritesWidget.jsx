import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, GripVertical, User, Pin, Pencil, Check, Star, Image as ImageIcon } from 'lucide-react';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { ImageSelectModal } from '@/components/profile/ImageSelectModal';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { getReorderedFavoriteIds } from '@/components/profile/profileFavoritesOrder';

function FavoriteCard({ item, type, isOverlay = false, isEditing = false, dragListeners = {}, dragAttributes = {}, onOpenImageModal }) {
    const linkPath = type === 'anime' ? `/anime/${item.id}` : `/character/${item.id}`;

    return (
        <div className={clsx(
            "group min-w-0",
            isOverlay && "cursor-grabbing scale-105"
        )}>
            {/* Card image */}
            <div className={clsx(
                "relative aspect-[2/3] rounded-xl overflow-hidden bg-bg-tertiary border border-border-color shadow-md",
                "group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300",
                isEditing && "hover:border-primary/50",
                !isEditing && "mb-2",
            )}>
                <Link
                    to={linkPath}
                    className={clsx("block w-full h-full", isEditing && "pointer-events-none")}
                    draggable={false}
                >
                    <ResponsiveImage
                        src={item.image || item.smallImage}
                        fallbackSrc={item.smallImage}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 639px) 29vw, (max-width: 1023px) 22vw, 180px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
                </Link>
            </div>

            {isEditing && !isOverlay && (
                <div className="mb-2 mt-1.5 grid grid-cols-2 gap-1.5" aria-label={`Ações de ${item.title || item.name}`}>
                    <button
                        type="button"
                        {...dragListeners}
                        {...dragAttributes}
                        aria-label={`Reordenar ${item.title || item.name}`}
                        className="grid h-11 min-w-11 touch-none cursor-grab place-items-center rounded-lg border border-border-color bg-bg-tertiary text-text-secondary transition-colors hover:border-primary/40 hover:text-primary active:cursor-grabbing"
                        title="Segure para reordenar"
                    >
                        <GripVertical className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {onOpenImageModal ? (
                        <button
                            type="button"
                            onClick={() => onOpenImageModal(item)}
                            aria-label={`Trocar imagem de ${item.title || item.name}`}
                            className="grid h-11 min-w-11 place-items-center rounded-lg border border-border-color bg-bg-tertiary text-text-secondary transition-colors hover:border-button-accent/40 hover:text-button-accent"
                            title="Trocar imagem"
                        >
                            <ImageIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                    ) : null}
                </div>
            )}

            {/* Title below card — matches RecentActivity style */}
            <Link
                to={linkPath}
                className={clsx(isEditing && "pointer-events-none")}
                draggable={false}
            >
                <p className="text-[11px] font-semibold text-text-secondary group-hover:text-primary line-clamp-2 leading-tight transition-colors">
                    {item.title || item.name}
                </p>
            </Link>
        </div>
    );
}

function SortableFavoriteItem({ item, type, isEditing, onOpenImageModal }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id, disabled: !isEditing });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'auto'
    };

    return (
        <div ref={setNodeRef} style={style}>
            <FavoriteCard
                item={item}
                type={type}
                isEditing={isEditing}
                dragListeners={listeners}
                dragAttributes={attributes}
                onOpenImageModal={onOpenImageModal}
            />
        </div>
    );
}

// --- Main Widget ---

export function FavoritesWidget({
    animeFavorites,
    characterFavorites,
    onReorderAnimes,
    onReorderCharacters,
    onUpdateImage,
    preferredView,
    onSetPreferredView,
    readOnly = false
}) {
    const [selectedTab, setSelectedTab] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [imageModalState, setImageModalState] = useState({ open: false, item: null });
    const [orderOverride, setOrderOverride] = useState({ key: null, ids: [] });

    const activeTab = selectedTab || preferredView || 'anime';
    const isPinned = preferredView === activeTab;
    const propItems = activeTab === 'anime'
        ? (Array.isArray(animeFavorites) ? animeFavorites : [])
        : (Array.isArray(characterFavorites) ? characterFavorites : []);
    const type = activeTab;
    const sourceItems = propItems.slice(0, 10);
    const sourceKey = `${type}:${sourceItems.map((item) => item.id).join('|')}`;
    const orderedIds = orderOverride.key === sourceKey
        ? orderOverride.ids
        : sourceItems.map((item) => item.id);
    const localItems = orderedIds
        .map((id) => sourceItems.find((item) => item.id === id))
        .filter(Boolean);

    // Dnd State
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        const nextOrder = getReorderedFavoriteIds(localItems, propItems.slice(10), active.id, over?.id);
        if (nextOrder) {
            setOrderOverride({ key: sourceKey, ids: nextOrder.visibleIds });
            if (activeTab === 'anime') onReorderAnimes?.(nextOrder.allIds);
            else onReorderCharacters?.(nextOrder.allIds);
        }
        setActiveId(null);
    };

    const handlePin = () => {
        if (isPinned) {
            onSetPreferredView?.(null);
        } else {
            onSetPreferredView?.(activeTab);
        }
    };

    return (
        <div className="relative min-w-0 overflow-hidden rounded-2xl border border-border-color bg-bg-secondary p-4 md:p-6">

            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Section title — matches RecentActivity / AchievementBadges pattern */}
            <div className="relative z-10 mb-4 flex min-w-0 items-center justify-between gap-3 md:mb-6">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                    <Star className="w-4 h-4 text-button-accent" aria-hidden="true" />
                    Favoritos
                </h3>
                <span className="shrink-0 rounded-full border border-border-color bg-bg-tertiary px-2.5 py-1 text-[10px] font-bold text-text-secondary">{localItems.length} de 10</span>
            </div>

            <div className="relative z-10 mb-4 grid min-w-0 gap-3 md:mb-6">
                <div className="min-w-0 overflow-x-auto pb-1">
                    <ViewToggle
                        value={activeTab}
                        onChange={(val) => { setSelectedTab(val); setIsEditing(false); }}
                        options={[
                            { value: 'anime', label: 'Animes', icon: Heart },
                            { value: 'character', label: 'Personagens', icon: User },
                        ]}
                    />
                </div>

                {!readOnly && (
                    <div className="grid grid-cols-[minmax(0,1fr)_2.75rem] gap-2 sm:flex sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setIsEditing(!isEditing)}
                            className={clsx(
                                "flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-bold transition-all",
                                isEditing
                                    ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                                    : "bg-bg-tertiary text-text-secondary border-border-color hover:text-text-primary hover:bg-bg-tertiary/80"
                            )}
                        >
                            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                            {isEditing ? 'Concluir' : 'Organizar'}
                        </button>

                        <button
                            type="button"
                            onClick={handlePin}
                            aria-label={isPinned ? 'Remover como aba padrão' : 'Definir como aba padrão'}
                            className={clsx(
                                "grid h-11 w-11 place-items-center rounded-lg border transition-all",
                                isPinned
                                    ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                    : "bg-transparent text-text-secondary border-transparent hover:bg-bg-tertiary"
                            )}
                            title={isPinned ? "Aba padrão definida" : "Definir como aba padrão"}
                        >
                            <Pin className={clsx("w-4 h-4", isPinned && "fill-current")} aria-hidden="true" />
                        </button>
                    </div>
                )}
            </div>

            {/* Grid Area */}
            {readOnly ? (
                // Static View
                <div className="relative z-10 grid min-w-0 grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5">
                    {localItems.map((item) => (
                        <FavoriteCard key={item.id} item={item} type={type} />
                    ))}
                    {localItems.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-border-color rounded-xl">
                            <Heart className="w-12 h-12 text-text-secondary/20 mx-auto mb-3" />
                            <p className="text-text-secondary font-medium">Nenhum favorito selecionado.</p>
                        </div>
                    )}
                </div>
            ) : (
                // Interactive View — grid-cols-3 on mobile for better proportions
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={(e) => setActiveId(e.active.id)}
                    onDragEnd={handleDragEnd}
                >
                    <div className="relative z-10 grid min-w-0 grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5">
                        <SortableContext items={localItems.map(i => i.id)} strategy={rectSortingStrategy}>
                            {localItems.map((item) => (
                                <SortableFavoriteItem
                                    key={item.id}
                                    item={item}
                                    type={type}
                                    isEditing={isEditing}
                                    onOpenImageModal={(item) => setImageModalState({ open: true, item })}
                                />
                            ))}
                        </SortableContext>

                        {localItems.length === 0 && (
                            <div className="col-span-full rounded-xl border-2 border-dashed border-border-color px-5 py-10 text-center">
                                <Heart className="mx-auto h-10 w-10 text-text-secondary/20" />
                                <p className="mt-3 text-sm font-bold text-text-primary">Sua vitrine ainda está vazia.</p>
                                <p className="mt-1 text-xs text-text-secondary">Favorite títulos no catálogo para vê-los aqui.</p>
                                <Link to="/catalog" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-button-accent px-4 text-xs font-black text-text-on-primary">
                                    Explorar catálogo
                                </Link>
                            </div>
                        )}
                    </div>

                    <DragOverlay adjustScale={true}>
                        {activeId && localItems.some((item) => item.id === activeId) ? (
                            <FavoriteCard
                                item={localItems.find(i => i.id === activeId)}
                                type={type}
                                isOverlay
                                isEditing
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Modal para Trocar Imagem do Post/Card */}
            {!readOnly ? <ImageSelectModal
                isOpen={imageModalState.open}
                onClose={() => setImageModalState({ open: false, item: null })}
                item={imageModalState.item}
                type={type}
                onSelect={async (newUrl) => {
                    if (onUpdateImage) {
                        await onUpdateImage(type, imageModalState.item?.id, newUrl);
                    }
                    setImageModalState({ open: false, item: null });
                }}
            /> : null}
        </div>
    );
}
