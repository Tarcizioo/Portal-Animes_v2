const ANILIST_URL = 'https://graphql.anilist.co';
const REQUEST_TIMEOUT_MS = 8000;

const MEDIA_FIELDS = `
  id
  idMal
  title { romaji english native }
  coverImage { extraLarge large medium color }
  description(asHtml: false)
  averageScore
  seasonYear
  season
  status
  format
  episodes
  genres
  popularity
  favourites
`;

const TOP_ANIME_QUERY = `
  query TopAnime($page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage lastPage }
      media(type: ANIME, isAdult: false, sort: [SCORE_DESC, POPULARITY_DESC]) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

const SEASONAL_ANIME_QUERY = `
  query SeasonalAnime($page: Int!, $perPage: Int!, $season: MediaSeason!, $seasonYear: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage lastPage }
      media(
        type: ANIME
        isAdult: false
        season: $season
        seasonYear: $seasonYear
        sort: [POPULARITY_DESC, SCORE_DESC]
      ) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

const HOME_GENRE_ROWS_QUERY = `
  query HomeGenreRows($perPage: Int!) {
    sciFi: Page(page: 1, perPage: $perPage) {
      media(type: ANIME, isAdult: false, genre: "Sci-Fi", sort: [POPULARITY_DESC, SCORE_DESC]) {
        ${MEDIA_FIELDS}
        bannerImage
      }
    }
    sports: Page(page: 1, perPage: $perPage) {
      media(type: ANIME, isAdult: false, genre: "Sports", sort: [POPULARITY_DESC, SCORE_DESC]) {
        ${MEDIA_FIELDS}
        bannerImage
      }
    }
    horror: Page(page: 1, perPage: $perPage) {
      media(type: ANIME, isAdult: false, genre_in: ["Horror", "Thriller"], sort: [POPULARITY_DESC, SCORE_DESC]) {
        ${MEDIA_FIELDS}
        bannerImage
      }
    }
  }
`;
const SCHEDULE_QUERY = `
  query AnimeSchedule($page: Int!, $perPage: Int!, $start: Int!, $end: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage lastPage total }
      airingSchedules(
        airingAt_greater: $start
        airingAt_lesser: $end
        sort: TIME
      ) {
        airingAt
        episode
        media { ${MEDIA_FIELDS} }
      }
    }
  }
`;

const RECOMMENDATIONS_QUERY = `
  query AnimeRecommendations($ids: [Int], $seedCount: Int!, $perSeed: Int!) {
    Page(page: 1, perPage: $seedCount) {
      media(idMal_in: $ids, type: ANIME) {
        idMal
        recommendations(page: 1, perPage: $perSeed, sort: RATING_DESC) {
          nodes {
            rating
            mediaRecommendation { ${MEDIA_FIELDS} }
          }
        }
      }
    }
  }
`;

const MEDIA_BATCH_QUERY = `
  query AnimeBatch($ids: [Int], $perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      pageInfo { currentPage hasNextPage lastPage total }
      media(idMal_in: $ids, type: ANIME) {
        ${MEDIA_FIELDS}
        studios(isMain: true) { nodes { id name } }
      }
    }
  }
`;

const RANDOM_ANIME_QUERY = `
  query RandomAnime($page: Int!) {
    Page(page: $page, perPage: 1) {
      media(type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

const ANIME_ARTWORK_QUERY = `
  query AnimeArtwork($idMal: Int!) {
    Media(idMal: $idMal, type: ANIME) {
      idMal
      title { romaji english native }
      coverImage { extraLarge large medium }
      bannerImage
      trailer { thumbnail }
    }
  }
`;

const CHARACTER_ARTWORK_QUERY = `
  query CharacterArtwork($id: Int!) {
    Character(id: $id) {
      id
      image { large medium }
    }
  }
