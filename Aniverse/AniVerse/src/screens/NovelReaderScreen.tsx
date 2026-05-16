// src/screens/NovelReaderScreen.tsx
// ─────────────────────────────────────────────
// Novel okuyucu: metin tabanlı, kaydırmalı.
// Font boyutu, yazı tipi, arka plan rengi ayarı.
// Scroll pozisyonu kaydedilir.
// ─────────────────────────────────────────────

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Platform, Animated, Modal, Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { MMKV } from 'react-native-mmkv';
import type { RootState } from '../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
import { useProgress } from '../hooks';
import { apiClient } from '../services/api';

const storage = new MMKV();

// ── Okuyucu ayarları ──────────────────────────
type BgTheme = 'dark' | 'sepia' | 'white';
type FontFamily = 'system' | 'serif' | 'mono';

interface ReaderSettings {
  fontSize: number;
  fontFamily: FontFamily;
  bgTheme: BgTheme;
  lineHeight: number;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 17,
  fontFamily: 'system',
  bgTheme: 'dark',
  lineHeight: 1.8,
};

const BG_THEMES: Record<BgTheme, { bg: string; text: string; label: string }> = {
  dark: { bg: '#0F0F13', text: '#E8E8F0', label: '🌙 Gece' },
  sepia: { bg: '#F5ECD7', text: '#3D2B1F', label: '📜 Sepya' },
  white: { bg: '#FFFFFF', text: '#1A1A2E', label: '☀️ Gündüz' },
};

