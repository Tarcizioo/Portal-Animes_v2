import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalClose } from '@/hooks/useModalClose';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { useAnimeLibrary } from '@/hooks/useAnimeLibrary';
import { useLibraryBackup } from '@/hooks/useLibraryBackup';
import { useNotificationPrefs } from '@/hooks/useNotificationPrefs';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAppPreferences } from '@/hooks/useAppPreferences';
import {
    Moon, Sun, Palette, Monitor, Trash2, AlertTriangle, X,
    Download, FileJson, FileSpreadsheet, FileUp,
    Loader2, CheckCircle2, AlertCircle, Settings, Bell, Eye, Heart, UserPlus,
    ChevronRight, LibraryBig, UserRoundCog, Gauge, Play, Accessibility,
    EyeOff, RotateCcw, LayoutGrid, BadgeCheck, Mail, ShieldCheck,
    ArrowLeft, HardDrive, Cloud,
} from 'lucide-react';

// ── Theme data ────────────────────────────────────────────────────────────────
const themes = [
    { id: 'light', name: 'Claro', icon: Sun, preview: ['#ffffff', '#f1f1f4', '#4f46e5'] },
    { id: 'sunshine', name: 'Sunshine', icon: Sun, preview: ['#fffcf0', '#ffecb3', '#d4960a'] },
    { id: 'matcha', name: 'Matcha', icon: Palette, preview: ['#f5fcf7', '#c5edcf', '#15803d'] },
    { id: 'rose', name: 'Rose', icon: Palette, preview: ['#fff5f8', '#ffd6e0', '#be185d'] },
    { id: 'dark', name: 'Escuro', icon: Moon, preview: ['#121212', '#2a2a2a', '#818cf8'] },
    { id: 'majorelle', name: 'Blue', icon: Palette, preview: ['#050a1e', '#151d45', '#5e4ae3'] },
    { id: 'blood', name: 'Blood', icon: Palette, preview: ['#0a0202', '#2b0909', '#ff0f39'] },
    { id: 'dracula', name: 'Dracula', icon: Palette, preview: ['#282a36', '#44475a', '#bd93f9'] },
];

const TABS = [
    { id: 'appearance', label: 'Aparência', description: 'Tema e identidade visual', icon: Palette },
    { id: 'experience', label: 'Experiência', description: 'Movimento, cards e navegação', icon: Gauge },
    { id: 'library', label: 'Biblioteca', description: 'Backup e portabilidade', icon: LibraryBig },
    { id: 'notifications', label: 'Notificações', description: 'Alertas e preferências', icon: Bell },
    { id: 'account', label: 'Minha conta', description: 'Segurança e dados', icon: UserRoundCog },
];

const getSafeInitialTab = (initialTab) => (
    TABS.some((tab) => tab.id === initialTab) ? initialTab : 'appearance'
);

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

function useDialogFocus(isOpen, dialogRef, initialFocusRef) {
    useEffect(() => {
        if (!isOpen || typeof document === 'undefined') return undefined;

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
    }, [dialogRef, initialFocusRef, isOpen]);
}

