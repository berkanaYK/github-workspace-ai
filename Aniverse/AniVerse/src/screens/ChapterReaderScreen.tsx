// src/screens/ChapterReaderScreen.tsx
// ─────────────────────────────────────────────
// Manga / Manhwa / Manhua okuyucu.
// Dikey (webtoon/manhwa) veya yatay (manga) mod.
// Sayfa ilerleme kaydı, chapter geçişi.
// ─────────────────────────────────────────────

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Dimensions, ActivityIndicator, Platform,
  Animated, Modal, ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useQuery } from '@tanstack/react-query';
import type { RootState } from '../store';
import { useSelector } from 'react-redux';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
import { contentService } from '../services/api';
import { useProgress } from '../hooks';

const { width: W, height: H } = Dimensions.get('window');

type ReadingMode = 'vertical' | 'horizontal';

// ── Tek sayfa bileşeni ────────────────────────
const PageItem: React.FC<{
  uri: string;
  mode: ReadingMode;
  pageIndex: number;
  totalPages: number;
}> = React.memo(({ uri, mode, pageIndex, totalPages }) => {
  const [ratio, setRatio] = useState(1.4); // varsayılan en-boy oranı

  if (mode === 'vertical') {
    // Webtoon/manhwa: tam genişlik, doğal yükseklik
    return (
      <FastImage
        source={{ uri, priority: FastImage.priority.normal }}
        style={{ width: W, height: W * ratio }}
        resizeMode={FastImage.resizeMode.contain}
        onLoad={e => {
          const { width, height } = e.nativeEvent;
          if (width > 0) setRatio(height / width);
        }}
      />
    );
  }

  // Yatay: tam ekran, contain
  return (
    <View style={styles.horizontalPage}>
      <FastImage
        source={{ uri, priority: FastImage.priority.normal }}
        style={styles.horizontalImage}
        resizeMode={FastImage.resizeMode.contain}
      />
    </View>
  );
});

