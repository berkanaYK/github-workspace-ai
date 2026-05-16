import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ANILIST_URL = 'https://graphql.anilist.co';

// ── AniList GraphQL sorguları ──────────────────

const SEARCH_QUERY = `
  query ($search: String, $type: MediaType, $page: Int, $perPage: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
      media(search: $search, type: $type, sort: $sort) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          large
          extraLarge
        }
        bannerImage
        genres
        averageScore
        popularity
        status
        episodes
        chapters
        volumes
        seasonYear
        season
        format
        countryOfOrigin
        studios(isMain: true) {
          nodes {
            name
          }
        }
        staff(sort: RELEVANCE, perPage: 3) {
          nodes {
            name {
              full
            }
          }
        }
        characters(sort: ROLE, perPage: 10) {
          edges {
            role
            node {
              name {
                full
              }
              image {
                large
              }
            }
            voiceActors(language: JAPANESE) {
              name {
                full
              }
            }
          }
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
                english
              }
              type
              coverImage {
                large
              }
            }
          }
        }
        trailer {
          id
          site
        }
      }
    }
  }
`;

const TRENDING_QUERY = `
  query ($page: Int, $perPage: Int, $type: MediaType) {
    Page(page: $page, perPage: $perPage) {
      media(type: $type, sort: TRENDING_DESC) {
        id
        title { romaji english native }
        description
        coverImage { large extraLarge }
        bannerImage
        genres
        averageScore
        popularity
        status
        episodes
        chapters
        seasonYear
        format
        countryOfOrigin
        studios(isMain: true) { nodes { name } }
      }
    }
  }
`;

const DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id) {
      id
      type
      title { romaji english native }
      description
      coverImage { large extraLarge }
      bannerImage
      genres
      tags { name rank }
      averageScore
      popularity
      status
      episodes
      chapters
      volumes
      seasonYear
      season
      format
      countryOfOrigin
      duration
      studios(isMain: true) { nodes { name } }
      staff(sort: RELEVANCE, perPage: 5) {
        nodes { name { full } }
      }
      characters(sort: ROLE, perPage: 15) {
        edges {
          role
          node {
            name { full }
            image { large }
          }
          voiceActors(language: JAPANESE) {
            name { full }
          }
        }
      }
      relations {
        edges {
          relationType
          node {
            id
            title { romaji english }
            type
            coverImage { large }
          }
        }
      }
      streamingEpisodes {
        title
        thumbnail
        url
        site
      }
      trailer { id site }
    }
  }
