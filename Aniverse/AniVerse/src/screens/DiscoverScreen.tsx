// src/screens/DiscoverScreen.tsx
// ─────────────────────────────────────────────
// Keşfet ekranı: içerik türü filtreleme,
// tür (genre) seçimi, sıralama ve sayfalandırılmış liste.
// ─────────────────────────────────────────────

import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, ActivityIndicator, TextInput, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
import { contentService } from '../services/api';
import type { Content, ContentType, ContentFilter, PaginatedResponse } from '../types';

// ── Sabitler ──────────────────────────────────
const CONTENT_TYPES: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'Tümü' },
  { key: 'anime', label: 'Anime' },
  { key: 'manga', label: 'Manga' },
  { key: 'manhwa', label: 'Manhwa' },
  { key: 'manhua', label: 'Manhua' },
  { key: 'novel', label: 'Novel' },
];

const SORT_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'popularity', label: 'Popülerlik' },
  { key: 'rating', label: 'Puan' },
  { key: 'newest', label: 'Yeni' },
  { key: 'title', label: 'İsim' },
];

const GENRES = [
  'Aksiyon', 'Macera', 'Komedi', 'Drama', 'Fantezi',
  'Korku', 'Romantizm', 'Bilim Kurgu', 'Spor', 'Doğaüstü',
  'Gizem', 'Psikolojik', 'Tarihsel', 'Müzik', 'Oyun',
];

// ── Grid içerik kartı ─────────────────────────
const GridCard: React.FC<{ item: Content; onPress: () => void }> = React.memo(
  ({ item, onPress }) => {
    const typeColor = COLORS.typeColors[item.type as keyof typeof COLORS.typeColors] ?? COLORS.primary;
    return (
      <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.8}>
        <FastImage
          source={{ uri: item.coverImage, priority: FastImage.priority.normal }}
          style={styles.gridImage}
          resizeMode={FastImage.resizeMode.cover}
        />
        <View style={[styles.typePill, { backgroundColor: `${typeColor}CC` }]}>
          <Text style={styles.typePillText}>{item.type.toUpperCase()}</Text>
        </View>
        <View style={styles.gridInfo}>
          <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.gridMeta}>⭐ {item.rating.toFixed(1)}</Text>
        </View>
      </TouchableOpacity>
    );
  }
);

