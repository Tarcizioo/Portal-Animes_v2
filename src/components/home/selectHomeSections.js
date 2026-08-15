const DEFAULT_RAIL_LIMIT = 12;

function getAnimeId(anime) {
  const id = anime?.id ?? anime?.mal_id;
  return id == null ? null : String(id);
}

function timestampSeconds(value) {
  if (typeof value?.seconds === 'number') return value.seconds;
  if (typeof value?.toMillis === 'function') return value.toMillis() / 1000;
  return 0;
}

function addIds(target, items = []) {
  items.forEach((item) => {
    const id = getAnimeId(item);
    if (id) target.add(id);
  });
}

function takeUnique(items = [], excludedIds, limit = DEFAULT_RAIL_LIMIT) {
  const selected = [];

  for (const item of items) {
    const id = getAnimeId(item);
    if (!id || excludedIds.has(id)) continue;
    excludedIds.add(id);
    selected.push(item);
    if (selected.length >= limit) break;
  }

  return selected;
}

export function selectHomeSections({
  featuredAnimes = [],
  popularAnimes = [],
  seasonalAnimes = [],
  recommendations = [],
  library = [],
  limit = DEFAULT_RAIL_LIMIT,
} = {}) {
  const discoveryExclusions = new Set();
  addIds(discoveryExclusions, featuredAnimes);
  addIds(discoveryExclusions, recommendations);
  addIds(discoveryExclusions, library);

  const nextChoices = library
    .filter((anime) => anime.status === 'plan_to_watch' || anime.status === 'paused')
    .sort((first, second) => {
      if (Boolean(first.isFavorite) !== Boolean(second.isFavorite)) {
        return Number(Boolean(second.isFavorite)) - Number(Boolean(first.isFavorite));
      }
      return timestampSeconds(second.lastUpdated) - timestampSeconds(first.lastUpdated);
    })
    .slice(0, limit)
    .map((anime) => ({
      ...anime,
      episodes: anime.episodes || anime.totalEp || null,
    }));

  const acclaimed = takeUnique(popularAnimes, discoveryExclusions, limit);
  const seasonal = takeUnique(seasonalAnimes, discoveryExclusions, limit);

  return { nextChoices, acclaimed, seasonal };
}
