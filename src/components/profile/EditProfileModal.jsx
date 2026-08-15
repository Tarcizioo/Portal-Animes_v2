import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera,
  Check,
  AlertTriangle,
  ArrowLeft,
  ClipboardPaste,
  Globe2,
  ImagePlus,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Palette,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useModalClose } from '@/hooks/useModalClose';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import { SocialIcon } from '@/components/profile/ProfileConnections';
import { CONNECTION_PLATFORMS, formatConnectionHandle, normalizeConnectionValue } from '@/utils/profileConnections';

const ANIME_GENRES = [
  'Action', 'Adventure', 'Avant Garde', 'Award Winning', 'Boys Love', 'Comedy', 'Drama',
  'Fantasy', 'Girls Love', 'Gourmet', 'Horror', 'Mystery', 'Romance', 'Sci-Fi',
  'Slice of Life', 'Sports', 'Supernatural', 'Suspense', 'Ecchi', 'Isekai', 'Mecha',
  'Military', 'Music', 'Parody', 'Psychological', 'School', 'Shoujo', 'Shonen',
  'Josei', 'Seinen', 'Space', 'Super Power', 'Vampire', 'Harem', 'Historical',
  'Demons', 'Magic', 'Martial Arts', 'Police', 'Samurai', 'Thriller',
];

const PROFILE_TABS = [
  { id: 'appearance', label: 'Visual', description: 'Avatar e banner', icon: Palette },
  { id: 'identity', label: 'Perfil', description: 'Nome, bio e gostos', icon: UserRound },
  { id: 'connections', label: 'Conexões', description: 'Suas redes em um toque', icon: Link2 },
  { id: 'privacy', label: 'Privacidade', description: 'Controle de visibilidade', icon: ShieldCheck },
];

const PROFILE_LIMITS = {
  displayNameMin: 2,
  displayNameMax: 50,
  aboutMax: 500,
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function useDialogFocus(isActive, dialogRef, initialFocusRef) {
  useEffect(() => {
    if (!isActive || typeof document === 'undefined') return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const scheduleFocus = window.requestAnimationFrame?.bind(window) || window.setTimeout.bind(window);
    const cancelFocus = window.cancelAnimationFrame?.bind(window) || window.clearTimeout.bind(window);
    const focusFrame = scheduleFocus(() => {
      (initialFocusRef.current || dialogRef.current)?.focus();
    });

    const keepFocusInside = (event) => {
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)]
        .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
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
  }, [dialogRef, initialFocusRef, isActive]);
}

function createFormData(profile = {}) {
  return {
    displayName: profile.displayName || '',
    photoURL: profile.photoURL || '',
    bannerURL: profile.bannerURL || '',
    about: profile.about || '',
    isPublic: profile.isPublic === true,
    favoriteGenres: profile.favoriteGenres || [],
    connections: {
      discord: profile.connections?.discord || '',
      twitter: profile.connections?.twitter || '',
      instagram: profile.connections?.instagram || '',
    },
  };
}

function SectionIntro({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-button-accent">{eyebrow}</p>
      <h3 className="mt-1 text-2xl font-black text-text-primary">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">{description}</p>
    </div>
  );
}

