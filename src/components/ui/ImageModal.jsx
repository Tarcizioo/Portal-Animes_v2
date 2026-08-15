import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAccessibleDialog } from '@/hooks/useAccessibleDialog';

/**
 * Reutilizável - exibe qualquer imagem em fullscreen com animação suave.
 * Usa createPortal para escapar de qualquer stacking context do layout.
 * Props:
 *   isOpen    {boolean}
 *   onClose   {function}
 *   imageUrl  {string}
 *   altText   {string}
 */
export function ImageModal({ isOpen, onClose, imageUrl, altText = '' }) {
    const dialogRef = useRef(null);
    const closeButtonRef = useRef(null);
    useAccessibleDialog({ isOpen, onClose, dialogRef, initialFocusRef: closeButtonRef });

    if (typeof document === 'undefined') return null;

    const modal = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="image-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    // position: fixed + inset-0 garante cobertura total do viewport
                    style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
                    className="flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
                    onClick={onClose}
                >
                    {/* Image container */}
                    <motion.div
                        ref={dialogRef}
                        key="image-modal-content"
                        initial={{ opacity: 0, scale: 0.9, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 12 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                        className="relative flex flex-col items-center gap-3"
                        style={{ maxWidth: '92vw', maxHeight: '92vh' }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label={altText ? `Visualização de ${altText}` : 'Visualização de imagem'}
                        tabIndex={-1}
                    >
                        {/* Botão fechar — acima da imagem */}
                        <div className="self-end">
                            <button
                                ref={closeButtonRef}
                                type="button"
                                onClick={onClose}
                                className="flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-4 text-xs font-medium text-white/70 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-black/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                aria-label="Fechar"
                            >
                                <X className="w-4 h-4" /> Fechar
                            </button>
                        </div>

                        {/* Imagem: respeita qualquer orientação/proporção */}
                        <img
                            src={imageUrl}
                            alt={altText}
                            className="block w-auto h-auto rounded-xl shadow-2xl ring-1 ring-white/10"
                            style={{ maxWidth: '92vw', maxHeight: '80vh', objectFit: 'contain' }}
                            draggable={false}
                        />

                        {altText && (
                            <p className="text-white/45 text-xs text-center">{altText}</p>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Renderiza no body para escapar do stacking context do layout
    return createPortal(modal, document.body);
}
