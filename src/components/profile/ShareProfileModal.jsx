import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModalClose } from '@/hooks/useModalClose';
import { PortalAnimesLogo } from '@/components/brand/PortalAnimesLogo';
import {
    ArrowLeft,
    BookOpenCheck,
    Check,
    CircleCheck,
    Copy,
    Download,
    LibraryBig,
    Link2,
    Share2,
    X,
} from 'lucide-react';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), [tabindex]:not([tabindex="-1"])';

function getInitials(value) {
    const parts = String(value || 'Usuário').trim().split(/\s+/).filter(Boolean);
    return (parts.slice(0, 2).map((part) => part.charAt(0)).join('') || 'U').toLocaleUpperCase('pt-BR');
}

function ShareCardImage({ src, alt = '', style, kind, fallback }) {
    const [failedSource, setFailedSource] = useState(null);

    if (!src || failedSource === src) return fallback;

    return (
        <img
            src={src}
            alt={alt}
            crossOrigin="anonymous"
            data-share-card-image={kind}
            onError={() => setFailedSource(src)}
            style={style}
        />
    );
}

function BrandBannerFallback() {
    return (
        <div
            role="img"
            aria-label="Banner padrão do PortalAnimes"
            data-share-card-fallback="banner"
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at 20% 15%, rgba(167,139,250,0.45), transparent 34%), linear-gradient(135deg, #24203d 0%, #12121a 58%, #0f0f14 100%)',
                color: '#ffffff',
            }}
        >
            <PortalAnimesLogo markClassName="h-10 w-10" wordmarkClassName="ml-2 text-lg" />
        </div>
    );
}

function AvatarFallback({ name }) {
    return (
        <div
            role="img"
            aria-label={`Avatar de ${name}`}
            data-share-card-fallback="avatar"
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(145deg, #8b5cf6 0%, #4f46e5 100%)',
                color: '#ffffff',
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: '-0.04em',
            }}
        >
            <span aria-hidden="true">{getInitials(name)}</span>
        </div>
    );
}

function useDialogFocus(isOpen, dialogRef, initialFocusRef) {
    useEffect(() => {
        if (!isOpen || typeof document === 'undefined') return undefined;
        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const scheduleFocus = window.requestAnimationFrame?.bind(window) || window.setTimeout.bind(window);
        const cancelFocus = window.cancelAnimationFrame?.bind(window) || window.clearTimeout.bind(window);
        const focusFrame = scheduleFocus(() => (initialFocusRef.current || dialogRef.current)?.focus());

        const keepFocusInside = (event) => {
            if (event.key !== 'Tab' || !dialogRef.current) return;
            const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)]
                .filter((element) => !element.hasAttribute('disabled'));
            if (!focusable.length) {
                event.preventDefault();
                dialogRef.current.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', keepFocusInside);
        return () => {
            cancelFocus(focusFrame);
            document.removeEventListener('keydown', keepFocusInside);
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus?.();
        };
    }, [dialogRef, initialFocusRef, isOpen]);
}

