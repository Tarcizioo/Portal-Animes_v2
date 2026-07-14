import {
  Archive,
  BookOpen,
  Clock,
  Compass,
  Crown,
  Flame,
  Heart,
  Library,
  Medal,
  Star,
  Trophy,
  Tv,
} from 'lucide-react';

function createBadge({ metric, target, ...badge }) {
  return {
    ...badge,
    metric,
    target,
    requirement: (stats) => (stats?.[metric] || 0) >= target,
  };
}

export function getAchievementStats(library = []) {
  const items = Array.isArray(library) ? library : [];
  const uniqueGenres = new Set(
    items.flatMap((anime) => (Array.isArray(anime.genres) ? anime.genres : [])).filter(Boolean),
  );

  return {
    totalAnimes: items.length,
    completedAnimes: items.filter((anime) => anime.status === 'completed').length,
    episodesWatched: items.reduce((total, anime) => total + Number(anime.currentEp || 0), 0),
    ratedAnimes: items.filter((anime) => Number(anime.score || 0) > 0).length,
    favoriteAnimes: items.filter((anime) => anime.isFavorite).length,
    uniqueGenres: uniqueGenres.size,
  };
}

export function getBadgeProgress(badge, stats) {
  const current = Math.max(0, Number(stats?.[badge.metric] || 0));
  const value = Math.min(current, badge.target);
  return {
    current,
    value,
    target: badge.target,
    percentage: Math.min(100, Math.round((current / badge.target) * 100)),
  };
}

export const BADGES = [
  createBadge({
    id: 'first_step', name: 'Primeiro Passo', description: 'Comece sua jornada adicionando um anime à biblioteca.',
    metric: 'totalAnimes', target: 1, unit: 'anime na biblioteca', category: 'Coleção', rarity: 'Comum',
    icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/25',
  }),
  createBadge({
    id: 'collector', name: 'Colecionador', description: 'Monte uma coleção com 10 títulos diferentes.',
    metric: 'totalAnimes', target: 10, unit: 'animes na biblioteca', category: 'Coleção', rarity: 'Incomum',
    icon: Library, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25',
  }),
  createBadge({
    id: 'archivist', name: 'Arquivista', description: 'Transforme sua biblioteca em um acervo de 50 títulos.',
    metric: 'totalAnimes', target: 50, unit: 'animes na biblioteca', category: 'Coleção', rarity: 'Rara',
    icon: Archive, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/25',
  }),
  createBadge({
    id: 'otaku_initiate', name: 'Iniciado', description: 'Conclua seus primeiros 5 animes.',
    metric: 'completedAnimes', target: 5, unit: 'animes concluídos', category: 'Conclusão', rarity: 'Comum',
    icon: Tv, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25',
  }),
  createBadge({
    id: 'veteran', name: 'Veterano', description: 'Alcance a marca de 20 animes concluídos.',
    metric: 'completedAnimes', target: 20, unit: 'animes concluídos', category: 'Conclusão', rarity: 'Rara',
    icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25',
  }),
  createBadge({
    id: 'anime_legend', name: 'Lenda do Catálogo', description: 'Complete 50 animes e deixe sua marca na plataforma.',
    metric: 'completedAnimes', target: 50, unit: 'animes concluídos', category: 'Conclusão', rarity: 'Lendária',
    icon: Crown, color: 'text-amber-300', bg: 'bg-amber-400/10', border: 'border-amber-400/30',
  }),
  createBadge({
    id: 'marathonist', name: 'Maratonista', description: 'Assista a um total de 100 episódios.',
    metric: 'episodesWatched', target: 100, unit: 'episódios assistidos', category: 'Ritmo', rarity: 'Incomum',
    icon: Clock, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/25',
  }),
  createBadge({
    id: 'binge_master', name: 'Sem Pausa', description: 'Acumule 500 episódios assistidos.',
    metric: 'episodesWatched', target: 500, unit: 'episódios assistidos', category: 'Ritmo', rarity: 'Épica',
    icon: Flame, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/25',
  }),
  createBadge({
    id: 'critic', name: 'Crítico', description: 'Avalie 5 animes da sua biblioteca.',
    metric: 'ratedAnimes', target: 5, unit: 'animes avaliados', category: 'Opinião', rarity: 'Incomum',
    icon: Star, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/25',
  }),
  createBadge({
    id: 'seasoned_critic', name: 'Crítico Experiente', description: 'Compartilhe sua nota em 20 títulos.',
    metric: 'ratedAnimes', target: 20, unit: 'animes avaliados', category: 'Opinião', rarity: 'Rara',
    icon: Medal, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/25',
  }),
  createBadge({
    id: 'curator', name: 'Curador', description: 'Escolha 5 animes que representam seus favoritos.',
    metric: 'favoriteAnimes', target: 5, unit: 'animes favoritos', category: 'Identidade', rarity: 'Incomum',
    icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/25',
  }),
  createBadge({
    id: 'genre_explorer', name: 'Explorador', description: 'Passeie por pelo menos 10 gêneros diferentes.',
    metric: 'uniqueGenres', target: 10, unit: 'gêneros explorados', category: 'Descoberta', rarity: 'Rara',
    icon: Compass, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/25',
  }),
];
