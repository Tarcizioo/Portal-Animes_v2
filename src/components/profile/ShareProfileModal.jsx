import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModalClose } from '@/hooks/useModalClose';
import { X, Copy, Download, Share2, Check, Star, Tv, Clock } from 'lucide-react';

export function ShareProfileModal({ isOpen, onClose, user, profile, favorites, library = [] }) {
    useModalClose(isOpen, onClose);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const cardRef = useRef(null);

    const publicUrl = `${window.location.origin}/u/${user?.uid}`;
    const banner = profile?.bannerURL || user?.bannerURL || "https://placehold.co/1200x400/1a1a1a/FFF?text=Banner";
    const photo  = profile?.photoURL  || user?.photoURL  || "https://placehold.co/200x200/6366f1/FFF?text=User";
    const name   = profile?.displayName || user?.displayName || "Usuário";
    const about  = profile?.about || '';

    const totalAnimes    = library.length;
    const totalEpisodes  = library.reduce((acc, a) => acc + (a.currentEp || 0), 0);
    const daysWatched    = ((totalEpisodes * 24) / 1440).toFixed(1);
    const topFavorites   = favorites.slice(0, 3);
    const shortUrl       = publicUrl.replace(/^https?:\/\//, '');

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadCard = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            const { default: html2canvas } = await import('html2canvas');
            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                backgroundColor: null,
                scale: 2,
                logging: false,
            });
            const image = canvas.toDataURL('image/png');
            const link  = document.createElement('a');
            link.href     = image;
            link.download = `profile-${name}.png`;
            link.click();
        } catch (err) {
            console.error('Erro ao gerar card:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    const modal = (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="bg-bg-secondary w-full max-w-2xl rounded-3xl border border-border-color shadow-2xl relative flex flex-col max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border-color">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-button-accent" /> Compartilhar Perfil
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-bg-tertiary rounded-full text-text-secondary hover:text-text-primary transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">

                    {/* Link */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Link Público</label>
                        <div className="flex gap-2">
                            <input
                                readOnly value={publicUrl}
                                className="flex-1 bg-bg-tertiary border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none text-sm font-mono"
                            />
                            <button
                                onClick={handleCopyLink}
                                className="px-4 py-2 bg-button-accent hover:opacity-90 text-text-on-primary rounded-xl font-bold transition-all flex items-center gap-2 min-w-[100px] justify-center text-sm"
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
                                onClick={handleDownloadCard}
                                disabled={isGenerating}
                                className="flex items-center gap-1.5 text-sm font-bold text-button-accent hover:opacity-80 disabled:opacity-40 transition-all"
                            >
                                <Download className="w-4 h-4" />
                                {isGenerating ? 'Gerando...' : 'Baixar PNG'}
                            </button>
                        </div>

                        {/* ── THE CARD ── (captured by html2canvas) */}
                        <div className="flex justify-center bg-black/30 p-4 rounded-2xl overflow-hidden">
                            <div
                                ref={cardRef}
                                style={{
                                    width: 560,
                                    background: 'linear-gradient(145deg, #0f0f14 0%, #13131a 60%, #18181f 100%)',
                                    borderRadius: 20,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                                }}
                            >
                                {/* Banner with gradient overlay */}
                                <div style={{ position: 'relative', height: 130 }}>
                                    <img
                                        src={banner} alt=""
                                        crossOrigin="anonymous"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
                                        <img src={photo} alt="" crossOrigin="anonymous"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
                                        { icon: '▶️', label: 'Eps Vistos', value: totalEpisodes },
                                        { icon: '📺', label: 'Animes',    value: totalAnimes },
                                        { icon: '🕐', label: 'Dias',      value: daysWatched },
                                    ].map(s => (
                                        <div key={s.label} style={{
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.07)',
                                            borderRadius: 12, padding: '10px 8px', textAlign: 'center',
                                        }}>
                                            <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                                            <div style={{ fontSize: 10, color: '#6b6b85', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
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
                                    <div style={{ fontSize: 10, color: '#7c6fad', fontWeight: 600 }}>
                                        🔗 {shortUrl}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#4a4a62' }}>
                                        {new Date().toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary text-center">Gerado automaticamente com base no seu perfil.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
