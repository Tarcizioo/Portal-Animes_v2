import { useEffect, useRef, useState } from 'react';
import {
    BookmarkPlus,
    CheckCircle2,
    ChevronDown,
    Heart,
    LoaderCircle,
    Minus,
    MoreHorizontal,
    Pencil,
    Play,
    Plus,
    Sparkles,
    Star,
    Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import { resetPointerGlow, trackPointerGlow } from '@/utils/pointerGlow';

const STATUS_OPTIONS = [
    { value: 'watching', label: 'Assistindo' },
    { value: 'completed', label: 'Completo' },
    { value: 'plan_to_watch', label: 'Planejo assistir' },
    { value: 'paused', label: 'Pausado' },
    { value: 'dropped', label: 'Abandonado' },
];

const STATUS_STYLES = {
    watching: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
    completed: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    plan_to_watch: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
    paused: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    dropped: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
};

const RATING_VALUES = Array.from({ length: 10 }, (_, index) => index + 1);

function JourneySurface({ children, isCompleted = false }) {
    return (
        <aside
            aria-label="Sua jornada"
            className={clsx(
                'relative rounded-[1.75rem] border bg-bg-secondary/80 p-5 shadow-[0_26px_80px_-32px_rgba(0,0,0,0.92)] ring-1 ring-inset backdrop-blur-2xl',
                isCompleted
                    ? 'border-emerald-400/20 ring-emerald-300/10'
                    : 'border-white/10 ring-white/5',
            )}
        >
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
                <span
                    className={clsx(
                        'absolute -right-16 -top-20 h-44 w-44 rounded-full blur-3xl',
                        isCompleted ? 'bg-emerald-400/20' : 'bg-primary/20',
                    )}
                />
                <span className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </span>
            <div className="relative z-10">{children}</div>
        </aside>
    );
}

function UntrackedJourney({ anime, handleStatusChange }) {
    const [pendingStatus, setPendingStatus] = useState(null);

    const startJourney = async (nextStatus) => {
        if (pendingStatus) return;

        setPendingStatus(nextStatus);
        try {
            await handleStatusChange(nextStatus);
        } finally {
            setPendingStatus(null);
        }
    };

    return (
        <JourneySurface>
            <div className="mb-5">
                <div className="mb-3 flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sua jornada</span>
                </div>
                <h3 className="text-xl font-black tracking-tight text-text-primary">Comece a acompanhar</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    Registre episódios, sua nota e cada etapa dessa história.
                </p>
            </div>

            <div className="space-y-2.5">
                <button
                    type="button"
                    onClick={() => startJourney('watching')}
                    disabled={Boolean(pendingStatus)}
                    aria-label={'Começar a acompanhar ' + anime.title}
                    className="pointer-glow pointer-glow--hero flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-4 py-3.5 text-sm font-black text-text-on-primary shadow-lg shadow-primary/25 transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60"
                    onPointerMove={trackPointerGlow}
                    onPointerLeave={resetPointerGlow}
                >
                    {pendingStatus === 'watching' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                    {pendingStatus === 'watching' ? 'Adicionando...' : 'Acompanhar anime'}
                </button>

                <button
                    type="button"
                    onClick={() => startJourney('plan_to_watch')}
                    disabled={Boolean(pendingStatus)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-bg-tertiary/60 px-4 py-3 text-sm font-bold text-text-primary transition-[border-color,background-color,color] hover:border-primary/40 hover:bg-bg-tertiary disabled:cursor-wait disabled:opacity-60"
                >
                    {pendingStatus === 'plan_to_watch' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />}
                    {pendingStatus === 'plan_to_watch' ? 'Adicionando...' : 'Planejo assistir'}
                </button>
            </div>
        </JourneySurface>
    );
}

function TrackedJourney({
    anime,
    libraryEntry,
    status,
    handleStatusChange,
    updateProgress,
    toggleFavorite,
    currentEp,
    totalEp,
    updateRating,
    onRemove,
}) {
    const [pendingAction, setPendingAction] = useState(null);
    const [isEditingEpisode, setIsEditingEpisode] = useState(false);
    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const [selectedRating, setSelectedRating] = useState(Number(libraryEntry.score) || 0);
    const [feedback, setFeedback] = useState('');
    const feedbackTimerRef = useRef(null);

    const hasKnownTotal = totalEp > 0;
    const safeCurrentEpisode = Math.max(0, hasKnownTotal ? Math.min(currentEp, totalEp) : currentEp);
    const progressPercentage = hasKnownTotal
        ? Math.min(100, Math.round((safeCurrentEpisode / totalEp) * 100))
        : 0;
    const isCompleted = status === 'completed' || (hasKnownTotal && safeCurrentEpisode >= totalEp);
    const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.plan_to_watch;

    useEffect(() => {
        setSelectedRating(Number(libraryEntry.score) || 0);
    }, [libraryEntry.score]);

    useEffect(() => () => {
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    }, []);

    const showFeedback = (message) => {
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        setFeedback(message);
        feedbackTimerRef.current = setTimeout(() => setFeedback(''), 2600);
    };

    const runAction = async (key, action, successMessage) => {
        if (pendingAction) return false;

        setPendingAction(key);
        try {
            await action();
            if (successMessage) showFeedback(successMessage);
            return true;
        } catch {
            return false;
        } finally {
            setPendingAction(null);
        }
    };

    const saveProgress = async (nextEpisode) => {
        const parsedEpisode = Number(nextEpisode);
        if (!Number.isFinite(parsedEpisode)) return false;

        const normalizedEpisode = Math.max(
            0,
            hasKnownTotal ? Math.min(Math.trunc(parsedEpisode), totalEp) : Math.trunc(parsedEpisode),
        );

        if (normalizedEpisode === safeCurrentEpisode) {
            setIsEditingEpisode(false);
            return true;
        }

        const saved = await runAction('progress', async () => {
            if (normalizedEpisode > 0 && status === 'plan_to_watch') {
                await handleStatusChange('watching');
            } else if (status === 'completed' && (!hasKnownTotal || normalizedEpisode < totalEp)) {
                await handleStatusChange('watching');
            }

            await updateProgress(libraryEntry.id, normalizedEpisode, totalEp);
        }, 'Episódio ' + normalizedEpisode + ' salvo');

        if (saved) setIsEditingEpisode(false);
        return saved;
    };

    const handleEpisodeSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await saveProgress(formData.get('episode'));
    };

    const handleStatusUpdate = (nextStatus) => runAction(
        'status',
        () => handleStatusChange(nextStatus),
        STATUS_OPTIONS.find((option) => option.value === nextStatus)?.label + ' salvo',
    );

    const handleRatingUpdate = async (rating) => {
        const previousRating = selectedRating;
        setSelectedRating(rating);
        setIsRatingOpen(false);

        const saved = await runAction(
            'rating',
            () => updateRating(anime.id, rating),
            rating > 0 ? 'Sua nota agora é ' + rating + '/10' : 'Nota removida',
        );

        if (!saved) setSelectedRating(previousRating);
    };

    const handleFavoriteToggle = () => runAction(
        'favorite',
        () => toggleFavorite(anime),
        libraryEntry.isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
    );

    return (
        <JourneySurface isCompleted={isCompleted}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className={clsx('mb-1.5 flex items-center gap-2', isCompleted ? 'text-emerald-300' : 'text-primary')}>
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sua jornada</span>
                    </div>
                    <h3 className="text-base font-black text-text-primary">
                        {isCompleted ? 'Jornada concluída' : 'Continue de onde parou'}
                    </h3>
                </div>

                <div className="flex items-center gap-1.5">
                    <div className="relative">
                        <label className="sr-only" htmlFor={'journey-status-' + anime.id}>Status na biblioteca</label>
                        <select
                            id={'journey-status-' + anime.id}
                            value={status}
                            onChange={(event) => handleStatusUpdate(event.target.value)}
                            disabled={Boolean(pendingAction)}
                            className={clsx(
                                'h-9 max-w-[9.5rem] cursor-pointer appearance-none rounded-full border py-1.5 pl-3 pr-8 text-[10px] font-black uppercase tracking-[0.08em] outline-none transition-colors focus:ring-2 focus:ring-primary/50 disabled:cursor-wait disabled:opacity-60',
                                statusStyle,
                            )}
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value} className="bg-bg-secondary text-text-primary">
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" aria-hidden="true" />
                    </div>

                    <button
                        type="button"
                        onClick={handleFavoriteToggle}
                        disabled={Boolean(pendingAction)}
                        aria-label={libraryEntry.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        aria-pressed={Boolean(libraryEntry.isFavorite)}
                        className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-bg-primary/40 text-text-secondary transition-[border-color,background-color,color,transform] hover:-translate-y-0.5 hover:border-red-400/30 hover:text-red-400 disabled:cursor-wait disabled:opacity-60"
                    >
                        {pendingAction === 'favorite'
                            ? <LoaderCircle className="h-4 w-4 animate-spin" />
                            : <Heart className={clsx('h-4 w-4', libraryEntry.isFavorite && 'fill-red-500 text-red-500')} />}
                    </button>

                    <details className="group relative">
                        <summary
                            aria-label="Mais opções da biblioteca"
                            className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full border border-white/10 bg-bg-primary/40 text-text-secondary transition-colors hover:border-white/20 hover:text-text-primary [&::-webkit-details-marker]:hidden"
                        >
                            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                        </summary>
                        <div className="absolute right-0 top-full z-30 mt-2 w-52 rounded-xl border border-border-color bg-bg-secondary/95 p-1.5 shadow-2xl backdrop-blur-xl">
                            <button
                                type="button"
                                onClick={onRemove}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-red-400 transition-colors hover:bg-red-500/10"
                            >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                Remover da biblioteca
                            </button>
                        </div>
                    </details>
                </div>
            </div>

            <section className="mt-5 rounded-2xl border border-white/10 bg-bg-primary/40 p-4 shadow-inner">
                <div className="mb-2.5 flex items-end justify-between gap-4">
                    <div>
                        <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-text-secondary">Progresso</span>
                        <span className="mt-1 block text-2xl font-black tracking-tight text-text-primary">
                            {safeCurrentEpisode}
                            <span className="ml-1 text-sm font-bold text-text-secondary">/ {hasKnownTotal ? totalEp : '?'}</span>
                        </span>
                    </div>
                    <span className={clsx('text-sm font-black', isCompleted ? 'text-emerald-300' : 'text-primary')}>
                        {hasKnownTotal ? progressPercentage + '%' : 'Em andamento'}
                    </span>
                </div>

                <div
                    className="h-2 overflow-hidden rounded-full bg-bg-tertiary"
                    role={hasKnownTotal ? 'progressbar' : undefined}
                    aria-label={hasKnownTotal ? 'Progresso de ' + anime.title : undefined}
                    aria-valuemin={hasKnownTotal ? 0 : undefined}
                    aria-valuemax={hasKnownTotal ? 100 : undefined}
                    aria-valuenow={hasKnownTotal ? progressPercentage : undefined}
                >
                    <div
                        className={clsx(
                            'h-full rounded-full transition-[width,background-color,box-shadow] duration-700',
                            isCompleted
                                ? 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.55)]'
                                : 'bg-gradient-to-r from-primary to-cyan-400 shadow-[0_0_16px_rgba(99,102,241,0.5)]',
                        )}
                        style={{ width: hasKnownTotal ? progressPercentage + '%' : '0%' }}
                    />
                </div>

                <div className="mt-4 grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-stretch gap-2">
                    <button
                        type="button"
                        onClick={() => saveProgress(safeCurrentEpisode - 1)}
                        disabled={Boolean(pendingAction) || safeCurrentEpisode <= 0}
                        aria-label="Diminuir um episódio"
                        className="grid min-h-11 place-items-center rounded-xl border border-white/10 bg-bg-tertiary/60 text-text-secondary transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Minus className="h-4 w-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsEditingEpisode((current) => !current)}
                        aria-expanded={isEditingEpisode}
                        aria-controls={'episode-editor-' + anime.id}
                        className="flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-bg-tertiary/40 px-2 text-text-primary transition-colors hover:border-primary/25 hover:bg-bg-tertiary/60"
                    >
                        <span className="truncate text-xs font-bold">Episódio {safeCurrentEpisode}</span>
                        <Pencil className="h-3.5 w-3.5 shrink-0 text-text-secondary" aria-hidden="true" />
                    </button>

                    <button
                        type="button"
                        onClick={() => saveProgress(safeCurrentEpisode + 1)}
                        disabled={Boolean(pendingAction) || isCompleted}
                        aria-label={isCompleted ? 'Anime já concluído' : 'Marcar próximo episódio como assistido'}
                        className={clsx(
                            'pointer-glow pointer-glow--hero flex min-h-11 items-center justify-center gap-1.5 overflow-hidden rounded-xl px-3 text-xs font-black transition-[transform,background-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50',
                            isCompleted
                                ? 'bg-emerald-500/20 text-emerald-200'
                                : 'bg-primary text-text-on-primary shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:bg-primary-hover',
                        )}
                        onPointerMove={trackPointerGlow}
                        onPointerLeave={resetPointerGlow}
                    >
                        {pendingAction === 'progress'
                            ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            : isCompleted
                                ? <CheckCircle2 className="h-3.5 w-3.5" />
                                : <Plus className="h-3.5 w-3.5" />}
                        {isCompleted ? 'Concluído' : '+1 episódio'}
                    </button>
                </div>

                {isEditingEpisode ? (
                    <form
                        id={'episode-editor-' + anime.id}
                        onSubmit={handleEpisodeSubmit}
                        className="mt-3 flex items-end gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3"
                    >
                        <label className="min-w-0 flex-1 text-[10px] font-black uppercase tracking-[0.14em] text-text-secondary">
                            Ir para o episódio
                            <input
                                name="episode"
                                type="number"
                                min="0"
                                max={hasKnownTotal ? totalEp : undefined}
                                defaultValue={safeCurrentEpisode}
                                inputMode="numeric"
                                autoFocus
                                className="mt-1.5 h-10 w-full rounded-lg border border-border-color bg-bg-primary px-3 text-base font-black text-text-primary outline-none focus:border-primary"
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={Boolean(pendingAction)}
                            className="h-10 rounded-lg bg-primary px-3 text-xs font-black text-text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60"
                        >
                            Salvar
                        </button>
                    </form>
                ) : null}
            </section>

            <section className="mt-3 rounded-2xl border border-white/10 bg-bg-primary/25">
                <button
                    type="button"
                    onClick={() => setIsRatingOpen((current) => !current)}
                    aria-label="Editar sua nota"
                    aria-expanded={isRatingOpen}
                    aria-controls={'rating-picker-' + anime.id}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-bg-tertiary/40"
                >
                    <Star className={clsx('h-4 w-4 shrink-0', selectedRating > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-text-secondary')} />
                    <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-text-secondary">Sua nota</span>
                        <span className="block text-sm font-black text-text-primary">
                            {selectedRating > 0 ? selectedRating + ' / 10' : 'Ainda não avaliado'}
                        </span>
                    </span>
                    <span className="text-xs font-bold text-primary">{isRatingOpen ? 'Fechar' : 'Editar'}</span>
                </button>

                {isRatingOpen ? (
                    <div id={'rating-picker-' + anime.id} className="border-t border-white/10 p-3">
                        <div className="grid grid-cols-5 gap-1.5">
                            {RATING_VALUES.map((rating) => (
                                <button
                                    key={rating}
                                    type="button"
                                    onClick={() => handleRatingUpdate(rating)}
                                    disabled={Boolean(pendingAction)}
                                    aria-label={'Dar nota ' + rating + ' de 10'}
                                    aria-pressed={selectedRating === rating}
                                    className={clsx(
                                        'h-9 rounded-lg text-xs font-black transition-[transform,background-color,color,border-color] hover:-translate-y-0.5',
                                        selectedRating === rating
                                            ? 'border border-yellow-400/40 bg-yellow-400/15 text-yellow-300'
                                            : 'border border-white/10 bg-bg-tertiary/40 text-text-secondary hover:border-primary/30 hover:text-text-primary',
                                    )}
                                >
                                    {rating}
                                </button>
                            ))}
                        </div>
                        {selectedRating > 0 ? (
                            <button
                                type="button"
                                onClick={() => handleRatingUpdate(0)}
                                disabled={Boolean(pendingAction)}
                                className="mt-2 w-full rounded-lg py-2 text-[10px] font-bold text-text-secondary transition-colors hover:bg-bg-tertiary/40 hover:text-text-primary"
                            >
                                Remover nota
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </section>

            <div className="mt-3 min-h-5" aria-live="polite">
                {pendingAction ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary">
                        <LoaderCircle className="h-3 w-3 animate-spin" /> Salvando alteração...
                    </span>
                ) : feedback ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> {feedback}
                    </span>
                ) : (
                    <span className="text-[10px] font-medium text-text-secondary/75">Alterações salvas automaticamente</span>
                )}
            </div>
        </JourneySurface>
    );
}

export function HeroActionCard(props) {
    if (!props.libraryEntry) {
        return (
            <UntrackedJourney
                anime={props.anime}
                handleStatusChange={props.handleStatusChange}
            />
        );
    }

    return <TrackedJourney {...props} />;
}
