import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { bulkImportTrending, importFromAniList, searchAniList } from '../services/anilist';

const router = Router();
const prisma = new PrismaClient();

// ── GET /home ─────────────────────────────────
// ── GET /home ─────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const [featured, anime, manga, manhwa, manhua, novel, topRated] = await Promise.all([
      prisma.content.findMany({
        orderBy: { popularity: 'desc' },
        take: 5,
      }),
      prisma.content.findMany({
        where: { type: 'ANIME' },
        orderBy: { popularity: 'desc' },
        take: 20,
      }),
      prisma.content.findMany({
        where: { type: 'MANGA' },
        orderBy: { popularity: 'desc' },
        take: 20,
      }),
      prisma.content.findMany({
        where: { type: 'MANHWA' },
        orderBy: { popularity: 'desc' },
        take: 20,
      }),
      prisma.content.findMany({
        where: { type: 'MANHUA' },
        orderBy: { popularity: 'desc' },
        take: 20,
      }),
      prisma.content.findMany({
        where: { type: 'NOVEL' },
        orderBy: { popularity: 'desc' },
        take: 20,
      }),
      prisma.content.findMany({
        orderBy: { rating: 'desc' },
        take: 20,
      }),
    ]);

    res.json({
      featured,
      trending: [...anime, ...manga, ...manhwa, ...manhua, ...novel],
      anime,
      manga,
      manhwa,
      manhua,
      novel,
      topRated,
      newEpisodes: [],
    });
  } catch (error: any) {
    console.error('Home error:', error);
    res.status(500).json({ error: 'Ana sayfa içerikleri alınamadı.' });
  }
});

// ── GET /home/genres ──────────────────────────
router.get('/genres', async (req: Request, res: Response) => {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(genres);
  } catch (error) {
    res.status(500).json({ error: 'Türler alınamadı.' });
  }
});

// ── POST /home/import-trending ────────────────
router.post('/import-trending', async (req: Request, res: Response) => {
  try {
    const { type = 'ANIME', count = 20 } = req.body;
    const results = await bulkImportTrending(type, count);
    res.json({
      message: `${results.filter(r => r.success).length} içerik başarıyla eklendi.`,
      results,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'İçerik import edilemedi.' });
  }
});

// ── POST /home/import-single ──────────────────
router.post('/import-single', async (req: Request, res: Response) => {
  try {
    const { anilistId } = req.body;
    if (!anilistId) return res.status(400).json({ error: 'AniList ID gerekli.' });
    const content = await importFromAniList(anilistId);
    res.json({ message: 'İçerik eklendi!', content });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'İçerik eklenemedi.' });
  }
});

// ── GET /home/search-anilist ──────────────────
router.get('/search-anilist', async (req: Request, res: Response) => {
  try {
    const { query, type } = req.query;
    if (!query) return res.status(400).json({ error: 'Arama terimi gerekli.' });
    const results = await searchAniList(query as string, type as any);
    res.json(results);
  } catch (error: any) {
    console.error('AniList search error:', error);
    res.status(500).json({ error: 'AniList araması yapılamadı.' });
  }
});

// ── POST /home/import-by-country ──────────────
router.post('/import-by-country', async (req: Request, res: Response) => {
  try {
    const { country = 'KR', count = 15 } = req.body;

    const COUNTRY_QUERY = `
      query ($page: Int, $perPage: Int, $country: CountryCode) {
        Page(page: $page, perPage: $perPage) {
          media(type: MANGA, countryOfOrigin: $country, sort: POPULARITY_DESC) {
            id
          }
        }
      }
    `;

    const axios = require('axios');
    const { data } = await axios.post('https://graphql.anilist.co', {
      query: COUNTRY_QUERY,
      variables: { page: 1, perPage: count, country },
    });

    const mediaList = data.data.Page.media;
    const results = [];

    for (const media of mediaList) {
      try {
        const content = await importFromAniList(media.id);
        results.push({ success: true, title: content.title, id: content.id, type: content.type });
        await new Promise(resolve => setTimeout(resolve, 700));
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }

    res.json({
      message: `${results.filter(r => r.success).length} içerik eklendi.`,
      results,
    });
  } catch (error: any) {
    console.error('Country import error:', error);
    res.status(500).json({ error: 'İçerik import edilemedi.' });
  }
});

// ── POST /home/import-novels ──────────────────
router.post('/import-novels', async (req: Request, res: Response) => {
  try {
    const { count = 15 } = req.body;

    const NOVEL_QUERY = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: MANGA, format: NOVEL, sort: POPULARITY_DESC) {
            id
          }
        }
      }
    `;

    const axios = require('axios');
    const { data } = await axios.post('https://graphql.anilist.co', {
      query: NOVEL_QUERY,
      variables: { page: 1, perPage: count },
    });

    const mediaList = data.data.Page.media;
    const results = [];

    for (const media of mediaList) {
      try {
        const content = await importFromAniList(media.id);
        results.push({ success: true, title: content.title, id: content.id, type: content.type });
        await new Promise(resolve => setTimeout(resolve, 700));
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }

    res.json({
      message: `${results.filter(r => r.success).length} novel eklendi.`,
      results,
    });
  } catch (error: any) {
    console.error('Novel import error:', error);
    res.status(500).json({ error: 'Novel import edilemedi.' });
  }
});

export default router;