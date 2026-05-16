// src/screens/LibraryScreen.tsx
// ─────────────────────────────────────────────
// Kütüphane: Favoriler, Geçmiş, Kaldığım Yerden.
// Kullanıcıya özel içerik listesi.
// ─────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SectionList, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useQuery } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
import { userService } from '../services/api';
import { toggleFavorite } from '../store/slices';
import type { Content, WatchStatus } from '../types';

// ── Sekme tanımları ───────────────────────────
type LibraryTab = 'continue' | 'favorites' | 'history';

const TABS: Array<{ key: LibraryTab; label: string; icon: string }> = [
  { key: 'continue', label: 'Devam Et', icon: '▶' },
  { key: 'favorites', label: 'Favoriler', icon: '❤️' },
  { key: 'history', label: 'Geçmiş', icon: '🕐' },
];

const WATCH_STATUS_LABELS: Record<WatchStatus, string> = {
  watching: 'İzliyorum',
  completed: 'Tamamladım',
  on_hold: 'Bekliyor',
  dropped: 'Bıraktım',
  plan_to_watch: 'Planlıyorum',
};

const WATCH_STATUS_COLORS: Record<WatchStatus, string> = {
  watching: COLORS.primary,
  completed: COLORS.success,
  on_hold: COLORS.warning,
  dropped: COLORS.error,
  plan_to_watch: COLORS.info,
};

