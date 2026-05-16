// src/screens/HomeScreen.tsx
import React, { useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, StatusBar, TouchableOpacity,
  Text, RefreshControl, Dimensions, Platform, Image,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
import { contentService } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Tür rozeti ────────────────────────────────
const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const color = COLORS.typeColors[type?.toLowerCase() as keyof typeof COLORS.typeColors] ?? COLORS.primary;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}CC` }]}>
      <Text style={styles.badgeText}>{type}</Text>
    </View>
  );
};

// ── Poster kartı ──────────────────────────────
const PosterCard: React.FC<{ item: any; onPress: () => void }> = React.memo(({ item, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.posterCard} activeOpacity={0.85}>
    {item.coverImage ? (
      <Image source={{ uri: item.coverImage }} style={styles.posterImage} resizeMode="cover" />
    ) : (
      <View style={[styles.posterImage, { backgroundColor: COLORS.dark.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 24 }}>🎬</Text>
      </View>
    )}
    <TypeBadge type={item.type} />
    <View style={styles.posterInfo}>
      <Text style={styles.posterTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.posterMeta}>⭐ {item.rating?.toFixed(1) || '—'}</Text>
    </View>
  </TouchableOpacity>
));

// ── Büyük öne çıkan kart ──────────────────────
const FeaturedCard: React.FC<{ item: any; onPress: () => void }> = ({ item, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.featuredCard} activeOpacity={0.9}>
    {item.bannerImage || item.coverImage ? (
      <Image
        source={{ uri: item.bannerImage || item.coverImage }}
        style={styles.featuredImage}
        resizeMode="cover"
      />
    ) : (
      <View style={[styles.featuredImage, { backgroundColor: COLORS.dark.surfaceElevated }]} />
    )}
    <View style={styles.featuredOverlay}>
      <TypeBadge type={item.type} />
      <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.featuredSynopsis} numberOfLines={2}>{item.synopsis}</Text>
      <View style={styles.featuredMeta}>
        <Text style={styles.featuredRating}>⭐ {item.rating?.toFixed(1) || '—'}</Text>
        {item.year && <Text style={styles.featuredYear}>{item.year}</Text>}
        {item.studio && <Text style={styles.featuredStudio}>{item.studio}</Text>}
      </View>
    </View>
  </TouchableOpacity>
);

// ── Bölüm başlığı ─────────────────────────────
const SectionHeader: React.FC<{ title: string; onSeeAll?: () => void }> = ({ title, onSeeAll }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={styles.seeAll}>Tümünü Gör →</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ── Yatay liste ───────────────────────────────
const HorizontalList: React.FC<{ data: any[]; onItemPress: (item: any) => void }> = ({ data, onItemPress }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.horizontalList}
  >
    {data.map((item: any, index: number) => (
      <PosterCard key={`${item.id}-${index}`} item={item} onPress={() => onItemPress(item)} />
    ))}
  </ScrollView>
);

// ── Ana Ekran ─────────────────────────────────
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useSelector((s: RootState) => s.ui.theme);
  const isDark = theme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const { data: homeData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['home'],
    queryFn: contentService.getHomeContent,
    staleTime: 5 * 60 * 1000,
  });

  const navigateToDetail = useCallback((item: any) => {
    navigation.navigate('ContentDetail', { contentId: item.id, contentTitle: item.title });
  }, [navigation]);

  // İçerikleri türe göre ayır
  const allContent = homeData?.trending || [];
  const animeList = homeData?.anime || [];
  const mangaList = homeData?.manga || [];
  const manhwaList = homeData?.manhwa || [];
  const manhuaList = homeData?.manhua || [];
  const novelList = homeData?.novel || [];
  const featured = homeData?.featured || [];
  const topRated = homeData?.topRated || [];

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={{ color: colors.textMuted, marginTop: SPACING.md }}>İçerikler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
        }
      >
        {/* Üst bar */}
        <View style={[styles.topBar, { paddingTop: Platform.OS === 'ios' ? 54 : 40 }]}>
          <Text style={[styles.appTitle, { color: colors.text }]}>
            <Text style={{ color: COLORS.primary }}>Ani</Text>Verse
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Search')}
            style={[styles.searchButton, { backgroundColor: colors.surfaceElevated }]}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>🔍  Ara...</Text>
          </TouchableOpacity>
        </View>

        {/* Öne çıkan */}
        {featured.length > 0 && (
          <FeaturedCard item={featured[0]} onPress={() => navigateToDetail(featured[0])} />
        )}

        {/* Anime */}
        {animeList.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="🎬 Anime" onSeeAll={() => navigation.navigate('Discover', { filter: 'anime' })} />
            <HorizontalList data={animeList} onItemPress={navigateToDetail} />
          </View>
        )}

        {/* Manga */}
        {mangaList.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="📖 Manga" onSeeAll={() => navigation.navigate('Discover', { filter: 'manga' })} />
            <HorizontalList data={mangaList} onItemPress={navigateToDetail} />
          </View>
        )}

        {/* Manhwa */}
        {manhwaList.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="🇰🇷 Manhwa" onSeeAll={() => navigation.navigate('Discover', { filter: 'manhwa' })} />
            <HorizontalList data={manhwaList} onItemPress={navigateToDetail} />
          </View>
        )}

        {/* Manhua */}
        {manhuaList.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="🇨🇳 Manhua" onSeeAll={() => navigation.navigate('Discover', { filter: 'manhua' })} />
            <HorizontalList data={manhuaList} onItemPress={navigateToDetail} />
          </View>
        )}

        {/* Novel */}
        {novelList.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="📝 Novel" onSeeAll={() => navigation.navigate('Discover', { filter: 'novel' })} />
            <HorizontalList data={novelList} onItemPress={navigateToDetail} />
          </View>
        )}

        {/* En yüksek puanlı */}
        {topRated.length > 0 && (
          <View style={[styles.section, { marginBottom: SPACING.xl }]}>
            <SectionHeader title="⭐ En İyi Puanlı" />
            <HorizontalList data={topRated} onItemPress={navigateToDetail} />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.base, paddingBottom: SPACING.md, gap: SPACING.md,
  },
  appTitle: { fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.bold },
  searchButton: {
    flex: 1, height: 40, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md, justifyContent: 'center',
  },

  // Featured
  featuredCard: {
    marginHorizontal: SPACING.base, borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden', height: 220, marginBottom: SPACING.md,
  },
  featuredImage: { width: '100%', height: '100%' },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', padding: SPACING.md,
  },
  featuredTitle: { color: COLORS.white, fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.bold, lineHeight: 28 },
  featuredSynopsis: { color: 'rgba(255,255,255,0.7)', fontSize: TYPOGRAPHY.size.xs, marginTop: 4, lineHeight: 18 },
  featuredMeta: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  featuredRating: { color: COLORS.white, fontSize: TYPOGRAPHY.size.xs, fontWeight: '600' },
  featuredYear: { color: 'rgba(255,255,255,0.7)', fontSize: TYPOGRAPHY.size.xs },
  featuredStudio: { color: 'rgba(255,255,255,0.7)', fontSize: TYPOGRAPHY.size.xs },

  // Section
  section: { marginTop: SPACING.lg },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.base, marginBottom: SPACING.md,
  },
  sectionTitle: { color: COLORS.white, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.semibold },
  seeAll: { color: COLORS.primaryLight, fontSize: TYPOGRAPHY.size.sm },
  horizontalList: { paddingHorizontal: SPACING.base, gap: SPACING.md },

  // Poster card
  posterCard: { width: 130, borderRadius: BORDER_RADIUS.md, overflow: 'hidden', backgroundColor: COLORS.dark.card },
  posterImage: { width: '100%', height: 185 },
  posterInfo: { padding: SPACING.sm },
  posterTitle: { color: COLORS.dark.text, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  posterMeta: { color: COLORS.dark.textMuted, fontSize: 10, marginTop: 3 },

  // Badge
  badge: {
    position: 'absolute', top: 6, left: 6,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  badgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
});

export default HomeScreen;