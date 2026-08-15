export function selectContinueWatching(animes = [], limit = 4) {
  return [...animes]
    .filter((anime) => anime?.status === 'watching' && (!anime.totalEp || (anime.currentEp || 0) < anime.totalEp))
    .sort((a, b) => (b.lastProgressAt?.seconds || b.lastUpdated?.seconds || 0) - (a.lastProgressAt?.seconds || a.lastUpdated?.seconds || 0))
    .slice(0, limit);
}
