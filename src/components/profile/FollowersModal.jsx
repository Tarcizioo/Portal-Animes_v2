import { useState } from 'react';
import { createPortal } from 'react-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, UserCheck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFollowList } from '@/hooks/useFollowList';
import { useFollow } from '@/hooks/useFollow';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

// ── Single row in the list ─────────────────────────────────────────────────────
function FollowRow({ uid, displayName, photoURL }) {
    const { user } = useAuth();
    const { isFollowing, loading, mutating, follow, unfollow } = useFollow(uid);
    const { toast } = useToast();
    const isOwnRow = user?.uid === uid;

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
        <div className="flex items-center justify-between gap-3 py-3 border-b border-border-color last:border-0">
            <Link to={`/u/${uid}`} className="flex items-center gap-3 min-w-0 group">
                <img
                    src={photoURL || `https://placehold.co/40x40/6366f1/FFF?text=${(displayName?.[0] || '?').toUpperCase()}`}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover border border-border-color flex-shrink-0 group-hover:border-button-accent/50 transition-colors"
                />
                <span className="text-sm font-semibold text-text-primary truncate group-hover:text-button-accent transition-colors">
                    {displayName || 'Usuário'}
                </span>
            </Link>

            {user && !isOwnRow && (
                <button
                    onClick={handleToggle}
                    disabled={loading || mutating}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isFollowing
                            ? 'bg-bg-tertiary border-border-color text-text-secondary hover:border-red-500/40 hover:text-red-400'
                            : 'bg-button-accent border-transparent text-text-on-primary hover:opacity-90'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                    {mutating
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : isFollowing
                            ? <><UserCheck className="w-3 h-3" /><span>Seguindo</span></>
                            : <span>+ Seguir</span>
                    }
                </button>
            )}
        </div>
    );
}

// ── Modal ──────────────────────────────────────────────────────────────────────
export function FollowersModal({ isOpen, onClose, uid, initialTab = 'followers' }) {
    const [activeTab, setActiveTab] = useState(initialTab);


    const { list: followers, loading: loadingFollowers } = useFollowList(uid, 'followers');
    const { list: following, loading: loadingFollowing } = useFollowList(uid, 'following');

    const active = activeTab === 'followers' ? followers : following;
    const isLoading = activeTab === 'followers' ? loadingFollowers : loadingFollowing;

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1,    y: 0  }}
                        exit={{   opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 bg-bg-secondary border border-border-color rounded-2xl shadow-2xl w-full max-w-md h-[560px] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border-color flex-shrink-0">
                            <div className="flex gap-1 bg-bg-tertiary rounded-xl p-1">
                                {['followers', 'following'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                            activeTab === tab
                                                ? 'bg-button-accent text-text-on-primary shadow'
                                                : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        {tab === 'followers' ? 'Seguidores' : 'Seguindo'}
                                    </button>
                                ))}
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors text-text-secondary hover:text-text-primary">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto px-4 flex-1 py-2">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-10">
                                    <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
                                </div>
                            ) : active.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-text-secondary gap-3">
                                    <Users className="w-10 h-10 opacity-30" />
                                    <p className="text-sm">
                                        {activeTab === 'followers' ? 'Nenhum seguidor ainda.' : 'Não segue ninguém ainda.'}
                                    </p>
                                </div>
                            ) : (
                                active.map(item => (
                                    <FollowRow
                                        key={item.uid}
                                        uid={item.uid}
                                        displayName={item.displayName}
                                        photoURL={item.photoURL}
                                    />
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
