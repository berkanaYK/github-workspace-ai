import axios from 'axios';
import * as cheerio from 'cheerio';

const JIKAN_URL = 'https://api.jikan.moe/v4';

type VideoSourceType = 'embed' | 'direct';

type VideoSource = {
  name: string;
  url: string;
  type: VideoSourceType;
  quality?: string;
  referer?: string;
};

type AddSource = (
  rawUrl: string | undefined,
  label?: string,
  type?: VideoSourceType,
  referer?: string,
) => void;

const PROVIDER_NAMES: Record<string, string> = {
  vidmoly: 'Vidmoly',
  sibnet: 'Sibnet',
  sendvid: 'SendVid',
  yourupload: 'YourUpload',
  mp4upload: 'MP4Upload',
  streamlare: 'Streamlare',
  upstream: 'Upstream',
  dood: 'DoodStream',
  mixdrop: 'MixDrop',
  filemoon: 'FileMoon',
  streamtape: 'StreamTape',
  uqload: 'Uqload',
  vidguard: 'VidGuard',
  vidhide: 'VidHide',
  filelions: 'FileLions',
  voe: 'VOE',
  ok: 'OK.ru',
  vk: 'VK',
  mail: 'Mail.ru',
  myvi: 'Myvi',
};

const PROVIDER_PATTERN = /(vidmoly|sibnet|sendvid|yourupload|mp4upload|streamlare|upstream|dood|mixdrop|filemoon|streamtape|uqload|vidguard|vidhide|filelions|voe\.sx|ok\.ru|vk\.com|mail\.ru|myvi)/i;
const DIRECT_VIDEO_PATTERN = /\.(m3u8|mp4|webm)(?:[?#]|$)/i;

const BASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
};

const createHeaders = (referer?: string, ajax = false) => ({
  ...BASE_HEADERS,
  ...(referer ? { Referer: referer } : {}),
  ...(ajax ? { 'X-Requested-With': 'XMLHttpRequest' } : {}),
});

const cleanUrlCandidate = (value: string): string =>
  value
    .trim()
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/\\u0026/g, '&');

const toAbsoluteUrl = (value: string | undefined, pageUrl: string): string | null => {
  if (!value) return null;

  const cleaned = cleanUrlCandidate(value);
  if (!cleaned || cleaned === '#' || cleaned.startsWith('javascript:')) return null;

  try {
    const normalized = cleaned.startsWith('//') ? `https:${cleaned}` : cleaned;
    return new URL(normalized, pageUrl).toString();
  } catch {
    return null;
  }
};

const getSourceName = (url: string, label?: string): string => {
  const cleanLabel = label?.replace(/\s+/g, ' ').trim();
  if (cleanLabel && cleanLabel.length <= 40) return cleanLabel;

  const lowerUrl = url.toLowerCase();
  const provider = Object.keys(PROVIDER_NAMES).find(key => lowerUrl.includes(key));
  if (provider) return PROVIDER_NAMES[provider];

  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Video';
  }
};

const isVideoCandidate = (url: string, pageUrl: string): boolean => {
  if (url === pageUrl) return false;
  if (DIRECT_VIDEO_PATTERN.test(url)) return true;
  if (PROVIDER_PATTERN.test(url)) return true;

  try {
    const parsed = new URL(url);
    const page = new URL(pageUrl);
    if (/puffytr\.com$/i.test(parsed.hostname) && /^\/player\/\d+/i.test(parsed.pathname)) {
      return true;
    }
    return parsed.hostname !== page.hostname && /embed|player|video|watch/i.test(url);
  } catch {
    return false;
  }
};