export function ShareProfileModal({ isOpen, onClose, user, profile, favorites = [], library = [] }) {
    useModalClose(isOpen, onClose);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState('');
    const cardRef = useRef(null);
    const dialogRef = useRef(null);
    const backButtonRef = useRef(null);

    useDialogFocus(isOpen, dialogRef, backButtonRef);

    useEffect(() => {
        if (!isOpen) {
            setCopied(false);
            setFeedback('');
        }
    }, [isOpen]);

    const publicUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/u/${user?.uid || ''}`;
    const banner = profile?.bannerURL || user?.bannerURL || null;
    const photo  = profile?.photoURL  || user?.photoURL  || null;
    const name   = profile?.displayName || user?.displayName || "Usuário";
    const about  = profile?.about || '';

    const totalAnimes    = library.length;
    const totalEpisodes  = library.reduce((acc, anime) => acc + Math.max(0, Number(anime.currentEp) || 0), 0);
    const totalCompleted = library.filter((anime) => ['completed', 'complete'].includes(anime.status)).length;
    const topFavorites   = favorites.slice(0, 3);
    const shortUrl       = publicUrl.replace(/^https?:\/\//, '');

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(publicUrl);
            setCopied(true);
            setFeedback('Link público copiado.');
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setFeedback('Não foi possível copiar automaticamente. Selecione o link e copie manualmente.');
        }
    };

    const handleDownloadCard = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            const { default: html2canvas } = await import('html2canvas');
            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                backgroundColor: null,
                scale: Math.min(4, Math.max(3, window.devicePixelRatio || 1)),
                logging: false,
            });
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1));
            if (!blob) throw new Error('Não foi possível preparar o PNG.');
            const image = URL.createObjectURL(blob);
            const link  = document.createElement('a');
            link.href     = image;
            link.download = `perfil-${name.replace(/[^a-z0-9_-]+/gi, '-').toLocaleLowerCase('pt-BR')}.png`;
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(image), 1000);
            setFeedback('PNG gerado e salvo com alta resolução.');
        } catch (err) {
            console.error('Erro ao gerar card:', err);
            setFeedback('Não foi possível gerar o PNG. Verifique as imagens do perfil e tente novamente.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen || typeof document === 'undefined') return null;

    const modal = (
        <div
            className="fixed inset-0 z-[160] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4"
            onClick={onClose}
        >
            <div
                ref={dialogRef}
                tabIndex={-1}
                className="relative flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border-0 bg-bg-secondary shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-3xl sm:border sm:border-border-color"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="share-profile-title"
            >
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border-color px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-5">
                    <button ref={backButtonRef} type="button" onClick={onClose} aria-label="Voltar e fechar compartilhamento" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent sm:hidden"><ArrowLeft className="h-5 w-5" /></button>
                    <h2 id="share-profile-title" className="flex min-w-0 flex-1 items-center gap-2 text-lg font-bold text-text-primary">
                        <Share2 className="w-5 h-5 text-button-accent" /> Compartilhar Perfil
                    </h2>
                    <button type="button" onClick={onClose} aria-label="Fechar compartilhamento" className="hidden h-11 w-11 place-items-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent sm:grid">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">

                    {/* Link */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Link Público</label>
                        <div className="flex flex-col gap-2 min-[380px]:flex-row">
                            <input
                                readOnly value={publicUrl}
                                aria-label="Link público do perfil"
                                onFocus={(event) => event.currentTarget.select()}
                                className="min-h-11 min-w-0 flex-1 rounded-xl border border-border-color bg-bg-tertiary px-4 py-2.5 font-mono text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent"
                            />
                            <button
                                type="button"
                                onClick={handleCopyLink}
                                className="flex min-h-11 min-w-[100px] items-center justify-center gap-2 rounded-xl bg-button-accent px-4 py-2 font-bold text-text-on-primary transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copiado!' : 'Copiar'}
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-border-color" />

                    {/* Card Preview */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Card de Perfil</label>
                            <button
                                type="button"
                                onClick={handleDownloadCard}
                                disabled={isGenerating}
                                className="flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-bold text-button-accent transition-all hover:bg-button-accent/10 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent"
                            >
                                <Download className="w-4 h-4" />
                                {isGenerating ? 'Gerando...' : 'Baixar PNG'}
                            </button>
                        </div>

                        {/* ── THE CARD ── (captured by html2canvas) */}
                        <div className="flex justify-center overflow-hidden rounded-2xl bg-black/30 p-2 min-[380px]:p-4">
                            <div
                                ref={cardRef}
                                style={{
                                    width: '100%',
                                    maxWidth: 560,
                                    background: 'linear-gradient(145deg, #0f0f14 0%, #13131a 60%, #18181f 100%)',
                                    borderRadius: 20,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                                }}
                            >
                                {/* Banner with gradient overlay */}
                                <div style={{ position: 'relative', height: 130 }}>
                                    <ShareCardImage
                                        key={banner || 'brand-banner'}
                                        src={banner}
                                        kind="banner"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                        fallback={<BrandBannerFallback />}
                                    />
                                    {/* Gradient bottom fade */}
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'linear-gradient(to bottom, rgba(15,15,20,0.1) 0%, rgba(15,15,20,0.7) 70%, rgba(15,15,20,1) 100%)',
                                    }} />
                                    {/* Top right branding */}
                                    <div style={{
                                        position: 'absolute', top: 12, right: 14,
                                        background: 'rgba(255,255,255,0.08)',
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: 8, padding: '3px 10px',
                                        fontSize: 10, fontWeight: 800,
                                        color: '#a78bfa', letterSpacing: '0.12em',
                                    }}>
                                        PORTAL ANIMES
                                    </div>
                                </div>

                                {/* Avatar + Name row */}
                                <div style={{ display: 'flex', alignItems: 'flex-end', padding: '0 24px', marginTop: -44, gap: 16, position: 'relative', zIndex: 2 }}>
                                    <div style={{
                                        width: 80, height: 80, borderRadius: '50%',
                                        border: '3px solid #a78bfa',
                                        overflow: 'hidden', flexShrink: 0,
                                        boxShadow: '0 0 0 3px #13131a, 0 8px 28px rgba(167,139,250,0.35)',
                                    }}>
                                        <ShareCardImage
                                            key={photo || 'initials-avatar'}
                                            src={photo}
                                            kind="avatar"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            fallback={<AvatarFallback name={name} />}
                                        />
                                    </div>
                                    <div style={{ paddingBottom: 6, flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {name}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#7c7c9a', marginTop: 3 }}>
                                            {shortUrl}
                                        </div>
                                    </div>
                                </div>

                                {/* About / tagline */}
                                {about && (
                                    <div style={{ padding: '10px 24px 0', fontSize: 12, color: '#9ca3b0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {about}
                                    </div>
                                )}

                                {/* Divider */}
                                <div style={{ margin: '16px 24px', height: 1, background: 'linear-gradient(90deg, rgba(167,139,250,0.3) 0%, rgba(255,255,255,0.04) 100%)' }} />

                                {/* Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: '0 24px' }}>
                                    {[
                                        { icon: BookOpenCheck, label: 'Episódios', value: totalEpisodes },
                                        { icon: LibraryBig, label: 'Animes', value: totalAnimes },
                                        { icon: CircleCheck, label: 'Concluídos', value: totalCompleted },
                                    ].map(({ icon: StatIcon, label, value }) => (
                                        <div key={label} style={{
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.07)',
                                            borderRadius: 12, padding: '10px 8px', textAlign: 'center',
                                        }}>
                                            <StatIcon aria-hidden="true" size={18} color="#a78bfa" style={{ display: 'block', margin: '0 auto 4px' }} />
                                            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
                                            <div style={{ fontSize: 9, color: '#8b8ba5', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Top 3 Favorites */}
                                {topFavorites.length > 0 && (
                                    <div style={{ padding: '16px 24px 0' }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#6b6b85', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                                            Top Favoritos
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                            {topFavorites.map((fav, i) => (
                                                <div key={fav.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '3/4' }}>
                                                    <img src={fav.image} alt={fav.title} crossOrigin="anonymous"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                    {/* Rank badge */}
                                                    <div style={{
                                                        position: 'absolute', top: 6, left: 6,
                                                        width: 20, height: 20, borderRadius: '50%',
                                                        background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#b45309',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 10, fontWeight: 900, color: '#fff',
                                                    }}>
                                                        {i + 1}
                                                    </div>
                                                    <div style={{
                                                        position: 'absolute', inset: '0 0 0 0',
                                                        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 55%)',
                                                    }} />
                                                    <div style={{
                                                        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 7px',
                                                        fontSize: 10, fontWeight: 700, color: '#fff',
                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                    }}>
                                                        {fav.title}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Footer */}
                                <div style={{
                                    margin: '16px 24px 20px',
                                    padding: '10px 14px',
                                    background: 'rgba(167,139,250,0.06)',
                                    border: '1px solid rgba(167,139,250,0.15)',
                                    borderRadius: 10,
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#9d8bd4', fontWeight: 600 }}>
                                        <Link2 aria-hidden="true" size={11} style={{ flexShrink: 0 }} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortUrl}</span>
                                    </div>
                                    <div style={{ fontSize: 10, color: '#4a4a62' }}>
                                        {new Date().toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary text-center">Gerado automaticamente com base no seu perfil.</p>
                        <p className="min-h-5 text-center text-xs font-semibold text-text-secondary" role="status" aria-live="polite">{feedback}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
