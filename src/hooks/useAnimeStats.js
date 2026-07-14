import { useMemo } from 'react';

const DEFAULT_STATS = {
        overview: {
            totalAnimes: 0,
            totalEpisodes: 0,
            totalHours: 0,
            totalDays: 0,
            averageScore: 0,
            favoritesCount: 0
        },
        genres: [],
        status: [],
        scoreDistribution: [],
        types: [],
        topRated: []
    };

export function useAnimeStats(library) {
    const stats = useMemo(() => {
        if (!library || library.length === 0) return DEFAULT_STATS;

        const totalAnimes = library.length;
        
        // --- Overview Stats ---
        const overview = {
            totalAnimes,
            episodesWatched: 0,
            minutesWatched: 0,
            daysWatched: 0,
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
        const libraryByStatus = {
            watching: [],
            completed: [],
            plan_to_watch: [],
            dropped: [],
            paused: []
        };

        // --- Score Distribution ---
         const scoreCounts = Array.from({ length: 11 }, () => ({
            total: 0,
            watching: 0,
            completed: 0,
            plan_to_watch: 0,
            dropped: 0,
            paused: 0
        }));

        const typeCounts = {};

        library.forEach(anime => {
            const currentEp = parseInt(anime.currentEp) || 0;
            const duration = parseInt(anime.duration) || 24; // Default to 24min if unknown
            const score = Number(anime.score) || 0;
            const status = anime.status || 'plan_to_watch';
            const type = anime.type || 'TV';

            // Overview
            overview.episodesWatched += currentEp;
            overview.minutesWatched += (currentEp * duration);
            
            if (overview[status] !== undefined) overview[status]++;
            // if (status === 'completed') overview.completed = (overview.completed || 0); // Already incremented above? actually line 41 does it.
            
            if (anime.isFavorite) overview.favorites++;

            if (score > 0) {
                totalScoreSum += score;
                totalScoreCount++;
                
                // Score Distribution
                const scoreInt = Math.floor(score);
                if (scoreInt >= 1 && scoreInt <= 10) {
                    scoreCounts[scoreInt].total++;
                    if (scoreCounts[scoreInt][status] !== undefined) {
                        scoreCounts[scoreInt][status]++;
                    }
                }
            }

            // Group by status for top rated filtering
            if (libraryByStatus[status]) {
                libraryByStatus[status].push(anime);
            }

             // Type Distribution
             typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        overview.averageScore = totalScoreCount > 0 ? (totalScoreSum / totalScoreCount).toFixed(1) : 0;
        overview.daysWatched = (overview.minutesWatched / 1440).toFixed(1);

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
                totalEpisodes: overview.episodesWatched,
                totalHours: Math.round(overview.minutesWatched / 60),
                totalDays: overview.daysWatched,
                averageScore: overview.averageScore,
                favoritesCount: overview.favorites
            },
            genres,
            status: statusData,
            scoreDistribution: calculateScoreDistribution(library), // Use helper
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
            const currentEp = parseInt(anime.currentEp) || 0;
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
                        episodeSum: 0
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
                genreCounts[genre].episodeSum += currentEp;
            });
        }
    });

    return Object.values(genreCounts)
        .map(g => {
            const avg = g.scoreCount > 0 ? (g.scoreSum / g.scoreCount) : 0;
            const minutes = g.episodeSum * 24;
            const days = minutes / 1440; // 60 * 24
            const percent = totalAnimes > 0 ? (g.total / totalAnimes) * 100 : 0;
            
            return {
                ...g,
                averageScore: Number(avg.toFixed(1)),
                daysWatched: Number(days.toFixed(1)),
                percentage: Number(percent.toFixed(1))
            };
        })
        .sort((a, b) => b.total - a.total);
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

    // Use 'score' key instead of 'name' to match Recharts dataKey in Stats.jsx
    return scoreCounts.map((s, i) => ({ ...s, score: i === 0 ? '?' : i.toString() })).slice(1);
}