`;
const ANIME_DETAILS_QUERY = `
  query AnimeDetails($idMal: Int!) {
    Media(idMal: $idMal, type: ANIME) {
      ${MEDIA_FIELDS}
      bannerImage
      duration
      source
      season
      favourites
      trailer { id site thumbnail }
      startDate { year month day }
      endDate { year month day }
      studios(isMain: true) { nodes { id name } }
      rankings { rank type allTime context }
      tags { name rank isMediaSpoiler isGeneralSpoiler }
      relations {
        edges {
          relationType
          node { idMal type title { romaji english native } }
        }
      }
      characters(page: 1, perPage: 25, sort: [ROLE, FAVOURITES_DESC]) {
        edges {
          role
          node {
            id
            name { full native }
            image { large medium }
            favourites
          }
        }
      }
      staff(page: 1, perPage: 25, sort: RELEVANCE) {
        edges {
          role
          node {
            id
            name { first last full native }
            image { large medium }
            primaryOccupations
          }
        }
      }
      recommendations(page: 1, perPage: 10, sort: RATING_DESC) {
        nodes {
          rating
          mediaRecommendation { ${MEDIA_FIELDS} }
        }
      }
    }
  }
`;

const TOP_CHARACTERS_QUERY = `
  query TopCharacters($page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage lastPage }
      characters(sort: FAVOURITES_DESC) {
        id
        name { full native }
        image { large medium }
        description(asHtml: false)
        favourites
        siteUrl
      }
    }
  }
`;

const TOP_PEOPLE_QUERY = `
  query TopPeople($page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage lastPage }
      staff(sort: FAVOURITES_DESC) {
        id
        name { first last full native }
        image { large medium }
        description(asHtml: false)
        favourites
        siteUrl
      }
    }
  }
`;

const SEARCH_STUDIOS_QUERY = `
  query SearchStudios($query: String!, $perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      pageInfo { currentPage hasNextPage lastPage total }
      studios(search: $query, sort: [SEARCH_MATCH, FAVOURITES_DESC]) {
        id
        name
        isAnimationStudio
        favourites
      }
    }
  }
`;

const STUDIO_DETAILS_QUERY = `
  query StudioDetails($id: Int!, $page: Int!, $perPage: Int!, $sort: [MediaSort]) {
    Studio(id: $id) {
      id
      name
      isAnimationStudio
      favourites
      media(page: $page, perPage: $perPage, sort: $sort, isMain: true) {
        pageInfo { currentPage hasNextPage lastPage total }
        nodes { ${MEDIA_FIELDS} }
      }
    }
  }
`;

const SEARCH_QUERY = `
  query SearchCatalog(
    $query: String!
    $perPage: Int!
    $includeAnime: Boolean!
    $includeCharacters: Boolean!
    $includePeople: Boolean!
  ) {
    animePage: Page(page: 1, perPage: $perPage) @include(if: $includeAnime) {
      media(search: $query, type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
        ${MEDIA_FIELDS}
      }
    }
    characterPage: Page(page: 1, perPage: $perPage) @include(if: $includeCharacters) {
      characters(search: $query, sort: FAVOURITES_DESC) {
        id
        name { full native }
        image { large medium }
        description(asHtml: false)
        favourites
        siteUrl
      }
    }
    peoplePage: Page(page: 1, perPage: $perPage) @include(if: $includePeople) {
      staff(search: $query, sort: FAVOURITES_DESC) {
        id
        name { first last full native }
        image { large medium }
        description(asHtml: false)
        favourites
        siteUrl
      }
    }
  }
`;

const CHARACTER_DETAILS_QUERY = `
  query CharacterDetails($id: Int!) {
    Character(id: $id) {
      id
      name { full native alternative }
      image { large medium }
      description(asHtml: false)
      favourites
      siteUrl
      media(page: 1, perPage: 25, sort: POPULARITY_DESC, type: ANIME) {
        edges {
          characterRole
          voiceActors(sort: FAVOURITES_DESC) {
            id
            name { first last full native }
            image { large medium }
            languageV2
          }
          node { ${MEDIA_FIELDS} }
        }
      }
    }
  }
`;

const PERSON_DETAILS_QUERY = `
  query PersonDetails($id: Int!) {
    Staff(id: $id) {
      id
      name { first last full native alternative }
      image { large medium }
      description(asHtml: false)
      favourites
      siteUrl
      dateOfBirth { year month day }
      homeTown
      primaryOccupations
      languageV2
      characterMedia(page: 1, perPage: 25, sort: POPULARITY_DESC) {
        edges {
          characterRole
          characters {
            id
            name { full native }
            image { large medium }
          }
          node { ${MEDIA_FIELDS} }
        }
      }
      staffMedia(page: 1, perPage: 25, sort: POPULARITY_DESC, type: ANIME) {
        edges {
          staffRole
          node { ${MEDIA_FIELDS} }
        }
      }
    }
  }
