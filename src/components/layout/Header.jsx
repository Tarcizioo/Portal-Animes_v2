
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Bell, ArrowLeft, ChevronDown, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '@/hooks/useSearch';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
    const { query, setQuery, type, setType, results, isSearching, setResults } = useSearch();
    const navigate = useNavigate();
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const searchInputRef = useRef(null);

    const { unreadCount } = useNotifications();
    const { user } = useAuth();
    const { profile } = useUserProfile();

    const displayName = profile?.displayName || user?.displayName || 'Visitante';

    // Focus input when mobile search opens
    useEffect(() => {
        if (showMobileSearch && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [showMobileSearch]);

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
                searchInputRef.current?.blur();
                navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${type}`);
            }
        } else if (e.key === 'Escape') {
            setResults([]);
            setSelectedIndex(-1);
            setShowMobileSearch(false);
        }
    };

    return (
        <header className="sticky top-0 z-40 bg-bg-primary px-4 md:px-8 py-4 flex items-center justify-between border-b border-border-color transition-colors duration-300">

            <div className="flex items-center gap-4 pl-12 md:pl-0">
                <div className="block">
                    <h1 className="text-xl font-bold text-text-primary">Olá, {displayName}!! 👋</h1>
                    <p className="text-sm text-text-secondary hidden sm:block">Descubra novos animes.</p>
                </div>
            </div>

            {/* NOTIFICATIONS & SEARCH CONTAINER */}
            <div className="flex items-center gap-4 ml-auto">

                {/* Notification Bell */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className="p-2 relative text-text-secondary hover:text-primary transition-colors rounded-full hover:bg-bg-tertiary"
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
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowMobileSearch(true)}
                        className="p-2 text-text-secondary hover:text-primary"
                        aria-label="Abrir busca"
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

                    <div className="relative w-96 focus-within:w-[32rem] transition-all duration-300">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-text-secondary group-focus-within:text-primary transition-colors duration-300" />
                        </div>
                        <input
                            type="text"
                            ref={searchInputRef}
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
                                        <div
                                            key={`${item.kind}-${item.id}`}
                                            onClick={() => handleResultClick(item)}
                                            className={`
                                                flex gap-4 p-3 cursor-pointer transition-all border-l-4 relative overflow-hidden group/item
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
                                        </div>
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
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="fixed inset-0 z-[9999] bg-bg-primary flex flex-col items-start justify-start overflow-hidden"
                        >
                            {/* Search Input Header */}
                            <div className="w-full flex items-center gap-3 p-4 border-b border-border-color bg-bg-primary shrink-0 relative z-10">
                                <button
                                    onClick={() => setShowMobileSearch(false)}
                                    className="p-2 -ml-2 text-text-secondary hover:text-primary rounded-full hover:bg-bg-tertiary transition-colors"
                                    aria-label="Fechar busca"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                                
                                <div className="flex-1 relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary group-focus-within:text-primary transition-colors" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Buscar animes..."
                                        autoFocus
                                        className="w-full bg-bg-tertiary border-2 border-transparent focus:border-primary/20 rounded-xl py-3 pl-10 pr-10 text-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:bg-bg-secondary transition-all"
                                    />
                                    {isSearching ? (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        </div>
                                    ) : query ? (
                                        <button 
                                            onClick={() => setQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary p-1 bg-bg-tertiary rounded-full"
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
                                        onClick={() => setType(t.value)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
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
                            <div className="w-full flex-1 overflow-y-auto px-4 py-4 pb-safe custom-scrollbar bg-bg-primary">
                                {results.length > 0 ? (
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                                            Resultados para "{query}"
                                        </h3>
                                        {results.map((item, index) => (
                                            <motion.div
                                                key={`${item.kind}-${item.id}`}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                                onClick={() => handleResultClick(item)}
                                                className="flex items-start gap-4 p-3 bg-bg-secondary/50 border border-border-color rounded-2xl active:scale-[0.98] active:bg-bg-tertiary transition-all"
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
                                                                ★ {item.score}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                                                        {item.year && item.year !== 'N/A' && (
                                                            <span>{item.year}</span>
                                                        )}
                                                        {item.status && (
                                                            <span className="opacity-60">• {item.status}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                        
                                        {/* View All Results Button (Mobile) - When results exist */}
                                        <motion.button
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            onClick={() => {
                                                setShowMobileSearch(false);
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
                                            onClick={() => {
                                                setShowMobileSearch(false);
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
