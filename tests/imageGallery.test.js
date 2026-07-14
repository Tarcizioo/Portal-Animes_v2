import { describe, expect, it, vi } from 'vitest';
import {
  extractPictureUrls,
  fetchFavoriteImageGallery,
} from '@/services/imageGallery';

describe('imageGallery', () => {
  it('prefers large images and removes duplicated URLs', () => {
    const pictures = extractPictureUrls({
      data: [
        { webp: { large_image_url: 'large.webp' }, jpg: { image_url: 'small.jpg' } },
        { jpg: { large_image_url: 'large.webp' } },
        { jpg: { image_url: 'fallback.jpg' } },
      ],
    });

    expect(pictures).toEqual(['large.webp', 'fallback.jpg']);
  });

  it('loads anime artwork from AniList by MAL ID', async () => {
    const signal = new AbortController().signal;
    const client = {
      getAnimeArtwork: vi.fn().mockResolvedValue(['cover.jpg', 'banner.jpg']),
    };

    await expect(fetchFavoriteImageGallery({
      item: { id: 5114, title: 'Fullmetal Alchemist' },
      type: 'anime',
      signal,
      client,
    })).resolves.toEqual(['cover.jpg', 'banner.jpg']);

    expect(client.getAnimeArtwork).toHaveBeenCalledWith('5114', { signal });
  });

  it('loads character artwork from AniList by internal ID', async () => {
    const client = {
      getCharacterArtwork: vi.fn().mockResolvedValue(['levi.jpg']),
    };

    await expect(fetchFavoriteImageGallery({
      item: { id: 'anilist-character-45627', name: 'Levi' },
      type: 'character',
      client,
    })).resolves.toEqual(['levi.jpg']);

    expect(client.getCharacterArtwork).toHaveBeenCalledWith('45627', { signal: undefined });
  });

  it('does not query AniList with a legacy character ID', async () => {
    const client = {
      getCharacterArtwork: vi.fn(),
    };

    await expect(fetchFavoriteImageGallery({
      item: { id: '456', name: 'Legacy character' },
      type: 'character',
      client,
    })).resolves.toEqual([]);

    expect(client.getCharacterArtwork).not.toHaveBeenCalled();
  });
});