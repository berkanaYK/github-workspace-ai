import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Content,
  ContentFilter,
  ContentStatus,
  ContentType,
  RelatedWork,
  SearchParams,
  User,
  UserProgress,
  VideoSource,
  WatchEmbedData,
} from '../types';

// ── Bilgisayarının IP adresi ──────────────────
const BASE_URL = 'http://192.168.1.15:3000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {'Content-Type': 'application/json'},
});

const normalizeContentType = (value: unknown): ContentType =>
  String(value || 'anime').toLowerCase() as ContentType;

const normalizeContentStatus = (value: unknown): ContentStatus =>
  String(value || 'ongoing').toLowerCase() as ContentStatus;

const normalizeRelation = (value: unknown): RelatedWork['relation'] =>
  String(value || 'adaptation').toLowerCase() as RelatedWork['relation'];

const normalizeArray = <T>(value: T[] | undefined | null): T[] =>
  Array.isArray(value) ? value : [];

const mapRelatedWorks = (item: any): RelatedWork[] => {
  const rawRelated = normalizeArray(item.relatedWorks || item.relatedFrom);

  return rawRelated
    .map((work: any) => {
      const target = work.to || work;
      return {
        id: target.id || work.toId || work.id,
        title: target.title || work.title || '',
        type: normalizeContentType(target.type || work.type),
        relation: normalizeRelation(work.relation),
        coverImage: target.coverImage || work.coverImage || '',
      };
    })
    .filter((work: RelatedWork) => Boolean(work.id && work.title));
};

const mapContent = (item: any): Content => ({
  ...item,
  type: normalizeContentType(item?.type),
  status: normalizeContentStatus(item?.status),
  coverImage: item?.coverImage || '',
  synopsis: item?.synopsis || '',
  genres: normalizeArray(item?.genres)
    .map((g: any) => g?.genre?.name || g?.name || g)
    .filter(Boolean),
  tags: normalizeArray(item?.tags)
    .map((t: any) => t?.tag?.name || t?.name || t)
    .filter(Boolean),
  relatedWorks: mapRelatedWorks(item || {}),
  characters: normalizeArray(item?.characters).map((c: any) => ({
    id: c.character?.id || c.id || c.characterId || c.name,
    name: c.character?.name || c.name || '',
    image: c.character?.image || c.image || '',
    role: String(c.role || 'supporting').toLowerCase(),
    voiceActor: c.voiceActor,
  })),
});

const mapContentList = (items: any[] | undefined): Content[] =>
  normalizeArray(items).map(mapContent);

const mapVideoSources = (sources: any[] | undefined): VideoSource[] =>
  normalizeArray(sources)
    .map((source: any) => ({
      name: source.name || 'Video',
      url: source.url || source.src || '',
      type: source.type || 'embed',
      quality: source.quality,
      referer: source.referer,
    }))
    .filter(source => Boolean(source.url));

// ── Token interceptor ─────────────────────────
apiClient.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Content Service ───────────────────────────
export const contentService = {
  getHomeContent: async () => {
    try {
      const {data} = await apiClient.get('/home');
      return {
        ...data,
        featured: mapContentList(data.featured),
        trending: mapContentList(data.trending),
        anime: mapContentList(data.anime),
        manga: mapContentList(data.manga),
        manhwa: mapContentList(data.manhwa),
        manhua: mapContentList(data.manhua),
        novel: mapContentList(data.novel),
        topRated: mapContentList(data.topRated),
        newEpisodes: data.newEpisodes || [],
      };
    } catch {
      return {
        featured: [],
        trending: [],
        anime: [],
        manga: [],
        manhwa: [],
        manhua: [],
        novel: [],
        topRated: [],
        newEpisodes: [],
      };
    }
  },
  getContentList: async (filter: ContentFilter, page = 1, limit = 20) => {
    try {
      const {data} = await apiClient.get('/content', {
        params: {...filter, page, limit},
      });
      return {
        ...data,
        data: mapContentList(data.data),
      };
    } catch {
      return {data: [], total: 0, page, limit, hasMore: false};
    }
  },
  getContentDetail: async (id: string): Promise<Content> => {
    const {data} = await apiClient.get(`/content/${id}`);
    return mapContent(data);
  },
  search: async (params: SearchParams) => {
    try {
      const {data} = await apiClient.get('/search', {params});
      return {
        ...data,
        data: mapContentList(data.data),
      };
    } catch {
      return {data: [], total: 0, page: 1, limit: 20, hasMore: false};
    }
  },
  getEpisodeSource: async (_episodeId: string) => {
    return {url: '', subtitles: [] as {lang: string; url: string}[]};
  },
  getChapterPages: async (_chapterId: string) => {
    return {pages: [] as string[]};
  },
};

