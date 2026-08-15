import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactCrop, { centerCrop, convertToPixelCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { ArrowLeft, Check, Crop, Image as ImageIcon, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { useModalClose } from '@/hooks/useModalClose';

const CROP_CONFIG = {
  avatar: {
    aspect: 1,
    width: 640,
    height: 640,
    label: 'Foto de perfil',
    description: 'O arquivo será quadrado e aparecerá circular no perfil.',
  },
  banner: {
    aspect: 16 / 5,
    width: 1600,
    height: 500,
    label: 'Banner do perfil',
    description: 'Mantenha rostos e textos importantes dentro da área central.',
  },
};

const FOCUSABLE_SELECTOR = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useDialogFocus(dialogRef, initialFocusRef) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
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
  }, [dialogRef, initialFocusRef]);
}

function getFitCrop(mediaWidth, mediaHeight, aspect, coverage = 92) {
  const width = Math.min(coverage, (coverage * mediaHeight * aspect) / mediaWidth);
  return centerCrop(
    makeAspectCrop({ unit: '%', width }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

async function getCroppedBlob(image, crop, outputWidth, outputHeight) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Seu navegador não conseguiu preparar a imagem.');

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = outputWidth;
  canvas.height = outputHeight;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível gerar o recorte.'))),
      'image/jpeg',
      0.92,
    );
  });
}

function CropPreview({ imageSrc, crop }) {
  if (!crop?.width || !crop?.height) {
    return <div className="flex h-full items-center justify-center text-text-secondary"><ImageIcon className="h-7 w-7" /></div>;
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={imageSrc}
        alt="Prévia do recorte"
        className="absolute max-w-none select-none"
        style={{
          width: `${10000 / crop.width}%`,
          left: `${(-crop.x / crop.width) * 100}%`,
          top: `${(-crop.y / crop.height) * 100}%`,
        }}
      />
    </div>
  );
}

