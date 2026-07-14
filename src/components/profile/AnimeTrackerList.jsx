import { Plus, MoreVertical, PlayCircle, Search, Eye, CheckCircle, Clock, PauseCircle, LayoutGrid, List, Trash2, Star, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useAnimeLibrary } from '@/hooks/useAnimeLibrary';
import { useNavigate, Link } from 'react-router-dom';

export function AnimeTrackerList() {
  const [activeTab, setActiveTab] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Usando o Hook Real
  const { library, loading, incrementProgress, removeFromLibrary } = useAnimeLibrary();

  // Mapeamento de Status para mostrar na UI e filtrar
  // Firestore Keys: 'watching', 'completed', 'plan_to_watch', 'dropped', 'paused'
  // UI Tabs Config:
  const tabs = [
    { id: 'todos', label: 'Todos', icon: LayoutGrid },
    { id: 'watching', label: 'Assistindo', icon: Eye },
    { id: 'completed', label: 'Completos', icon: CheckCircle },
    { id: 'plan_to_watch', label: 'Planejados', icon: Clock },
    { id: 'dropped', label: 'Dropados', icon: Trash2 },
    { id: 'paused', label: 'Pausados', icon: PauseCircle },
  ];

  // Configuração Visual dos Status
  const statusConfig = {
    watching: { label: "Assistindo", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", bar: "bg-green-500" },
    completed: { label: "Completo", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", bar: "bg-blue-500" },
    plan_to_watch: { label: "Planejado", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20", bar: "bg-gray-500" },
    dropped: { label: "Dropado", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", bar: "bg-red-500" },
    paused: { label: "Pausado", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", bar: "bg-yellow-500" },
  };

  // Filtragem
  const filteredAnimes = library.filter(anime => {
    const matchesTab = activeTab === 'todos' ? true : anime.status === activeTab;
    const matchesSearch = anime.title ? anime.title.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <div className="mt-8 flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="mt-8 font-sans">

      {/* CABEÇALHO COM TÍTULO E BUSCA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
          Biblioteca Pessoal
        </h3>

        <Link to="/library" className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-transform hover:translate-x-1">
          Ver Biblioteca <ArrowRight className="w-3 h-3" />
        </Link>

        {/* Barra de Busca Pequena */}
        <div className="relative group w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Filtrar animes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-[var(--text-secondary)]"
          />
        </div>
      </div>

      {/* ABAS DE FILTRO (Estilo Pill) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-800 mb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.id === 'todos' ? library.length : library.filter(a => a.status === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border
                ${isActive
                  ? 'bg-primary text-white border-primary shadow-[0_0_15px_-5px_rgba(99,102,241,0.6)]'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/10'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-black/20 text-gray-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* GRID DE CARDS */}
      {filteredAnimes.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredAnimes.map((anime) => {
            const config = statusConfig[anime.status] || statusConfig.watching;
            const progress = anime.totalEp > 0 ? (anime.currentEp / anime.totalEp) * 100 : 0;

            return (
              <div
                key={anime.id}
                onClick={() => navigate(`/anime/${anime.id}`)}
                className="group flex gap-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-3 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:bg-[var(--bg-tertiary)] cursor-pointer"
              >
                {/* Imagem */}
                <div className="relative w-20 h-28 shrink-0 rounded-xl overflow-hidden bg-gray-900 shadow-md">
                  <img
                    src={anime.image}
                    alt={anime.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>

                  {/* Rating Badge (Novo) - Positioned over image */}
                  <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded-md px-1.5 py-0.5 flex items-center gap-1">
                    <Star className={`w-3 h-3 ${anime.score > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                    <span className="text-[10px] font-bold text-white">{anime.score > 0 ? anime.score : '-'}</span>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">

                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-[var(--text-primary)] truncate text-sm md:text-base leading-snug group-hover:text-primary transition-colors">
                        {anime.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromLibrary(anime.id);
                        }}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1 -mr-2 -mt-2 z-10 relative"
                        title="Remover da biblioteca"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${config.color} ${config.bg} ${config.border}`}>
                      {config.label}
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-end justify-between text-xs font-mono mb-1.5">
                      <span className="text-[var(--text-secondary)]">Progresso</span>
                      <span className="text-[var(--text-primary)] font-bold">
                        {anime.currentEp} <span className="text-[var(--text-secondary)]">/ {anime.totalEp || '?'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>

                      {/* Botão + só aparece se não estiver completo */}
                      {anime.status !== 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            incrementProgress(anime.id, anime.currentEp, anime.totalEp);
                          }}
                          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:bg-primary hover:text-white hover:border-primary active:scale-90 transition-all cursor-pointer z-10 relative"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}

                      {/* Se estiver completo, mostra Check */}
                      {anime.status === 'completed' && (
                        <div className="shrink-0 w-6 h-6 flex items-center justify-center text-blue-400">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // ESTADO VAZIO (Quando não tem animes no filtro)
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/5 rounded-3xl bg-white/5">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-600">
            <Search className="w-8 h-8" />
          </div>
          <p className="text-gray-400 font-medium">Nenhum anime encontrado.</p>
          <a href="/catalog" className="mt-4 text-primary text-sm font-bold hover:underline">
            Explorar Catálogo
          </a>
        </div>
      )}
    </div>
  );
}