`;

const CATALOG_GENRES = {
  1: 'Action',
  2: 'Adventure',
  4: 'Comedy',
  7: 'Mystery',
  8: 'Drama',
  9: 'Ecchi',
  10: 'Fantasy',
  14: 'Horror',
  18: 'Mecha',
  19: 'Music',
  22: 'Romance',
  24: 'Sci-Fi',
  30: 'Sports',
  36: 'Slice of Life',
  37: 'Supernatural',
  40: 'Psychological',
  41: 'Thriller',
  66: 'Mahou Shoujo',
};

const CATALOG_TAGS = {
  23: 'School',
  27: 'Shounen',
  42: 'Seinen',
  1001: 'Isekai',
  1002: 'Historical',
  1003: 'Military',
  1004: 'Martial Arts',
  1005: 'Space',
};

const CATALOG_FORMATS = {
  tv: ['TV', 'TV_SHORT'],
  movie: ['MOVIE'],
  ova: ['OVA'],
  special: ['SPECIAL'],
  ona: ['ONA'],
  music: ['MUSIC'],
};

const CATALOG_STATUSES = {
  airing: ['RELEASING'],
  complete: ['FINISHED'],
  upcoming: ['NOT_YET_RELEASED'],
};

const CATALOG_LICENSES = {
  1977: ['Netflix'],
  1468: ['Crunchyroll'],
  102: ['Funimation'],
  417: ['Disney Plus'],
  1695: ['Hulu'],
};

const CATALOG_SORTS = {
  ranking: ['SCORE_DESC', 'POPULARITY_DESC'],
  score: ['SCORE_DESC', 'POPULARITY_DESC'],
  popularity: ['POPULARITY_DESC'],
  favorites: ['FAVOURITES_DESC'],
  newest: ['START_DATE_DESC'],
  oldest: ['START_DATE'],
  az: ['TITLE_ROMAJI'],
  za: ['TITLE_ROMAJI_DESC'],
};

const DAY_INDEXES = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const VOICE_LANGUAGE_PRIORITY = {
  Portuguese: 0,
  Spanish: 1,
  English: 2,
  Japanese: 3,
};

export function buildAniListCatalogVariables(filters = {}, page = 1, perPage = 24) {
  const genreIds = Array.isArray(filters.genres) ? filters.genres : [];
  const genres = genreIds.map((id) => CATALOG_GENRES[id]).filter(Boolean);
  const tags = genreIds.map((id) => CATALOG_TAGS[id]).filter(Boolean);
  const season = filters.season ? String(filters.season).toUpperCase() : null;
  const year = Number.parseInt(filters.year, 10);
  const hasYear = Number.isInteger(year) && year > 1900;

  return {
    page,
    perPage,
    search: String(filters.q || '').trim() || null,
    genres: genres.length ? genres : null,
    tags: tags.length ? tags : null,
    season,
    seasonYear: season && hasYear ? year : null,
    startDateGreater: hasYear ? year * 10000 : null,
    startDateLesser: hasYear ? (year * 10000) + 1231 : null,
    formats: CATALOG_FORMATS[filters.type] || null,
    statuses: CATALOG_STATUSES[filters.status] || null,
    licensedBy: CATALOG_LICENSES[filters.producers] || null,
    sort: CATALOG_SORTS[filters.orderBy] || CATALOG_SORTS.ranking,
  };
}

export function getAniListDayRange(day, referenceDate = new Date()) {
  const targetDay = DAY_INDEXES[String(day || '').toLowerCase()];
  const safeTarget = Number.isInteger(targetDay) ? targetDay : referenceDate.getDay();
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + safeTarget - start.getDay());

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start: Math.floor(start.getTime() / 1000) - 1,
    end: Math.floor(end.getTime() / 1000),
  };
}
function buildCatalogQuery(variables) {
  const definitions = ['$page: Int!', '$perPage: Int!'];
  const argumentsList = ['type: ANIME', 'isAdult: false'];
  const optionalArguments = [
    ['search', 'String', 'search'],
    ['genres', '[String]', 'genre_in'],
    ['tags', '[String]', 'tag_in'],
    ['season', 'MediaSeason', 'season'],
    ['seasonYear', 'Int', 'seasonYear'],
    ['startDateGreater', 'FuzzyDateInt', 'startDate_greater'],
    ['startDateLesser', 'FuzzyDateInt', 'startDate_lesser'],
    ['formats', '[MediaFormat]', 'format_in'],
    ['statuses', '[MediaStatus]', 'status_in'],
    ['licensedBy', '[String]', 'licensedBy_in'],
    ['sort', '[MediaSort]', 'sort'],
  ];

  optionalArguments.forEach(([variable, type, argument]) => {
    if (variables[variable] == null) return;
    definitions.push(`$${variable}: ${type}`);
    argumentsList.push(`${argument}: $${variable}`);
  });

  return `
    query AnimeCatalog(${definitions.join(', ')}) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { currentPage hasNextPage lastPage total }
        media(${argumentsList.join(', ')}) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
}

