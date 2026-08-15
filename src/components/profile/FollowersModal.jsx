import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Loader2,
    RefreshCw,
    UserCheck,
    UserPlus,
    UserRound,
    Users,
    X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFollowList } from '@/hooks/useFollowList';
import { useFollow } from '@/hooks/useFollow';
import { useAccessibleDialog } from '@/hooks/useAccessibleDialog';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

function FollowRow({ uid, displayName, photoURL, onNavigate }) {
    const { user } = useAuth();
    const { isFollowing, loading, mutating, follow, unfollow } = useFollow(uid);
    const { toast } = useToast();
    const isOwnRow = user?.uid === uid;
    const safeName = displayName || 'Usuário';

    const handleToggle = async () => {
        try {
            if (isFollowing) {
                await unfollow();
                toast.info('Você deixou de seguir este perfil.', 'Seguindo');
            } else {
                await follow({ displayName, photoURL });
                toast.success('Agora você acompanha este perfil.', 'Seguindo');
            }
        } catch {
            toast.error('Não foi possível atualizar o seguimento. Tente novamente.', 'Seguidores');
        }
    };

    return (
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border-color py-3 last:border-0">
            <Link to={`/u/${uid}`} onClick={onNavigate} className="group flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">
                <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-border-color bg-bg-tertiary text-text-secondary transition-colors group-hover:border-button-accent/50">
                    <UserRound className="h-5 w-5" aria-hidden="true" />
                    {photoURL ? (
                        <img
                            src={photoURL}
                            alt=""
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(event) => { event.currentTarget.style.display = 'none'; }}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    ) : null}
                </span>
                <span className="truncate text-sm font-semibold text-text-primary transition-colors group-hover:text-button-accent">{safeName}</span>
            </Link>

            {user && !isOwnRow ? (
                <button
                    type="button"
                    onClick={handleToggle}
                    disabled={loading || mutating}
                    aria-label={isFollowing ? `Deixar de seguir ${safeName}` : `Seguir ${safeName}`}
                    className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors ${
                        isFollowing
                            ? 'border-border-color bg-bg-tertiary text-text-secondary hover:border-red-500/40 hover:text-red-400'
                            : 'border-transparent bg-button-accent text-text-on-primary hover:opacity-90'
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                    {mutating ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /><span className="sr-only">Atualizando</span></>
                    ) : isFollowing ? (
                        <><UserCheck className="h-3.5 w-3.5" aria-hidden="true" /><span>Seguindo</span></>
                    ) : (
                        <><UserPlus className="h-3.5 w-3.5" aria-hidden="true" /><span>Seguir</span></>
                    )}
                </button>
            ) : null}
        </div>
    );
}

export function FollowersModal({ isOpen, onClose, uid, initialTab = 'followers' }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const dialogRef = useRef(null);
    const closeButtonRef = useRef(null);
    useAccessibleDialog({ isOpen, onClose, dialogRef, initialFocusRef: closeButtonRef });

    const {
        list: followers,
        loading: loadingFollowers,
        error: followersError,
        retry: retryFollowers,
    } = useFollowList(uid, 'followers');
    const {
        list: following,
        loading: loadingFollowing,
        error: followingError,
        retry: retryFollowing,
    } = useFollowList(uid, 'following');

    const isFollowersTab = activeTab === 'followers';
    const active = isFollowersTab ? followers : following;
    const isLoading = isFollowersTab ? loadingFollowers : loadingFollowing;
    const error = isFollowersTab ? followersError : followingError;
    const retry = isFollowersTab ? retryFollowers : retryFollowing;

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
                <motion.div
                    ref={dialogRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 28 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 flex h-[78dvh] max-h-[640px] w-full min-w-0 max-w-md flex-col overflow-hidden rounded-t-3xl border border-border-color bg-bg-secondary shadow-2xl sm:h-[560px] sm:rounded-3xl"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="followers-modal-title"
                    tabIndex={-1}
                >
                    <div className="mx-auto mt-2 h-1 w-12 shrink-0 rounded-full bg-border-color sm:hidden" aria-hidden="true" />
                    <header className="flex min-w-0 shrink-0 items-center gap-2 border-b border-border-color p-3 sm:p-4">
                        <h2 id="followers-modal-title" className="sr-only">Seguidores e seguindo</h2>
                        <div className="grid min-w-0 flex-1 grid-cols-2 rounded-xl bg-bg-tertiary p-1">
                            {[
                                { id: 'followers', label: 'Seguidores' },
                                { id: 'following', label: 'Seguindo' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    aria-pressed={activeTab === tab.id}
                                    className={`min-h-11 rounded-lg px-2 text-sm font-semibold transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-button-accent text-text-on-primary shadow'
                                            : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Fechar seguidores" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">
                            <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </header>

                    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2" aria-live="polite">
                        {isLoading ? (
                            <div className="grid min-h-48 place-items-center" aria-label="Carregando conexões">
                                <Loader2 className="h-6 w-6 animate-spin text-text-secondary" aria-hidden="true" />
                            </div>
                        ) : error ? (
                            <div role="alert" className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-red-500/25 bg-red-500/5 px-6 text-center">
                                <div>
                                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-400"><AlertCircle className="h-5 w-5" aria-hidden="true" /></span>
                                    <h3 className="mt-4 font-black text-text-primary">Não foi possível carregar esta lista</h3>
                                    <p className="mt-1 text-sm text-text-secondary">A conexão social não respondeu. Tente novamente.</p>
                                    <button type="button" onClick={retry} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-color bg-bg-tertiary px-4 text-xs font-black text-text-primary hover:border-button-accent/40">
                                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Tentar novamente
                                    </button>
                                </div>
                            </div>
                        ) : active.length === 0 ? (
                            <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-center text-text-secondary">
                                <Users className="h-10 w-10 opacity-30" aria-hidden="true" />
                                <p className="text-sm">{isFollowersTab ? 'Nenhum seguidor ainda.' : 'Este perfil ainda não segue ninguém.'}</p>
                            </div>
                        ) : (
                            active.map((item) => (
                                <FollowRow
                                    key={item.uid}
                                    uid={item.uid}
                                    displayName={item.displayName}
                                    photoURL={item.photoURL}
                                    onNavigate={onClose}
                                />
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body,
    );
}