function ConnectionEditor({ platform, value, onChange, toast }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const normalizedValue = normalizeConnectionValue(platform.id, value);

  useEffect(() => {
    setDraft(value || '');
  }, [value]);

  const saveDraft = () => {
    const normalized = normalizeConnectionValue(platform.id, draft);
    if (!normalized) {
      toast.warning('Digite um usuário ou cole o link do perfil.', platform.label);
      return;
    }
    onChange(normalized);
    setEditing(false);
  };

  const pasteAndConnect = async () => {
    try {
      const clipboardValue = await navigator.clipboard.readText();
      const normalized = normalizeConnectionValue(platform.id, clipboardValue);
      if (!normalized) throw new Error('empty');
      onChange(normalized);
      setDraft(normalized);
      setEditing(false);
      toast.success(`${platform.label} conectado.`, 'Conexões');
    } catch {
      setEditing(true);
      toast.info('Cole o usuário ou link no campo abaixo.', platform.label);
    }
  };

  return (
    <div className={clsx('rounded-2xl border p-4 transition-colors', platform.surface)}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/20" style={{ color: platform.accent }}>
          <SocialIcon platform={platform.id} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-black text-text-primary">{platform.label}</h4>
            {normalizedValue && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">Conectado</span>}
          </div>
          <p className="truncate text-xs text-text-secondary">
            {normalizedValue ? formatConnectionHandle(platform.id, normalizedValue) : platform.hint}
          </p>
        </div>

        {!editing && normalizedValue && (
          <button type="button" onClick={() => setEditing(true)} className="min-h-11 rounded-lg px-2.5 py-1.5 text-xs font-bold text-text-secondary hover:bg-black/20 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">Editar</button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <label className="sr-only" htmlFor={`connection-${platform.id}`}>{platform.label}</label>
          <input
            id={`connection-${platform.id}`}
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                saveDraft();
              }
            }}
            placeholder={platform.placeholder}
            autoFocus
            className="w-full rounded-xl border border-border-color bg-bg-primary/70 px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary/60 focus:border-button-accent"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setDraft(value || ''); setEditing(false); }} className="min-h-11 rounded-lg px-3 py-2 text-xs font-bold text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">Cancelar</button>
            <button type="button" onClick={saveDraft} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-button-accent px-3 py-2 text-xs font-black text-text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent"><Check className="h-3.5 w-3.5" /> Confirmar</button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={pasteAndConnect} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-bg-primary/60 px-3 py-2.5 text-xs font-black text-text-primary transition-colors hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">
            <ClipboardPaste className="h-4 w-4" /> {normalizedValue ? 'Substituir do clipboard' : 'Colar e conectar'}
          </button>
          {!normalizedValue && <button type="button" onClick={() => setEditing(true)} className="min-h-11 rounded-xl border border-border-color px-3 py-2.5 text-xs font-bold text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">Digitar</button>}
          {normalizedValue && <button type="button" onClick={() => onChange('')} aria-label={`Remover ${platform.label}`} className="rounded-xl border border-red-500/20 px-3 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>}
        </div>
      )}
    </div>
  );
}

