import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Info, Layers, Clock, Monitor, Star, Film, CheckCircle, AlertCircle, Calendar, Users } from 'lucide-react';
import { InfoRow } from '@/components/anime/InfoRow';

export function AnimeSidebar({ anime, characters, staff }) {
    // Filter staff to show only key roles if possible, or just slice the first few
    // Common key roles: Director, Series Composition, Character Design, Music
    const mainStaff = staff?.slice(0, 4) || [];

    return (
        <motion.aside
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-3 xl:col-span-3 space-y-8 h-fit order-1 lg:order-2"
        >
            <div className="space-y-6">
                <h3 className="font-bold text-lg flex items-center gap-2 border-b border-border-color pb-2">
                    <Info className="w-5 h-5 text-primary" /> Informações
                </h3>
                <div className="space-y-3">
                    <InfoRow icon={Layers} label="Episódios" value={`${anime.episodes || '?'}`} />
                    <InfoRow icon={Clock} label="Duração" value={anime.duration?.split('per')[0]} />
                    <InfoRow
                        icon={Monitor}
                        label="Estúdio"
                        value={anime.studios?.[0] ? (
                            anime.studios[0].mal_id ? (
                                <Link to={`/studio/${anime.studios[0].mal_id}`} className="hover:underline">
                                    {anime.studios[0].name}
                                </Link>
                            ) : anime.studios[0].name
                        ) : '-'}
                        highlight
                    />
                    <InfoRow icon={Star} label="Nota Média" value={anime.score} color="text-yellow-400" />
                    <div className="border-t border-border-color/50 my-2" />
                    <InfoRow icon={Film} label="Origem" value={anime.source} />
                    <InfoRow icon={CheckCircle} label="Status" value={anime.status === 'Finished Airing' ? 'Completo' : 'Em Lançamento'} color={anime.status === 'Finished Airing' ? 'text-emerald-400' : 'text-blue-400'} />
                    <InfoRow icon={AlertCircle} label="Classificação" value={anime.rating?.split(' ')[0]} />
                    <InfoRow icon={Calendar} label="Exibição" value={anime.year || anime.aired?.string?.split('to')[0]} />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-lg border-b border-border-color pb-2">Gêneros</h3>
                <div className="flex flex-wrap gap-2">
                    {anime.genres?.map(g => {
                        const className = "px-3 py-1.5 rounded-lg bg-bg-secondary border border-border-color text-xs font-medium transition-colors hover:bg-primary hover:text-white hover:border-primary";
                        return g.mal_id ? (
                            <Link key={g.mal_id} to={`/catalog?genre=${g.mal_id}`} className={className}>
                                {g.name}
                            </Link>
                        ) : (
                            <span key={g.name} className={className}>{g.name}</span>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-lg border-b border-border-color pb-2">Elenco</h3>
                <div className="grid grid-cols-1 gap-3">
                    {characters?.slice(0, 4).map(char => (
                        <motion.div
                            key={char.character.mal_id}
                            whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.05)" }}
                            className="rounded-xl transition-colors"
                        >
                            <Link to={`/character/${char.character.mal_id}`} className="flex items-center gap-3 p-2 group">
                                <div className="size-10 rounded-full overflow-hidden bg-bg-secondary shrink-0">
                                    <img src={char.character.images?.jpg?.image_url} alt="" loading="lazy" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">{char.character.name}</span>
                                    <span className="text-xs text-text-secondary truncate">{char.role}</span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
                <Link to={`/anime/${anime.id}/characters`} className="block text-center text-sm font-bold text-primary hover:underline mt-4">
                    Ver todo o elenco
                </Link>
            </div>

            {/* Production Staff Section - New Feature */}
            {mainStaff.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-bold text-lg border-b border-border-color pb-2">Equipe de Produção</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {mainStaff.map((person, index) => (
                            <motion.div
                                key={`${person.person.mal_id}-${index}`}
                                whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.05)" }}
                                className="rounded-xl transition-colors"
                            >
                                <Link to={`/person/${person.person.mal_id}`} className="flex items-center gap-3 p-2 group">
                                    <div className="size-10 rounded-full overflow-hidden bg-bg-secondary shrink-0">
                                        <img src={person.person.images?.jpg?.image_url} alt="" loading="lazy" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">{person.person.name}</span>
                                        <span className="text-xs text-text-secondary truncate">{person.positions?.[0] || 'Staff'}</span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {mainStaff.length > 0 && (
                <Link to={`/anime/${anime.id}/staff`} className="block text-center text-sm font-bold text-primary hover:underline mt-4">
                    Ver toda a equipe
                </Link>
            )}
        </motion.aside>
    );
}