// ── Yatay devam kartı ─────────────────────────
const ContinueCard: React.FC<{
  item: Content;
  progress?: { lastEpisodeNumber?: number; lastChapterNumber?: number; lastEpisodeTimestamp?: number };
  onPress: () => void;
}> = React.memo(({ item, progress, onPress }) => {
  const progressText = progress?.lastEpisodeNumber
    ? `Bölüm ${progress.lastEpisodeNumber}${progress.lastEpisodeTimestamp ? ` • ${Math.floor(progress.lastEpisodeTimestamp / 60)} dk` : ''}`
    : progress?.lastChapterNumber
    ? `Bölüm ${progress.lastChapterNumber}`
    : 'Başla';

  // Tahmini ilerleme yüzdesi
  const episodeProgress =
    progress?.lastEpisodeTimestamp && item.episodeDuration
      ? Math.min((progress.lastEpisodeTimestamp / (item.episodeDuration * 60)) * 100, 100)
      : 0;

  return (
    <TouchableOpacity style={styles.continueCard} onPress={onPress} activeOpacity={0.85}>
      <FastImage
        source={{ uri: item.coverImage, priority: FastImage.priority.normal }}
        style={styles.continueImage}
        resizeMode={FastImage.resizeMode.cover}
      />
      {/* İlerleme çubuğu */}
      {episodeProgress > 0 && (
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${episodeProgress}%` }]} />
        </View>
      )}
      <View style={styles.continueInfo}>
        <Text style={styles.continueTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.continueSub}>{progressText}</Text>
        <View style={styles.continuePlayBtn}>
          <Text style={styles.continuePlayText}>▶ Devam Et</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ── Favori liste öğesi ────────────────────────
const FavoriteItem: React.FC<{
  item: Content;
  onPress: () => void;
  onRemove: () => void;
}> = React.memo(({ item, onPress, onRemove }) => {
  const typeColor = COLORS.typeColors[item.type as keyof typeof COLORS.typeColors];
  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.8}>
      <FastImage
        source={{ uri: item.coverImage, priority: FastImage.priority.low }}
        style={styles.listImage}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.listInfo}>
        <Text style={styles.listTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.listMeta}>
          <View style={[styles.typeBadge, { backgroundColor: `${typeColor}20`, borderColor: `${typeColor}40` }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>{item.type}</Text>
          </View>
          <Text style={styles.listRating}>⭐ {item.rating.toFixed(1)}</Text>
        </View>
        <Text style={styles.listStatus}>
          {item.status === 'ongoing' ? '🟢 Devam Ediyor' : '✅ Tamamlandı'}
          {item.totalEpisodes ? ` • ${item.totalEpisodes} Bölüm` : ''}
          {item.totalChapters ? ` • ${item.totalChapters} Bölüm` : ''}
        </Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={{ color: COLORS.error, fontSize: 20 }}>♡</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

// ── Geçmiş liste öğesi ───────────────────────
const HistoryItem: React.FC<{
  item: Content;
  onPress: () => void;
}> = React.memo(({ item, onPress }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.8}>
    <FastImage
      source={{ uri: item.coverImage, priority: FastImage.priority.low }}
      style={styles.listImage}
      resizeMode={FastImage.resizeMode.cover}
    />
    <View style={styles.listInfo}>
      <Text style={styles.listTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.listStatus}>{item.type.toUpperCase()} • {item.year}</Text>
      <Text style={[styles.listRating, { marginTop: 4 }]}>⭐ {item.rating.toFixed(1)}</Text>
    </View>
    <Text style={{ color: COLORS.dark.textMuted, fontSize: 20 }}>›</Text>
  </TouchableOpacity>
));

// ── Ana Bileşen ───────────────────────────────
const LibraryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useSelector((s: RootState) => s.ui.theme);
  const isDark = theme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const user = useSelector((s: RootState) => s.auth.user);
  const progressMap = useSelector((s: RootState) => s.user.progressMap);
  const localFavorites = useSelector((s: RootState) => s.user.favorites);

  const [activeTab, setActiveTab] = useState<LibraryTab>('continue');

  // Favoriler
  const { data: favorites, isLoading: favLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => userService.getFavorites(user!.id),
    enabled: !!user && activeTab === 'favorites',
    staleTime: 2 * 60 * 1000,
  });

  // Geçmiş
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['history', user?.id],
    queryFn: () => userService.getHistory(user!.id),
    enabled: !!user && activeTab === 'history',
    staleTime: 60 * 1000,
  });

  // Devam et: progress'i olan içerikler
  const continueItems = Object.values(progressMap)
    .filter(p => p.watchStatus === 'watching' && (p.lastEpisodeNumber || p.lastChapterNumber))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 20);

  const navigateToDetail = useCallback((id: string, title?: string) => {
    navigation.navigate('ContentDetail', { contentId: id, contentTitle: title });
  }, [navigation]);

  const handleRemoveFavorite = useCallback((id: string) => {
    dispatch(toggleFavorite(id));
  }, [dispatch]);

  // Giriş yapılmamışsa
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 48 }}>📚</Text>
        <Text style={[styles.screenTitle, { color: colors.text, marginTop: SPACING.md }]}>
          Kütüphanem
        </Text>
        <Text style={{ color: colors.textSecondary, marginTop: SPACING.sm, textAlign: 'center', paddingHorizontal: SPACING.xl }}>
          Kütüphanenizi görmek için giriş yapın.
        </Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={styles.loginBtnText}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Başlık ──────────────────────────── */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 56 : 40 }]}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Kütüphanem</Text>
      </View>

      {/* ── Sekme çubuğu ────────────────────── */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: COLORS.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? COLORS.primary : colors.textSecondary },
            ]}>
              {tab.icon} {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── İçerik alanı ────────────────────── */}

      {/* Devam Et */}
      {activeTab === 'continue' && (
        <FlatList
          data={continueItems}
          keyExtractor={item => item.contentId}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48 }}>▶</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Henüz Başlamadınız</Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                İzlemeye veya okumaya başladığınız içerikler burada görünür.
              </Text>
              <TouchableOpacity
                style={styles.discoverBtn}
                onPress={() => navigation.navigate('Discover')}
              >
                <Text style={styles.discoverBtnText}>İçerik Keşfet</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const prog = progressMap[item.contentId];
            // Basit mock content — gerçekte content detayını da çekerdiniz
            const mockContent: Content = {
              id: item.contentId,
              title: item.contentId,
              type: 'anime',
              status: 'ongoing',
              coverImage: '',
              synopsis: '',
              genres: [],
              tags: [],
              rating: 0,
              ratingCount: 0,
              popularity: 0,
              year: 2024,
            };
            return (
              <ContinueCard
                item={mockContent}
                progress={prog}
                onPress={() => navigateToDetail(item.contentId)}
              />
            );
          }}
        />
      )}

      {/* Favoriler */}
      {activeTab === 'favorites' && (
        <>
          {favLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ margin: SPACING.xl }} />
          ) : (
            <FlatList
              data={favorites ?? []}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text style={[styles.listHeader, { color: colors.textMuted }]}>
                  {(favorites?.length ?? 0).toLocaleString('tr')} içerik
                </Text>
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={{ fontSize: 48 }}>🤍</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>Favori Yok</Text>
                  <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                    İçerikleri favorilerinize ekleyerek burada saklayabilirsiniz.
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <FavoriteItem
                  item={item}
                  onPress={() => navigateToDetail(item.id, item.title)}
                  onRemove={() => handleRemoveFavorite(item.id)}
                />
              )}
            />
          )}
        </>
      )}

      {/* Geçmiş */}
      {activeTab === 'history' && (
        <>
          {historyLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ margin: SPACING.xl }} />
          ) : (
            <FlatList
              data={historyData?.data ?? []}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text style={[styles.listHeader, { color: colors.textMuted }]}>
                  Son görüntülenenler
                </Text>
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={{ fontSize: 48 }}>🕐</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>Geçmiş Boş</Text>
                  <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                    İzlediğiniz ve okuduğunuz içerikler burada görünür.
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <HistoryItem
                  item={item}
                  onPress={() => navigateToDetail(item.id, item.title)}
                />
              )}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  screenTitle: { fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.bold },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: TYPOGRAPHY.size.sm, fontWeight: '600' },

  listContainer: { paddingBottom: 100 },
  listHeader: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '500',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Continue card
  continueCard: {
    flexDirection: 'row',
    marginHorizontal: SPACING.base,
    marginVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.dark.card,
    height: 100,
  },
  continueImage: { width: 70, height: '100%' },
  progressBarBg: {
    position: 'absolute',
    bottom: 0,
    left: 70,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  continueInfo: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  continueTitle: {
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    lineHeight: 18,
  },
  continueSub: {
    color: COLORS.dark.textSecondary,
    fontSize: TYPOGRAPHY.size.xs,
  },
  continuePlayBtn: {
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 0.5,
    borderColor: `${COLORS.primary}40`,
  },
  continuePlayText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '600',
  },

  // List item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.dark.border,
    gap: SPACING.md,
  },
  listImage: {
    width: 58,
    height: 82,
    borderRadius: BORDER_RADIUS.sm,
  },
  listInfo: { flex: 1 },
  listTitle: {
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 4,
  },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 0.5,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  listRating: { color: COLORS.dark.textSecondary, fontSize: TYPOGRAPHY.size.xs },
  listStatus: { color: COLORS.dark.textMuted, fontSize: TYPOGRAPHY.size.xs },
  removeBtn: { padding: SPACING.sm },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  emptyTitle: { fontSize: TYPOGRAPHY.size.lg, fontWeight: TYPOGRAPHY.weight.semibold },
  emptyDesc: { fontSize: TYPOGRAPHY.size.sm, textAlign: 'center', lineHeight: 21 },
  discoverBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  discoverBtnText: { color: COLORS.white, fontWeight: '600' },

  // Login prompt
  loginBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  loginBtnText: { color: COLORS.white, fontWeight: '600', fontSize: TYPOGRAPHY.size.base },
});

export default LibraryScreen;
