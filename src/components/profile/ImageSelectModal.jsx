import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    Check,
    Image as ImageIcon,
    Link2,
    Loader2,
    RefreshCw,
    Sparkles,
    Upload,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { fetchFavoriteImageGallery } from '@/services/imageGallery';
import { compressFavoriteImage, normalizeImageUrl } from '@/utils/favoriteImage';

const GALLERY_CACHE_TIME = 1000 * 60 * 60 * 24 * 7;

export function ImageSelectModal({ isOpen, onClose, item, type, onSelect }) {
    const [savingUrl, setSavingUrl] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [failedImages, setFailedImages] = useState([]);
    const [customUrl, setCustomUrl] = useState('');
    const [processingFile, setProcessingFile] = useState(false);

    useEffect(() => {
        setSavingUrl(null);
        setSaveError(null);
        setFailedImages([]);
        setCustomUrl('');
        setProcessingFile(false);
    }, [isOpen, item?.id]);

    const galleryQuery = useQuery({
        queryKey: ['favorite-image-gallery', 'anilist-v1', type, item?.id],
        queryFn: ({ signal }) => fetchFavoriteImageGallery({ item, type, signal }),
        enabled: Boolean(isOpen && item?.id && type),
        staleTime: GALLERY_CACHE_TIME,
        gcTime: GALLERY_CACHE_TIME,
        retry: 2,
        refetchOnWindowFocus: false,
    });

    const images = Array.from(new Set([
        item?.image,
        ...(galleryQuery.data || []),
    ].filter(Boolean))).filter((url) => !failedImages.includes(url));
    const hasAlternatives = images.some((url) => url !== item?.image);
    const isBusy = Boolean(savingUrl || processingFile);

    const handleSelect = async (url) => {
        if (savingUrl) return false;

        setSavingUrl(url);
        setSaveError(null);
        try {
            await onSelect(url);
            return true;
        } catch {
            setSaveError('Não foi possível salvar essa imagem. Tente novamente.');
            return false;
        } finally {
            setSavingUrl(null);
        }
    };

    const handleCustomUrl = async (event) => {
        event.preventDefault();
        try {
            const normalizedUrl = normalizeImageUrl(customUrl);
            await handleSelect(normalizedUrl);
        } catch (error) {
            setSaveError(error.message);
        }
    };

    const handleFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setProcessingFile(true);
        setSaveError(null);
        try {
            const compressedImage = await compressFavoriteImage(file);
            await handleSelect(compressedImage);
        } catch (error) {
            setSaveError(error.message || 'Não foi possível processar essa imagem.');
        } finally {
            setProcessingFile(false);
        }
    };

    const handleClose = () => {
        if (!isBusy) onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="lg"
            title={
                <span className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                        <ImageIcon className="h-4 w-4" />
                    </span>
                    Escolher imagem do card
                </span>
            }
            subtitle="Use a arte oficial disponível ou personalize o card com sua própria imagem."
            contentClassName="p-4 sm:p-6"
        >
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-border-color bg-bg-primary/45 p-3 sm:p-4">
                <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border-color bg-bg-tertiary">
                    {item?.image ? (
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <ImageIcon className="m-auto h-full w-5 text-text-secondary/40" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-text-primary">{item?.title || item?.name || 'Favorito'}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Arte oficial e capa personalizada
                    </p>
                </div>
                {galleryQuery.isFetching && (
                    <span className="hidden items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary sm:flex">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando
                    </span>
                )}
            </div>

            <div className="mb-5 grid gap-3 rounded-2xl border border-border-color bg-bg-tertiary/35 p-3 sm:grid-cols-[1fr_auto] sm:p-4">
                <form onSubmit={handleCustomUrl} className="flex min-w-0 gap-2">
                    <label className="relative min-w-0 flex-1">
                        <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                        <span className="sr-only">URL HTTPS da imagem</span>
                        <input
                            type="url"
                            inputMode="url"
                            value={customUrl}
                            onChange={(event) => setCustomUrl(event.target.value)}
                            placeholder="https://exemplo.com/capa.jpg"
                            disabled={isBusy}
                            className="w-full rounded-xl border border-border-color bg-bg-primary py-2.5 pl-10 pr-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={isBusy || !customUrl.trim()}
                        className="rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Usar URL
                    </button>
                </form>

                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border-color bg-bg-primary px-4 py-2.5 text-sm font-bold text-text-primary transition hover:border-primary/50 hover:text-primary">
                    {processingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Escolher arquivo
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFile}
                        disabled={isBusy}
                        className="sr-only"
                    />
                </label>

                <p className="text-xs leading-relaxed text-text-secondary sm:col-span-2">
                    O arquivo é comprimido no navegador antes de ser salvo. Não usa Firebase Storage nem serviço pago.
                </p>
            </div>

            {galleryQuery.isError && (
                <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-amber-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">A arte oficial não pôde ser atualizada</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-amber-200/75">A imagem atual, uma URL ou um arquivo local continuam disponíveis.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => galleryQuery.refetch()}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/25 bg-transparent px-2.5 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-400/10"
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
                    </button>
                </div>
            )}

            {saveError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm font-semibold text-red-300">
                    <AlertCircle className="h-4 w-4" /> {saveError}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {images.map((url, index) => {
                    const isCurrent = url === item?.image;
                    const isSaving = savingUrl === url;

                    return (
                        <button
                            type="button"
                            key={`${index}-${url.slice(0, 80)}`}
                            onClick={() => handleSelect(url)}
                            disabled={isBusy}
                            aria-label={`${isCurrent ? 'Manter' : 'Selecionar'} imagem de ${item?.title || item?.name || 'favorito'}`}
                            className={`group relative aspect-[2/3] overflow-hidden rounded-2xl border-2 p-0 text-left shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait ${
                                isCurrent
                                    ? 'border-primary shadow-primary/15'
                                    : 'border-transparent hover:-translate-y-1 hover:border-primary/70 hover:shadow-primary/20'
                            }`}
                        >
                            <img
                                src={url}
                                alt={item?.title || item?.name || 'Opção de imagem'}
                                loading="lazy"
                                decoding="async"
                                onError={() => setFailedImages((current) => [...current, url])}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />

                            {isCurrent && (
                                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-lg">
                                    <Check className="h-3 w-3" /> Atual
                                </span>
                            )}

                            <span className="absolute inset-x-2 bottom-2 translate-y-1 rounded-lg bg-black/65 px-2 py-1.5 text-center text-[10px] font-black uppercase tracking-wider text-white opacity-0 backdrop-blur-md transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                                {isCurrent ? 'Manter imagem' : 'Usar esta imagem'}
                            </span>

                            {isSaving && (
                                <span className="absolute inset-0 grid place-items-center bg-black/70 backdrop-blur-sm">
                                    <Loader2 className="h-7 w-7 animate-spin text-white" />
                                </span>
                            )}
                        </button>
                    );
                })}

                {galleryQuery.isFetching && Array.from({ length: images.length ? 3 : 8 }).map((_, index) => (
                    <div key={`gallery-skeleton-${index}`} className="aspect-[2/3] animate-pulse rounded-2xl border border-border-color bg-bg-tertiary" />
                ))}
            </div>

            {!galleryQuery.isFetching && !galleryQuery.isError && images.length > 0 && !hasAlternatives && (
                <p className="mt-4 rounded-xl border border-border-color bg-bg-primary/30 px-4 py-3 text-center text-xs text-text-secondary">
                    A galeria possui apenas uma arte oficial para este item. Use uma URL ou arquivo para personalizar.
                </p>
            )}

            {!galleryQuery.isFetching && images.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border-color py-10 text-center text-text-secondary">
                    <ImageIcon className="mx-auto mb-3 h-8 w-8 opacity-30" />
                    <p className="text-sm font-semibold">Nenhuma arte oficial disponível. Você ainda pode adicionar sua própria imagem.</p>
                </div>
            )}
        </Modal>
    );
}