// ── Ana Bileşen ───────────────────────────────
const DiscoverScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const theme = useSelector((s: RootState) => s.ui.theme);
  const isDark = theme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const [activeType, setActiveType] = useState<string>(route.params?.filter ?? 'all');
  const [sortBy, setSortBy] = useState('popularity');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filter: ContentFilter = {
    type: activeType !== 'all' ? (activeType as ContentType) : undefined,
    sortBy: sortBy as any,
    genres: selectedGenres.length > 0 ? selectedGenres : undefined,
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['content-list', filter],
    queryFn: ({ pageParam }) =>
      contentService.getContentList(filter, pageParam, 20) as Promise<PaginatedResponse<Content>>,
    initialPageParam: 1,
    getNextPageParam: (last: PaginatedResponse<Content>) =>
      last.hasMore ? last.page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
  });

  const allItems = data?.pages.flatMap(p => p.data) ?? [];

  const toggleGenre = useCallback((g: string) => {
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Content }) => (
      <GridCard
        item={item}
        onPress={() =>
          navigation.navigate('ContentDetail', {
            contentId: item.id,
            contentTitle: item.title,
          })
        }
      />
    ),
    [navigation]
  );

  const renderFooter = () =>
    isFetchingNextPage ? (
      <ActivityIndicator color={COLORS.primary} style={{ margin: SPACING.lg }} />
    ) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Üst bar ─────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: Platform.OS === 'ios' ? 56 : 40 }]}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Keşfet</Text>
        <TouchableOpacity
          style={[styles.filterToggle, {
            backgroundColor: showFilters ? `${COLORS.primary}25` : colors.surfaceElevated,
            borderColor: showFilters ? COLORS.primary : colors.border,
          }]}
          onPress={() => setShowFilters(s => !s)}
        >
          <Text style={{ color: showFilters ? COLORS.primary : colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
            ⚙ Filtre {selectedGenres.length > 0 ? `(${selectedGenres.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── İçerik türü seçici ────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeRow}
      >
        {CONTENT_TYPES.map(ct => (
          <TouchableOpacity
            key={ct.key}
            style={[
              styles.typeChip,
              activeType === ct.key && {
                backgroundColor: COLORS.primary,
                borderColor: COLORS.primary,
              },
              { borderColor: colors.border },
            ]}
            onPress={() => setActiveType(ct.key)}
          >
            <Text style={[
              styles.typeChipText,
              { color: activeType === ct.key ? COLORS.white : colors.textSecondary },
            ]}>
              {ct.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Filtre paneli ────────────────── */}
      {showFilters && (
        <View style={[styles.filterPanel, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {/* Sıralama */}
          <Text style={[styles.filterSectionLabel, { color: colors.textSecondary }]}>Sıralama</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
            <View style={styles.chipRow}>
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.smallChip,
                    sortBy === opt.key && { backgroundColor: `${COLORS.primary}25`, borderColor: COLORS.primary },
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setSortBy(opt.key)}
                >
                  <Text style={[
                    styles.smallChipText,
                    { color: sortBy === opt.key ? COLORS.primary : colors.textSecondary },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Türler */}
          <Text style={[styles.filterSectionLabel, { color: colors.textSecondary }]}>Türler</Text>
          <View style={styles.genreWrap}>
            {GENRES.map(g => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.smallChip,
                  selectedGenres.includes(g) && { backgroundColor: `${COLORS.accent}20`, borderColor: COLORS.accent },
                  { borderColor: colors.border },
                ]}
                onPress={() => toggleGenre(g)}
              >
                <Text style={[
                  styles.smallChipText,
                  { color: selectedGenres.includes(g) ? COLORS.accent : colors.textSecondary },
                ]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Sıralama özet satırı ──────────── */}
      <View style={[styles.resultBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.resultCount, { color: colors.textMuted }]}>
          {isLoading ? 'Yükleniyor...' : `${data?.pages[0]?.total?.toLocaleString('tr') ?? 0} içerik`}
        </Text>
      </View>

      {/* ── İçerik grid'i ───────────────── */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Sonuç bulunamadı
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const CARD_W = (SPACING.base * 2 + SPACING.sm * 2) / 3;

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  screenTitle: { fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.bold },
  filterToggle: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 0.5,
  },

  typeRow: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  typeChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 0.5,
    backgroundColor: 'transparent',
  },
  typeChipText: { fontSize: TYPOGRAPHY.size.sm, fontWeight: '500' },

  filterPanel: {
    padding: SPACING.md,
    borderBottomWidth: 0.5,
  },
  filterSectionLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  chipRow: { flexDirection: 'row', gap: SPACING.xs },
  genreWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 0.5,
    marginBottom: 4,
  },
  smallChipText: { fontSize: TYPOGRAPHY.size.xs, fontWeight: '500' },

  resultBar: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
  },
  resultCount: { fontSize: TYPOGRAPHY.size.xs },

  grid: { padding: SPACING.base },
  row: { gap: SPACING.sm, marginBottom: SPACING.sm },

  gridCard: {
    flex: 1,
    maxWidth: '32%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.dark.card,
  },
  gridImage: { width: '100%', aspectRatio: 2 / 3 },
  typePill: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typePillText: { color: COLORS.white, fontSize: 8, fontWeight: '700' },
  gridInfo: { padding: 6 },
  gridTitle: { color: COLORS.dark.text, fontSize: 11, fontWeight: '500', lineHeight: 15 },
  gridMeta: { color: COLORS.dark.textMuted, fontSize: 10, marginTop: 2 },

  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: TYPOGRAPHY.size.base },
});

export default DiscoverScreen;
