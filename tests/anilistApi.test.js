import { describe, expect, it } from 'vitest';
import {
  mapAniListCharacterDetails,
  mapAniListCharacters,
  mapAniListPeople,
  mapAniListPersonDetails,
  mapAniListSearch,
} from '../src/services/anilistApi';

const media = {
  idMal: 16498,
  title: { english: 'Attack on Titan', romaji: 'Shingeki no Kyojin' },
  coverImage: { large: 'https://example.com/anime.jpg' },
  averageScore: 85,
};

describe('AniList API mappings', () => {
  it('maps ranking characters to internal Portal IDs', () => {
    const result = mapAniListCharacters({
      pageInfo: { currentPage: 2, hasNextPage: true, lastPage: 10 },
      characters: [{
        id: 45627,
        name: { full: 'Levi', native: 'リヴァイ' },
        image: { large: 'https://example.com/levi.jpg' },
        description: 'Captain',
        favourites: 100,
      }],
    });

    expect(result.data[0]).toMatchObject({
      mal_id: 'anilist-character-45627',
      name: 'Levi',
      favorites: 100,
      source: 'anilist',
    });
    expect(result.pagination.has_next_page).toBe(true);
  });

  it('maps ranking staff to internal Portal IDs', () => {
    const result = mapAniListPeople({
      staff: [{
        id: 95075,
        name: { first: 'Kana', last: 'Hanazawa', full: 'Kana Hanazawa' },
        image: { medium: 'https://example.com/kana.jpg' },
        favourites: 50,
      }],
    });

    expect(result.data[0]).toMatchObject({
      mal_id: 'anilist-person-95075',
      name: 'Kana Hanazawa',
      given_name: 'Kana',
      family_name: 'Hanazawa',
    });
  });

  it('maps search categories and ignores anime without a MAL route', () => {
    const result = mapAniListSearch({
      animePage: { media: [media, { idMal: null, title: { romaji: 'No MAL ID' } }] },
      characterPage: { characters: [{ id: 45627, name: { full: 'Levi' } }] },
      peoplePage: { staff: [{ id: 95591, name: { full: 'Kenjirou Tsuda' } }] },
    });

    expect(result.anime).toHaveLength(1);
    expect(result.characters[0].mal_id).toBe('anilist-character-45627');
    expect(result.people[0].mal_id).toBe('anilist-person-95591');
  });

  it('maps a character profile with internal voice actor links', () => {
    const result = mapAniListCharacterDetails({
      id: 45627,
      name: { full: 'Levi', alternative: ['Captain Levi'] },
      image: { large: 'https://example.com/levi.jpg' },
      media: {
        edges: [{
          characterRole: 'MAIN',
          node: media,
          voiceActors: [
            { id: 95118, name: { full: 'Hiroshi Kamiya' }, languageV2: 'Japanese' },
            { id: 95119, name: { full: 'Dublador BR' }, languageV2: 'Portuguese' },
            { id: 95120, name: { full: 'Doblador ES' }, languageV2: 'Spanish' },
          ],
        }],
      },
    });

    expect(result.character.id).toBe('anilist-character-45627');
    expect(result.animeography[0].anime.mal_id).toBe(16498);
    expect(result.voiceActors.map((voice) => voice.language)).toEqual([
      'Portuguese',
      'Spanish',
      'Japanese',
    ]);
    expect(result.voiceActors[0].person.mal_id).toBe('anilist-person-95119');
  });

  it('maps a person profile with internal character links', () => {
    const result = mapAniListPersonDetails({
      id: 95591,
      name: { full: 'Kenjirou Tsuda' },
      characterMedia: {
        edges: [{
          characterRole: 'SUPPORTING',
          node: media,
          characters: [{ id: 133704, name: { full: 'Kento Nanami' } }],
        }],
      },
      staffMedia: { edges: [{ staffRole: 'Director', node: media }] },
    });

    expect(result.person.mal_id).toBe('anilist-person-95591');
    expect(result.voices[0].character.mal_id).toBe('anilist-character-133704');
    expect(result.animePositions[0].anime.mal_id).toBe(16498);
  });
});