const FONT_FAMILIES: Record<FontFamily, { label: string; style: any }> = {
  system: { label: 'Sistem', style: { fontFamily: undefined } },
  serif: { label: 'Serif', style: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' } },
  mono: { label: 'Mono', style: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' } },
};

// ── Ana Bileşen ───────────────────────────────
const NovelReaderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { chapterId, contentId, chapterTitle } = route.params;

  const { updateNovelPosition } = useProgress(contentId);

  // Ayarları MMKV'den yükle
  const loadSettings = (): ReaderSettings => {
    try {
      const saved = storage.getString('novel_reader_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  };

  const [settings, setSettings] = useState<ReaderSettings>(loadSettings);
  const [showUI, setShowUI] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const uiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uiOpacity = useRef(new Animated.Value(1)).current;

  const { bg, text } = BG_THEMES[settings.bgTheme];

  // Novel bölüm içeriğini getir
  const { data: chapter, isLoading } = useQuery({
    queryKey: ['novel-chapter', chapterId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/novel-chapters/${chapterId}`);
      return data as { title: string; content: string; number: number };
    },
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    StatusBar.setHidden(true, 'fade');
    return () => StatusBar.setHidden(false, 'fade');
  }, []);

  // Ayarları kaydet
  const updateSettings = useCallback((update: Partial<ReaderSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...update };
      storage.set('novel_reader_settings', JSON.stringify(next));
      return next;
    });
  }, []);

  // UI otomatik gizle
  const resetUITimer = useCallback(() => {
    if (uiTimer.current) clearTimeout(uiTimer.current);
    uiTimer.current = setTimeout(() => {
      Animated.timing(uiOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
        setShowUI(false)
      );
    }, 5000);
  }, []);

  const toggleUI = useCallback(() => {
    if (showSettings) { setShowSettings(false); return; }
    if (showUI) {
      Animated.timing(uiOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
        setShowUI(false)
      );
    } else {
      setShowUI(true);
      Animated.timing(uiOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      resetUITimer();
    }
  }, [showUI, showSettings, resetUITimer]);

  // Scroll pozisyonunu kaydet (debounce)
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScroll = useCallback((e: any) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
    scrollSaveTimer.current = setTimeout(() => {
      updateNovelPosition(chapterId, Math.round(scrollY.current));
    }, 2000);
  }, [chapterId, updateNovelPosition]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={[styles.loadingText, { color: text }]}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* ── İçerik ────────────────────────── */}
      <Pressable style={{ flex: 1 }} onPress={toggleUI}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={32}
        >
          {/* Bölüm başlığı */}
          <Text style={[styles.chapterTitle, { color: text, ...FONT_FAMILIES[settings.fontFamily].style }]}>
            {chapter?.title ?? chapterTitle}
          </Text>
          <View style={[styles.divider, { backgroundColor: `${text}20` }]} />

          {/* Novel metni */}
          <Text style={[
            styles.novelText,
            {
              color: text,
              fontSize: settings.fontSize,
              lineHeight: settings.fontSize * settings.lineHeight,
              ...FONT_FAMILIES[settings.fontFamily].style,
            },
          ]}>
            {chapter?.content ?? ''}
          </Text>

          {/* Bölüm sonu */}
          <View style={styles.chapterEnd}>
            <View style={[styles.endLine, { backgroundColor: `${text}20` }]} />
            <Text style={[styles.endText, { color: `${text}60` }]}>Bölüm Sonu</Text>
            <View style={[styles.endLine, { backgroundColor: `${text}20` }]} />
          </View>
        </ScrollView>
      </Pressable>

      {/* ── Üst bar ───────────────────────── */}
      {showUI && (
        <Animated.View style={[styles.topBar, { backgroundColor: `${bg}F0`, opacity: uiOpacity }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.barBtn}>
            <Text style={[styles.barIcon, { color: text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.barTitle, { color: text }]} numberOfLines={1}>
            {chapter?.title ?? chapterTitle}
          </Text>
          <TouchableOpacity
            onPress={() => { setShowSettings(s => !s); }}
            style={styles.barBtn}
          >
            <Text style={[styles.barIcon, { color: text }]}>Aa</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Ayarlar paneli ─────────────────── */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSettings(false)}>
          <Pressable
            style={[styles.settingsPanel, { backgroundColor: COLORS.dark.surface }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.settingsHandle} />

            {/* Font boyutu */}
            <Text style={styles.settingLabel}>Yazı Boyutu</Text>
            <View style={styles.fontSizeRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => updateSettings({ fontSize: Math.max(13, settings.fontSize - 1) })}
              >
                <Text style={styles.stepBtnText}>A−</Text>
              </TouchableOpacity>
              <Text style={styles.fontSizeValue}>{settings.fontSize}px</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => updateSettings({ fontSize: Math.min(28, settings.fontSize + 1) })}
              >
                <Text style={styles.stepBtnText}>A+</Text>
              </TouchableOpacity>
            </View>

            {/* Satır aralığı */}
            <Text style={styles.settingLabel}>Satır Aralığı</Text>
            <View style={styles.fontSizeRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => updateSettings({ lineHeight: Math.max(1.3, +(settings.lineHeight - 0.1).toFixed(1)) })}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.fontSizeValue}>{settings.lineHeight.toFixed(1)}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => updateSettings({ lineHeight: Math.min(2.5, +(settings.lineHeight + 0.1).toFixed(1)) })}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Yazı tipi */}
            <Text style={styles.settingLabel}>Yazı Tipi</Text>
            <View style={styles.optionRow}>
              {(Object.keys(FONT_FAMILIES) as FontFamily[]).map(ff => (
                <TouchableOpacity
                  key={ff}
                  style={[
                    styles.optionChip,
                    settings.fontFamily === ff && styles.optionChipActive,
                  ]}
                  onPress={() => updateSettings({ fontFamily: ff })}
                >
                  <Text style={[
                    styles.optionChipText,
                    { ...FONT_FAMILIES[ff].style },
                    settings.fontFamily === ff && { color: COLORS.primary },
                  ]}>
                    {FONT_FAMILIES[ff].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Arka plan */}
            <Text style={styles.settingLabel}>Arka Plan</Text>
            <View style={styles.optionRow}>
              {(Object.keys(BG_THEMES) as BgTheme[]).map(theme => (
                <TouchableOpacity
                  key={theme}
                  style={[
                    styles.bgChip,
                    { backgroundColor: BG_THEMES[theme].bg, borderColor: BG_THEMES[theme].text + '30' },
                    settings.bgTheme === theme && {
                      borderColor: COLORS.primary,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => updateSettings({ bgTheme: theme })}
                >
                  <Text style={[styles.bgChipText, { color: BG_THEMES[theme].text }]}>
                    {BG_THEMES[theme].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingText: { marginTop: SPACING.md, fontSize: TYPOGRAPHY.size.sm },

  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: 120,
  },
  chapterTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    lineHeight: 32,
    marginBottom: SPACING.md,
  },
  divider: { height: 1, marginBottom: SPACING.lg },
  novelText: {
    letterSpacing: 0.2,
  },
  chapterEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xl * 2,
    gap: SPACING.md,
  },
  endLine: { flex: 1, height: 1 },
  endText: { fontSize: TYPOGRAPHY.size.xs, fontWeight: '500', letterSpacing: 1 },

  // Üst bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  barBtn: { padding: SPACING.sm, minWidth: 44 },
  barIcon: { fontSize: 18, fontWeight: '600' },
  barTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Ayarlar modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  settingsPanel: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
    gap: SPACING.sm,
  },
  settingsHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.dark.border,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  settingLabel: {
    color: COLORS.dark.textMuted,
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: SPACING.sm,
  },
  fontSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  stepBtn: {
    width: 52,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.dark.surfaceElevated,
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { color: COLORS.dark.text, fontSize: TYPOGRAPHY.size.base, fontWeight: '600' },
  fontSizeValue: {
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: '500',
    minWidth: 50,
    textAlign: 'center',
  },
  optionRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  optionChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
  },
  optionChipActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}15` },
  optionChipText: { color: COLORS.dark.text, fontSize: TYPOGRAPHY.size.sm },
  bgChip: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  bgChipText: { fontSize: TYPOGRAPHY.size.xs, fontWeight: '500' },
});

export default NovelReaderScreen;