export function ImageCropModal({ imageSrc, type, onConfirm, onCancel }) {
  useModalClose(true, onCancel);

  const config = CROP_CONFIG[type] || CROP_CONFIG.avatar;
  const isAvatar = type === 'avatar';
  const imageRef = useRef(null);
  const dialogRef = useRef(null);
  const backButtonRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageSize, setImageSize] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState('');

  useDialogFocus(dialogRef, backButtonRef);

  const applyCrop = useCallback((nextCrop) => {
    setCrop(nextCrop);
    if (imageRef.current) {
      setCompletedCrop(convertToPixelCrop(nextCrop, imageRef.current.width, imageRef.current.height));
    }
  }, []);

  const resetCrop = useCallback(() => {
    if (!imageRef.current) return;
    const { width, height } = imageRef.current;
    setZoom(1);
    applyCrop(getFitCrop(width, height, config.aspect));
  }, [applyCrop, config.aspect]);

  const handleImageLoad = useCallback((event) => {
    const { width, height, naturalWidth, naturalHeight } = event.currentTarget;
    setImageSize({ naturalWidth, naturalHeight });
    const nextCrop = getFitCrop(width, height, config.aspect);
    setCrop(nextCrop);
    setCompletedCrop(convertToPixelCrop(nextCrop, width, height));
  }, [config.aspect]);

  const handleZoomChange = (event) => {
    if (!imageRef.current) return;
    const nextZoom = Number(event.target.value);
    const { width, height } = imageRef.current;
    const fitCrop = getFitCrop(width, height, config.aspect);
    const sizedCrop = makeAspectCrop({ unit: '%', width: fitCrop.width / nextZoom }, config.aspect, width, height);
    const centerX = crop ? crop.x + crop.width / 2 : 50;
    const centerY = crop ? crop.y + crop.height / 2 : 50;
    const nextCrop = {
      ...sizedCrop,
      x: clamp(centerX - sizedCrop.width / 2, 0, 100 - sizedCrop.width),
      y: clamp(centerY - sizedCrop.height / 2, 0, 100 - sizedCrop.height),
    };

    setZoom(nextZoom);
    applyCrop(nextCrop);
  };

  const handleConfirm = async () => {
    if (!completedCrop || !imageRef.current) return;
    setIsProcessing(true);
    setProcessingError('');

    try {
      const blob = await getCroppedBlob(imageRef.current, completedCrop, config.width, config.height);
      onConfirm(blob, URL.createObjectURL(blob));
    } catch (error) {
      setProcessingError(error.message || 'Não foi possível finalizar o recorte.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[190] flex items-end justify-center bg-black/90 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <Motion.div
        ref={dialogRef}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        tabIndex={-1}
        className="flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden border-0 bg-bg-secondary shadow-2xl sm:h-auto sm:max-h-[94dvh] sm:rounded-3xl sm:border sm:border-border-color"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-title"
      >
        <header className="flex items-center gap-3 border-b border-border-color px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:py-4">
          <button ref={backButtonRef} type="button" onClick={onCancel} aria-label="Voltar sem usar o recorte" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent sm:hidden"><ArrowLeft className="h-5 w-5" /></button>
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-button-accent/10 text-button-accent"><Crop className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-button-accent">Ajuste da imagem</p>
              <h2 id="crop-title" className="truncate text-lg font-black text-text-primary">{config.label}</h2>
            </div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Fechar recorte" className="ml-auto hidden h-11 w-11 place-items-center rounded-xl text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent sm:grid"><X className="h-5 w-5" /></button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-h-[280px] items-center justify-center overflow-auto bg-[#09090b] p-3 sm:min-h-[360px] sm:p-7">
            <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={setCompletedCrop} aspect={config.aspect} circularCrop={isAvatar} keepSelection ruleOfThirds minWidth={80}>
              <img ref={imageRef} src={imageSrc} alt="Imagem escolhida para recorte" onLoad={handleImageLoad} className="max-h-[58vh] max-w-full object-contain" />
            </ReactCrop>
          </div>

          <aside className="space-y-6 border-t border-border-color bg-bg-tertiary/45 p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-text-secondary">Prévia final</p>
              <div className="mt-3 flex justify-center rounded-2xl border border-border-color bg-bg-primary/50 p-5">
                <div className={isAvatar ? 'relative h-32 w-32 overflow-hidden rounded-full border-4 border-bg-secondary shadow-xl' : 'relative aspect-[16/5] w-full overflow-hidden rounded-xl border border-border-color shadow-xl'}>
                  <CropPreview imageSrc={imageSrc} crop={crop} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
                <span className="flex items-center gap-1.5"><ZoomOut className="h-4 w-4" /> Zoom</span>
                <span className="rounded-md bg-bg-primary px-2 py-1 text-text-primary">{zoom.toFixed(1)}x</span>
              </div>
              <input type="range" min="1" max="2.5" step="0.1" value={zoom} onChange={handleZoomChange} aria-label="Zoom do recorte" className="h-11 w-full accent-button-accent" />
              <div className="flex items-center justify-between text-text-secondary"><ZoomOut className="h-4 w-4" /><ZoomIn className="h-4 w-4" /></div>
            </div>

            <button type="button" onClick={resetCrop} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-color px-4 py-2.5 text-sm font-bold text-text-secondary transition-colors hover:border-button-accent/50 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent"><RotateCcw className="h-4 w-4" /> Recomeçar enquadramento</button>

            <div className="rounded-xl border border-border-color bg-bg-primary/40 p-3 text-xs leading-relaxed text-text-secondary">
              <p className="font-bold text-text-primary">Saída otimizada: {config.width} × {config.height}px</p>
              <p className="mt-1">{config.description}</p>
              {imageSize && (imageSize.naturalWidth < config.width || imageSize.naturalHeight < config.height) && <p className="mt-2 font-bold text-amber-400">A imagem original é menor que o tamanho recomendado e pode perder nitidez.</p>}
            </div>
          </aside>
        </div>

        <footer className="border-t border-border-color bg-bg-secondary px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:py-4">
          {processingError && <p className="mb-3 text-xs font-bold text-red-400" role="alert">{processingError}</p>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-secondary">Arraste a seleção sobre a imagem para escolher o foco.</p>
            <div className="flex gap-2">
              <button type="button" onClick={onCancel} className="min-h-11 flex-1 rounded-xl border border-border-color px-5 py-2.5 text-sm font-bold text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent sm:flex-none">Cancelar</button>
              <button type="button" onClick={handleConfirm} disabled={!completedCrop || isProcessing} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-button-accent px-5 py-2.5 text-sm font-black text-text-on-primary shadow-lg shadow-button-accent/20 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent disabled:cursor-wait disabled:opacity-50 sm:flex-none"><Check className="h-4 w-4" />{isProcessing ? 'Preparando...' : 'Usar esta imagem'}</button>
            </div>
          </div>
        </footer>
      </Motion.div>
    </div>,
    document.body,
  );
}