async function fetchAniList(query, variables, options = {}) {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener('abort', abortFromCaller, { once: true });

  try {
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.errors?.length) {
      const message = payload.errors?.[0]?.message || `AniList API Error: ${response.status}`;
      const error = new Error(message);
      error.status = payload.errors?.[0]?.status || response.status;
      throw error;
    }

    return payload.data;
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }
}

function cleanAniListText(value = '') {
  return String(value || '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/~!/g, '')
    .replace(/!~/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/(__|\*\*)/g, '')
    .trim();
}

function mapPagination(pageInfo = {}) {
  return {
    current_page: pageInfo.currentPage || 1,
    has_next_page: Boolean(pageInfo.hasNextPage),
    last_visible_page: pageInfo.lastPage || 1,
    items: { total: pageInfo.total || 0 },
  };
}

function mapImages(image = {}) {
  const largeImageUrl = image.extraLarge || image.large || image.medium || '';
  const imageUrl = image.large || image.medium || largeImageUrl;
  const smallImageUrl = image.medium || imageUrl;

  return {
    jpg: {
      image_url: imageUrl,
      small_image_url: smallImageUrl,
      large_image_url: largeImageUrl,
    },
    webp: {
      image_url: imageUrl,
      small_image_url: smallImageUrl,
      large_image_url: largeImageUrl,
    },
  };
}

function mapCharacter(character = {}) {
  return {
    mal_id: `anilist-character-${character.id}`,
    name: character.name?.full || character.name?.native || 'Personagem sem nome',
    name_kanji: character.name?.native || null,
    images: mapImages(character.image),
    about: cleanAniListText(character.description),
    favorites: character.favourites || 0,
    source: 'anilist',
  };
}

function mapPerson(person = {}) {
  return {
    mal_id: `anilist-person-${person.id}`,
    name: person.name?.full || person.name?.native || 'Pessoa sem nome',
    given_name: person.name?.first || null,
    family_name: person.name?.last || null,
    images: mapImages(person.image),
    about: cleanAniListText(person.description),
    favorites: person.favourites || 0,
    source: 'anilist',
  };
}

function mapMedia(media = {}) {
  return {
    mal_id: media.idMal || null,
    anilist_id: media.id || null,
    title: media.title?.english || media.title?.romaji || media.title?.native || 'Anime sem titulo',
    title_english: media.title?.english || null,
    title_japanese: media.title?.native || null,
    images: mapImages(media.coverImage),
    cover_color: media.coverImage?.color || null,
    banner: media.bannerImage || null,
    synopsis: cleanAniListText(media.description),
    score: media.averageScore ? media.averageScore / 10 : null,
    year: media.seasonYear || null,
    season: media.season?.toLowerCase() || null,
    status: mapAnimeStatus(media.status),
    type: mapAnimeFormat(media.format),
    episodes: media.episodes || null,
    genres: (media.genres || []).map((name) => ({ name })),
    studios: (media.studios?.nodes || []).map((studio) => ({
      mal_id: `anilist-studio-${studio.id}`,
      name: studio.name,
    })),
    members: media.popularity || 0,
    favorites: media.favourites || 0,
    source: 'anilist',
    data_source: 'anilist',
  };
}

function mapStudio(studio = {}) {
  const internalId = `anilist-studio-${studio.id}`;
  return {
    id: internalId,
    mal_id: internalId,
    name: studio.name || 'Estudio sem nome',
    title: studio.name || 'Estudio sem nome',
    titles: [{ type: 'Default', title: studio.name || 'Estudio sem nome' }],
    images: mapImages(),
    favorites: studio.favourites || 0,
    isAnimationStudio: Boolean(studio.isAnimationStudio),
    source: 'anilist',
  };
}

const GENRE_IDS = {
  Action: 1,
  Adventure: 2,
  Comedy: 4,
  Drama: 8,
  Ecchi: 9,
  Fantasy: 10,
  Hentai: 12,
  Horror: 14,
  Mystery: 7,
  Romance: 22,
  'Sci-Fi': 24,
  Sports: 30,
  Supernatural: 37,
  Suspense: 41,
  'Slice of Life': 36,
};

function humanizeEnum(value) {
  if (!value) return null;
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mapAnimeStatus(status) {
  const statuses = {
    FINISHED: 'Finished Airing',
    RELEASING: 'Currently Airing',
    NOT_YET_RELEASED: 'Not yet aired',
    CANCELLED: 'Cancelled',
    HIATUS: 'On Hiatus',
  };
  return statuses[status] || humanizeEnum(status);
}

function mapAnimeFormat(format) {
  const formats = {
    TV: 'TV',
    TV_SHORT: 'TV Short',
    MOVIE: 'Movie',
    SPECIAL: 'Special',
    OVA: 'OVA',
    ONA: 'ONA',
    MUSIC: 'Music',
  };
  return formats[format] || humanizeEnum(format);
}

function mapAniListDate(date = {}) {
  return {
    day: date.day || null,
    month: date.month || null,
    year: date.year || null,
  };
}

export function mapAniListAnimeDetails(media = {}) {
  if (!media?.idMal) return null;

  const anime = mapMedia(media);
  const ratedRanking = (media.rankings || []).find((ranking) => ranking.type === 'RATED' && ranking.allTime)
    || (media.rankings || []).find((ranking) => ranking.type === 'RATED');
  const popularityRanking = (media.rankings || []).find((ranking) => ranking.type === 'POPULAR' && ranking.allTime)
    || (media.rankings || []).find((ranking) => ranking.type === 'POPULAR');
  const trailerUrl = media.trailer?.site?.toLowerCase() === 'youtube' && media.trailer.id
    ? `https://www.youtube.com/embed/${media.trailer.id}`
    : null;
  const from = mapAniListDate(media.startDate);
  const to = mapAniListDate(media.endDate);
  const dateLabel = [fuzzyDateToIso(media.startDate), fuzzyDateToIso(media.endDate)].filter(Boolean).join(' to ');

  const data = {
    ...anime,
    title_japanese: media.title?.native || null,
    banner_image: media.bannerImage || null,
    trailer: {
      embed_url: trailerUrl,
      url: trailerUrl,
      images: { maximum_image_url: media.trailer?.thumbnail || null },
    },
    duration: media.duration ? `${media.duration} min per ep` : null,
    rating: null,
    status: mapAnimeStatus(media.status),
    studios: (media.studios?.nodes || []).map((studio) => ({
      name: studio.name,
      mal_id: `anilist-studio-${studio.id}`,
    })),
    genres: (media.genres || []).map((name) => ({ name, mal_id: GENRE_IDS[name] || null })),
    themes: (media.tags || [])
      .filter((tag) => tag.rank >= 60 && !tag.isMediaSpoiler && !tag.isGeneralSpoiler)
      .slice(0, 6)
      .map((tag) => ({ name: tag.name })),
    demographics: [],
    rank: ratedRanking?.rank || null,
    popularity: popularityRanking?.rank || null,
    members: media.popularity || 0,
    favorites: media.favourites || 0,
    aired: { string: dateLabel || null, prop: { from, to } },
    relations: (media.relations?.edges || [])
      .filter((edge) => edge.node?.idMal && edge.node?.type === 'ANIME')
      .map((edge) => ({
        relation: humanizeEnum(edge.relationType),
        entry: [{
          mal_id: edge.node.idMal,
          type: 'anime',
          name: edge.node.title?.english || edge.node.title?.romaji || edge.node.title?.native,
        }],
      })),
    season: media.season?.toLowerCase() || null,
    source: humanizeEnum(media.source),
    type: mapAnimeFormat(media.format),
  };

  const characters = (media.characters?.edges || []).map((edge) => ({
    character: mapCharacter(edge.node),
    role: edge.role === 'MAIN' ? 'Main' : 'Supporting',
  }));
  const staff = (media.staff?.edges || []).map((edge) => ({
    person: mapPerson(edge.node),
    positions: [edge.role || edge.node?.primaryOccupations?.[0] || 'Staff'],
  }));
  const recommendations = (media.recommendations?.nodes || [])
    .filter((recommendation) => recommendation.mediaRecommendation?.idMal)
    .map((recommendation) => ({
      entry: mapMedia(recommendation.mediaRecommendation),
      votes: recommendation.rating || 0,
    }));

  return { data, characters, staff, recommendations };
}

function fuzzyDateToIso(date = {}) {
  if (!date.year || !date.month || !date.day) return null;
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

export function mapAniListSchedules(page = {}) {
  const scheduledAnime = (page.airingSchedules || [])
    .filter((schedule) => schedule.media?.idMal)
    .map((schedule) => ({
      ...mapMedia(schedule.media),
      airing: {
        episode: schedule.episode || null,
        at: schedule.airingAt || null,
      },
    }));

  return Array.from(
    new Map(scheduledAnime.map((anime) => [String(anime.mal_id), anime])).values()
  );
}

export function mapAniListRecommendations(media = []) {
  const recommendations = media.flatMap((seed) => (
    seed.recommendations?.nodes || []
  )).filter((recommendation) => recommendation.mediaRecommendation?.idMal)
    .map((recommendation) => ({
      entry: mapMedia(recommendation.mediaRecommendation),
      votes: recommendation.rating || 0,
    }));

  return Array.from(
    new Map(
      recommendations
        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
        .map((recommendation) => [String(recommendation.entry.mal_id), recommendation])
    ).values()
  );
}

export function mapAniListArtwork(media = {}) {
  const cover = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium;
  return Array.from(new Set([
    cover,
    media.bannerImage,
    media.trailer?.thumbnail,
  ].filter(Boolean)));
}

export function mapAniListCharacterArtwork(character = {}) {
  const image = character.image?.large || character.image?.medium;
  return image ? [image] : [];
}
export function mapAniListAnimePage(page = {}) {
  return {
    data: (page.media || []).filter((media) => media.idMal).map(mapMedia),
    pagination: mapPagination(page.pageInfo),
    source: 'anilist',
  };
}

export function mapAniListCharacters(page = {}) {
  return {
    data: (page.characters || []).map(mapCharacter),
    pagination: mapPagination(page.pageInfo),
    source: 'anilist',
  };
}

export function mapAniListPeople(page = {}) {
  return {
    data: (page.staff || []).map(mapPerson),
    pagination: mapPagination(page.pageInfo),
    source: 'anilist',
  };
}

export function mapAniListStudios(page = {}) {
  return {
    data: (page.studios || []).map(mapStudio),
    pagination: mapPagination(page.pageInfo),
    source: 'anilist',
  };
}

export function mapAniListStudioDetails(studio) {
  if (!studio?.id) return null;

  return {
    studio: {
      ...mapStudio(studio),
      count: studio.media?.pageInfo?.total || 0,
      about: studio.isAnimationStudio
        ? `${studio.name} é um estúdio de animação.`
        : `${studio.name} participa da indústria de animes.`,
    },
    data: (studio.media?.nodes || []).filter((media) => media.idMal).map(mapMedia),
    pagination: mapPagination(studio.media?.pageInfo),
    source: 'anilist',
  };
}


export function mapAniListSearch(data = {}) {
  return {
    anime: (data.animePage?.media || []).filter((media) => media.idMal).map(mapMedia),
    characters: (data.characterPage?.characters || []).map(mapCharacter),
    people: (data.peoplePage?.staff || []).map(mapPerson),
  };
}

export function mapAniListCharacterDetails(data = {}) {
  const edges = data.media?.edges || [];
  const animeography = edges
    .filter((edge) => edge.node?.idMal)
    .map((edge) => ({
      anime: mapMedia(edge.node),
      role: edge.characterRole === 'MAIN' ? 'Main' : 'Supporting',
    }));

  const voiceActors = Array.from(
    new Map(
      edges.flatMap((edge) => edge.voiceActors || []).map((person) => [person.id, {
        person: mapPerson(person),
        language: person.languageV2 || 'Japanese',
      }])
    ).values()
  ).sort((a, b) => {
    const languageOrder = (VOICE_LANGUAGE_PRIORITY[a.language] ?? 99)
      - (VOICE_LANGUAGE_PRIORITY[b.language] ?? 99);
    if (languageOrder !== 0) return languageOrder;
    return (b.person.favorites || 0) - (a.person.favorites || 0);
  });
  const images = mapImages(data.image);

  return {
    character: {
      id: `anilist-character-${data.id}`,
      name: data.name?.full || data.name?.native || 'Personagem sem nome',
      name_kanji: data.name?.native || null,
      about: cleanAniListText(data.description),
      favorites: data.favourites || 0,
      image: images.jpg.image_url,
      large_image: images.jpg.large_image_url,
      nicknames: data.name?.alternative || [],
      source: 'anilist',
    },
    animeography,
    voiceActors,
    pictures: images.jpg.image_url ? [{ jpg: images.jpg }] : [],
  };
}

export function mapAniListPersonDetails(data = {}) {
  const voices = (data.characterMedia?.edges || []).flatMap((edge) => {
    if (!edge.node?.idMal) return [];
    const anime = mapMedia(edge.node);

    return (edge.characters || []).map((character) => ({
      anime,
      character: mapCharacter(character),
      role: edge.characterRole === 'MAIN' ? 'Main' : 'Supporting',
    }));
  });
  const animePositions = (data.staffMedia?.edges || [])
    .filter((edge) => edge.node?.idMal)
    .map((edge) => ({ anime: mapMedia(edge.node), position: edge.staffRole || 'Staff' }));
  const person = mapPerson(data);

  return {
    person: {
      ...person,
      birthday: fuzzyDateToIso(data.dateOfBirth),
      website_url: data.siteUrl || null,
      hometown: data.homeTown || null,
      occupations: data.primaryOccupations || [],
      language: data.languageV2 || null,
    },
    voices,
    animePositions,
    pictures: person.images.jpg.image_url ? [{ jpg: person.images.jpg }] : [],
  };
}

export const anilistApi = {
  async getCatalog(filters = {}, page = 1, limit = 24, options = {}) {
    const variables = buildAniListCatalogVariables(filters, page, limit);
    const data = await fetchAniList(buildCatalogQuery(variables), variables, options);
    return mapAniListAnimePage(data.Page);
  },

  async getSchedules(day, options = {}) {
    const range = getAniListDayRange(day);
    const data = await fetchAniList(SCHEDULE_QUERY, {
      page: 1,
      perPage: 50,
      ...range,
    }, options);
    return { data: mapAniListSchedules(data.Page), source: 'anilist' };
  },

  async getRecommendations(seedIds = [], perSeed = 10, options = {}) {
    const ids = Array.from(new Set(seedIds.map(Number).filter(Number.isInteger))).slice(0, 25);
    if (!ids.length) return { data: [], source: 'anilist' };

    const data = await fetchAniList(RECOMMENDATIONS_QUERY, {
      ids,
      seedCount: ids.length,
      perSeed,
    }, options);

    return {
      data: mapAniListRecommendations(data.Page?.media || []),
      source: 'anilist',
    };
  },

  async getHomeGenreRows(limit = 18, options = {}) {
    const data = await fetchAniList(HOME_GENRE_ROWS_QUERY, { perPage: limit }, options);
    const mapRow = (page) => (page?.media || []).filter((media) => media.idMal).map(mapMedia);

    return {
      data: {
        scifi: mapRow(data.sciFi),
        sports: mapRow(data.sports),
        horror: mapRow(data.horror),
      },
      source: 'anilist',
    };
  },
  async getAnimeByMalIds(ids = [], options = {}) {
    const normalizedIds = Array.from(new Set(ids.map(Number).filter(Number.isInteger)));
    const items = [];

    for (let index = 0; index < normalizedIds.length; index += 50) {
      const chunk = normalizedIds.slice(index, index + 50);
      const data = await fetchAniList(MEDIA_BATCH_QUERY, {
        ids: chunk,
        perPage: chunk.length,
      }, options);
      items.push(...(data.Page?.media || []).filter((media) => media.idMal).map(mapMedia));
    }

    return { data: items, source: 'anilist' };
  },

  async getRandomAnime(options = {}) {
    const page = Math.floor(Math.random() * 1000) + 1;
    const data = await fetchAniList(RANDOM_ANIME_QUERY, { page }, options);
    const media = data.Page?.media?.find((item) => item.idMal);
    return { data: media ? mapMedia(media) : null, source: 'anilist' };
  },

  async getAnimeArtwork(id, options = {}) {
    const data = await fetchAniList(ANIME_ARTWORK_QUERY, { idMal: Number(id) }, options);
    return mapAniListArtwork(data.Media);
  },

  async getCharacterArtwork(id, options = {}) {
    const data = await fetchAniList(CHARACTER_ARTWORK_QUERY, { id: Number(id) }, options);
    return mapAniListCharacterArtwork(data.Character);
  },
  async getTopAnime(page = 1, limit = 25, options = {}) {
    const data = await fetchAniList(TOP_ANIME_QUERY, { page, perPage: limit }, options);
    return mapAniListAnimePage(data.Page);
  },

  async getSeasonalAnime(season, seasonYear, page = 1, limit = 25, options = {}) {
    const data = await fetchAniList(SEASONAL_ANIME_QUERY, {
      page,
      perPage: limit,
      season,
      seasonYear,
    }, options);
    return mapAniListAnimePage(data.Page);
  },
  async getAnimeByMalId(id, options = {}) {
    const data = await fetchAniList(ANIME_DETAILS_QUERY, { idMal: Number(id) }, options);
    return mapAniListAnimeDetails(data.Media);
  },

  async getTopCharacters(page = 1, limit = 25, options = {}) {
    const data = await fetchAniList(TOP_CHARACTERS_QUERY, { page, perPage: limit }, options);
    return mapAniListCharacters(data.Page);
  },

  async getTopPeople(page = 1, limit = 25, options = {}) {
    const data = await fetchAniList(TOP_PEOPLE_QUERY, { page, perPage: limit }, options);
    return mapAniListPeople(data.Page);
  },

  async searchStudios(query, limit = 10, options = {}) {
    const data = await fetchAniList(SEARCH_STUDIOS_QUERY, { query, perPage: limit }, options);
    return mapAniListStudios(data.Page);
  },

  async getStudioDetails(id, page = 1, limit = 25, sort = ['POPULARITY_DESC'], options = {}) {
    const data = await fetchAniList(STUDIO_DETAILS_QUERY, {
      id: Number(id),
      page,
      perPage: limit,
      sort,
    }, options);
    return mapAniListStudioDetails(data.Studio);
  },

  async searchCatalog(query, limit = 10, categories = {}, options = {}) {
    const variables = {
      query,
      perPage: limit,
      includeAnime: categories.anime !== false,
      includeCharacters: categories.characters !== false,
      includePeople: categories.people !== false,
    };
    const data = await fetchAniList(SEARCH_QUERY, variables, options);
    return mapAniListSearch(data);
  },

  async getCharacterDetails(id, options = {}) {
    const data = await fetchAniList(CHARACTER_DETAILS_QUERY, { id: Number(id) }, options);
    return mapAniListCharacterDetails(data.Character);
  },

  async getPersonDetails(id, options = {}) {
    const data = await fetchAniList(PERSON_DETAILS_QUERY, { id: Number(id) }, options);
    return mapAniListPersonDetails(data.Staff);
  },
};