`;

// ── AniList API çağrısı ───────────────────────
async function queryAniList(query: string, variables: any) {
  const { data } = await axios.post(ANILIST_URL, {
    query,
    variables,
  });
  return data.data;
}

// ── Durum dönüştürme ──────────────────────────
function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    RELEASING: 'ONGOING',
    FINISHED: 'COMPLETED',
    NOT_YET_RELEASED: 'UPCOMING',
    CANCELLED: 'HIATUS',
    HIATUS: 'HIATUS',
  };
  return statusMap[status] || 'ONGOING';
}

// ── Tip dönüştürme (ülkeye göre manhwa/manhua ayırt et) ──
function mapType(format: string, type: string, countryOfOrigin?: string): string {
  const upperType = (type || '').toUpperCase();
  const upperFormat = (format || '').toUpperCase();
  const upperCountry = (countryOfOrigin || '').toUpperCase();

  // type undefined ise format'tan çıkar
  const effectiveType = upperType || (upperFormat === 'TV' || upperFormat === 'TV_SHORT' || upperFormat === 'MOVIE' || upperFormat === 'SPECIAL' || upperFormat === 'OVA' || upperFormat === 'ONA' || upperFormat === 'MUSIC' ? 'ANIME' : 'MANGA');

  if (effectiveType === 'MANGA') {
    if (upperFormat === 'NOVEL') return 'NOVEL';
    if (upperCountry === 'KR') return 'MANHWA';
    if (upperCountry === 'CN' || upperCountry === 'TW') return 'MANHUA';
    return 'MANGA';
  }
  return 'ANIME';
}

// ── İlişki tipi dönüştürme ────────────────────
function mapRelationType(type: string): string {
  const map: Record<string, string> = {
    PREQUEL: 'PREQUEL',
    SEQUEL: 'SEQUEL',
    SPIN_OFF: 'SPIN_OFF',
    SIDE_STORY: 'SIDE_STORY',
    ADAPTATION: 'ADAPTATION',
    ALTERNATIVE: 'ALTERNATIVE',
    PARENT: 'ADAPTATION',
    CHARACTER: 'SIDE_STORY',
    SUMMARY: 'ALTERNATIVE',
    OTHER: 'ALTERNATIVE',
  };
  return map[type] || 'ALTERNATIVE';
}

// ── AniList verisini veritabanına kaydet ───────
export async function importFromAniList(anilistId: number) {
  const data = await queryAniList(DETAIL_QUERY, { id: anilistId });
  const media = data.Media;

  if (!media) throw new Error('İçerik bulunamadı.');

  const title = media.title.english || media.title.romaji || 'Bilinmeyen';
  const titleAlt = media.title.native || media.title.romaji || null;

  console.log('=== DEBUG ===');
  console.log('Title:', title);
  console.log('media.type:', media.type);
  console.log('media.format:', media.format);
  console.log('media.countryOfOrigin:', media.countryOfOrigin);

  const type = mapType(media.format, media.type || 'ANIME', media.countryOfOrigin);
  console.log('Mapped type:', type);
  console.log('=============');

  const status = mapStatus(media.status);

  // İçerik oluştur veya güncelle
  const content = await prisma.content.upsert({
    where: { id: `anilist_${anilistId}` },
    update: {
      title,
      titleAlt,
      synopsis: media.description?.replace(/<[^>]*>/g, '') || null,
      coverImage: media.coverImage?.extraLarge || media.coverImage?.large || null,
      bannerImage: media.bannerImage || null,
      rating: media.averageScore ? media.averageScore / 10 : 0,
      popularity: media.popularity || 0,
      year: media.seasonYear || null,
      studio: media.studios?.nodes?.[0]?.name || null,
      author: media.staff?.nodes?.[0]?.name?.full || null,
      status: status as any,
      type: type as any,
      trailerUrl: media.trailer?.site === 'youtube' ? `https://www.youtube.com/watch?v=${media.trailer.id}` : null,
    },
    create: {
      id: `anilist_${anilistId}`,
      title,
      titleAlt,
      type: type as any,
      status: status as any,
      synopsis: media.description?.replace(/<[^>]*>/g, '') || null,
      coverImage: media.coverImage?.extraLarge || media.coverImage?.large || null,
      bannerImage: media.bannerImage || null,
      rating: media.averageScore ? media.averageScore / 10 : 0,
      popularity: media.popularity || 0,
      year: media.seasonYear || null,
      studio: media.studios?.nodes?.[0]?.name || null,
      author: media.staff?.nodes?.[0]?.name?.full || null,
      trailerUrl: media.trailer?.site === 'youtube' ? `https://www.youtube.com/watch?v=${media.trailer.id}` : null,
    },
  });

  // Türleri ekle
  if (media.genres) {
    for (const genreName of media.genres) {
      const genre = await prisma.genre.upsert({
        where: { name: genreName },
        update: {},
        create: { name: genreName },
      });
      await prisma.contentGenre.upsert({
        where: { contentId_genreId: { contentId: content.id, genreId: genre.id } },
        update: {},
        create: { contentId: content.id, genreId: genre.id },
      });
    }
  }

  // Karakterleri ekle
  if (media.characters?.edges) {
    for (const edge of media.characters.edges) {
      const charName = edge.node?.name?.full;
      if (!charName) continue;

      const character = await prisma.character.upsert({
        where: { id: `char_${charName.replace(/\s/g, '_').toLowerCase()}` },
        update: { image: edge.node?.image?.large || null },
        create: {
          id: `char_${charName.replace(/\s/g, '_').toLowerCase()}`,
          name: charName,
          image: edge.node?.image?.large || null,
        },
      });

      await prisma.contentCharacter.upsert({
        where: {
          contentId_characterId: { contentId: content.id, characterId: character.id },
        },
        update: {},
        create: {
          contentId: content.id,
          characterId: character.id,
          role: edge.role === 'MAIN' ? 'MAIN' : 'SUPPORTING',
          voiceActor: edge.voiceActors?.[0]?.name?.full || null,
        },
      });
    }
  }

  return content;
}

// ── Trend içerikleri çek ──────────────────────
export async function fetchTrending(type: 'ANIME' | 'MANGA' = 'ANIME', page = 1, perPage = 20) {
  const data = await queryAniList(TRENDING_QUERY, { page, perPage, type });
  return data.Page.media;
}

// ── Arama yap ─────────────────────────────────
export async function searchAniList(search: string, type?: 'ANIME' | 'MANGA', page = 1, perPage = 20) {
  const variables: any = { search, page, perPage, sort: ['SEARCH_MATCH'] };
  if (type) variables.type = type;
  const data = await queryAniList(SEARCH_QUERY, variables);
  return data.Page;
}

// ── Toplu import ──────────────────────────────
export async function bulkImportTrending(type: 'ANIME' | 'MANGA' = 'ANIME', count = 20) {
  const trending = await fetchTrending(type, 1, count);
  const results = [];

  for (const media of trending) {
    try {
      const content = await importFromAniList(media.id);
      results.push({ success: true, title: content.title, id: content.id, type: content.type });
      // Rate limit: AniList 90 req/min
      await new Promise(resolve => setTimeout(resolve, 700));
    } catch (error: any) {
      results.push({ success: false, title: media.title?.romaji, error: error.message });
    }
  }

  return results;
}