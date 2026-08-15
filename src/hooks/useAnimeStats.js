import { useMemo } from 'react';

const DEFAULT_STATS = {
        overview: {
            totalAnimes: 0,
            totalEpisodes: 0,
            progressEpisodes: 0,
            availableEpisodes: 0,
            episodeProgress: 0,
            averageScore: 0,
            favoritesCount: 0
        },
        genres: [],
        status: [],
        scoreDistribution: [],
        types: [],
        topRated: []
    };

function toNonNegativeInteger(value) {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0;
}

export function useAnimeStats(library) {
    const stats = useMemo(() => {
        if (!library || library.length === 0) return DEFAULT_STATS;

        const totalAnimes = library.length;
        
        // --- Overview Stats ---
        const overview = {
            totalAnimes,
            totalEpisodes: 0,
            progressEpisodes: 0,
            availableEpisodes: 0,
            completed: 0,
            watching: 0,
            plan_to_watch: 0,
            dropped: 0,
            paused: 0,
            averageScore: 0,
            favorites: 0
        };

        // --- Accumulators ---
        let totalScoreSum = 0;
        let totalScoreCount = 0;
        const typeCounts = {};

        library.forEach(anime => {
            const currentEp = toNonNegativeInteger(anime.currentEp);
            const totalEp = toNonNegativeInteger(anime.totalEp ?? anime.episodes);
            const score = Number(anime.score) || 0;
            const status = anime.status || 'plan_to_watch';
            const type = anime.type || 'TV';

            // Overview
            overview.totalEpisodes += currentEp;
            if (totalEp > 0) {
                overview.progressEpisodes += Math.min(currentEp, totalEp);
                overview.availableEpisodes += totalEp;
            }
            
            if (overview[status] !== undefined) overview[status]++;
            
            if (anime.isFavorite) overview.favorites++;

            if (score > 0) {
                totalScoreSum += score;
                totalScoreCount++;
            }

             // Type Distribution
             typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        overview.averageScore = totalScoreCount > 0 ? (totalScoreSum / totalScoreCount).toFixed(1) : 0;
        overview.episodeProgress = overview.availableEpisodes > 0
            ? Math.round((overview.progressEpisodes / overview.availableEpisodes) * 100)
            : 0;

         // --- Genre Stats (Calculated via helper) ---
        const genres = calculateGenreStats(library);

        // --- Status Distribution ---
        const statusData = [
            { name: 'Assistindo', value: overview.watching, fill: '#3b82f6' }, // blue-500
            { name: 'Completo', value: overview.completed, fill: '#10b981' }, // emerald-500
            { name: 'Planejado', value: overview.plan_to_watch, fill: '#6366f1' }, // indigo-500
            { name: 'Pausado', value: overview.paused, fill: '#f59e0b' }, // amber-500
            { name: 'Dropado', value: overview.dropped, fill: '#ef4444' } // red-500
        ].filter(item => item.value > 0);

        // --- Type Distribution Format ---
        const types = Object.entries(typeCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

         // --- Top Rated ---
        const topRated = [...library]
             .filter(a => Number(a.score) > 0)
             .sort((a, b) => Number(b.score) - Number(a.score));

        return {
            overview: {
                totalAnimes: overview.totalAnimes,
                totalEpisodes: overview.totalEpisodes,
                progressEpisodes: overview.progressEpisodes,
                availableEpisodes: overview.availableEpisodes,
                episodeProgress: overview.episodeProgress,
                averageScore: overview.averageScore,
                favoritesCount: overview.favorites
            },
            genres,
            status: statusData,
            scoreDistribution: calculateScoreDistribution(library),
            types,
            topRated
        };
    }, [library]);

    return stats;
}

export function calculateGenreStats(animes) {
    if (!animes || animes.length === 0) return [];
    
    const genreCounts = {};
    const totalAnimes = animes.length;

    animes.forEach(anime => {
        if (Array.isArray(anime.genres)) {
            const currentEp = toNonNegativeInteger(anime.currentEp);
            const score = Number(anime.score) || 0;
            
            anime.genres.forEach(genre => {
                const s = anime.status || 'plan_to_watch';
                if (!genreCounts[genre]) {
                    genreCounts[genre] = { 
                        name: genre, 
                        total: 0, 
                        watching: 0, 
                        completed: 0, 
                        plan_to_watch: 0, 
                        dropped: 0, 
                        paused: 0,
                        scoreSum: 0,
                        scoreCount: 0,
                        episodesRegistered: 0
                    };
                }
                genreCounts[genre].total++;
                if (genreCounts[genre][s] !== undefined) {
                    genreCounts[genre][s]++;
                }
                
                // Stats accumulation
                if (score > 0) {
                    genreCounts[genre].scoreSum += score;
                    genreCounts[genre].scoreCount++;
                }
                genreCounts[genre].episodesRegistered += currentEp;
            });
        }
    });

    return Object.values(genreCounts)
        .map(g => {
            const avg = g.scoreCount > 0 ? (g.scoreSum / g.scoreCount) : 0;
            const percent = totalAnimes > 0 ? (g.total / totalAnimes) * 100 : 0;
            
            return {
                ...g,
                averageScore: Number(avg.toFixed(1)),
                percentage: Number(percent.toFixed(1))
            };
        })
        .sort((a, b) => b.total - a.total || b.episodesRegistered - a.episodesRegistered || a.name.localeCompare(b.name));
}

export function calculateScoreDistribution(animes) {
    if (!animes) return [];
    
    const scoreCounts = Array.from({ length: 11 }, () => ({
        total: 0,
        watching: 0,
        completed: 0,
        plan_to_watch: 0,
        dropped: 0,
        paused: 0
    }));

    animes.forEach(anime => {
        const score = Number(anime.score) || 0;
        const status = anime.status || 'plan_to_watch';
        
        if (score > 0) {
            const scoreInt = Math.floor(score);
            if (scoreInt >= 1 && scoreInt <= 10) {
                scoreCounts[scoreInt].total++;
                if (scoreCounts[scoreInt][status] !== undefined) {
                    scoreCounts[scoreInt][status]++;
                }
            }
        }
    });

    return scoreCounts.map((s, i) => ({ ...s, score: i === 0 ? '?' : i.toString() })).slice(1);
}
