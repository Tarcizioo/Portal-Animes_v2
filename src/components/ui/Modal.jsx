import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useModalClose } from '@/hooks/useModalClose';

const SIZE_CLASSES = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-5xl',
};

export function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    size = 'md',
    contentClassName = '',
    panelClassName = '',
}) {
    const titleId = useId();
    useModalClose(isOpen, onClose);

    useEffect(() => {
        if (!isOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    if (typeof document === 'undefined') return null;

    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-black/75 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    <motion.section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? titleId : undefined}
                        aria-label={title ? undefined : 'Janela de diálogo'}
                        className={`relative flex max-h-[92dvh] w-full ${sizeClass} flex-col overflow-hidden rounded-t-[1.75rem] border border-border-color bg-bg-secondary shadow-[0_28px_90px_rgba(0,0,0,0.55)] sm:rounded-[1.75rem] ${panelClassName}`}
                        initial={{ opacity: 0, y: 36, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />

                        <header className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-border-color px-5 py-4 sm:px-6 sm:py-5">
                            <div className="min-w-0 pt-0.5">
                                {title && (
                                    <h2 id={titleId} className="text-lg font-black tracking-tight text-text-primary sm:text-xl">
                                        {title}
                                    </h2>
                                )}
                                {subtitle && (
                                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-text-secondary sm:text-sm">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Fechar modal"
                                className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-border-color bg-bg-tertiary/70 p-0 text-text-secondary transition-all hover:rotate-90 hover:border-primary/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </header>

                        <div className={`custom-scrollbar flex-1 overflow-y-auto p-5 sm:p-6 ${contentClassName}`}>
                            {children}
                        </div>
                    </motion.section>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}