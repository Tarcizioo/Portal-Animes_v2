import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GitMerge } from 'lucide-react';

export function AnimeRelations({ relations }) {
    if (!relations || relations.length === 0) return null;

    // Filter relations that actually contain anime links
    const validRelations = relations.filter(relation => 
        relation.entry && relation.entry.some(e => e.type === 'anime')
    );

    if (validRelations.length === 0) return null;

    // Translation Map for Relations
    const translateRelation = (rel) => {
        const map = {
            'Sequel': 'Continuação',
            'Prequel': 'História Anterior',
            'Alternative setting': 'História Alternativa',
            'Alternative version': 'Versão Alternativa',
            'Side story': 'Spin-off / História Paralela',
            'Parent story': 'História Principal',
            'Summary': 'Resumo',
            'Full story': 'História Completa',
            'Spin-off': 'Spin-off',
            'Character': 'Personagem',
            'Other': 'Outro'
        };
        return map[rel] || rel;
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
        >
             <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-primary" /> Franquia & Temporadas
            </h3>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validRelations.map((relation, idx) => {
                    // Get only Anime entries within this relation
                    const animeEntries = relation.entry.filter(e => e.type === 'anime');
                    if (animeEntries.length === 0) return null;

                    return (
                        <div key={idx} className="bg-bg-secondary border border-border-color rounded-xl p-4 flex flex-col gap-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary bg-bg-tertiary px-2 py-1 rounded-md w-max">
                                {translateRelation(relation.relation)}
                            </span>
                            
                            <div className="flex flex-col gap-2">
                                {animeEntries.map(entry => (
                                    <Link 
                                        key={entry.mal_id} 
                                        to={`/anime/${entry.mal_id}`}
                                        onClick={() => window.scrollTo(0,0)}
                                        className="group flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-bg-tertiary transition-colors"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-button-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                                            {entry.name}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.section>
    );
}
