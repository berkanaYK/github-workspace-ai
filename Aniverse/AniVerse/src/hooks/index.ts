import {useColorScheme} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useCallback, useState, useEffect} from 'react';
import type {RootState} from '../store';
import {COLORS} from '../theme';
import {updateProgress} from '../store/slices/userSlice';
import type {UserProgress, ContentFilter} from '../types';

// ── useTheme ──────────────────────────────────
export const useTheme = () => {
  const theme = useSelector((s: RootState) => s.ui.theme);
  const systemTheme = useColorScheme();
  const isDark =
    theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
  return {isDark, colors: isDark ? COLORS.dark : COLORS.light, theme};
};

// ── useProgress ───────────────────────────────
export const useProgress = (contentId: string) => {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const progress = useSelector((s: RootState) => s.user.progressMap[contentId]);

  const saveProgress = useCallback(
    (update: Partial<UserProgress>) => {
      if (!user) {
        return;
      }
      const newProgress: UserProgress = {
        ...progress,
        ...update,
        userId: user.id,
        contentId,
        watchStatus: update.watchStatus ?? progress?.watchStatus ?? 'watching',
        isFavorite: update.isFavorite ?? progress?.isFavorite ?? false,
        updatedAt: new Date().toISOString(),
      };
      dispatch(updateProgress(newProgress));
    },
    [user, contentId, progress, dispatch],
  );

  const updateEpisodeTimestamp = useCallback(
    (episodeId: string, episodeNumber: number, timestamp: number) => {
      saveProgress({
        lastEpisodeId: episodeId,
        lastEpisodeNumber: episodeNumber,
        lastEpisodeTimestamp: timestamp,
      });
    },
    [saveProgress],
  );

  const updateChapterPage = useCallback(
    (chapterId: string, chapterNumber: number, pageIndex: number) => {
      saveProgress({
        lastChapterId: chapterId,
        lastChapterNumber: chapterNumber,
        lastPageIndex: pageIndex,
      });
    },
    [saveProgress],
  );

  const updateNovelPosition = useCallback(
    (chapterId: string, position: number) => {
      saveProgress({
        lastNovelChapterId: chapterId,
        lastNovelPosition: position,
      });
    },
    [saveProgress],
  );

  return {
    progress,
    saveProgress,
    updateEpisodeTimestamp,
    updateChapterPage,
    updateNovelPosition,
  };
};

// ── useSearch ─────────────────────────────────
export const useSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<ContentFilter>({});
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setTotal(0);
      return;
    }

    const doSearch = async () => {
      setIsLoading(true);
      try {
        const {contentService} = require('../services/api');
        const data = await contentService.search({
          query: debouncedQuery,
          type: filter.type,
        });
        setResults(data.data || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    doSearch();
  }, [debouncedQuery, filter]);

  return {query, setQuery, filter, setFilter, results, total, isLoading};
};