// ── Ana Bileşen ───────────────────────────────
const ChapterReaderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { chapterId, contentId, chapterNumber } = route.params;

  const theme = useSelector((s: RootState) => s.ui.theme);
  const { updateChapterPage } = useProgress(contentId);

  const [mode, setMode] = useState<ReadingMode>('vertical');
  const [currentPage, setCurrentPage] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const [showModeModal, setShowModeModal] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const uiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uiOpacity = useRef(new Animated.Value(1)).current;

  // Sayfa kaynaklarını getir
  const { data: chapterData, isLoading } = useQuery({
    queryKey: ['chapter-pages', chapterId],
    queryFn: () => contentService.getChapterPages(chapterId),
    staleTime: 60 * 60 * 1000,
  });

  const pages = chapterData?.pages ?? [];

  useEffect(() => {
    StatusBar.setHidden(true, 'fade');
    return () => StatusBar.setHidden(false, 'fade');
  }, []);

  // UI otomatik gizle
  const resetUITimer = useCallback(() => {
    if (uiTimer.current) clearTimeout(uiTimer.current);
    uiTimer.current = setTimeout(() => {
      Animated.timing(uiOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
        setShowUI(false)
      );
    }, 4000);
  }, []);

  const toggleUI = useCallback(() => {
    if (showUI) {
      Animated.timing(uiOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
        setShowUI(false)
      );
    } else {
      setShowUI(true);
      Animated.timing(uiOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      resetUITimer();
    }
  }, [showUI, resetUITimer]);

  // Görüntülenen sayfayı takip et
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        const idx = viewableItems[0].index ?? 0;
        setCurrentPage(idx);
        updateChapterPage(chapterId, chapterNumber, idx);
      }
    },
    [chapterId, chapterNumber, updateChapterPage]
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingState]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Bölüm yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Sayfa listesi ─────────────────── */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={toggleUI}
        activeOpacity={1}
      >
        <FlatList
          ref={flatListRef}
          data={pages}
          keyExtractor={(_, i) => `page-${i}`}
          horizontal={mode === 'horizontal'}
          pagingEnabled={mode === 'horizontal'}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          removeClippedSubviews
          maxToRenderPerBatch={4}
          windowSize={7}
          initialNumToRender={3}
          getItemLayout={
            mode === 'horizontal'
              ? (_, index) => ({ length: W, offset: W * index, index })
              : undefined
          }
          renderItem={({ item, index }) => (
            <PageItem
              uri={item}
              mode={mode}
              pageIndex={index}
              totalPages={pages.length}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ color: COLORS.dark.textMuted, fontSize: TYPOGRAPHY.size.base }}>
                Sayfa bulunamadı.
              </Text>
            </View>
          }
        />
      </TouchableOpacity>

      {/* ── Üst UI ───────────────────────── */}
      {showUI && (
        <Animated.View style={[styles.topBar, { opacity: uiOpacity }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.topBarIcon}>✕</Text>
          </TouchableOpacity>
          <View style={styles.topBarInfo}>
            <Text style={styles.topBarTitle}>Bölüm {chapterNumber}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowModeModal(true)}
            style={styles.modeBtn}
          >
            <Text style={styles.topBarIcon}>
              {mode === 'vertical' ? '⇅' : '⇄'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Alt UI — sayfa numarası ve progress ── */}
      {showUI && pages.length > 0 && (
        <Animated.View style={[styles.bottomBar, { opacity: uiOpacity }]}>
          {/* Sayfa ilerlemesi çubuğu */}
          <View style={styles.pageProgressTrack}>
            <View style={[
              styles.pageProgressFill,
              { width: `${((currentPage + 1) / pages.length) * 100}%` },
            ]} />
          </View>
          <Text style={styles.pageCounter}>
            {currentPage + 1} / {pages.length}
          </Text>

          {/* Sayfa atla butonları */}
          <View style={styles.pageNav}>
            <TouchableOpacity
              style={[styles.pageNavBtn, currentPage === 0 && styles.pageNavBtnDisabled]}
              onPress={() => {
                if (currentPage > 0 && flatListRef.current) {
                  flatListRef.current.scrollToIndex({
                    index: currentPage - 1,
                    animated: true,
                  });
                }
              }}
              disabled={currentPage === 0}
            >
              <Text style={styles.pageNavText}>‹ Önceki</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pageNavBtn, currentPage === pages.length - 1 && styles.pageNavBtnDisabled]}
              onPress={() => {
                if (currentPage < pages.length - 1 && flatListRef.current) {
                  flatListRef.current.scrollToIndex({
                    index: currentPage + 1,
                    animated: true,
                  });
                }
              }}
              disabled={currentPage === pages.length - 1}
            >
              <Text style={styles.pageNavText}>Sonraki ›</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ── Okuma modu seçici modal ───────── */}
      <Modal
        visible={showModeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowModeModal(false)}
          activeOpacity={1}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Okuma Modu</Text>

            <TouchableOpacity
              style={[styles.modalOption, mode === 'vertical' && styles.modalOptionActive]}
              onPress={() => { setMode('vertical'); setShowModeModal(false); }}
            >
              <Text style={styles.modalOptionIcon}>⇅</Text>
              <View>
                <Text style={styles.modalOptionLabel}>Dikey Kaydırma</Text>
                <Text style={styles.modalOptionDesc}>Webtoon / Manhwa için</Text>
              </View>
              {mode === 'vertical' && <Text style={{ color: COLORS.primary }}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, mode === 'horizontal' && styles.modalOptionActive]}
              onPress={() => { setMode('horizontal'); setShowModeModal(false); }}
            >
              <Text style={styles.modalOptionIcon}>⇄</Text>
              <View>
                <Text style={styles.modalOptionLabel}>Yatay Sayfa</Text>
                <Text style={styles.modalOptionDesc}>Manga / Manhua için</Text>
              </View>
              {mode === 'horizontal' && <Text style={{ color: COLORS.primary }}>✓</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingState: { alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  loadingText: { color: COLORS.dark.textSecondary, fontSize: TYPOGRAPHY.size.sm },

  horizontalPage: { width: W, height: H, alignItems: 'center', justifyContent: 'center' },
  horizontalImage: { width: W, height: H },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  backBtn: { padding: SPACING.sm },
  topBarIcon: { color: COLORS.white, fontSize: 22 },
  topBarInfo: { flex: 1, alignItems: 'center' },
  topBarTitle: { color: COLORS.white, fontSize: TYPOGRAPHY.size.sm, fontWeight: '600' },
  modeBtn: { padding: SPACING.sm },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.md,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.base,
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: SPACING.sm,
  },
  pageProgressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  pageProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  pageCounter: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: TYPOGRAPHY.size.xs,
    textAlign: 'center',
  },
  pageNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pageNavBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pageNavBtnDisabled: { opacity: 0.3 },
  pageNavText: { color: COLORS.white, fontSize: TYPOGRAPHY.size.sm, fontWeight: '500' },

  emptyState: {
    width: W,
    height: H,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: COLORS.dark.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.base,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
  },
  modalTitle: {
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    marginBottom: SPACING.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  modalOptionActive: { backgroundColor: `${COLORS.primary}15` },
  modalOptionIcon: { fontSize: 28, width: 36, textAlign: 'center' },
  modalOptionLabel: { color: COLORS.dark.text, fontSize: TYPOGRAPHY.size.base, fontWeight: '500' },
  modalOptionDesc: { color: COLORS.dark.textMuted, fontSize: TYPOGRAPHY.size.xs, marginTop: 2 },
});

export default ChapterReaderScreen;