export function EditProfileModal({ isOpen, onClose, profile, onSave, initialTab = 'appearance' }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadImage, uploading } = useImageUpload();
  const [activeTab, setActiveTab] = useState('appearance');
  const [formData, setFormData] = useState(() => createFormData(profile));
  const [bannerFile, setBannerFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [cropModal, setCropModal] = useState({ open: false, src: '', type: '' });
  const [genreSearch, setGenreSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const bannerInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const objectUrlsRef = useRef(new Set());
  const dialogRef = useRef(null);
  const backButtonRef = useRef(null);
  const discardDialogRef = useRef(null);
  const discardCancelRef = useRef(null);

  const hasUnsavedChanges = useMemo(() => (
    JSON.stringify(formData) !== JSON.stringify(createFormData(profile))
    || Boolean(bannerFile || photoFile || bannerPreview || photoPreview)
  ), [bannerFile, bannerPreview, formData, photoFile, photoPreview, profile]);

  const requestClose = useCallback(() => {
    if (saving || uploading) return;
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  }, [hasUnsavedChanges, onClose, saving, uploading]);

  useModalClose(isOpen && !cropModal.open, () => {
    if (showDiscardConfirm) setShowDiscardConfirm(false);
    else requestClose();
  });
  useDialogFocus(isOpen && !cropModal.open && !showDiscardConfirm, dialogRef, backButtonRef);
  useDialogFocus(showDiscardConfirm, discardDialogRef, discardCancelRef);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(createFormData(profile));
    setBannerFile(null);
    setPhotoFile(null);
    setBannerPreview('');
    setPhotoPreview('');
    setGenreSearch('');
    setShowDiscardConfirm(false);
    setActiveTab(PROFILE_TABS.some((tab) => tab.id === initialTab) ? initialTab : 'appearance');
  }, [initialTab, isOpen, profile]);

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
  }, []);


  const trackObjectUrl = (url) => {
    objectUrlsRef.current.add(url);
    return url;
  };

  const releaseObjectUrl = (url) => {
    if (!url || !objectUrlsRef.current.has(url)) return;
    URL.revokeObjectURL(url);
    objectUrlsRef.current.delete(url);
  };

  const closeCropModal = () => {
    releaseObjectUrl(cropModal.src);
    setCropModal({ open: false, src: '', type: '' });
  };

  const handleFileChange = (event, type) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.warning('Selecione um arquivo de imagem.', 'Imagem inválida');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.warning('A imagem deve ter no máximo 10 MB.', 'Arquivo muito grande');
      return;
    }

    const src = trackObjectUrl(URL.createObjectURL(file));
    setCropModal({ open: true, src, type });
  };

  const handleCropConfirm = (blob, previewUrl) => {
    const trackedPreview = trackObjectUrl(previewUrl);
    const file = new File([blob], `${cropModal.type}_${Date.now()}.jpg`, { type: 'image/jpeg' });

    if (cropModal.type === 'banner') {
      releaseObjectUrl(bannerPreview);
      setBannerFile(file);
      setBannerPreview(trackedPreview);
    } else {
      releaseObjectUrl(photoPreview);
      setPhotoFile(file);
      setPhotoPreview(trackedPreview);
    }
    closeCropModal();
  };

  const removeImage = (type) => {
    if (type === 'banner') {
      releaseObjectUrl(bannerPreview);
      setBannerPreview('');
      setBannerFile(null);
      setFormData((current) => ({ ...current, bannerURL: '' }));
    } else {
      releaseObjectUrl(photoPreview);
      setPhotoPreview('');
      setPhotoFile(null);
      setFormData((current) => ({ ...current, photoURL: '' }));
    }
  };

  const visibleGenres = useMemo(() => {
    const search = genreSearch.trim().toLocaleLowerCase('pt-BR');
    return ANIME_GENRES
      .filter((genre) => !formData.favoriteGenres.includes(genre))
      .filter((genre) => !search || genre.toLocaleLowerCase('pt-BR').includes(search))
      .slice(0, 12);
  }, [formData.favoriteGenres, genreSearch]);

  if (!isOpen || typeof document === 'undefined') return null;

  const addGenre = (genre) => {
    if (formData.favoriteGenres.length >= 8) {
      toast.warning('Escolha no máximo 8 gêneros para manter o perfil objetivo.', 'Gêneros');
      return;
    }
    setFormData((current) => ({ ...current, favoriteGenres: [...current.favoriteGenres, genre] }));
    setGenreSearch('');
  };

  const removeGenre = (genre) => {
    setFormData((current) => ({
      ...current,
      favoriteGenres: current.favoriteGenres.filter((item) => item !== genre),
    }));
  };

  const updateConnection = (platform, value) => {
    setFormData((current) => ({
      ...current,
      connections: { ...current.connections, [platform]: value },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const displayName = formData.displayName.trim();
    if (displayName.length < PROFILE_LIMITS.displayNameMin) {
      setActiveTab('identity');
      toast.warning(`O nome precisa ter pelo menos ${PROFILE_LIMITS.displayNameMin} caracteres.`, 'Perfil');
      return;
    }
    if (!user?.uid) return;

    setSaving(true);
    try {
      const updatedData = {
        ...formData,
        displayName,
        about: formData.about.trim(),
        connections: Object.fromEntries(
          Object.entries(formData.connections).map(([platform, value]) => [platform, normalizeConnectionValue(platform, value)]),
        ),
      };

      const [bannerURL, photoURL] = await Promise.all([
        bannerFile ? uploadImage(bannerFile, `users/${user.uid}/banner_${Date.now()}`) : null,
        photoFile ? uploadImage(photoFile, `users/${user.uid}/avatar_${Date.now()}`) : null,
      ]);
      if (bannerURL) updatedData.bannerURL = bannerURL;
      if (photoURL) updatedData.photoURL = photoURL;

      await onSave(updatedData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      if (error.code === 'storage/unauthorized') toast.error('O Firebase Storage recusou o upload.', 'Permissão');
      else if (error.code === 'storage/canceled') toast.warning('Upload cancelado.', 'Imagem');
      else toast.error(error.message || 'Não foi possível salvar o perfil.', 'Erro');
    } finally {
      setSaving(false);
    }
  };

  const bannerImage = bannerPreview || formData.bannerURL;
  const photoImage = photoPreview || formData.photoURL;
  const initials = (formData.displayName || 'PA').trim().slice(0, 2).toLocaleUpperCase('pt-BR');
  const connectedCount = Object.values(formData.connections).filter(Boolean).length;
  const isSubmitting = saving || uploading;

  return createPortal(
    <>
      {cropModal.open && <ImageCropModal imageSrc={cropModal.src} type={cropModal.type} onConfirm={handleCropConfirm} onCancel={closeCropModal} />}

      <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md md:items-center md:p-4" onMouseDown={requestClose}>
        <form
          ref={dialogRef}
          onSubmit={handleSubmit}
          onMouseDown={(event) => event.stopPropagation()}
          tabIndex={-1}
          className="flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden border-0 bg-bg-secondary shadow-2xl md:h-[92vh] md:max-h-[780px] md:rounded-3xl md:border md:border-border-color"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          <header className="flex items-center gap-3 border-b border-border-color px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-7 md:py-4">
            <button ref={backButtonRef} type="button" onClick={requestClose} aria-label="Voltar e fechar edição de perfil" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent md:hidden"><ArrowLeft className="h-5 w-5" /></button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-button-accent">Seu espaço</p>
              <h2 id="edit-profile-title" className="text-xl font-black text-text-primary md:text-2xl">Editar perfil</h2>
            </div>
            <span className="shrink-0 text-[10px] font-bold text-text-secondary md:hidden">{PROFILE_TABS.findIndex((tab) => tab.id === activeTab) + 1} de {PROFILE_TABS.length}</span>
            <button type="button" onClick={requestClose} aria-label="Fechar edição de perfil" className="hidden h-11 w-11 place-items-center rounded-xl text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent md:grid"><X className="h-5 w-5" /></button>
          </header>

          <div className="grid min-h-0 flex-1 md:grid-cols-[220px_minmax(0,1fr)]">
            <nav className="no-scrollbar flex gap-2 overflow-x-auto border-b border-border-color bg-bg-tertiary/35 p-3 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-4" aria-label="Seções do perfil">
              {PROFILE_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={active ? 'page' : undefined}
                    className={clsx(
                      'flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all md:w-full',
                      active ? 'border-button-accent/30 bg-button-accent/10 text-text-primary' : 'border-transparent text-text-secondary hover:bg-bg-primary/50 hover:text-text-primary',
                    )}
                  >
                    <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', active ? 'bg-button-accent text-text-on-primary' : 'bg-bg-primary')}><Icon className="h-4 w-4" /></span>
                    <span>
                      <span className="block text-sm font-black">{tab.label}{tab.id === 'connections' && connectedCount > 0 ? ` · ${connectedCount}` : ''}</span>
                      <span className="hidden text-[10px] text-text-secondary md:block">{tab.description}</span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <main className="no-scrollbar min-h-0 overflow-y-auto overscroll-contain p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] [scroll-padding-bottom:calc(6rem+env(safe-area-inset-bottom))] md:p-8">
              {activeTab === 'appearance' && (
                <section>
                  <SectionIntro eyebrow="Identidade visual" title="Escolha o melhor enquadramento." description="Veja avatar e banner juntos antes de salvar. Toda imagem passa pelo recorte e é otimizada automaticamente." />

                  <div className="overflow-hidden rounded-3xl border border-border-color bg-bg-primary shadow-xl">
                    <div className="relative aspect-[16/5] min-h-36 overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.45),transparent_32%),linear-gradient(135deg,#18181b,#09090b)]">
                      {bannerImage && <img src={bannerImage} alt="Prévia do banner" className="absolute inset-0 block h-full w-full object-cover" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-black/20" />
                      <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute right-3 top-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-black/55 px-3 py-2 text-xs font-black text-white backdrop-blur-md transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Camera className="h-4 w-4" /> Alterar banner</button>
                    </div>
                    <div className="relative flex min-h-28 items-end gap-4 px-5 pb-5 pt-12 sm:px-7">
                      <button type="button" onClick={() => photoInputRef.current?.click()} className="group absolute -top-12 left-5 aspect-square h-24 w-24 overflow-hidden rounded-full border-4 border-bg-primary bg-bg-tertiary p-0 leading-none shadow-2xl sm:left-7 sm:h-28 sm:w-28" aria-label="Alterar foto de perfil">
                        {photoImage ? <img src={photoImage} alt="Prévia do avatar" className="absolute inset-0 block h-full w-full rounded-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center rounded-full text-2xl font-black text-button-accent">{initials}</span>}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100"><Camera className="h-5 w-5" /></span>
                      </button>
                      <div className="ml-28 min-w-0 sm:ml-32">
                        <p className="truncate text-lg font-black text-text-primary">{formData.displayName || 'Seu nome'}</p>
                        <p className="text-xs text-text-secondary">Prévia do cabeçalho do perfil</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-2xl border border-border-color bg-bg-tertiary/35 p-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-button-accent/10 text-button-accent"><ImagePlus className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1"><p className="text-sm font-black text-text-primary">Banner</p><p className="text-xs text-text-secondary">Proporção 16:5 · 1600 × 500</p></div>
                      {bannerImage && <button type="button" onClick={() => removeImage('banner')} aria-label="Remover banner" className="grid h-11 w-11 place-items-center rounded-lg text-text-secondary hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-border-color bg-bg-tertiary/35 p-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"><UserRound className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1"><p className="text-sm font-black text-text-primary">Avatar</p><p className="text-xs text-text-secondary">Exibição circular · 640 × 640</p></div>
                      {photoImage && <button type="button" onClick={() => removeImage('avatar')} aria-label="Remover avatar" className="grid h-11 w-11 place-items-center rounded-lg text-text-secondary hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  </div>

                  <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleFileChange(event, 'banner')} className="hidden" />
                  <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleFileChange(event, 'avatar')} className="hidden" />
                </section>
              )}

              {activeTab === 'identity' && (
                <section>
                  <SectionIntro eyebrow="Identidade" title="Conte um pouco sobre você." description="Um nome claro, uma bio curta e seus gêneros favoritos ajudam outras pessoas a encontrar afinidades." />
                  <div className="space-y-5">
                    <div>
                      <div className="mb-2 flex justify-between"><label htmlFor="profile-display-name" className="text-sm font-bold text-text-primary">Nome de exibição</label><span className="text-xs text-text-secondary">{formData.displayName.length}/{PROFILE_LIMITS.displayNameMax}</span></div>
                      <input id="profile-display-name" type="text" minLength={PROFILE_LIMITS.displayNameMin} maxLength={PROFILE_LIMITS.displayNameMax} value={formData.displayName} onChange={(event) => setFormData((current) => ({ ...current, displayName: event.target.value }))} className="min-h-11 w-full rounded-xl border border-border-color bg-bg-primary/60 px-4 py-3 text-text-primary outline-none transition-colors focus:border-button-accent focus-visible:ring-2 focus-visible:ring-button-accent/40" />
                    </div>

                    <div>
                      <div className="mb-2 flex justify-between"><label htmlFor="profile-about" className="text-sm font-bold text-text-primary">Bio</label><span className="text-xs text-text-secondary">{formData.about.length}/{PROFILE_LIMITS.aboutMax}</span></div>
                      <textarea id="profile-about" rows="4" maxLength={PROFILE_LIMITS.aboutMax} value={formData.about} onChange={(event) => setFormData((current) => ({ ...current, about: event.target.value }))} placeholder="Quais histórias e animes fazem parte da sua jornada?" className="w-full resize-none rounded-xl border border-border-color bg-bg-primary/60 px-4 py-3 text-sm leading-relaxed text-text-primary outline-none transition-colors placeholder:text-text-secondary/60 focus:border-button-accent focus-visible:ring-2 focus-visible:ring-button-accent/40" />
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-bold text-text-primary">Gêneros favoritos</p><p className="text-xs text-text-secondary">Escolha até 8 para manter sua identidade objetiva.</p></div><span className="rounded-lg bg-bg-primary px-2 py-1 text-xs font-black text-text-secondary">{formData.favoriteGenres.length}/8</span></div>
                      {formData.favoriteGenres.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{formData.favoriteGenres.map((genre) => <button key={genre} type="button" onClick={() => removeGenre(genre)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-button-accent/25 bg-button-accent/10 px-3 py-1.5 text-xs font-bold text-button-accent transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">{genre}<X className="h-3 w-3" /></button>)}</div>}
                      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" /><input type="search" value={genreSearch} onChange={(event) => setGenreSearch(event.target.value)} placeholder="Buscar um gênero" className="w-full rounded-xl border border-border-color bg-bg-primary/60 py-3 pl-10 pr-4 text-sm text-text-primary outline-none focus:border-button-accent" /></div>
                      <div className="mt-3 flex flex-wrap gap-2">{visibleGenres.map((genre) => <button key={genre} type="button" onClick={() => addGenre(genre)} className="min-h-11 rounded-full border border-border-color px-3 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:border-button-accent/50 hover:bg-button-accent/5 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">+ {genre}</button>)}</div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'connections' && (
                <section>
                  <SectionIntro eyebrow="Conexões" title="Menos links, mais conexões." description="Copie seu @ ou o link do perfil e use “Colar e conectar”. O PortalAnimes remove o endereço e guarda somente seu usuário." />
                  <div className="grid gap-3 lg:grid-cols-2">
                    {CONNECTION_PLATFORMS.map((platform) => <ConnectionEditor key={platform.id} platform={platform} value={formData.connections[platform.id]} onChange={(value) => updateConnection(platform.id, value)} toast={toast} />)}
                  </div>
                  <div className="mt-5 rounded-2xl border border-button-accent/15 bg-button-accent/5 p-4 text-xs leading-relaxed text-text-secondary"><p className="font-bold text-text-primary">Por que não pedimos login nas redes?</p><p className="mt-1">Assim suas credenciais nunca passam pelo PortalAnimes. O Discord é copiado com um toque; Instagram e X abrem diretamente no perfil informado.</p></div>
                </section>
              )}

              {activeTab === 'privacy' && (
                <section>
                  <SectionIntro eyebrow="Privacidade" title="Você decide quem pode ver." description="A configuração afeta seu perfil público e sua biblioteca compartilhada, sem apagar nenhum dado." />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={() => setFormData((current) => ({ ...current, isPublic: true }))} className={clsx('rounded-2xl border p-5 text-left transition-all', formData.isPublic ? 'border-emerald-400/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/5' : 'border-border-color bg-bg-tertiary/30 hover:border-border-color/80')}>
                      <div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"><Globe2 className="h-5 w-5" /></span>{formData.isPublic && <span className="rounded-full bg-emerald-500 px-2 py-1 text-[9px] font-black uppercase text-white">Ativo</span>}</div>
                      <h4 className="mt-4 font-black text-text-primary">Perfil público</h4><p className="mt-1 text-xs leading-relaxed text-text-secondary">Outras pessoas podem visitar seu perfil, biblioteca, favoritos e conquistas.</p>
                    </button>
                    <button type="button" onClick={() => setFormData((current) => ({ ...current, isPublic: false }))} className={clsx('rounded-2xl border p-5 text-left transition-all', !formData.isPublic ? 'border-amber-400/50 bg-amber-500/10 shadow-lg shadow-amber-500/5' : 'border-border-color bg-bg-tertiary/30 hover:border-border-color/80')}>
                      <div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><LockKeyhole className="h-5 w-5" /></span>{!formData.isPublic && <span className="rounded-full bg-amber-500 px-2 py-1 text-[9px] font-black uppercase text-black">Ativo</span>}</div>
                      <h4 className="mt-4 font-black text-text-primary">Perfil privado</h4><p className="mt-1 text-xs leading-relaxed text-text-secondary">Somente você acessa seus dados. Seguidores verão que o perfil está fechado.</p>
                    </button>
                  </div>
                </section>
              )}
            </main>
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-border-color bg-bg-tertiary/35 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:px-7 md:py-4">
            <p className="hidden text-xs text-text-secondary sm:block">As alterações só entram no ar depois de salvar.</p>
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={requestClose} className="min-h-11 rounded-xl border border-border-color px-4 py-2.5 text-sm font-bold text-text-secondary hover:bg-bg-primary/50 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-button-accent px-5 py-2.5 text-sm font-black text-text-on-primary shadow-lg shadow-button-accent/20 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary disabled:cursor-wait disabled:opacity-60">
                {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSubmitting ? 'Salvando...' : 'Salvar perfil'}
              </button>
            </div>
          </footer>
        </form>
      </div>

      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[170] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={() => setShowDiscardConfirm(false)}>
          <div ref={discardDialogRef} tabIndex={-1} role="alertdialog" aria-modal="true" aria-labelledby="discard-profile-title" aria-describedby="discard-profile-description" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border-color bg-bg-secondary p-5 shadow-2xl">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/10 text-amber-400"><AlertTriangle className="h-5 w-5" /></span>
            <h3 id="discard-profile-title" className="mt-4 text-lg font-black text-text-primary">Descartar alterações?</h3>
            <p id="discard-profile-description" className="mt-2 text-sm leading-relaxed text-text-secondary">Seu rascunho de perfil ainda não foi salvo.</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button ref={discardCancelRef} type="button" onClick={() => setShowDiscardConfirm(false)} className="min-h-11 rounded-xl border border-border-color px-4 text-sm font-bold text-text-secondary hover:bg-bg-tertiary hover:text-text-primary">Continuar editando</button>
              <button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-red-500 px-4 text-sm font-black text-white hover:bg-red-600">Descartar</button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
