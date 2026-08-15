
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Bell, ArrowLeft, ChevronDown, Loader2, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSearch } from '@/hooks/useSearch';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import { PortalCatMark } from '@/components/brand/PortalAnimesLogo';
import { useAccessibleDialog } from '@/hooks/useAccessibleDialog';

export function Header({ isHeroMode = false, showMobileBrand = false, hideOnMobile = false }) {
    const { query, setQuery, type, setType, results, isSearching, setResults } = useSearch();
    const navigate = useNavigate();
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const desktopSearchInputRef = useRef(null);
    const mobileSearchInputRef = useRef(null);
    const mobileSearchDialogRef = useRef(null);

    const { unreadCount } = useNotifications();
    const { user } = useAuth();
    const { profile } = useUserProfile();

    const displayName = profile?.displayName || user?.displayName || 'Visitante';

    const closeMobileSearch = () => {
        setShowMobileSearch(false);
        setSelectedIndex(-1);
    };

    useAccessibleDialog({
        isOpen: showMobileSearch,
        onClose: closeMobileSearch,
        dialogRef: mobileSearchDialogRef,
        initialFocusRef: mobileSearchInputRef,
    });

    const handleResultClick = (result) => {
        if (result.kind === 'character') {
            navigate(`/character/${result.id}`);
        } else if (result.kind === 'person') {
            navigate(`/person/${result.id}`);
        } else if (result.kind === 'studio') {
            navigate(`/studio/${result.id}`);
        } else {
            navigate(`/anime/${result.id}`);
        }
        setQuery('');
        setResults([]);
        setSelectedIndex(-1);
        setShowMobileSearch(false);
    };


    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown' && results.length > 0) {
            e.preventDefault();
            setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp' && results.length > 0) {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && results[selectedIndex]) {
                handleResultClick(results[selectedIndex]);
            } else if (query.trim().length > 0) {
                // Se não tiver nenhum selecionado, redireciona para a página de Busca Global
                setShowMobileSearch(false);
                setResults([]);
                e.currentTarget.blur();
                navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${type}`);
            }
        } else if (e.key === 'Escape') {
            e.stopPropagation();
            setResults([]);
            setSelectedIndex(-1);
            if (showMobileSearch) closeMobileSearch();
            else {
                setIsFocused(false);
                e.currentTarget.blur();
            }
        }
    };

    return (
        <header
            data-app-header
            data-variant={isHeroMode ? 'hero' : 'glass'}
            className={`app-header ${isHeroMode ? 'app-header--hero' : 'app-header--glass'} ${hideOnMobile ? 'hidden md:flex' : 'flex'} sticky top-0 z-40 min-h-[4.5rem] items-center justify-between px-4 py-3 md:min-h-20 md:px-8 md:py-4`}
        >

            <div className="flex min-w-0 items-center gap-3">
                {showMobileBrand ? (
                    <Link
                        to="/"
                        aria-label="PortalAnimes — Início"
                        className="flex min-w-0 items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
                    >
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-text-on-primary shadow-lg shadow-primary/25">
                            <PortalCatMark className="h-8 w-8" />
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-base font-black tracking-[-0.04em] text-text-primary">PortalAnimes</span>
                            <span className="block truncate text-xs text-text-secondary">Olá, {displayName}</span>
                        </span>
                    </Link>
                ) : null}

                <div className={`app-header__greeting ${showMobileBrand ? 'hidden md:block' : 'block'}`}>
                    <h1 className="text-xl font-bold text-text-primary">Olá, {displayName}</h1>
                    <p className="text-sm text-text-secondary hidden sm:block">Descubra novos animes.</p>
                </div>
            </div>

            {/* NOTIFICATIONS & SEARCH CONTAINER */}
            <div className="ml-auto flex items-center gap-2 md:gap-4">

                {/* Notification Bell */}
                <div className="relative">
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className="app-header__chrome relative grid h-11 w-11 place-items-center rounded-2xl text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-primary"
                        aria-label="Abrir notificações"
                    >
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-bg-primary animate-pulse"></span>
                        )}
                    </motion.button>
                    <NotificationDropdown isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
                </div>

                {/* SEARCH TOGGLE (MOBILE ONLY) */}
                <div className="flex items-center gap-2 md:hidden">
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setSelectedIndex(-1); setShowMobileSearch(true); }}
                        className="app-header__chrome grid h-11 w-11 place-items-center rounded-2xl text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-primary"
                        aria-label="Abrir busca"
                        aria-haspopup="dialog"
                        aria-expanded={showMobileSearch}
                    >
                        <Search className="w-6 h-6" />
                    </motion.button>
                </div>

                {/* DESKTOP SEARCH BAR */}
                <div className="hidden md:flex relative group items-center gap-2 w-auto transition-all duration-300">
                    
                    {/* Search Type Selector */}
                    <div className="relative">
                        <select 
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="appearance-none bg-bg-tertiary border-2 border-transparent hover:border-border-color rounded-xl py-2.5 pl-3 pr-8 text-sm font-medium text-text-primary focus:outline-none focus:border-primary cursor-pointer transition-all"
                        >
                            <option value="all">Todos</option>
                            <option value="anime">Animes</option>
                            <option value="character">Personagens</option>
                            <option value="person">Pessoas</option>
                            <option value="studio">Estúdios</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                    </div>

                    <div
                        className="search-border-beam relative w-96 rounded-2xl focus-within:w-[32rem] transition-all duration-300"
                    >
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-text-secondary group-focus-within:text-primary transition-colors duration-300" />
                        </div>
                        <input
                            type="text"
                            ref={desktopSearchInputRef}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelectedIndex(-1);
                            }}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                            onKeyDown={handleKeyDown}
                            placeholder="Pesquisar..."
                            className="block w-full pl-10 pr-10 py-2.5 border-2 border-transparent rounded-2xl bg-bg-tertiary text-text-primary focus:outline-none focus:border-primary focus:bg-bg-secondary focus:shadow-[0_0_20px_var(--shadow-color)] transition-all duration-300 shadow-sm hover:shadow-md placeholder-text-secondary/50"
                        />
                        {isSearching && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            </div>
                        )}
                        {/* Results Dropdown (Desktop) */}
                        {isFocused && results.length > 0 && (
                            <div className="absolute top-full mt-3 left-0 w-full bg-bg-secondary rounded-2xl shadow-xl z-50 max-h-[60vh] overflow-y-auto border border-border-color overflow-hidden animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
                                <div className="py-2">
                                    {results.map((item, index) => (
                                        <button
                                            key={`${item.kind}-${item.id}`}
                                            type="button"
                                            onClick={() => handleResultClick(item)}
                                            className={`
                                                relative flex w-full cursor-pointer gap-4 overflow-hidden border-l-4 p-3 text-left transition-all group/item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary
                                                ${index === selectedIndex ? 'bg-primary/5 border-primary pl-4' : 'border-transparent hover:bg-bg-tertiary/50 hover:pl-4'}
                                            `}
                                        >
                                            <div className="w-10 h-14 flex-shrink-0 rounded-md overflow-hidden bg-bg-tertiary">
                                                <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                                            </div>
                                            <div className="flex flex-col justify-center min-w-0">
                                                <h4 className="text-sm font-bold truncate text-text-primary group-hover/item:text-primary">
                                                    {item.title}
                                                </h4>
                                                <span className="text-xs text-text-secondary truncate">
                                                    {item.kind === 'character' ? 'Personagem' : item.kind === 'person' ? 'Pessoa' : item.kind === 'studio' ? 'Estúdio' : 'Anime'}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {/* View All Results Button (Desktop) */}
                                <div className="border-t border-border-color bg-bg-tertiary p-2">
                                    <button
                                        onClick={() => {
                                            setShowMobileSearch(false);
                                            setResults([]);
                                            navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${type}`);
                                        }}
                                        className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-primary hover:text-white hover:bg-primary rounded-xl transition-all group"
                                    >
                                        <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        Ver todos os resultados para "{query}"
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* No results but query typed (Desktop) */}
                        {isFocused && results.length === 0 && query.trim().length > 2 && !isSearching && (
                            <div className="absolute top-full mt-3 left-0 w-full bg-bg-secondary rounded-2xl shadow-xl z-50 p-4 border border-border-color">
                                <p className="text-center text-sm text-text-secondary mb-3">Nenhum resultado instantâneo encontrado.</p>
                                <button
                                    onClick={() => {
                                        setShowMobileSearch(false);
                                        setResults([]);
                                        navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${type}`);
                                    }}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-sm font-bold text-primary hover:text-white hover:bg-primary rounded-xl transition-all"
                                >
                                    <Search className="w-4 h-4" />
                                    Fazer busca completa por "{query}"
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            {/* --- MOBILE SEARCH OVERLAY (PORTAL) --- */}
            {createPortal(
                <AnimatePresence>
                    {showMobileSearch && (
                        <motion.div
                            ref={mobileSearchDialogRef}
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="fixed inset-0 z-[9999] flex flex-col items-start justify-start overflow-hidden bg-bg-primary"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="mobile-search-title"
                            tabIndex={-1}
                        >
                            <h2 id="mobile-search-title" className="sr-only">Busca rápida</h2>
                            {/* Search Input Header */}
                            <div className="relative z-10 flex w-full shrink-0 items-center gap-3 border-b border-border-color bg-bg-primary px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
                                <button
                                    type="button"
                                    onClick={closeMobileSearch}
                                    className="-ml-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    aria-label="Fechar busca"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                                
                                <div className="flex-1 relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary group-focus-within:text-primary transition-colors" />
                                    <input
                                        ref={mobileSearchInputRef}
                                        type="search"
                                        value={query}
                                        onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); }}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Buscar animes..."
                                        aria-label="Buscar animes, personagens, pessoas ou estúdios"
                                        aria-controls="mobile-search-results"
                                        aria-activedescendant={selectedIndex >= 0 ? `mobile-search-result-${selectedIndex}` : undefined}
                                        className="w-full bg-bg-tertiary border-2 border-transparent focus:border-primary/20 rounded-xl py-3 pl-10 pr-10 text-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:bg-bg-secondary transition-all"
                                    />
                                    {isSearching ? (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        </div>
                                    ) : query ? (
                                        <button 
                                            type="button"
                                            onClick={() => { setQuery(''); setSelectedIndex(-1); }}
                                            className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-bg-tertiary text-text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            aria-label="Limpar busca"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            {/* Mobile Filters */}
                            <div className="w-full flex items-center gap-2 px-4 py-2 bg-bg-primary border-b border-border-color overflow-x-auto no-scrollbar">
                                {[
                                    { value: 'all', label: 'Todos' },
                                    { value: 'anime', label: 'Animes' },
                                    { value: 'character', label: 'Personagens' },
                                    { value: 'person', label: 'Pessoas' },
                                    { value: 'studio', label: 'Estúdios' }
                                ].map((t) => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => { setType(t.value); setSelectedIndex(-1); }}
                                        aria-pressed={type === t.value}
                                        className={`min-h-11 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                            type === t.value 
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                            : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* Mobile Results List */}
                            <div id="mobile-search-results" className="custom-scrollbar w-full flex-1 overflow-y-auto bg-bg-primary px-4 py-4 pb-[max(5rem,env(safe-area-inset-bottom))]" aria-live="polite">
                                {results.length > 0 ? (
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                                            Resultados para "{query}"
                                        </h3>
                                        {results.map((item, index) => (
                                            <motion.button
                                                key={`${item.kind}-${item.id}`}
                                                id={`mobile-search-result-${index}`}
                                                type="button"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                                onClick={() => handleResultClick(item)}
                                                onFocus={() => setSelectedIndex(index)}
                                                aria-current={selectedIndex === index ? 'true' : undefined}
                                                className={`flex w-full items-start gap-4 rounded-2xl border p-3 text-left transition-all active:scale-[0.98] active:bg-bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selectedIndex === index ? 'border-primary bg-primary/10' : 'border-border-color bg-bg-secondary/50'}`}
                                            >
                                                <div className="w-16 h-24 rounded-lg overflow-hidden bg-bg-tertiary shrink-0 shadow-sm relative">
                                                    <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                                                </div>
                                                <div className="flex-1 min-w-0 py-1">
                                                    <h4 className="text-base font-bold text-text-primary leading-tight line-clamp-2 mb-1">
                                                        {item.title}
                                                    </h4>
                                                    
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider border ${
                                                            item.kind === 'character' 
                                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                                                                : item.kind === 'studio'
                                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                        }`}>
                                                            {item.kind === 'character' ? 'Personagem' : item.kind === 'person' ? 'Pessoa' : item.kind === 'studio' ? 'Estúdio' : 'Anime'}
                                                        </span>
                                                        {item.score && (
                                                            <span className="flex items-center gap-1 text-xs text-yellow-500 font-bold bg-yellow-500/5 px-1.5 py-0.5 rounded border border-yellow-500/20">
                                                                <Star aria-hidden="true" className="h-3 w-3 fill-current" />
                                                                {item.score}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                                                        {item.year && item.year !== 'N/A' && (
                                                            <span>{item.year}</span>
                                                        )}
                                                        {item.status && (
                                                            <span className="flex items-center gap-2 opacity-60">
                                                                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-current" />
                                                                {item.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.button>
                                        ))}
                                        
                                        {/* View All Results Button (Mobile) - When results exist */}
                                        <motion.button
                                            type="button"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            onClick={() => {
                                                closeMobileSearch();
                                                setResults([]);
                                                navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${type}`);
                                            }}
                                            className="w-full mt-4 py-4 flex items-center justify-center gap-2 text-base font-bold text-white bg-button-accent hover:bg-button-accent/90 rounded-2xl shadow-lg shadow-button-accent/20 transition-all active:scale-[0.98]"
                                        >
                                            <Search className="w-5 h-5" />
                                            Ver todos os resultados
                                        </motion.button>
                                        
                                        {/* Spacer for bottom nav/safe area */}
                                        <div className="h-20" />
                                    </div>
                                ) : query.length > 2 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-text-secondary pb-20 px-6 text-center">
                                        <div className="p-6 bg-bg-tertiary rounded-full mb-6">
                                            <Search className="w-12 h-12 text-primary opacity-50" />
                                        </div>
                                        <p className="font-medium text-lg text-text-primary mb-2">Nenhum resultado rápido</p>
                                        <p className="text-sm opacity-80 mb-8">Tente buscar no catálogo completo para filtros avançados.</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                closeMobileSearch();
                                                setResults([]);
                                                navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${type}`);
                                            }}
                                            className="w-full max-w-xs py-3.5 flex items-center justify-center gap-2 text-sm font-bold text-white bg-primary rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                                        >
                                            <Search className="w-4 h-4" />
                                            Fazer busca completa
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-start pt-20 h-full text-text-secondary opacity-40">
                                        <Search className="w-16 h-16 mb-4 opacity-20" />
                                        <p className="font-medium">Digite para buscar...</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </header>
    );
}
