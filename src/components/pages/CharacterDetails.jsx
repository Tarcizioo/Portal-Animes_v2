import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCharacterInfo } from '@/hooks/useCharacterInfo';
import { useCharacterLibrary } from '@/hooks/useCharacterLibrary';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Heart, Mic2, Film, User, Image as ImageIcon, X, ChevronRight, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/context/ToastContext';
import { AnimeListItem } from '@/components/ui/AnimeListItem';
import { ImageModal } from '@/components/ui/ImageModal';
import { motion, AnimatePresence } from 'framer-motion';
import { BackButton } from '@/components/ui/BackButton';

const VOICE_LANGUAGE_LABELS = {
    Portuguese: 'Português',
    Spanish: 'Espanhol',
    English: 'Inglês',
    Japanese: 'Japonês',
    Korean: 'Coreano',
    French: 'Francês',
    German: 'Alemão',
    Italian: 'Italiano',
};

export function CharacterDetails() {
    const { id } = useParams();
    const { character, animeography, voiceActors, pictures, loading } = useCharacterInfo(id);
    const { isCharacterFavorite, toggleCharacterFavorite } = useCharacterLibrary();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isAboutExpanded, setIsAboutExpanded] = useState(false);
    const [favLoading, setFavLoading] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    
    // UI State
    const [activeTab, setActiveTab] = useState('anime');
    const [voiceLanguage, setVoiceLanguage] = useState('all');
    const [selectedImage, setSelectedImage] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    const isFavorite = character ? isCharacterFavorite(character.id) : false;

    const handleToggleFavorite = async () => {
        if (!user) {
            toast.error("Faça login para favoritar!");
            return;
        }

        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 500);

        setFavLoading(true);
        try {
            await toggleCharacterFavorite(character);
            if (!isFavorite) {
                toast.success(`${character.name} adicionado aos favoritos!`, "Favorito Adicionado");
            } else {
                toast.info(`${character.name} removido dos favoritos.`, "Favorito Removido");
            }
        } catch (err) {
            toast.error(err.message, "Erro ao Favoritar");
        } finally {
            setFavLoading(false);
        }
    };

    usePageTitle(character?.name || 'Detalhes do Personagem');

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num > 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    const voiceLanguages = Array.from(new Set(voiceActors.map((voice) => voice.language).filter(Boolean)));
    const filteredVoiceActors = voiceLanguage === 'all'
        ? voiceActors
        : voiceActors.filter((voice) => voice.language === voiceLanguage);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (!character) return (
        <div className="flex bg-bg-primary text-text-primary items-center justify-center h-screen">
            <p>Personagem não encontrado.</p>
        </div>
    );

    return (
        <>
            <ScrollToTop />
            <div className="min-h-screen bg-bg-primary text-text-primary font-sans pb-20 relative overflow-hidden">
                <div className={`relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-12 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="mb-6">
                        <BackButton />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* --- LEFT COLUMN (Sidebar) --- */}
                        <aside className="lg:col-span-3 lg:sticky lg:top-24 h-fit space-y-6">
                            {/* Character Portrait (Shrinked & Premium) */}
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-bg-secondary aspect-[2/3] group max-w-[280px] mx-auto lg:mx-0">
                                <img
                                    src={character.image}
                                    alt={character.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                                {character.favorites && (
                                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl text-xs font-bold text-white border border-white/10 shadow-lg flex items-center gap-1.5">
                                        <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-300'}`} />
                                        {formatNumber(character.favorites)}
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats / Info */}
                            {character.nicknames?.length > 0 && (
                                <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-5 border border-white/5 space-y-3">
                                    <h3 className="font-bold border-b border-white/5 pb-2 flex items-center gap-2 text-sm text-text-secondary uppercase tracking-wider">
                                        <Info className="w-4 h-4" /> Apelidos
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {character.nicknames.slice(0, 5).map((nick, i) => (
                                            <span key={i} className="text-xs font-medium px-2 py-1 bg-white/5 rounded-md border border-white/5 text-text-primary">
                                                {nick}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </aside>

                        {/* --- RIGHT COLUMN (Main Content) --- */}
                        <div className="lg:col-span-9 space-y-10">

                            {/* Header Info */}
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <h1 className="text-4xl md:text-6xl font-black text-text-primary tracking-tight drop-shadow-2xl leading-none">
                                            {character.name}
                                        </h1>
                                        {character.name_kanji && (
                                            <h2 className="text-2xl text-primary font-bold opacity-80">{character.name_kanji}</h2>
                                        )}
                                    </div>

                                    {/* Favorite Action - Moved Here */}
                                    <button
                                        onClick={() => handleToggleFavorite()}
                                        disabled={favLoading}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 shadow-xl active:scale-95 group border ${isFavorite
                                            ? "bg-red-500 text-white border-red-400"
                                            : "bg-bg-secondary text-text-primary hover:bg-bg-tertiary border-border-color"
                                            }`}
                                    >
                                        <Heart className={`w-5 h-5 transition-transform duration-300 ${isFavorite ? "fill-white text-white" : "text-text-secondary"} ${isAnimating ? "scale-150" : "group-hover:scale-110"}`} />
                                        <span>{isFavorite ? "Favoritado" : "Favoritar"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* About Section - Simplified to Text Only */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
                                    <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                                        <User className="w-5 h-5 text-primary" /> Sobre
                                    </h3>
                                </div>

                                <div className="prose prose-invert max-w-none">
                                    <p className="text-text-secondary leading-relaxed whitespace-pre-line text-base md:text-lg font-light">
                                        {character.about
                                            ? (isAboutExpanded ? character.about.replace(/\\n/g, '\n') : character.about.replace(/\\n/g, '\n').slice(0, 600) + (character.about.length > 600 ? '...' : ''))
                                            : "Sem descrição disponível para este personagem."
                                        }
                                    </p>
                                    {character.about && character.about.length > 600 && (
                                        <button
                                            onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                                            className="mt-2 text-primary font-bold hover:text-white transition-colors text-sm flex items-center gap-1 group"
                                        >
                                            {isAboutExpanded ? 'Ler Menos' : 'Ler Mais'} <ChevronRight className={`w-4 h-4 transition-transform ${isAboutExpanded ? 'rotate-90' : ''}`} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* TABS Navigation & Content */}
                            <div className="space-y-6 pt-6 border-t border-border-color">
                                {/* Tab Navigation (Modern Pills) */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        onClick={() => setActiveTab('anime')}
                                        className={clsx(
                                            "px-5 py-2.5 rounded-full text-sm sm:text-base font-bold flex items-center gap-2 transition-all duration-300 shadow-sm border",
                                            activeTab === 'anime' 
                                                ? "bg-primary text-white border-primary shadow-primary/20 scale-105" 
                                                : "bg-bg-secondary text-text-secondary border-border-color hover:bg-bg-tertiary hover:text-text-primary"
                                        )}
                                    >
                                        <Film className="w-4 h-4 sm:w-5 sm:h-5" /> Filmografia
                                        <span className={clsx(
                                            "text-xs px-2 py-0.5 rounded-full",
                                            activeTab === 'anime' ? "bg-white/20 text-white" : "bg-bg-tertiary text-text-secondary"
                                        )}>
                                            {animeography.length}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('voice_actors')}
                                        className={clsx(
                                            "px-5 py-2.5 rounded-full text-sm sm:text-base font-bold flex items-center gap-2 transition-all duration-300 shadow-sm border",
                                            activeTab === 'voice_actors' 
                                                ? "bg-primary text-white border-primary shadow-primary/20 scale-105" 
                                                : "bg-bg-secondary text-text-secondary border-border-color hover:bg-bg-tertiary hover:text-text-primary"
                                        )}
                                    >
                                        <Mic2 className="w-4 h-4 sm:w-5 sm:h-5" /> Dubladores
                                        <span className={clsx(
                                            "text-xs px-2 py-0.5 rounded-full",
                                            activeTab === 'voice_actors' ? "bg-white/20 text-white" : "bg-bg-tertiary text-text-secondary"
                                        )}>
                                            {voiceActors.length}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('gallery')}
                                        className={clsx(
                                            "px-5 py-2.5 rounded-full text-sm sm:text-base font-bold flex items-center gap-2 transition-all duration-300 shadow-sm border",
                                            activeTab === 'gallery' 
                                                ? "bg-primary text-white border-primary shadow-primary/20 scale-105" 
                                                : "bg-bg-secondary text-text-secondary border-border-color hover:bg-bg-tertiary hover:text-text-primary"
                                        )}
                                    >
                                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Galeria
                                        <span className={clsx(
                                            "text-xs px-2 py-0.5 rounded-full",
                                            activeTab === 'gallery' ? "bg-white/20 text-white" : "bg-bg-tertiary text-text-secondary"
                                        )}>
                                            {pictures.length}
                                        </span>
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div className="min-h-[400px]">
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'anime' ? (
                                            <motion.div
                                                key="anime"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {animeography.length === 0 ? (
                                                    <p className="text-text-secondary text-center py-20 italic">Ops! Nenhuma participação encontrada.</p>
                                                ) : (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                                                        {animeography.map((entry, idx) => (
                                                            <Link
                                                                to={`/anime/${entry.anime.mal_id}`}
                                                                key={`${entry.anime.mal_id}-${idx}`}
                                                                className="block group relative"
                                                            >
                                                                <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/5 group-hover:border-primary/50 transition-all">
                                                                    <img
                                                                        src={entry.anime.images?.jpg?.image_url}
                                                                        alt={entry.anime.title}
                                                                        loading="lazy"
                                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                    />
                                                                    <div className="absolute top-1.5 right-1.5">
                                                                        <span className={clsx(
                                                                            "text-[10px] font-black px-2 py-1 rounded-md shadow-sm backdrop-blur-md uppercase tracking-wide",
                                                                            entry.role === 'Main'
                                                                                ? "bg-primary text-white"
                                                                                : "bg-black/60 text-gray-200"
                                                                        )}>
                                                                            {entry.role === 'Main' ? 'MAIN' : 'SUPP'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-2 mt-3 leading-tight">
                                                                    {entry.anime.title}
                                                                </h4>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ) : activeTab === 'voice_actors' ? (
                                            <motion.div
                                                key="voice_actors"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {voiceActors.length === 0 ? (
                                                    <p className="text-text-secondary text-center py-20 italic">Nenhum dublador registrado.</p>
                                                ) : (
                                                    <>
                                                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-color bg-bg-secondary p-3">
                                                            <div>
                                                                <p className="text-sm font-bold text-text-primary">Idiomas de dublagem</p>
                                                                <p className="text-xs text-text-secondary">Português e espanhol aparecem quando essas informações estão disponíveis.</p>
                                                            </div>
                                                            <select
                                                                value={voiceLanguage}
                                                                onChange={(event) => setVoiceLanguage(event.target.value)}
                                                                className="rounded-xl border border-border-color bg-bg-primary px-3 py-2 text-sm font-semibold text-text-primary outline-none focus:border-primary"
                                                            >
                                                                <option value="all">Todos os idiomas ({voiceActors.length})</option>
                                                                {voiceLanguages.map((language) => (
                                                                    <option key={language} value={language}>
                                                                        {VOICE_LANGUAGE_LABELS[language] || language}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                        {filteredVoiceActors.map((va, idx) => (
                                                            <Link 
                                                                to={`/person/${va.person.mal_id}`} 
                                                                key={`${va.person.mal_id}-${idx}`} 
                                                                className="flex items-center gap-4 p-4 rounded-2xl bg-bg-secondary border border-border-color hover:border-primary/50 hover:bg-bg-tertiary transition-all group shadow-sm hover:shadow-md hover:-translate-y-1"
                                                            >
                                                                <div
                                                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-cover bg-center shrink-0 border border-border-color group-hover:border-primary transition-all shadow-inner"
                                                                    style={{ backgroundImage: `url('${va.person.images?.jpg?.image_url}')` }}
                                                                />
                                                                <div className="min-w-0 pr-2">
                                                                    <h4 className="text-sm sm:text-base font-bold text-text-primary truncate group-hover:text-primary transition-colors">{va.person.name}</h4>
                                                                    <span className="inline-block mt-1 text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider bg-bg-primary border border-border-color px-2 py-0.5 rounded-md">
                                                                        {VOICE_LANGUAGE_LABELS[va.language] || va.language}
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                        </div>
                                                        {filteredVoiceActors.length === 0 && (
                                                            <p className="py-12 text-center text-sm italic text-text-secondary">
                                                                Nenhum dublador cadastrado neste idioma.
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="gallery"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                                            >
                                                {pictures.map((pic, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group relative border border-white/5 hover:border-primary/50 transition-all shadow-md hover:shadow-primary/20"
                                                        onClick={() => setSelectedImage(pic.jpg.image_url)}
                                                    >
                                                        <img
                                                            src={pic.jpg.image_url}
                                                            alt="Character gallery"
                                                            loading="lazy"
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <ImageIcon className="w-8 h-8 text-white drop-shadow-md" />
                                                        </div>
                                                    </div>
                                                ))}
                                                {pictures.length === 0 && <p className="text-text-secondary col-span-full italic py-10 text-center">Nenhuma foto extra disponível.</p>}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Image Modal */}
                <ImageModal 
                    isOpen={!!selectedImage}
                    onClose={() => setSelectedImage(null)}
                    imageUrl={selectedImage}
                    altText="Character Image"
                />
            </div>
        </>
    );
}
