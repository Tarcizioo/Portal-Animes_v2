import { useRef, useEffect } from 'react';
import { Bell, Check, Heart, Eye, X, Trash2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Link } from 'react-router-dom';
import { useAppPreferences } from '@/hooks/useAppPreferences';

// ─── Timestamp relativo ──────────────────────────────────────────────────────
function relativeTime(date) {
    if (!date) return '';
    const now = Date.now();
    const diff = now - (date instanceof Date ? date.getTime() : new Date(date).getTime());
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'agora mesmo';
    if (mins < 60) return `há ${mins} min`;
    if (hours < 24) return `há ${hours}h`;
    if (days < 7) return `há ${days}d`;
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ─── Ícone por tipo ───────────────────────────────────────────────────────────
function NotifIcon({ type }) {
    if (type === 'profile_view') return <Eye className="w-4 h-4 text-blue-400" />;
    if (type === 'comment_like') return <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />;
    return <Bell className="w-4 h-4 text-primary" />;
}

// ─── Item de notificação ──────────────────────────────────────────────────────
function NotifItem({ notif, onRead, onDelete, onClose, showBorder }) {
    return (
        <div className={[
            'relative group flex gap-3 p-4 hover:bg-bg-tertiary/60 transition-colors',
            !notif.read ? 'bg-primary/5' : '',
            showBorder ? 'border-t border-border-color/15' : '',
        ].join(' ')}>

            {/* Avatar do ator */}
            <div className="shrink-0 relative">
                {notif.actorAvatar ? (
                    <img
                        src={notif.actorAvatar}
                        alt={notif.actorName}
                        className="w-9 h-9 rounded-full object-cover border border-border-color"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-bg-tertiary border border-border-color flex items-center justify-center">
                        <NotifIcon type={notif.type} />
                    </div>
                )}
                {/* Badge do tipo sobre o avatar */}
                {notif.actorAvatar && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-bg-secondary border border-border-color flex items-center justify-center">
                        <NotifIcon type={notif.type} />
                    </div>
                )}
            </div>

            {/* Conteúdo */}
            <Link
                to={notif.link || '#'}
                className="flex-1 min-w-0"
                onClick={() => { onRead(notif.id); onClose(); }}
            >
                <p className="text-sm text-text-primary leading-snug">
                    {notif.content}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                    {relativeTime(notif.createdAt)}
                </p>
            </Link>

            {/* Ações: marcar lida + deletar */}
            <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notif.read && (
                    <button
                        onClick={() => onRead(notif.id)}
                        className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
                        title="Marcar como lida"
                    >
                        <Check className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    onClick={() => onDelete(notif.id)}
                    className="p-1 rounded text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Deletar"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

// ─── Dropdown principal ───────────────────────────────────────────────────────
export function NotificationDropdown({ isOpen, onClose }) {
    const {
        notifications, unreadCount, loading,
        markAsRead, markAllAsRead,
        deleteNotification, deleteAllRead,
    } = useNotifications();
    const { preferences } = useAppPreferences();
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) onClose();
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const hasRead = notifications.some((notification) => notification.read);
    const visibleNotifications = preferences.hideReadNotifications
        ? notifications.filter((notification) => !notification.read)
        : notifications;

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-bg-secondary border border-border-color rounded-xl shadow-2xl z-50 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-color bg-bg-tertiary/50">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-text-primary text-sm">Notificações</h3>
                    {unreadCount > 0 && (
                        <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                        >
                            <Check className="w-3 h-3" /> Lidas
                        </button>
                    )}
                    {hasRead && (
                        <button
                            onClick={deleteAllRead}
                            className="text-xs text-text-secondary hover:text-red-400 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                            title="Deletar todas as lidas"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 rounded text-text-secondary hover:text-text-primary transition-colors ml-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-text-secondary text-sm">Carregando...</div>
                ) : visibleNotifications.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center gap-2 text-text-secondary">
                        <Bell className="w-8 h-8 opacity-20" />
                        <p className="text-sm">Nenhuma notificação por enquanto.</p>
                    </div>
                ) : (
                    visibleNotifications.map((notif, index) => (
                        <NotifItem
                            key={notif.id}
                            notif={notif}
                            onRead={markAsRead}
                            onDelete={deleteNotification}
                            onClose={onClose}
                            showBorder={index > 0}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
