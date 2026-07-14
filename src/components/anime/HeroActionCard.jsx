import { Plus, Heart, Trash2, Star, ChevronDown } from 'lucide-react';

export function HeroActionCard({ anime, libraryEntry, status, handleStatusChange, handleIncrement, updateProgress, toggleFavorite, currentEp, totalEp, updateRating, onRemove }) {
    if (!libraryEntry) {
        return (
            <div className="bg-bg-secondary/90 backdrop-blur-xl p-6 rounded-2xl border border-border-color shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-text-primary">Acompanhar</h3>
                    <button onClick={() => toggleFavorite(anime)} className="p-2 hover:bg-bg-tertiary rounded-full transition-colors group" title="Favoritar">
                        <Heart className="w-5 h-5 text-text-secondary group-hover:text-red-500 transition-colors" />
                    </button>
                </div>

                <p className="text-sm text-text-secondary">Adicione à sua lista para rastrear.</p>
                <button
                    onClick={() => handleStatusChange('watching')}
                    className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Adicionar à Lista
                </button>
            </div>
        );
    }

    return (
        <div className="bg-bg-secondary/90 backdrop-blur-xl p-5 rounded-2xl border border-border-color shadow-xl space-y-4">
            <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary">Editar Progresso</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onRemove}
                        className="p-2 hover:bg-bg-tertiary rounded-full transition-colors group"
                        title="Remover da Biblioteca"
                    >
                        <Trash2 className="w-5 h-5 text-text-secondary group-hover:text-red-500 transition-colors" />
                    </button>
                    <button onClick={() => toggleFavorite(anime)} className="p-2 hover:bg-bg-tertiary rounded-full transition-colors">
                        <Heart className={`w-5 h-5 ${libraryEntry.isFavorite ? 'fill-red-500 text-red-500' : 'text-text-secondary'}`} />
                    </button>
                </div>
            </div>

            <div className="relative">
                <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full appearance-none bg-bg-tertiary border border-border-color rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                >
                    <option value="watching">Assistindo</option>
                    <option value="completed">Completo</option>
                    <option value="plan_to_watch">Planejo Assistir</option>
                    <option value="dropped">Dropado</option>
                    <option value="paused">Pausado</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-text-secondary">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>

            <div className="flex items-center gap-2 bg-bg-tertiary p-2 rounded-xl border border-border-color">
                <input
                    type="number"
                    value={currentEp}
                    onChange={(e) => updateProgress(libraryEntry.id, parseInt(e.target.value) || 0, totalEp)}
                    className="w-12 bg-transparent text-center font-bold text-text-primary outline-none"
                />
                <span className="text-text-secondary">/ {totalEp || '?'}</span>
                <button onClick={handleIncrement} className="ml-auto p-1.5 bg-primary rounded-lg text-text-on-primary hover:bg-primary-hover">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            {/* Rating Selector (0-10) */}
            <div className="pt-2 relative">
                <div className="flex items-center gap-3 bg-bg-tertiary py-3 px-4 rounded-xl border border-border-color hover:border-primary/50 transition-colors cursor-pointer group">
                    <Star className={`w-5 h-5 shrink-0 transition-colors ${(libraryEntry.score || 0) > 0 ? "fill-yellow-400 text-yellow-400" : "text-text-secondary group-hover:text-primary"}`} />
                    <span className="text-sm font-bold text-text-primary shrink-0">Nota:</span>
                    
                    <div className="flex-1 text-center text-sm font-bold text-text-primary pointer-events-none">
                        {(libraryEntry.score || 0) > 0 ? `${libraryEntry.score} / 10` : <span className="text-text-secondary">Sem Nota</span>}
                    </div>
                    
                    <ChevronDown className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors shrink-0 pointer-events-none" />
                </div>
                
                <select
                    value={libraryEntry.score || 0}
                    onChange={(e) => updateRating(anime.id, parseInt(e.target.value))}
                    className="absolute inset-x-0 bottom-0 h-[52px] w-full opacity-0 cursor-pointer"
                >
                    <option value={0} className="bg-bg-primary text-text-secondary">Sem Nota</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num} className="bg-bg-primary text-text-primary">
                            {num} / 10
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
