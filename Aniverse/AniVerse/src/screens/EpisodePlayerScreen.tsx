import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import {WebView} from 'react-native-webview';
import Video from 'react-native-video';
import {useNavigation, useRoute} from '@react-navigation/native';
import {COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS} from '../theme';
import {watchService} from '../services/api';
import type {VideoSource, WatchEmbedData} from '../types';

const EpisodePlayerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    contentId,
    contentTitle = 'Anime',
    episodeNumber = 1,
    totalEpisodes: routeTotalEpisodes = null,
  } = route.params;

  const [embedData, setEmbedData] = useState<WatchEmbedData | null>(null);
  const [activeSource, setActiveSource] = useState<VideoSource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [webviewLoading, setWebviewLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmbed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setWebviewLoading(true);

    try {
      const data = await watchService.getEmbedUrl(contentId, episodeNumber);
      setEmbedData(data);

      if (data?.sources?.length) {
        setActiveSource(data.sources[0]);
      } else {
        setActiveSource(null);
        setError('Video kaynağı bulunamadı.');
      }
    } catch {
      setError('Video yüklenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [contentId, episodeNumber]);

  useEffect(() => {
    loadEmbed();
  }, [loadEmbed]);

  const totalEpisodes = embedData?.totalEpisodes ?? routeTotalEpisodes;
  const canGoNext = !totalEpisodes || episodeNumber < totalEpisodes;
  const isDirectVideo = activeSource?.type === 'direct';
  const sourceHeaders = activeSource?.referer
    ? {Referer: activeSource.referer}
    : undefined;
  const playerSource = activeSource?.url
    ? sourceHeaders
      ? {uri: activeSource.url, headers: sourceHeaders}
      : {uri: activeSource.url}
    : undefined;

  const goToEpisode = (ep: number) => {
    navigation.replace('EpisodePlayer', {
      contentId,
      contentTitle,
      episodeNumber: ep,
      totalEpisodes,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.titleText} numberOfLines={1}>
            {contentTitle} - Bölüm {episodeNumber}
          </Text>
          <View style={{width: 40}} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Video hazırlanıyor...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.titleText}>Bölüm {episodeNumber}</Text>
          <View style={{width: 40}} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadEmbed}>
            <Text style={styles.retryBtnText}>Tekrar Dene</Text>
          </TouchableOpacity>
          {embedData?.pageUrl && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => Linking.openURL(embedData.pageUrl)}>
              <Text style={styles.secondaryBtnText}>Kaynak sayfasını aç</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.titleText} numberOfLines={1}>
          {contentTitle} - Bölüm {episodeNumber}
        </Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.videoContainer}>
        {playerSource && isDirectVideo && (
          <Video
            source={playerSource}
            style={styles.webview}
            controls
            resizeMode="contain"
            onLoadStart={() => setWebviewLoading(true)}
            onLoad={() => setWebviewLoading(false)}
            onError={() => {
              setWebviewLoading(false);
              setError('Video oynatılırken hata oluştu.');
            }}
          />
        )}
        {playerSource && !isDirectVideo && (
          <WebView
            key={playerSource.uri}
            source={playerSource}
            style={styles.webview}
            onLoadStart={() => setWebviewLoading(true)}
            onLoadEnd={() => setWebviewLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            mixedContentMode="always"
            userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
          />
        )}
        {webviewLoading && (
          <View style={styles.videoLoading}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.videoLoadingText}>Video yükleniyor...</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <View style={styles.episodeNav}>
          <TouchableOpacity
            style={[styles.navBtn, episodeNumber <= 1 && styles.navBtnDisabled]}
            onPress={() => episodeNumber > 1 && goToEpisode(episodeNumber - 1)}
            disabled={episodeNumber <= 1}>
            <Text
              style={[
                styles.navBtnText,
                episodeNumber <= 1 && styles.navBtnTextDisabled,
              ]}>
              ◀ Önceki
            </Text>
          </TouchableOpacity>

          <View style={styles.currentEp}>
            <Text style={styles.currentEpText}>Bölüm {episodeNumber}</Text>
            {totalEpisodes && (
              <Text style={styles.totalEpText}>/ {totalEpisodes}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
            onPress={() => canGoNext && goToEpisode(episodeNumber + 1)}
            disabled={!canGoNext}>
            <Text
              style={[
                styles.navBtnText,
                !canGoNext && styles.navBtnTextDisabled,
              ]}>
              Sonraki ▶
            </Text>
          </TouchableOpacity>
        </View>

        {embedData?.sources && embedData.sources.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sourceList}>
            {embedData.sources.map(source => {
              const isActive = source.url === activeSource?.url;
              return (
                <TouchableOpacity
                  key={source.url}
                  style={[
                    styles.sourceChip,
                    isActive && styles.sourceChipActive,
                  ]}
                  onPress={() => setActiveSource(source)}>
                  <Text
                    style={[
                      styles.sourceChipText,
                      isActive && styles.sourceChipTextActive,
                    ]}>
                    {source.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.sourceInfo}>
          <Text style={styles.sourceLabel}>
            {activeSource?.name || 'Kaynak seçilmedi'}
          </Text>
          <Text style={styles.sourceSite}>
            {activeSource?.type === 'direct' ? 'Direct' : 'Embed'}
          </Text>
        </View>

        {activeSource?.url && (
          <TouchableOpacity
            style={styles.openBrowserBtn}
            onPress={() => Linking.openURL(activeSource.url)}>
            <Text style={styles.openBrowserText}>Tarayıcıda Aç</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.dark.background},
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.dark.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.dark.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {color: COLORS.white, fontSize: 22, fontWeight: '600'},
  titleText: {
    flex: 1,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    textAlign: 'center',
  },

  videoContainer: {flex: 1, backgroundColor: '#000', position: 'relative'},
  webview: {flex: 1, backgroundColor: '#000'},
  videoLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  videoLoadingText: {
    color: COLORS.dark.textMuted,
    fontSize: TYPOGRAPHY.size.xs,
  },

  controls: {padding: SPACING.base, backgroundColor: COLORS.dark.surface},

  episodeNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  navBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.dark.surfaceElevated,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
  },
  navBtnDisabled: {opacity: 0.4},
  navBtnText: {
    color: COLORS.primaryLight,
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
  },
  navBtnTextDisabled: {color: COLORS.dark.textMuted},
  currentEp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}18`,
    borderWidth: 0.5,
    borderColor: `${COLORS.primary}40`,
  },
  currentEpText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
  },
  totalEpText: {color: COLORS.dark.textMuted, fontSize: TYPOGRAPHY.size.xs},

  sourceList: {gap: SPACING.sm, paddingBottom: SPACING.sm},
  sourceChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.dark.surfaceElevated,
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
  },
  sourceChipActive: {
    backgroundColor: `${COLORS.primary}25`,
    borderColor: COLORS.primary,
  },
  sourceChipText: {
    color: COLORS.dark.textSecondary,
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
  },
  sourceChipTextActive: {color: COLORS.primaryLight},

  sourceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.dark.border,
  },
  sourceLabel: {
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '500',
  },
  sourceSite: {color: COLORS.dark.textMuted, fontSize: TYPOGRAPHY.size.xs},

  openBrowserBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
  },
  openBrowserText: {
    color: COLORS.primaryLight,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '500',
  },

  loadingText: {color: COLORS.dark.textMuted, fontSize: TYPOGRAPHY.size.sm},
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: COLORS.warning,
    borderWidth: 1,
    borderColor: COLORS.warning,
    fontSize: 26,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.dark.textSecondary,
    fontSize: TYPOGRAPHY.size.base,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryBtnText: {color: COLORS.white, fontWeight: '600'},
  secondaryBtn: {paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm},
  secondaryBtnText: {color: COLORS.primaryLight, fontWeight: '600'},
});

export default EpisodePlayerScreen;
