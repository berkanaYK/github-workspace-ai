// src/types/index.ts
// ─────────────────────────────────────────────
// Temel veri modeli: Her içerik türü tek bir
// Content objesi içinde ilişkisel olarak tutulur.
// ─────────────────────────────────────────────

// ── İçerik Türleri ──────────────────────────
export type ContentType = 'anime' | 'manga' | 'manhwa' | 'manhua' | 'novel';
export type ContentStatus = 'ongoing' | 'completed' | 'hiatus' | 'upcoming';
export type WatchStatus =
  | 'watching'
  | 'completed'
  | 'on_hold'
  | 'dropped'
  | 'plan_to_watch';
export type VideoSourceType = 'embed' | 'direct';

// ── Bölüm / Sayı ────────────────────────────
export interface Episode {
  id: string;
  number: number;
  title: string;
  duration: number; // dakika cinsinden (anime)
  thumbnail: string;
  videoUrl?: string;
  releaseDate: string;
  isSpecial?: boolean;
  isFiller?: boolean;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  pages: string[]; // sayfa URL'leri
  releaseDate: string;
  readCount?: number;
}

export interface NovelChapter {
  id: string;
  number: number;
  title: string;
  content: string; // metin içerik
  wordCount: number;
  releaseDate: string;
}

// ── Sezon ───────────────────────────────────
export interface Season {
  id: string;
  number: number;
  title: string;
  episodes: Episode[];
  startDate: string;
  endDate?: string;
}

// ── İlişkili Yapıt ──────────────────────────
export interface RelatedWork {
  id: string;
  title: string;
  type: ContentType;
  relation:
    | 'prequel'
    | 'sequel'
    | 'spin_off'
    | 'side_story'
    | 'adaptation'
    | 'alternative';
  coverImage: string;
}

// ── Ana İçerik Modeli ───────────────────────
// Bir anime/manga/novel'a ait TÜM içerikler
// tek bir Content objesinde toplanır.
export interface Content {
  id: string;
  title: string;
  titleAlt?: string; // alternatif/orijinal isim
  type: ContentType;
  status: ContentStatus;
  coverImage: string;
  bannerImage?: string;
  synopsis: string;
  genres: string[];
  tags: string[];
  rating: number; // 0–10
  ratingCount: number;
  popularity: number;
  year: number;
  studio?: string; // anime için yapım şirketi
  author?: string; // manga/novel için yazar
  artist?: string;

  // Anime'ye özgü
  seasons?: Season[];
  totalEpisodes?: number;
  episodeDuration?: number;

  // Manga/Manhwa/Manhua'ya özgü
  chapters?: Chapter[];
  totalChapters?: number;

  // Novel'e özgü
  novelChapters?: NovelChapter[];
  totalNovelChapters?: number;

  // İlişkili içerikler (spin-off, uyarlama vb.)
  relatedWorks?: RelatedWork[];

  // Ek medya
  trailerUrl?: string;
  characters?: Character[];
}

// ── Karakter ────────────────────────────────
export interface Character {
  id: string;
  name: string;
  image: string;
  role: 'main' | 'supporting';
  voiceActor?: string;
}

// ── Kullanıcı ───────────────────────────────
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  language: 'tr' | 'en';
  theme: 'dark' | 'light' | 'system';
  notifications: NotificationSettings;
  contentFilters: ContentType[];
}

export interface NotificationSettings {
  newEpisode: boolean;
  newChapter: boolean;
  favorites: boolean;
  announcements: boolean;
}

// ── Kullanıcı İlerlemesi ────────────────────
// Hangi bölümde/sayfada kaldığını tutar.
export interface UserProgress {
  userId: string;
  contentId: string;
  watchStatus: WatchStatus;
  lastEpisodeId?: string;
  lastEpisodeNumber?: number;
  lastEpisodeTimestamp?: number; // saniye cinsinden
  lastChapterId?: string;
  lastChapterNumber?: number;
  lastPageIndex?: number;
  lastNovelChapterId?: string;
  lastNovelPosition?: number; // karakter pozisyonu
  updatedAt: string;
  isFavorite: boolean;
  userRating?: number; // kullanıcının kendi puanı (0–10)
}

// ── Öneri ───────────────────────────────────
export interface Recommendation {
  content: Content;
  score: number; // 0–1 arasında öneri skoru
  reason: string; // "İzleme geçmişinize göre"
}

// ── API Yanıt Tipleri ────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

// ── Filtre ve Arama ──────────────────────────
export interface ContentFilter {
  type?: ContentType;
  genres?: string[];
  status?: ContentStatus;
  year?: number;
  minRating?: number;
  sortBy?: 'popularity' | 'rating' | 'newest' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends ContentFilter {
  query: string;
  page?: number;
  limit?: number;
}

export interface VideoSource {
  name: string;
  url: string;
  type?: VideoSourceType;
  quality?: string;
  referer?: string;
}

export interface WatchEmbedData {
  episode: number;
  title: string;
  totalEpisodes: number | null;
  pageUrl: string;
  attempts?: Array<{provider: string; pageUrl: string; sourceCount: number}>;
  sources: VideoSource[];
}
