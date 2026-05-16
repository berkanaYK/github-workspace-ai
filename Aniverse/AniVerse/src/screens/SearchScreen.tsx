// src/screens/SearchScreen.tsx
// ─────────────────────────────────────────────
// Arama ekranı: anlık arama, filtre, AI semantik arama,
// son aramalar, popüler aramalar.
// ─────────────────────────────────────────────

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Keyboard, Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
import { MMKV } from 'react-native-mmkv';
import type { RootState } from '../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
import { useSearch } from '../hooks';
import type { Content, ContentType } from '../types';

const storage = new MMKV();
const MAX_RECENT = 10;

const POPULAR_SEARCHES = [
  'Naruto', 'Attack on Titan', 'One Piece', 'Solo Leveling',
  'Jujutsu Kaisen', 'Demon Slayer', 'Mushoku Tensei', 'Oshi no Ko',
];

// ── Arama sonuç öğesi ─────────────────────────
const SearchResultItem: React.FC<{
  item: Content;
  onPress: () => void;
}> = React.memo(({ item, onPress }) => {
  const typeColor = COLORS.typeColors[item.type as keyof typeof COLORS.typeColors] ?? COLORS.primary;
  return (
    <TouchableOpacity style={styles.resultItem} onPress={onPress} activeOpacity={0.8}>
      <FastImage
        source={{ uri: item.coverImage, priority: FastImage.priority.normal }}
        style={styles.resultImage}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.resultMeta}>
          <View style={[styles.typeBadge, { backgroundColor: `${typeColor}20`, borderColor: `${typeColor}40` }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>{item.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.resultYear}>{item.year}</Text>
          <Text style={styles.resultRating}>⭐ {item.rating.toFixed(1)}</Text>
        </View>
        <Text style={styles.resultSynopsis} numberOfLines={2}>{item.synopsis}</Text>
      </View>
    </TouchableOpacity>
  );
});

// ── Ana Bileşen ───────────────────────────────
const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const theme = useSelector((s: RootState) => s.ui.theme);
  const isDark = theme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const inputRef = useRef<TextInput>(null);
  const [isAISearch, setIsAISearch] = useState(false);

  // Son aramalar (MMKV'den)
  const loadRecentSearches = (): string[] => {
    try {
      const saved = storage.getString('recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  };
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);

  const { query, setQuery, filter, setFilter, results, total, isLoading } = useSearch(
    route.params?.initialQuery ?? ''
  );

  // Arama kutusuna otomatik odaklan
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Son aramalara ekle
  const addRecentSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setRecentSearches(prev => {
      const next = [q, ...prev.filter(s => s !== q)].slice(0, MAX_RECENT);
      storage.set('recent_searches', JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    storage.delete('recent_searches');
  }, []);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (q.trim().length >= 2) addRecentSearch(q.trim());
  }, [setQuery, addRecentSearch]);

  const handlePopularSearch = useCallback((q: string) => {
    setQuery(q);
    addRecentSearch(q);
    inputRef.current?.blur();
  }, [setQuery, addRecentSearch]);

  const navigateToDetail = useCallback((item: Content) => {
    Keyboard.dismiss();
    addRecentSearch(query);
    navigation.navigate('ContentDetail', { contentId: item.id, contentTitle: item.title });
  }, [query, addRecentSearch, navigation]);

  const showEmpty = query.length < 2;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Arama çubuğu ─────────────────── */}
      <View style={[styles.searchBar, { paddingTop: Platform.OS === 'ios' ? 56 : 36 }]}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text }]}
            value={query}
            onChangeText={handleSearch}
            placeholder="Anime, manga, novel ara..."
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={() => addRecentSearch(query)}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {query.length > 0 && Platform.OS === 'android' && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => { Keyboard.dismiss(); navigation.goBack(); }}
          style={styles.cancelBtn}
        >
          <Text style={{ color: COLORS.primary, fontSize: TYPOGRAPHY.size.base, fontWeight: '600' }}>
            İptal
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Tür filtresi ─────────────────── */}
      {!showEmpty && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeRow}
        >
          {(['all', 'anime', 'manga', 'manhwa', 'manhua', 'novel'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeChip,
                { borderColor: colors.border },
                (filter.type === t || (t === 'all' && !filter.type)) && {
                  backgroundColor: COLORS.primary,
                  borderColor: COLORS.primary,
                },
              ]}
              onPress={() => setFilter(prev => ({ ...prev, type: t === 'all' ? undefined : (t as ContentType) }))}
            >
              <Text style={[
                styles.typeChipText,
                { color: (filter.type === t || (t === 'all' && !filter.type)) ? COLORS.white : colors.textSecondary },
              ]}>
                {t === 'all' ? 'Tümü' : t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── AI arama butonu ───────────────── */}
      {!showEmpty && (
        <TouchableOpacity
          style={[
            styles.aiSearchBtn,
            { backgroundColor: colors.surfaceElevated, borderColor: isAISearch ? COLORS.primary : colors.border },
          ]}
          onPress={() => setIsAISearch(s => !s)}
        >
          <Text style={{ fontSize: 16 }}>✨</Text>
          <Text style={[styles.aiSearchText, { color: isAISearch ? COLORS.primary : colors.textSecondary }]}>
            AI Semantik Arama {isAISearch ? '(Açık)' : '(Kapalı)'}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Sonuçlar veya boş durum ───────── */}
      {showEmpty ? (
        <ScrollView contentContainerStyle={styles.emptyContainer} showsVerticalScrollIndicator={false}>
          {/* Son aramalar */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SON ARAMALAR</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={{ color: COLORS.error, fontSize: TYPOGRAPHY.size.xs }}>Temizle</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.recentItem, { borderBottomColor: colors.border }]}
                  onPress={() => handlePopularSearch(s)}
                >
                  <Text style={{ color: colors.textMuted, marginRight: SPACING.sm }}>🕐</Text>
                  <Text style={[styles.recentText, { color: colors.text }]}>{s}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const next = recentSearches.filter(r => r !== s);
                      setRecentSearches(next);
                      storage.set('recent_searches', JSON.stringify(next));
                    }}
                  >
                    <Text style={{ color: colors.textMuted }}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Popüler aramalar */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>POPÜLER ARAMALAR</Text>
            <View style={styles.popularGrid}>
              {POPULAR_SEARCHES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.popularChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  onPress={() => handlePopularSearch(s)}
                >
                  <Text style={[styles.popularText, { color: colors.text }]}>🔥 {s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <>
          {/* Sonuç sayısı */}
          {!isLoading && (
            <Text style={[styles.resultCount, { color: colors.textMuted }]}>
              {total.toLocaleString('tr')} sonuç bulundu
              {isAISearch ? ' (AI)' : ''}
            </Text>
          )}

          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <SearchResultItem item={item} onPress={() => navigateToDetail(item)} />
            )}
            contentContainerStyle={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              isLoading ? (
                <View style={styles.loadingCenter}>
                  <ActivityIndicator color={COLORS.primary} />
                  {isAISearch && (
                    <Text style={[styles.aiLoadingText, { color: colors.textMuted }]}>
                      ✨ AI arama yapılıyor...
                    </Text>
                  )}
                </View>
              ) : null
            }
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.noResults}>
                  <Text style={{ fontSize: 48 }}>🔍</Text>
                  <Text style={[styles.noResultsTitle, { color: colors.text }]}>
                    Sonuç Bulunamadı
                  </Text>
                  <Text style={[styles.noResultsDesc, { color: colors.textMuted }]}>
                    "{query}" için sonuç yok.{'\n'}
                    Farklı kelimeler veya AI aramayı deneyin.
                  </Text>
                  {!isAISearch && (
                    <TouchableOpacity
                      style={styles.aiTryBtn}
                      onPress={() => setIsAISearch(true)}
                    >
                      <Text style={styles.aiTryBtnText}>✨ AI ile Dene</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null
            }
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 0.5,
    paddingHorizontal: SPACING.md,
    height: 44,
    gap: SPACING.sm,
  },
  searchIcon: { fontSize: 16 },
  input: { flex: 1, fontSize: TYPOGRAPHY.size.base, paddingVertical: 0 },
  clearBtn: { padding: 4 },
  cancelBtn: { paddingVertical: SPACING.sm },

  typeRow: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  typeChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 0.5,
  },
  typeChipText: { fontSize: TYPOGRAPHY.size.xs, fontWeight: '600' },

  aiSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 0.5,
    gap: SPACING.sm,
  },
  aiSearchText: { fontSize: TYPOGRAPHY.size.sm, fontWeight: '500' },

  resultCount: {
    fontSize: TYPOGRAPHY.size.xs,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },

  resultsList: { paddingBottom: 100 },
  resultItem: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.dark.border,
  },
  resultImage: { width: 56, height: 80, borderRadius: BORDER_RADIUS.sm },
  resultInfo: { flex: 1 },
  resultTitle: {
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 4,
  },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  typeBadgeText: { fontSize: 9, fontWeight: '700' },
  resultYear: { color: COLORS.dark.textMuted, fontSize: TYPOGRAPHY.size.xs },
  resultRating: { color: COLORS.dark.textSecondary, fontSize: TYPOGRAPHY.size.xs },
  resultSynopsis: { color: COLORS.dark.textMuted, fontSize: TYPOGRAPHY.size.xs, lineHeight: 17 },

  // Boş/başlangıç durumu
  emptyContainer: { paddingBottom: 100 },
  section: { paddingHorizontal: SPACING.base, paddingTop: SPACING.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: TYPOGRAPHY.size.xs, fontWeight: '600', letterSpacing: 0.5 },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
  },
  recentText: { flex: 1, fontSize: TYPOGRAPHY.size.base },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  popularChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 0.5,
  },
  popularText: { fontSize: TYPOGRAPHY.size.sm },

  loadingCenter: { padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm },
  aiLoadingText: { fontSize: TYPOGRAPHY.size.sm },

  noResults: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.xl, gap: SPACING.md },
  noResultsTitle: { fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.semibold },
  noResultsDesc: { fontSize: TYPOGRAPHY.size.sm, textAlign: 'center', lineHeight: 21 },
  aiTryBtn: {
    marginTop: SPACING.sm,
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 0.5,
    borderColor: `${COLORS.primary}40`,
  },
  aiTryBtnText: { color: COLORS.primary, fontWeight: '600' },
});

export default SearchScreen;
