import { useState } from 'react';

import { motion } from 'framer-motion';
import { UserPlus, UserCheck, UserMinus, Loader2 } from 'lucide-react';
import { useFollow } from '@/hooks/useFollow';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function FollowButton({ targetUid, targetProfile }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { isFollowing, loading, mutating, follow, unfollow } = useFollow(targetUid);
    const [hovered, setHovered] = useState(false);

    if (!user || !targetUid || user.uid === targetUid || loading) return null;

    const handleClick = async () => {
        if (mutating) return;

        try {
            if (isFollowing) {
                await unfollow();
                toast.info('Você deixou de seguir este perfil.', 'Seguindo');
            } else {
                await follow(targetProfile);
                toast.success('Agora você acompanha este perfil.', 'Seguindo');
            }
        } catch {
            toast.error('Não foi possível atualizar o seguimento. Tente novamente.', 'Seguidores');
        }
    };

    const label = isFollowing
        ? (hovered ? 'Deixar de seguir' : 'Seguindo')
        : '+ Seguir';
    const Icon = mutating
        ? Loader2
        : isFollowing
            ? (hovered ? UserMinus : UserCheck)
            : UserPlus;

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            disabled={mutating}
            className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl shadow-md transition-all text-xs md:text-sm font-bold border ${
                isFollowing
                    ? hovered
                        ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20'
                        : 'bg-bg-secondary border-border-color text-text-primary hover:border-button-accent/50'
                    : 'bg-button-accent text-text-on-primary border-transparent hover:opacity-90'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${mutating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{label}</span>
        </motion.button>
    );
}