import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

const ToastContext = createContext();
const EXIT_DURATION = 220;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef(new Map());
    const closingToastIds = useRef(new Set());

    const dismissToast = useCallback((id) => {
        if (closingToastIds.current.has(id)) return;

        closingToastIds.current.add(id);
        const timers = timersRef.current.get(id);
        if (timers?.autoDismiss) clearTimeout(timers.autoDismiss);

        setToasts((prev) => prev.map((toast) => (
            toast.id === id ? { ...toast, isClosing: true } : toast
        )));

        const exitTimer = setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
            timersRef.current.delete(id);
            closingToastIds.current.delete(id);
        }, EXIT_DURATION);

        timersRef.current.set(id, { exitTimer });
    }, []);

    const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
        const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, type, title, message, duration, isClosing: false }]);

        if (duration) {
            const autoDismiss = setTimeout(() => dismissToast(id), duration);
            timersRef.current.set(id, { autoDismiss });
        }
    }, [dismissToast]);

    useEffect(() => () => {
        timersRef.current.forEach((timers) => {
            if (timers.autoDismiss) clearTimeout(timers.autoDismiss);
            if (timers.exitTimer) clearTimeout(timers.exitTimer);
        });
    }, []);

    const value = {
        toast: {
            success: (message, title = 'Sucesso') => addToast({ type: 'success', title, message }),
            error: (message, title = 'Erro') => addToast({ type: 'error', title, message }),
            info: (message, title = 'Informação') => addToast({ type: 'info', title, message }),
            warning: (message, title = 'Atenção') => addToast({ type: 'warning', title, message }),
        }
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {createPortal(
                <div
                    className="fixed bottom-20 sm:bottom-6 left-1/2 z-[9999] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-3 pointer-events-none"
                    aria-live="polite"
                    aria-relevant="additions removals"
                >
                    {toasts.map((toast) => (
                        <Toast key={toast.id} {...toast} onClose={() => dismissToast(toast.id)} />
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

// The hook shares the private context with its provider in this module.
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

function Toast({ type, title, message, duration, isClosing, onClose }) {
    const styles = {
        success: {
            bg: 'bg-green-500',
            icon: CheckCircle,
            iconColor: 'text-green-400'
        },
        error: {
            bg: 'bg-red-500',
            icon: AlertCircle,
            iconColor: 'text-red-400'
        },
        warning: {
            bg: 'bg-yellow-500',
            icon: AlertTriangle,
            iconColor: 'text-yellow-400'
        },
        info: {
            bg: 'bg-blue-500',
            icon: Info,
            iconColor: 'text-blue-400'
        }
    };

    const style = styles[type] || styles.info;
    const Icon = style.icon;

    return (
        <div
            role={type === 'error' ? 'alert' : 'status'}
            className={`toast-surface pointer-events-auto w-full overflow-hidden rounded-2xl border border-border-color/90 bg-bg-secondary/95 shadow-[0_18px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl ${isClosing ? 'toast-exit' : 'toast-enter'}`}
        >
            <div className="relative flex group">
                <div className={`w-1.5 shrink-0 ${style.bg}`} />

                <div className="flex-1 p-4 pr-11">
                    <div className="flex items-start gap-3">
                        <div className={`toast-icon mt-0.5 rounded-full p-1.5 ${style.bg}/15 ${style.iconColor}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div>
                            {title && <h4 className="mb-1 text-sm font-bold text-text-primary">{title}</h4>}
                            <p className="text-sm leading-relaxed text-text-secondary">{message}</p>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar notificação"
                    className="absolute right-2 top-2 rounded-lg p-1.5 text-text-secondary opacity-70 transition-all hover:bg-bg-tertiary hover:text-text-primary hover:opacity-100 focus:opacity-100"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {duration > 0 && (
                <div className="h-0.5 bg-white/5">
                    <div className={`toast-progress h-full ${style.bg}`} style={{ '--toast-duration': `${duration}ms` }} />
                </div>
            )}
        </div>
    );
}