// ── Auth Service ──────────────────────────────
export const authService = {
  loginWithEmail: async (email: string, password: string) => {
    const {data} = await apiClient.post('/auth/login', {email, password});
    await AsyncStorage.setItem('auth_token', data.token);
    await AsyncStorage.setItem('refresh_token', data.refreshToken);
    return {
      user: data.user as User,
      token: data.token as string,
    };
  },

  loginWithGoogle: async () => {
    return {user: {} as User, token: ''};
  },

  register: async (email: string, password: string, username: string) => {
    const {data} = await apiClient.post('/auth/register', {
      email,
      password,
      username,
    });
    return {
      user: {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        preferences: {
          language: 'tr' as const,
          theme: 'dark' as const,
          notifications: {
            newEpisode: true,
            newChapter: true,
            favorites: true,
            announcements: true,
          },
          contentFilters: [],
        },
        createdAt: new Date().toISOString(),
      } as User,
      token: '',
    };
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {}
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');
  },

  refreshToken: async () => '',
};

// ── Watch Service ─────────────────────────────
export const watchService = {
  getAnimeEpisodes: async (contentId: string) => {
    try {
      const {data} = await apiClient.get(`/watch/info/${contentId}`);
      return data;
    } catch {
      return null;
    }
  },

  getEmbedUrl: async (
    contentId: string,
    episode: number,
  ): Promise<WatchEmbedData | null> => {
    try {
      const {data} = await apiClient.get(
        `/watch/embed/${contentId}/${episode}`,
      );
      return {
        ...data,
        sources: mapVideoSources(data.sources),
      };
    } catch {
      return null;
    }
  },

  getWatchSources: async (_title: string, _episode: number = 1) => {
    return [];
  },

  matchAnime: async (_title: string) => {
    return [];
  },

  getAnimeInfo: async (_animeId: string) => {
    return null;
  },

  getEpisodeSource: async (_episodeId: string) => {
    return {sources: [], subtitles: []};
  },
};

// ── User Service ──────────────────────────────
export const userService = {
  syncProgress: async (progress: UserProgress) => {
    try {
      const {data} = await apiClient.put(
        `/users/${progress.userId}/progress/${progress.contentId}`,
        progress,
      );
      return data;
    } catch {
      return progress;
    }
  },
  getProgressList: async (userId: string): Promise<UserProgress[]> => {
    try {
      const {data} = await apiClient.get(`/users/${userId}/progress`);
      return data;
    } catch {
      return [];
    }
  },
  getFavorites: async (userId: string): Promise<Content[]> => {
    try {
      const {data} = await apiClient.get(`/users/${userId}/favorites`);
      return data;
    } catch {
      return [];
    }
  },
  toggleFavorite: async (userId: string, contentId: string) => {
    try {
      const {data} = await apiClient.post(`/users/${userId}/favorites/toggle`, {
        contentId,
      });
      return data;
    } catch {
      return {isFavorite: false};
    }
  },
  getHistory: async (userId: string, page = 1) => {
    try {
      const {data} = await apiClient.get(`/users/${userId}/history`, {
        params: {page, limit: 30},
      });
      return data;
    } catch {
      return {data: [] as Content[], total: 0, page, limit: 30, hasMore: false};
    }
  },
};