// ── Tab button ────────────────────────────────────────────────────────────────
function TabBtn({ tab, active, onClick }) {
    const Icon = tab.icon;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-current={active ? 'page' : undefined}
            className={`group flex min-w-max items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:min-w-0 md:w-full ${
                active
                    ? 'border-primary/25 bg-primary/10 text-text-primary shadow-sm shadow-primary/5'
                    : 'border-transparent text-text-secondary hover:border-border-color hover:bg-bg-tertiary/65 hover:text-text-primary'
            }`}
        >
            <span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl transition-colors ${active ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-bg-tertiary text-text-secondary group-hover:text-text-primary'}`}>
                <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-xs font-black sm:text-sm">{tab.label}</span>
                <span className="mt-0.5 hidden truncate text-[10px] font-medium text-text-secondary md:block">{tab.description}</span>
            </span>
            <ChevronRight className={`hidden h-4 w-4 transition-transform md:block ${active ? 'translate-x-0 text-primary' : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
        </button>
    );
}

// Appearance tab
function AppearanceTab({ theme, setTheme }) {
    const activeTheme = themes.find((item) => item.id === theme) || themes[0];

    return (
        <div className="space-y-7">
            <div className="relative overflow-hidden rounded-3xl border border-border-color bg-bg-primary/45 p-5 sm:p-6">
                <div className="pointer-events-none absolute -right-14 -top-20 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
                <div className="relative grid items-center gap-5 sm:grid-cols-[1fr_220px]">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                            <Palette className="h-3 w-3" /> Personalização
                        </span>
                        <h3 className="mt-3 text-xl font-black tracking-tight text-text-primary">Seu portal, seu clima.</h3>
                        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                            Troque a atmosfera da plataforma sem perder contraste, legibilidade ou a identidade do PortalAnimes.
                        </p>
                    </div>
                    <div
                        className="relative h-32 overflow-hidden rounded-2xl border border-white/10 p-3 shadow-2xl"
                        style={{ background: `linear-gradient(145deg, ${activeTheme.preview[0]}, ${activeTheme.preview[1]})` }}
                    >
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-white/30" />
                            <span className="h-2 w-2 rounded-full bg-white/20" />
                            <span className="h-2 w-2 rounded-full bg-white/15" />
                        </div>
                        <div className="mt-4 flex gap-2">
                            <div className="h-16 w-10 rounded-lg bg-black/20" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-3/4 rounded-full bg-black/20" />
                                <div className="h-2 w-full rounded-full bg-black/10" />
                                <div className="h-6 w-20 rounded-lg" style={{ backgroundColor: activeTheme.preview[2] }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-text-secondary">
                            <Monitor className="h-4 w-4" /> Temas disponíveis
                        </h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary/70"><HardDrive className="h-3.5 w-3.5" /> Aplicado e salvo neste dispositivo.</p>
                    </div>
                    <span className="rounded-full border border-border-color bg-bg-tertiary/70 px-3 py-1 text-[10px] font-bold text-text-secondary">{themes.length} opções</span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {themes.map((item) => {
                        const Icon = item.icon;
                        const isActive = theme === item.id;

                        return (
                            <button
                                type="button"
                                key={item.id}
                                onClick={() => setTheme(item.id)}
                                aria-pressed={isActive}
                                className={`group overflow-hidden rounded-2xl border p-0 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                    isActive
                                        ? 'border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/30'
                                        : 'border-border-color hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg'
                                }`}
                            >
                                <span
                                    className="relative block h-16 overflow-hidden p-2.5"
                                    style={{ background: `linear-gradient(135deg, ${item.preview[0]}, ${item.preview[1]})` }}
                                >
                                    <span className="absolute -right-3 -top-4 h-12 w-12 rounded-full opacity-45 blur-xl" style={{ backgroundColor: item.preview[2] }} />
                                    <span className="relative flex h-full gap-1.5 rounded-lg border border-black/10 bg-black/5 p-1.5">
                                        <span className="w-3 rounded bg-black/15" />
                                        <span className="flex-1 space-y-1.5 pt-1">
                                            <span className="block h-1.5 w-3/4 rounded bg-black/20" />
                                            <span className="block h-3 w-1/2 rounded" style={{ backgroundColor: item.preview[2] }} />
                                        </span>
                                    </span>
                                </span>
                                <span className="flex items-center gap-2 px-3 py-2.5">
                                    <span className={`grid h-7 w-7 place-items-center rounded-lg ${isActive ? 'bg-primary text-white' : 'bg-bg-tertiary text-text-secondary'}`}>
                                        {isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                                    </span>
                                    <span className={`text-xs font-black ${isActive ? 'text-primary' : 'text-text-primary'}`}>{item.name}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Experience tab
function ExperienceTab({ preferences, updatePreference, resetPreferences }) {
    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-bg-primary/70 to-cyan-400/10 p-5 sm:p-6">
                <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl" />
                <div className="relative max-w-xl">
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-bg-secondary/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                        <Gauge className="h-3.5 w-3.5" /> Controle fino
                    </span>
                    <h3 className="mt-3 text-xl font-black tracking-tight text-text-primary">Uma interface no seu ritmo.</h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                        Estas preferências são salvas neste dispositivo, funcionam imediatamente e podem ser alteradas a qualquer momento.
                    </p>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <PrefToggle
                    icon={Play}
                    label="Rotação automática do destaque"
                    description="Avança o hero da página inicial a cada oito segundos."
                    checked={preferences.autoPlayHero}
                    onChange={(value) => updatePreference('autoPlayHero', value)}
                />
                <PrefToggle
                    icon={Accessibility}
                    label="Reduzir movimentos"
                    description="Diminui transições e animações em toda a plataforma."
                    checked={preferences.reducedMotion}
                    onChange={(value) => updatePreference('reducedMotion', value)}
                />
                <PrefToggle
                    icon={BadgeCheck}
                    label="Mostrar notas nos cards"
                    description="Exibe ou oculta os badges de avaliação nos carrosséis."
                    checked={preferences.showScores}
                    onChange={(value) => updatePreference('showScores', value)}
                />
                <div className="rounded-xl border border-border-color bg-bg-primary/40 p-4 transition-colors hover:bg-bg-tertiary/40">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 rounded-lg bg-bg-tertiary p-2 text-text-secondary"><LayoutGrid className="h-4 w-4" /></span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-text-primary">Densidade dos carrosséis</p>
                            <p className="mt-0.5 text-xs text-text-secondary">Escolha quantos cards aparecem por linha.</p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {[
                                    { value: 'comfortable', label: 'Confortável' },
                                    { value: 'compact', label: 'Compacta' },
                                ].map((option) => (
                                    <button
                                        type="button"
                                        key={option.value}
                                        onClick={() => updatePreference('carouselDensity', option.value)}
                                        aria-pressed={preferences.carouselDensity === option.value}
                                        className={`min-h-11 rounded-lg border px-2.5 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${preferences.carouselDensity === option.value ? 'border-primary bg-primary/10 text-primary' : 'border-border-color bg-bg-secondary text-text-secondary hover:text-text-primary'}`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={resetPreferences}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-color bg-bg-tertiary/55 px-4 py-2.5 text-xs font-bold text-text-secondary transition-colors hover:border-primary/35 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <RotateCcw className="h-4 w-4" /> Restaurar preferências de experiência
            </button>
        </div>
    );
}
// Library/Backup tab
function LibraryTab({ library, isSignedIn }) {
    const { exportJSON, exportCSV, parseJSON, parseMAL, commitImport } = useLibraryBackup(library);

    const [preview, setPreview]       = useState(null);
    const [overwrite, setOverwrite]   = useState(true);
    const [importing, setImporting]   = useState(false);
    const [progress, setProgress]     = useState(0);
    const [result, setResult]         = useState(null);
    const [parseError, setParseError] = useState(null);
    const [dragging, setDragging]     = useState(false);
    const fileRef = useRef(null);

    const reset = () => {
        setPreview(null); setResult(null);
        setParseError(null); setProgress(0);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleFile = async (file) => {
        if (!file) return;
        reset();
        try {
            const parsed = file.name.endsWith('.xml') ? await parseMAL(file) : await parseJSON(file);
            setPreview(parsed);
        } catch (err) { setParseError(err.message); }
    };

    const handleImport = async () => {
        if (!preview?.items?.length) return;
        setImporting(true); setProgress(0);
        try {
            await commitImport(preview.items, overwrite,
                (done, total) => setProgress(Math.round((done / total) * 100)));
            setResult({ success: true, message: `${preview.count} animes importados!` });
            setPreview(null);
        } catch (err) {
            setResult({ success: false, message: err.message });
        } finally { setImporting(false); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-3 rounded-2xl border border-border-color bg-bg-primary/45 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    {isSignedIn ? <Cloud className="h-5 w-5" /> : <HardDrive className="h-5 w-5" />}
                </span>
                <div>
                    <p className="text-sm font-black text-text-primary">{isSignedIn ? 'Biblioteca sincronizada' : 'Biblioteca neste dispositivo'}</p>
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                        {isSignedIn
                            ? 'Sua coleção fica vinculada à conta. Exportações e arquivos escolhidos permanecem somente no seu dispositivo.'
                            : 'Entre na sua conta para sincronizar. Exportações e importações são processadas localmente.'}
                    </p>
                </div>
            </div>

            {/* Export */}
            <div>
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4" /> Exportar
                </h3>
                <p className="text-xs text-text-secondary mb-3">
                    {library.length} animes na sua biblioteca
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={exportJSON}
                        className="flex items-center justify-center gap-2 p-4 rounded-xl border border-border-color bg-bg-primary/40 hover:border-button-accent/40 hover:bg-bg-tertiary transition-all text-sm font-semibold text-text-secondary hover:text-text-primary focus:outline-none"
                    >
                        <FileJson className="w-5 h-5 text-button-accent" />
                        <div className="text-left">
                            <div>Exportar JSON</div>
                            <div className="text-xs font-normal opacity-60">Fidelidade total</div>
                        </div>
                    </button>
                    <button
                        onClick={exportCSV}
                        className="flex items-center justify-center gap-2 p-4 rounded-xl border border-border-color bg-bg-primary/40 hover:border-green-500/40 hover:bg-green-500/5 transition-all text-sm font-semibold text-text-secondary hover:text-text-primary focus:outline-none"
                    >
                        <FileSpreadsheet className="w-5 h-5 text-green-400" />
                        <div className="text-left">
                            <div>Exportar CSV</div>
                            <div className="text-xs font-normal opacity-60">Excel / Sheets</div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="h-px bg-border-color" />

            {/* Import */}
            <div>
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileUp className="w-4 h-4" /> Importar
                </h3>

                {result && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold mb-3 ${result.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {result.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {result.message}
                        <button type="button" onClick={reset} className="ml-auto min-h-11 rounded-lg px-2 text-xs underline opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">Nova importação</button>
                    </div>
                )}
                {parseError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20 mb-3">
                        <AlertCircle className="w-4 h-4" />{parseError}
                    </div>
                )}

                {!preview && !result && !importing && (
                    <div
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 transition-all ${dragging ? 'scale-[1.01] border-button-accent bg-button-accent/10' : 'border-border-color hover:border-button-accent/50 hover:bg-bg-tertiary/40'}`}
                    >
                        <div className="p-3 bg-bg-tertiary rounded-2xl">
                            <FileUp className="w-7 h-7 text-button-accent" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-text-primary text-sm">Escolha seu arquivo de biblioteca</p>
                            <p className="text-xs text-text-secondary mt-1">.json (nosso formato) · .xml (MyAnimeList)</p>
                        </div>
                        <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-button-accent px-5 text-sm font-black text-text-on-primary shadow-lg shadow-button-accent/20 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary sm:w-auto">
                            <FileUp className="h-4 w-4" /> Selecionar arquivo
                        </button>
                        <input ref={fileRef} type="file" accept=".json,.xml" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                    </div>
                )}

                {preview && !importing && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-400 font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            {preview.count} animes encontrados no arquivo
                        </div>
                        <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 rounded-xl bg-bg-primary/40 border border-border-color p-2 space-y-1">
                            {preview.items.slice(0, 8).map((a, i) => (
                                <div key={i} className="flex justify-between text-xs px-2 py-0.5">
                                    <span className="text-text-primary truncate max-w-[65%]">{a.title}</span>
                                    <span className="text-text-secondary capitalize">{a.status?.replace('_', ' ')}</span>
                                </div>
                            ))}
                            {preview.count > 8 && <p className="text-center text-xs text-text-secondary py-1">+ {preview.count - 8} mais...</p>}
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
                            <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} className="accent-button-accent" />
                            Substituir animes já existentes
                        </label>
                        <div className="flex gap-2">
                            <button type="button" onClick={reset} className="min-h-11 flex-1 rounded-xl border border-border-color py-2 text-sm text-text-secondary hover:bg-bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">Cancelar</button>
                            <button type="button" onClick={handleImport} className="min-h-11 flex-1 rounded-xl bg-button-accent py-2 text-sm font-bold text-text-on-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">
                                Importar {preview.count} animes
                            </button>
                        </div>
                    </div>
                )}

                {importing && (
                    <div className="space-y-3 py-4">
                        <div className="flex items-center justify-center gap-3 text-text-secondary">
                            <Loader2 className="w-5 h-5 animate-spin text-button-accent" />
                            <span className="text-sm font-medium">Importando... {progress}%</span>
                        </div>
                        <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                            <div className="h-full bg-button-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Notifications tab ────────────────────────────────────────────────────────
function PrefToggle({ icon: Icon, label, description, checked, onChange, disabled }) {
    return (
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border-color bg-bg-primary/40 hover:bg-bg-tertiary/40 transition-colors">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-lg bg-bg-tertiary text-text-secondary flex-shrink-0">
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-text-primary">{label}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{description}</p>
                </div>
            </div>
            <button
                type="button"
                onClick={() => !disabled && onChange(!checked)}
                disabled={disabled}
                aria-checked={checked}
                aria-label={`${checked ? 'Desativar' : 'Ativar'} ${label}`}
                role="switch"
                className="relative -my-2 grid h-11 w-12 flex-shrink-0 place-items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
                <span aria-hidden="true" className={`relative block h-6 w-11 rounded-full transition-colors duration-200 ${checked ? 'bg-button-accent' : 'border border-border-color bg-bg-tertiary'}`}>
                    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
                </span>
            </button>
        </div>
    );
}

function NotificationsTab({ user }) {
    const { prefs, loading, updatePref, updatePrefs } = useNotificationPrefs();
    const { preferences, updatePreference } = useAppPreferences();
    const enabledCount = Object.values(prefs).filter(Boolean).length;
    const allEnabled = enabledCount === Object.keys(prefs).length;

    if (!user) {
        return (
            <div className="rounded-xl border border-border-color bg-bg-tertiary p-4 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-text-secondary opacity-50" />
                <p className="text-sm text-text-secondary">Faça login para configurar suas notificações.</p>
            </div>
        );
    }

    const toggleAll = (enabled) => updatePrefs({
        profile_view: enabled,
        comment_like: enabled,
        new_follower: enabled,
    });

    return (
        <div className="space-y-5">
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-bg-primary/70 to-emerald-400/10 p-5">
                <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-primary/20 blur-3xl" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Central de alertas</span>
                        <h3 className="mt-1 text-lg font-black text-text-primary">{enabledCount} de {Object.keys(prefs).length} categorias ativas</h3>
                        <p className="mt-1 text-xs text-text-secondary">As alterações são sincronizadas no seu perfil.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => toggleAll(!allEnabled)}
                        disabled={loading}
                        className="min-h-11 rounded-xl border border-primary/25 bg-bg-secondary/75 px-4 py-2.5 text-xs font-black text-primary transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                    >
                        {allEnabled ? 'Pausar todos' : 'Ativar todos'}
                    </button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <PrefToggle
                    icon={Eye}
                    label="Visitas ao perfil"
                    description="Quando alguém abrir o seu perfil público."
                    checked={prefs.profile_view}
                    onChange={(value) => updatePref('profile_view', value)}
                    disabled={loading}
                />
                <PrefToggle
                    icon={Heart}
                    label="Likes em comentários"
                    description="Quando alguém curtir um comentário seu."
                    checked={prefs.comment_like}
                    onChange={(value) => updatePref('comment_like', value)}
                    disabled={loading}
                />
                <PrefToggle
                    icon={UserPlus}
                    label="Novos seguidores"
                    description="Quando uma pessoa começar a seguir você."
                    checked={prefs.new_follower}
                    onChange={(value) => updatePref('new_follower', value)}
                    disabled={loading}
                />
                <PrefToggle
                    icon={EyeOff}
                    label="Ocultar notificações lidas"
                    description="Mantém o menu focado apenas no que ainda falta ver."
                    checked={preferences.hideReadNotifications}
                    onChange={(value) => updatePreference('hideReadNotifications', value)}
                />
            </div>
        </div>
    );
}
// ── Account tab ───────────────────────────────────────────────────────────────
function AccountTab({ user, profile, deleteAccount, onClose }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const usesPassword = user?.providerData?.some((provider) => provider.providerId === 'password') || false;

    const handleDelete = async () => {
        if (confirmText !== 'DELETAR' || (usesPassword && !currentPassword)) return;
        setIsDeleting(true);
        setDeleteError('');
        try {
            await deleteAccount(currentPassword);
            onClose();
        } catch (error) {
            const invalidPassword = ['auth/invalid-credential', 'auth/wrong-password'].includes(error?.code);
            setDeleteError(invalidPassword
                ? 'A senha informada está incorreta.'
                : 'Não foi possível excluir a conta. Confirme sua identidade e tente novamente.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!user) return (
        <div className="rounded-xl border border-border-color bg-bg-tertiary p-4 text-center">
            <p className="text-sm text-text-secondary">Faça login para ver as opções da conta.</p>
        </div>
    );

    const displayName = profile?.displayName || user.displayName || 'Usuário';
    const sitePhoto = profile?.photoURL || null;
    const providerIds = user.providerData?.map((provider) => provider.providerId) || [];
    const providerName = [
        providerIds.includes('google.com') ? 'Google' : null,
        providerIds.includes('password') ? 'E-mail' : null,
    ].filter(Boolean).join(' + ') || 'Não informado';
    const createdAt = user.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('pt-BR')
        : 'Não informado';

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-bg-primary/75 to-cyan-400/10 p-5 sm:p-6">
                <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-cyan-400/15 blur-3xl" />
                <div className="relative flex items-center gap-4">
                    <div className="relative grid h-16 w-16 flex-shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-primary to-cyan-500 text-xl font-black text-white shadow-xl shadow-primary/15">
                        <span>{displayName[0].toLocaleUpperCase('pt-BR')}</span>
                        {sitePhoto && <img src={sitePhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary"><ShieldCheck className="h-3.5 w-3.5" /> Conta conectada</span>
                        <h3 className="mt-1 truncate text-xl font-black text-text-primary">{displayName}</h3>
                        <p className="mt-1 truncate text-xs text-text-secondary">A foto exibida aqui vem do seu perfil no PortalAnimes.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border-color bg-bg-primary/40 p-4">
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-text-secondary"><Mail className="h-3.5 w-3.5" /> E-mail</span>
                    <p className="mt-2 truncate text-sm font-bold text-text-primary">{user.email || 'Não informado'}</p>
                </div>
                <div className="rounded-2xl border border-border-color bg-bg-primary/40 p-4">
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-text-secondary"><BadgeCheck className="h-3.5 w-3.5" /> Entrada</span>
                    <p className="mt-2 text-sm font-bold text-text-primary">{providerName}</p>
                </div>
                <div className="rounded-2xl border border-border-color bg-bg-primary/40 p-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Conta criada em</span>
                    <p className="mt-2 text-sm font-bold text-text-primary">{createdAt}</p>
                </div>
                <div className="rounded-2xl border border-border-color bg-bg-primary/40 p-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Sincronização</span>
                    <p className="mt-2 text-sm font-bold text-emerald-400">Firebase ativo</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/5">
                <div className="p-4">
                    <h4 className="mb-2 flex items-center gap-2 font-bold text-red-500">
                        <AlertTriangle className="h-5 w-5" /> Zona de perigo
                    </h4>
                    <p className="mb-4 text-sm text-text-secondary">
                        A exclusão é permanente e remove os dados vinculados a esta conta.
                    </p>
                    {!showDeleteConfirm ? (
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex min-h-11 items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                            <Trash2 className="h-4 w-4" /> Excluir minha conta
                        </button>
                    ) : (
                        <div className="space-y-3 rounded-xl bg-bg-tertiary p-4">
                            <label className="block text-sm text-text-secondary" htmlFor="delete-account-confirmation">
                                Digite <span className="font-bold text-text-primary">DELETAR</span> para confirmar:
                            </label>
                            <input
                                id="delete-account-confirmation"
                                type="text"
                                value={confirmText}
                                onChange={(event) => setConfirmText(event.target.value)}
                                className="min-h-11 w-full rounded-lg border border-red-500/30 bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                                placeholder="DELETAR"
                            />
                            {usesPassword ? (
                                <div>
                                    <label className="mb-1.5 block text-sm text-text-secondary" htmlFor="delete-account-password">
                                        Confirme sua senha atual:
                                    </label>
                                    <input
                                        id="delete-account-password"
                                        type="password"
                                        autoComplete="current-password"
                                        value={currentPassword}
                                        onChange={(event) => setCurrentPassword(event.target.value)}
                                        disabled={isDeleting}
                                        className="min-h-11 w-full rounded-lg border border-red-500/30 bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                                        placeholder="Sua senha"
                                    />
                                </div>
                            ) : (
                                <p className="text-xs leading-relaxed text-text-secondary">
                                    O Google abrirá uma janela para confirmar sua identidade antes da exclusão.
                                </p>
                            )}
                            {deleteError && <p role="alert" className="text-xs font-semibold text-red-400">{deleteError}</p>}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={confirmText !== 'DELETAR' || (usesPassword && !currentPassword) || isDeleting}
                                    className="min-h-11 flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isDeleting ? 'Apagando...' : 'Confirmar exclusão'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setConfirmText('');
                                        setCurrentPassword('');
                                        setDeleteError('');
                                    }}
                                    className="min-h-11 rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
// ── Main Modal ────────────────────────────────────────────────────────────────
function SettingsModalContent({ isOpen, onClose, initialTab }) {
    useModalClose(isOpen, onClose);
    const { theme, setTheme } = useTheme();
    const { deleteAccount, user } = useAuth();
    const { profile } = useUserProfile();
    const { preferences, updatePreference, resetPreferences } = useAppPreferences();
    const { library } = useAnimeLibrary();
    const [activeTab, setActiveTab] = useState(initialTab);
    const dialogRef = useRef(null);
    const backButtonRef = useRef(null);
    const activeSection = TABS.find((tab) => tab.id === activeTab) || TABS[0];
    const ActiveIcon = activeSection.icon;
    const profileName = profile?.displayName || user?.displayName || 'Visitante';
    const profilePhoto = profile?.photoURL || null;
    const isLocalSection = activeTab === 'appearance' || activeTab === 'experience';
    const scopeLabel = isLocalSection
        ? 'Neste dispositivo'
        : user ? 'Sincronizado com sua conta' : 'Disponível após entrar';
    const ScopeIcon = isLocalSection ? HardDrive : Cloud;

    useDialogFocus(isOpen, dialogRef, backButtonRef);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[150] flex items-end justify-center bg-black/80 backdrop-blur-md md:items-center md:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <div className="pointer-events-none absolute left-[12%] top-[8%] h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
                    <div className="pointer-events-none absolute bottom-[5%] right-[10%] h-60 w-60 rounded-full bg-cyan-400/5 blur-[90px]" />

                    <motion.section
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Configurações do PortalAnimes"
                        tabIndex={-1}
                        className="relative flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden border-0 bg-bg-secondary shadow-[0_35px_120px_rgba(0,0,0,0.7)] md:h-[94dvh] md:max-h-[820px] md:flex-row md:rounded-[2rem] md:border md:border-border-color"
                        initial={{ opacity: 0, y: 34, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <aside className="flex flex-shrink-0 flex-col border-b border-border-color bg-bg-primary/55 md:w-[280px] md:border-b-0 md:border-r">
                            <div className="flex items-center gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-5 md:pb-5 md:pt-6">
                                <button
                                    ref={backButtonRef}
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Voltar e fechar configurações"
                                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border-color bg-bg-tertiary text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                                        <Settings className="h-4.5 w-4.5" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-black tracking-tight text-text-primary sm:text-base">Configurações</h2>
                                        <p className="hidden text-[10px] font-semibold text-text-secondary md:block">Central da sua experiência</p>
                                    </div>
                                </div>
                                <span className="shrink-0 text-[10px] font-bold text-text-secondary md:hidden">{TABS.findIndex((tab) => tab.id === activeTab) + 1} de {TABS.length}</span>
                            </div>

                            <nav className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-x-hidden md:px-4 md:pb-4" aria-label="Seções de configurações">
                                <p className="mb-1 hidden px-3 text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary/65 md:block">Preferências</p>
                                {TABS.map((tab) => (
                                    <TabBtn
                                        key={tab.id}
                                        tab={tab}
                                        active={activeTab === tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                    />
                                ))}
                            </nav>

                            <div className="m-4 mt-auto hidden items-center gap-3 rounded-2xl border border-border-color bg-bg-tertiary/55 p-3 md:flex">
                                <div className="relative grid h-10 w-10 flex-shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/35 to-cyan-400/15 text-xs font-black text-text-primary">
                                    <span>{profileName[0].toLocaleUpperCase('pt-BR')}</span>
                                    {profilePhoto && (
                                        <img
                                            src={profilePhoto}
                                            alt=""
                                            referrerPolicy="no-referrer"
                                            onError={(event) => { event.currentTarget.style.display = 'none'; }}
                                            className="absolute inset-0 h-full w-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-black text-text-primary">{profileName}</p>
                                    <p className="mt-0.5 truncate text-[10px] font-semibold text-text-secondary">Tema e experiência neste dispositivo</p>
                                </div>
                            </div>
                        </aside>

                        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
                            <header className="hidden flex-shrink-0 items-start justify-between gap-5 border-b border-border-color px-7 py-6 md:flex lg:px-10">
                                <div className="flex items-start gap-4">
                                    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                                        <ActiveIcon className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight text-text-primary">{activeSection.label}</h3>
                                        <p className="mt-1 text-xs font-medium text-text-secondary">{activeSection.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary/60">Esc</span>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="Fechar configurações"
                                        className="grid h-11 w-11 place-items-center rounded-full border border-border-color bg-bg-tertiary/70 p-0 text-text-secondary transition-all hover:rotate-90 hover:border-primary/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </header>

                            <div className="border-b border-border-color px-5 py-3 md:hidden">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="flex min-w-0 items-center gap-2 text-sm font-black text-text-primary">
                                        <ActiveIcon className="h-4 w-4 shrink-0 text-primary" /> <span className="truncate">{activeSection.label}</span>
                                    </p>
                                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border-color bg-bg-tertiary/70 px-2.5 py-1 text-[9px] font-black text-text-secondary">
                                        <ScopeIcon className="h-3 w-3" /> {scopeLabel}
                                    </span>
                                </div>
                            </div>

                            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 [scroll-padding-bottom:calc(5rem+env(safe-area-inset-bottom))] sm:px-7 sm:py-7 lg:px-10">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        className="mx-auto w-full max-w-3xl pb-8"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.18 }}
                                    >
                                        {activeTab === 'appearance' && <AppearanceTab theme={theme} setTheme={setTheme} />}
                                        {activeTab === 'experience' && <ExperienceTab preferences={preferences} updatePreference={updatePreference} resetPreferences={resetPreferences} />}
                                        {activeTab === 'library' && <LibraryTab library={library} isSignedIn={Boolean(user)} />}
                                        {activeTab === 'notifications' && <NotificationsTab user={user} />}
                                        {activeTab === 'account' && <AccountTab user={user} profile={profile} deleteAccount={deleteAccount} onClose={onClose} />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </main>
                    </motion.section>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}

export function SettingsModal({ isOpen, onClose, initialTab = 'appearance' }) {
    const safeInitialTab = getSafeInitialTab(initialTab);

    return (
        <SettingsModalContent
            key={`${isOpen ? 'open' : 'closed'}:${safeInitialTab}`}
            isOpen={isOpen}
            onClose={onClose}
            initialTab={safeInitialTab}
        />
    );
}
