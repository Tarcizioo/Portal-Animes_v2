import { anilistApi } from '@/services/anilistApi';

const ANILIST_CHARACTER_PREFIX = 'anilist-character-';

export function extractPictureUrls(payload = {}) {
  return Array.from(new Set(
    (payload.data || []).map((picture) => (
      picture.webp?.large_image_url
      || picture.jpg?.large_image_url
      || picture.webp?.image_url
      || picture.jpg?.image_url
    )).filter(Boolean)
  ));
}

export async function fetchFavoriteImageGallery({
  item,
  type,
  signal,
  client = anilistApi,
}) {
  const itemId = String(item?.id || '');
  if (!itemId || !['anime', 'character'].includes(type)) return [];

  if (type === 'anime') {
    if (!/^\d+$/.test(itemId)) return [];
    return client.getAnimeArtwork(itemId, { signal });
  }

  if (!itemId.startsWith(ANILIST_CHARACTER_PREFIX)) return [];
  const anilistId = itemId.replace(ANILIST_CHARACTER_PREFIX, '');
  if (!/^\d+$/.test(anilistId)) return [];

  return client.getCharacterArtwork(anilistId, { signal });
}