const parseJsonLike = (value: any) => {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const collectGenericSources = ($: cheerio.CheerioAPI, pageUrl: string, addSource: AddSource) => {
  $('iframe').each((_, el) => {
    const node = $(el);
    const label = node.attr('title') || node.attr('name') || node.parent().text();
    ['src', 'data-src', 'data-lazy-src', 'data-url', 'data-video', 'data-embed'].forEach(attr => {
      addSource(node.attr(attr), label, 'embed');
    });

    const srcdoc = node.attr('srcdoc');
    if (srcdoc) {
      const child = cheerio.load(srcdoc);
      child('iframe').each((__, nested) => {
        addSource(child(nested).attr('src') || child(nested).attr('data-src'), label, 'embed');
      });
    }
  });

  $('[data-video], [data-src], [data-url], [data-embed], [data-iframe], [data-player], [data-href]').each((_, el) => {
    const node = $(el);
    const label = node.text();
    ['data-video', 'data-src', 'data-url', 'data-embed', 'data-iframe', 'data-player', 'data-href'].forEach(attr => {
      addSource(node.attr(attr), label, 'embed');
    });
  });

  $('a[href], option[value]').each((_, el) => {
    const node = $(el);
    addSource(node.attr('href') || node.attr('value'), node.text(), 'embed');
  });

  const scriptContent = $('script').map((_, el) => $(el).html() || '').get().join('\n');
  const absoluteUrlRegex = /(?:https?:)?\/\/[^'"\s<\\]+/gi;
  let match;

  while ((match = absoluteUrlRegex.exec(scriptContent)) !== null) {
    addSource(match[0], undefined, DIRECT_VIDEO_PATTERN.test(match[0]) ? 'direct' : 'embed');
  }

  const keyedUrlRegex = /(?:src|source|file|url|embed|iframe)\s*[:=]\s*['"]([^'"]+)['"]/gi;
  while ((match = keyedUrlRegex.exec(scriptContent)) !== null) {
    addSource(match[1], undefined, DIRECT_VIDEO_PATTERN.test(match[1]) ? 'direct' : 'embed');
  }
};

const scrapePuffyVideoSources = async (
  $: cheerio.CheerioAPI,
  pageUrl: string,
  addSource: AddSource,
) => {
  const translatorUrls = new Set<string>();

  $('[translator]').each((_, el) => {
    const url = toAbsoluteUrl($(el).attr('translator'), pageUrl);
    if (url) translatorUrls.add(url);
  });

  const translatorUrlRegex = /https?:\/\/puffytr\.com\/episode\/\d+\/translator\/\d+/gi;
  const pageHtml = $.html();
  let match;
  while ((match = translatorUrlRegex.exec(pageHtml)) !== null) {
    translatorUrls.add(match[0]);
  }

  const videoButtons: Array<{ url: string; label?: string }> = [];

  for (const translatorUrl of translatorUrls) {
    try {
      const { data } = await axios.get(translatorUrl, {
        headers: createHeaders(pageUrl, true),
        timeout: 10000,
      });
      const payload = parseJsonLike(data);
      const fragment = typeof payload === 'object' ? payload.data : payload;
      if (typeof fragment !== 'string') continue;

      const translatorHtml = cheerio.load(fragment);
      translatorHtml('[video]').each((_, el) => {
        const node = translatorHtml(el);
        const url = toAbsoluteUrl(node.attr('video'), pageUrl);
        if (!url || !/puffytr\.com\/video\/\d+/i.test(url)) return;

        videoButtons.push({
          url,
          label: node.attr('data-video-name') || node.text(),
        });
      });
    } catch (error: any) {
      console.error('Puffy translator scrape error:', error.message);
    }
  }

  const seenVideos = new Set<string>();

  for (const button of videoButtons) {
    if (seenVideos.has(button.url)) continue;
    seenVideos.add(button.url);

    try {
      const { data } = await axios.get(button.url, {
        headers: createHeaders(pageUrl, true),
        timeout: 10000,
      });
      const payload = parseJsonLike(data);
      const playerHtml = typeof payload === 'object' ? payload.player || payload.data : payload;
      if (typeof playerHtml === 'string') {
        const player = cheerio.load(playerHtml);
        player('iframe').each((_, el) => {
          addSource(player(el).attr('src'), button.label, 'embed', pageUrl);
        });
      }

      const id = button.url.match(/\/video\/(\d+)/)?.[1];
      if (id) {
        addSource(`https://puffytr.com/player/${id}`, button.label, 'embed', pageUrl);
      }
    } catch (error: any) {
      console.error('Puffy video scrape error:', error.message);
    }
  }
};

export const animeService = {
  getAnimeInfo: async (malId: number) => {
    try {
      const { data } = await axios.get(`${JIKAN_URL}/anime/${malId}`);
      return data.data;
    } catch (error) {
      return null;
    }
  },

  getAllEpisodes: async (malId: number) => {
    const allEpisodes: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const { data } = await axios.get(`${JIKAN_URL}/anime/${malId}/episodes?page=${page}`);
        const episodes = data.data || [];
        allEpisodes.push(...episodes);
        hasMore = data.pagination?.has_next_page || false;
        page++;
        await new Promise(resolve => setTimeout(resolve, 350));
      } catch {
        hasMore = false;
      }
    }

    return allEpisodes;
  },

  searchAnime: async (query: string) => {
    try {
      const { data } = await axios.get(`${JIKAN_URL}/anime?q=${encodeURIComponent(query)}&limit=10`);
      return data.data || [];
    } catch (error) {
      return [];
    }
  },

  getMALId: async (anilistId: string) => {
    try {
      const query = `query ($id: Int) { Media(id: $id) { idMal title { romaji english } } }`;
      const numericId = parseInt(anilistId.replace('anilist_', ''));
      const { data } = await axios.post('https://graphql.anilist.co', {
        query,
        variables: { id: numericId },
      });
      return {
        malId: data.data?.Media?.idMal || null,
        title: data.data?.Media?.title?.english || data.data?.Media?.title?.romaji || null,
      };
    } catch {
      return { malId: null, title: null };
    }
  },

  formatTitleForUrl: (title: string): string => {
    return title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\((\d{4})\)/g, '$1')
      .replace(/[()[\]{}]/g, '')
      .replace(/[':!.,?&+]/g, '')
      .replace(/×/g, 'x')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .trim();
  },

  getWatchUrls: (title: string, episode: number) => {
    const slug = animeService.formatTitleForUrl(title);
    return {
      trSub: `https://www.tranimeizle.io/${slug}-${episode}-bolum-izle`,
      puffyTr: `https://puffytr.com/${slug}-${episode}-bolum-izle`,
    };
  },

  scrapeVideoSources: async (pageUrl: string): Promise<VideoSource[]> => {
    try {
      const { data: html } = await axios.get(pageUrl, {
        headers: createHeaders(),
        timeout: 10000,
      });

      const $ = cheerio.load(html);
      const sources: VideoSource[] = [];
      const addSource: AddSource = (
        rawUrl,
        label,
        type: VideoSourceType = 'embed',
        referer,
      ) => {
        const url = toAbsoluteUrl(rawUrl, pageUrl);
        if (!url || !isVideoCandidate(url, pageUrl)) return;
        if (sources.some(source => source.url === url)) return;

        sources.push({
          name: getSourceName(url, label),
          url,
          type: DIRECT_VIDEO_PATTERN.test(url) ? 'direct' : type,
          ...(referer ? { referer } : {}),
        });
      };

      collectGenericSources($, pageUrl, addSource);

      if (/puffytr\.com/i.test(pageUrl)) {
        await scrapePuffyVideoSources($, pageUrl, addSource);
      }

      return sources;
    } catch (error: any) {
      console.warn('Scrape warning:', pageUrl, error.message);
      return [];
    }
  },
};
