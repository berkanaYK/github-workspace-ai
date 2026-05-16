import { Router, Request, Response } from 'express';
import { animeService } from '../services/consumet';

const router = Router();

// ── GET /watch/info/:contentId ────────────────
router.get('/info/:contentId', async (req: Request, res: Response) => {
  try {
    const contentId = req.params.contentId as string;

    const { malId, title } = await animeService.getMALId(contentId);
    if (!malId) {
      return res.status(404).json({ error: 'Anime bulunamadı.' });
    }

    await new Promise(resolve => setTimeout(resolve, 350));
    const info = await animeService.getAnimeInfo(malId);
    if (!info) {
      return res.status(404).json({ error: 'Anime bilgisi alınamadı.' });
    }

    await new Promise(resolve => setTimeout(resolve, 350));
    const episodes = await animeService.getAllEpisodes(malId);

    res.json({
      malId,
      title: info.title_english || info.title || title,
      titleJapanese: info.title_japanese,
      totalEpisodes: info.episodes,
      status: info.status,
      image: info.images?.jpg?.large_image_url,
      episodes: episodes.map((ep: any) => ({
        number: ep.mal_id,
        title: ep.title || `Bölüm ${ep.mal_id}`,
        titleJapanese: ep.title_japanese,
        aired: ep.aired,
        filler: ep.filler,
        recap: ep.recap,
      })),
    });
  } catch (error: any) {
    console.error('Watch info error:', error);
    res.status(500).json({ error: 'Anime bilgisi alınamadı.' });
  }
});

// ── GET /watch/embed/:contentId/:episode ──────
router.get('/embed/:contentId/:episode', async (req: Request, res: Response) => {
  try {
    const contentId = req.params.contentId as string;
    const episode = Number(req.params.episode);

    if (!Number.isInteger(episode) || episode < 1) {
      return res.status(400).json({ error: 'Geçersiz bölüm numarası.' });
    }

    const { malId, title } = await animeService.getMALId(contentId);
    if (!malId || !title) {
      return res.status(404).json({ error: 'Anime bulunamadı.' });
    }

    await new Promise(resolve => setTimeout(resolve, 350));
    const info = await animeService.getAnimeInfo(malId);

    let finalTitle = info?.title || info?.title_english || title;
    const year = info?.year || info?.aired?.prop?.from?.year;
    if (year && !finalTitle.includes(String(year))) {
      finalTitle = `${finalTitle} (${year})`;
    }

    const watchUrls = animeService.getWatchUrls(finalTitle, episode);
    const attempts: Array<{ provider: string; pageUrl: string; sourceCount: number }> = [];
    let pageUrl = watchUrls.trSub;
    let sources: Awaited<ReturnType<typeof animeService.scrapeVideoSources>> = [];

    for (const [provider, candidateUrl] of Object.entries(watchUrls)) {
      console.log('Scraping URL:', candidateUrl);

    // Sayfadan video kaynaklarını çek
      const candidateSources = await animeService.scrapeVideoSources(candidateUrl);
      attempts.push({
        provider,
        pageUrl: candidateUrl,
        sourceCount: candidateSources.length,
      });

      console.log(`Found ${candidateSources.length} sources from ${provider}`);

      if (candidateSources.length > 0) {
        pageUrl = candidateUrl;
        sources = candidateSources;
        break;
      }
    }

    res.json({
      episode,
      title: finalTitle,
      totalEpisodes: info?.episodes || null,
      pageUrl,
      attempts,
      sourceCount: sources.length,
      sources,
    });
  } catch (error: any) {
    console.error('Embed error:', error);
    res.status(500).json({ error: 'Video kaynağı alınamadı.' });
  }
});

// ── GET /watch/search/:query ──────────────────
router.get('/search/:query', async (req: Request, res: Response) => {
  try {
    const query = req.params.query as string;
    const results = await animeService.searchAnime(query);

    res.json({
      results: results.map((r: any) => ({
        malId: r.mal_id,
        title: r.title_english || r.title,
        titleJapanese: r.title_japanese,
        image: r.images?.jpg?.large_image_url,
        episodes: r.episodes,
        status: r.status,
        rating: r.score,
        type: r.type,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Arama başarısız.' });
  }
});

export default router;
