import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Plus, GripVertical, User, Pin, Pencil, Check, X, Star, Image as ImageIcon } from 'lucide-react';
import { ViewToggle } from '@/components/ui/ViewToggle';
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
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';

// --- Components Helpers ---

function FavoriteCard({ item, type, isOverlay = false, isEditing = false, dragListeners = {}, dragAttributes = {}, onOpenImageModal }) {
    const linkPath = type === 'anime' ? `/anime/${item.id}` : `/character/${item.id}`;

    return (
        <div className={clsx(
            "group",
            isOverlay && "cursor-grabbing scale-105"
        )}>
            {/* Card image */}
            <div className={clsx(
                "relative aspect-[2/3] rounded-xl overflow-hidden bg-bg-tertiary border border-border-color shadow-md mb-2",
                "group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300",
                isEditing && "hover:border-primary/50"
            )}>
                {/* Drag Handle (Only in Edit Mode) */}
                {isEditing && (
                    <div
                        {...dragListeners}
                        {...dragAttributes}
                        className="absolute top-2 right-2 z-20 p-2 bg-black/60 backdrop-blur-md rounded-lg cursor-grab active:cursor-grabbing hover:bg-primary transition-colors touch-none shadow-lg"
                        title="Segure para reordenar"
                    >
                        <GripVertical className="w-4 h-4 text-white" />
                    </div>
                )}

                {/* Edit Image Button (Only in Edit Mode) */}
                {isEditing && onOpenImageModal && (
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenImageModal(item); }}
                        className="absolute bottom-2 right-2 z-20 p-2 bg-black/60 backdrop-blur-md rounded-lg hover:bg-button-accent transition-colors shadow-lg group-hover:scale-105"
                        title="Mudar Foto do Card"
                    >
                        <ImageIcon className="w-4 h-4 text-white" />
                    </button>
                )}

                <Link
                    to={isEditing ? "#" : linkPath}
                    className={clsx("block w-full h-full", isEditing && "pointer-events-none")}
                    draggable={false}
                >
                    <img
                        src={item.image}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        draggable={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
                </Link>
            </div>

            {/* Title below card — matches RecentActivity style */}
            <Link
                to={isEditing ? "#" : linkPath}
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
        touchAction: 'none'
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
    const propItems = activeTab === 'anime' ? animeFavorites : characterFavorites;
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

        if (active.id !== over?.id) {
            const oldIndex = localItems.findIndex((item) => item.id === active.id);
            const newIndex = localItems.findIndex((item) => item.id === over.id);
            const newOrder = arrayMove(localItems, oldIndex, newIndex);
            const newOrderIds = newOrder.map((item) => item.id);
            const restOfItems = propItems.slice(10).map((item) => item.id);
            const fullIds = [...newOrderIds, ...restOfItems];

            setOrderOverride({ key: sourceKey, ids: newOrderIds });
            if (activeTab === 'anime') onReorderAnimes(fullIds);
            else onReorderCharacters(fullIds);
        }
        setActiveId(null);
    };

    const handlePin = () => {
        if (isPinned) {
            onSetPreferredView(null);
        } else {
            onSetPreferredView(activeTab);
        }
    };

    return (
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-4 md:p-6 relative overflow-hidden">

            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Section title — matches RecentActivity / AchievementBadges pattern */}
            <div className="flex items-center justify-between mb-4 md:mb-6 relative z-10">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                    <Star className="w-4 h-4 text-button-accent" />
                    Favoritos
                </h3>
            </div>

            {/* Controls row */}
            <div className="flex flex-row flex-wrap items-center justify-between gap-2 mb-4 md:mb-6 relative z-10">

                <div className="flex items-center gap-2 md:gap-4">
                    {/* Modern Tab Switcher */}
                    <ViewToggle
                        value={activeTab}
                        onChange={(val) => { setSelectedTab(val); setIsEditing(false); }}
                        options={[
                            { value: 'anime', label: 'Animes', icon: Heart },
                            { value: 'character', label: 'Personagens', icon: User },
                        ]}
                    />

                    {/* Count Badge */}
                    <span className="text-xs font-bold text-text-secondary bg-bg-tertiary px-3 py-1.5 rounded-full border border-border-color">
                        {localItems.length} / 10
                    </span>
                </div>

                {/* Actions */}
                {!readOnly && (
                    <div className="flex items-center gap-2">
                        {/* Edit Toggle */}
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={clsx(
                                "flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg border transition-all",
                                isEditing
                                    ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                                    : "bg-bg-tertiary text-text-secondary border-border-color hover:text-text-primary hover:bg-bg-tertiary/80"
                            )}
                        >
                            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                            {isEditing ? 'Concluir' : 'Organizar'}
                        </button>

                        {/* Pin Button */}
                        <button
                            onClick={handlePin}
                            className={clsx(
                                "p-2 rounded-lg border transition-all",
                                isPinned
                                    ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                    : "bg-transparent text-text-secondary border-transparent hover:bg-bg-tertiary"
                            )}
                            title={isPinned ? "Visão padrão definida" : "Definir como visão padrão"}
                        >
                            <Pin className={clsx("w-4 h-4", isPinned && "fill-current")} />
                        </button>
                    </div>
                )}
            </div>

            {/* Grid Area */}
            {readOnly ? (
                // Static View
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 relative z-10">
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
                    <div className="grid grid-cols-5 sm:grid-cols-4 lg:grid-cols-5 gap-3 relative z-10">
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

                        {/* Empty Slots */}
                        {Array.from({ length: 10 - localItems.length }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                className="aspect-[2/3] rounded-xl border-2 border-dashed border-border-color bg-bg-tertiary/30 flex flex-col items-center justify-center gap-3 text-text-secondary/50 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group"
                            >
                                <div className="p-3 rounded-full bg-bg-tertiary group-hover:scale-110 transition-transform shadow-sm">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Vazio</span>
                            </div>
                        ))}
                    </div>

                    <DragOverlay adjustScale={true}>
                        {activeId ? (
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
            <ImageSelectModal
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
            />
        </div>
    );
}
