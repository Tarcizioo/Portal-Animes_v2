import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePersonInfo } from '@/hooks/usePeople';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Loader } from '@/components/ui/Loader';
import { Heart, Info, Mic2, ChevronDown, Trophy, Images } from 'lucide-react';
import { RoleCard } from '@/components/ui/RoleCard';
import { ImageModal } from '@/components/ui/ImageModal';
import { motion, AnimatePresence } from 'framer-motion';
import { BackButton } from '@/components/ui/BackButton';
import clsx from 'clsx';

export function PersonDetails() {
  const { id } = useParams();
  const { person, voices, pictures, animePositions, loading } = usePersonInfo(id);
  const [visibleVoices, setVisibleVoices] = useState(20);
  const [visiblePositions, setVisiblePositions] = useState(20);
  const [activeTab, setActiveTab] = useState('roles');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  usePageTitle(person?.name || 'Detalhes da Pessoa');

  const handleShowMoreVoices = () => {
    setVisibleVoices(prev => prev + 20);
  };

  const handleShowMorePositions = () => {
    setVisiblePositions(prev => prev + 20);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex bg-bg-primary text-text-primary items-center justify-center h-screen">
        <p>Pessoa não encontrada.</p>
      </div>
    );
  }

  const displayedVoices = voices.slice(0, visibleVoices);
  const displayedPositions = animePositions.slice(0, visiblePositions);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans pb-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
        <div className="mb-6">
            <BackButton />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Sidebar */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 self-start space-y-6 h-fit">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-bg-secondary aspect-[2/3] max-w-[280px] mx-auto lg:mx-0 group">
              <img 
                src={person.images?.jpg?.image_url} 
                alt={person.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
              <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl text-xs font-bold text-white border border-white/10 shadow-lg flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                  {person.favorites?.toLocaleString() || 0}
              </div>
            </div>

            <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-5 border border-white/5 space-y-4">
               <h3 className="font-bold border-b border-white/5 pb-2 flex items-center gap-2 text-sm text-text-secondary uppercase tracking-wider">
                  <Info className="w-4 h-4" /> Informações
               </h3>
               
               <div className="space-y-3 text-sm">
                  {person.given_name && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Nome:</span>
                      <span className="font-medium text-right">{person.given_name} {person.family_name}</span>
                    </div>
                  )}
                  {person.birthday && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Nascimento:</span>
                      <span className="font-medium text-right">{new Date(person.birthday).toLocaleDateString()}</span>
                    </div>
                  )}
                   {person.website_url && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Website:</span>
                      <a href={person.website_url} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline truncate max-w-[150px]">Link</a>
                    </div>
                  )}
               </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-10">
            
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight leading-none">
                {person.name}
              </h1>
              {person.given_name && (
                 <h2 className="text-xl text-primary font-bold opacity-80">{person.family_name} {person.given_name}</h2>
              )}
            </div>

            {/* About */}
             <div className="space-y-4">
                <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2 border-b border-white/10 pb-2">
                    <Info className="w-5 h-5 text-primary" /> Biografia
                </h3>
                <div className="prose prose-invert max-w-none">
                    <p className="text-text-secondary leading-relaxed whitespace-pre-line text-base">
                        {person.about 
                            ? (isExpanded ? person.about.replace(/\\n/g, '\n') : person.about.replace(/\\n/g, '\n').slice(0, 400) + (person.about.length > 400 ? '...' : ''))
                            : "Biografia indisponível."
                        }
                    </p>
                    {person.about && person.about.length > 400 && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-primary font-bold hover:text-white transition-colors text-sm mt-2"
                        >
                            {isExpanded ? 'Ler Menos' : 'Ler Mais'}
                        </button>
                    )}
                </div>
            </div>

            {/* Content Tabs */}
            <div className="space-y-6 pt-6 border-t border-border-color">
               <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => setActiveTab('roles')}
                    className={clsx(
                        "px-5 py-2.5 rounded-full text-sm sm:text-base font-bold flex items-center gap-2 transition-all duration-300 shadow-sm border",
                        activeTab === 'roles' 
                            ? "bg-primary text-white border-primary shadow-primary/20 scale-105" 
                            : "bg-bg-secondary text-text-secondary border-border-color hover:bg-bg-tertiary hover:text-text-primary"
                    )}
                  >
                    <Mic2 className="w-4 h-4 sm:w-5 sm:h-5" /> Dublagens 
                    <span className={clsx(
                        "text-xs px-2 py-0.5 rounded-full",
                        activeTab === 'roles' ? "bg-white/20 text-white" : "bg-bg-tertiary text-text-secondary"
                    )}>
                        {voices.length}
                    </span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('staff')}
                    className={clsx(
                        "px-5 py-2.5 rounded-full text-sm sm:text-base font-bold flex items-center gap-2 transition-all duration-300 shadow-sm border",
                        activeTab === 'staff' 
                            ? "bg-primary text-white border-primary shadow-primary/20 scale-105" 
                            : "bg-bg-secondary text-text-secondary border-border-color hover:bg-bg-tertiary hover:text-text-primary"
                    )}
                  >
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5" /> Produções 
                    <span className={clsx(
                        "text-xs px-2 py-0.5 rounded-full",
                        activeTab === 'staff' ? "bg-white/20 text-white" : "bg-bg-tertiary text-text-secondary"
                    )}>
                        {animePositions.length}
                    </span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('photos')}
                    className={clsx(
                        "px-5 py-2.5 rounded-full text-sm sm:text-base font-bold flex items-center gap-2 transition-all duration-300 shadow-sm border",
                        activeTab === 'photos' 
                            ? "bg-primary text-white border-primary shadow-primary/20 scale-105" 
                            : "bg-bg-secondary text-text-secondary border-border-color hover:bg-bg-tertiary hover:text-text-primary"
                    )}
                  >
                    <Images className="w-4 h-4 sm:w-5 sm:h-5" /> Fotos 
                    <span className={clsx(
                        "text-xs px-2 py-0.5 rounded-full",
                        activeTab === 'photos' ? "bg-white/20 text-white" : "bg-bg-tertiary text-text-secondary"
                    )}>
                        {pictures.length}
                    </span>
                  </button>
               </div>
                
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'roles' && (
                            <motion.div
                                key="roles"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {voices.length > 0 ? (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {displayedVoices.map((role, idx) => (
                                    <motion.div
                                        key={`${role.anime.mal_id}-${role.character.mal_id}-${idx}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <RoleCard role={role} />
                                    </motion.div>
                                    ))}
                                </div>
                                ) : (
                                <p className="text-text-secondary italic">Nenhum registro de dublagem encontrado.</p>
                                )}

                                {voices.length > visibleVoices && (
                                <div className="flex justify-center pt-4">
                                    <button 
                                    onClick={handleShowMoreVoices}
                                    className="px-6 py-3 bg-bg-secondary border border-primary/30 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all flex items-center gap-2 shadow-sm hover:shadow-primary/30 hover:-translate-y-1"
                                    >
                                    Carregar Mais <ChevronDown className="w-5 h-5" />
                                    </button>
                                </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'staff' && (
                            <motion.div
                                key="staff"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {animePositions.length > 0 ? (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {displayedPositions.map((pos, idx) => (
                                    <motion.div
                                        key={`${pos.anime.mal_id}-${idx}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3 }}
                                        className="flex bg-bg-secondary rounded-xl overflow-hidden border border-border-color hover:border-primary/50 transition-all duration-300 group h-24 relative shadow-sm hover:shadow-md hover:-translate-y-1"
                                    >
                                        {/* Anime Image */}
                                        <Link to={`/anime/${pos.anime.mal_id}`} className="w-20 shrink-0 relative overflow-hidden">
                                            <img 
                                            src={pos.anime.images?.jpg?.image_url} 
                                            alt={pos.anime.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            loading="lazy"
                                            />
                                        </Link>
                                        
                                        {/* Info */}
                                        <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                                            <Link to={`/anime/${pos.anime.mal_id}`} className="text-sm font-bold text-text-primary hover:text-primary transition-colors line-clamp-1 mb-1">
                                            {pos.anime.title}
                                            </Link>
                                            <span className="text-xs text-text-secondary">
                                            Cargo: <span className="text-primary font-medium">{pos.position}</span>
                                            </span>
                                        </div>

                                    </motion.div>
                                    ))}
                                </div>
                                ) : (
                                <p className="text-text-secondary italic">Nenhum registro de produção encontrado.</p>
                                )}

                                {animePositions.length > visiblePositions && (
                                <div className="flex justify-center pt-4">
                                    <button 
                                    onClick={handleShowMorePositions}
                                    className="px-6 py-3 bg-bg-secondary border border-primary/30 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all flex items-center gap-2 shadow-sm hover:shadow-primary/30 hover:-translate-y-1"
                                    >
                                    Carregar Mais <ChevronDown className="w-5 h-5" />
                                    </button>
                                </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'photos' && (
                            <motion.div
                                key="photos"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                            >
                                {pictures.map((pic, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                                    className="aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/5 hover:border-primary/50 transition-all group relative cursor-pointer hover:shadow-primary/20 hover:-translate-y-1"
                                    onClick={() => setSelectedImage(pic.jpg.image_url)}
                                >
                                    <img 
                                        src={pic.jpg.image_url} 
                                        alt={`Foto ${idx + 1}`} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Info className="w-8 h-8 text-white" />
                                    </div>
                                </motion.div>
                                ))}
                                {pictures.length === 0 && <p className="text-text-secondary col-span-full italic">Nenhuma foto extra encontrada.</p>}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

          </div>

        </div>
      </div>
      
      <ImageModal 
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage}
        altText="Foto em tamanho grande"
      />
    </div>
  );
}
