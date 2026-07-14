import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { anilistApi } from '@/services/anilistApi';
import { useAnimeLibrary } from '@/hooks/useAnimeLibrary';
import { Search, ChevronRight, CheckCircle2, Loader2, Sparkles, Tv } from 'lucide-react';

export function OnboardingModal() {
    const { user } = useAuth();
    const { profile, updateProfileData } = useUserProfile();
    const { toggleFavorite } = useAnimeLibrary();

    const [step, setStep] = useState(1);

    // Step 1 State
    const [displayName, setDisplayName] = useState('');

    // Step 2 State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedAnime, setSelectedAnime] = useState(null);

    const [isSaving, setIsSaving] = useState(false);

    // Initialize display name from Google
    useEffect(() => {
        if (profile?.displayName) {
            setDisplayName(profile.displayName);
        } else if (user?.displayName) {
            setDisplayName(user.displayName);
        }
    }, [profile, user]);

    // Handle Anime Search
    useEffect(() => {
        if (searchQuery.length < 3) {
            setSearchResults([]);
            return;
        }

        const delayDebounceData = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await anilistApi.searchCatalog(searchQuery, 4, {
                    anime: true,
                    characters: false,
                    people: false,
                });
                setSearchResults(response.anime || []);
            } catch (error) {
                console.error("Erro ao buscar animes na onboarding:", error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceData);
    }, [searchQuery]);

    // Show modal only if profile exists and hasCompletedOnboarding is strictly false
    if (!profile || profile.hasCompletedOnboarding !== false) {
        return null;
    }

    const handleFirstStepComplete = (e) => {
        e.preventDefault();
        if (displayName.trim().length >= 3) {
            setStep(2);
        }
    };

    const handleFinish = async () => {
        setIsSaving(true);
        try {
            // 1. Save Display Name and completion flag
            await updateProfileData({
                displayName: displayName.trim(),
                hasCompletedOnboarding: true
            });

            // 2. Save Favorite Anime if selected
            if (selectedAnime) {
                const animeDataToSave = {
                    id: selectedAnime.mal_id,
                    title: selectedAnime.title_english || selectedAnime.title,
                    image: selectedAnime.images?.webp?.large_image_url || selectedAnime.images?.jpg?.large_image_url,
                    score: selectedAnime.score,
                    year: selectedAnime.year || 'N/A',
                    status: selectedAnime.status,
                    episodes: selectedAnime.episodes,
                    type: selectedAnime.type,
                };

                // Add it silently to favorites
                await toggleFavorite(animeDataToSave, true);
            }

        } catch (error) {
            console.error("Erro ao finalizar onboarding", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-lg bg-bg-secondary rounded-3xl shadow-2xl border border-border-color overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header Graphic */}
                <div className="h-32 bg-gradient-to-br from-primary via-primary/80 to-purple-600 relative flex items-center justify-center overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
                    <motion.div
                        initial={{ rotate: -10, scale: 0.8 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ duration: 0.5, type: 'spring' }}
                        className="bg-white/20 p-4 rounded-full backdrop-blur-md border border-white/30 text-white shadow-xl"
                    >
                        <Sparkles className="w-8 h-8" />
                    </motion.div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 overflow-y-auto no-scrollbar flex-1">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-black text-text-primary mb-2">Bem-vindo(a)! 🎉</h2>
                                    <p className="text-text-secondary">Como você quer ser chamado(a) na comunidade?</p>
                                </div>

                                <form onSubmit={handleFirstStepComplete} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">
                                            Nome de Exibição
                                        </label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Seu apelido..."
                                            className="w-full bg-bg-tertiary border-2 border-border-color focus:border-primary rounded-xl py-3 px-4 text-text-primary outline-none transition-all shadow-sm focus:shadow-primary/10 font-medium"
                                            autoFocus
                                            minLength={3}
                                            maxLength={30}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={displayName.trim().length < 3}
                                        className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                                    >
                                        Continuar
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-black text-text-primary mb-2">Seu Anime Favorito 🤩</h2>
                                    <p className="text-text-secondary">Qual o anime que tem o seu coração? Vamos adicioná-lo aos seus favoritos.</p>
                                </div>

                                {/* Form */}
                                <div className="space-y-4 mb-8">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Buscar anime..."
                                            className="w-full bg-bg-tertiary border-2 border-border-color focus:border-primary rounded-xl py-3 pl-11 pr-10 text-text-primary outline-none transition-all"
                                            autoFocus
                                        />
                                        {isSearching && (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
                                        )}
                                    </div>

                                    {/* Results */}
                                    {searchResults.length > 0 && (
                                        <div className="bg-bg-tertiary border border-border-color rounded-xl p-2 max-h-56 overflow-y-auto space-y-1 custom-scrollbar">
                                            {searchResults.map((anime) => (
                                                <div
                                                    key={anime.mal_id}
                                                    onClick={() => setSelectedAnime(anime)}
                                                    className={`flex items-center gap-3 p-2 cursor-pointer transition-colors rounded-lg border-2 ${selectedAnime?.mal_id === anime.mal_id
                                                            ? 'bg-primary/10 border-primary'
                                                            : 'hover:bg-bg-secondary border-transparent'
                                                        }`}
                                                >
                                                    <img
                                                        src={anime.images?.jpg?.image_url}
                                                        className="w-10 h-14 object-cover rounded shadow-sm"
                                                        alt={anime.title}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-text-primary truncate">{anime.title_english || anime.title}</h4>
                                                        <p className="text-xs text-text-secondary">{anime.year || 'N/A'}</p>
                                                    </div>
                                                    {selectedAnime?.mal_id === anime.mal_id && (
                                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleFinish}
                                        disabled={isSaving}
                                        className="flex-1 bg-bg-tertiary hover:bg-bg-secondary text-text-secondary font-bold py-3.5 rounded-xl transition-transform active:scale-95 disabled:opacity-50 shadow-sm border border-border-color"
                                    >
                                        Pular etapa
                                    </button>
                                    <button
                                        onClick={handleFinish}
                                        disabled={!selectedAnime || isSaving}
                                        className="flex-[2] bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Tv className="w-5 h-5" />}
                                        Finalizar
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Progress Indicators */}
                <div className="bg-bg-tertiary p-4 flex justify-center gap-2 border-t border-border-color shrink-0">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-primary' : 'w-4 bg-border-color'}`} />
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-primary' : 'w-4 bg-border-color'}`} />
                </div>
            </motion.div>
        </div>
    );
}
