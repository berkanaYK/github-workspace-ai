import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS} from '../theme';
import {watchService} from '../services/api';

const EPISODES_PER_SEASON = 24;

const EpisodeListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {contentId, contentTitle} = route.params;

  const [animeData, setAnimeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState(0);

  const loadEpisodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await watchService.getAnimeEpisodes(contentId);
      if (data && data.episodes && data.episodes.length > 0) {
        setAnimeData(data);
        setActiveSeason(0);
      } else {
        setError('Bu anime için bölüm bulunamadı.');
      }
    } catch (err) {
      setError('Bölümler yüklenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    loadEpisodes();
  }, [loadEpisodes]);

  // Bölümleri sezonlara ayır
  const seasons = useMemo(() => {
    if (!animeData?.episodes) {
      return [];
    }

    const eps = animeData.episodes;
    const seasonCount = Math.ceil(eps.length / EPISODES_PER_SEASON);
    const result = [];

    for (let i = 0; i < seasonCount; i++) {
      const start = i * EPISODES_PER_SEASON;
      const end = Math.min(start + EPISODES_PER_SEASON, eps.length);
      result.push({
        number: i + 1,
        title: seasonCount === 1 ? 'Tüm Bölümler' : `Sezon ${i + 1}`,
        episodes: eps.slice(start, end),
        range: `${start + 1}-${end}`,
      });
    }

    return result;
  }, [animeData]);

  const playEpisode = (episode: any) => {
    navigation.navigate('EpisodePlayer', {
      contentId,
      contentTitle,
      episodeNumber: episode.number,
      totalEpisodes:
        animeData?.totalEpisodes || animeData?.episodes?.length || null,
    });
  };

  const renderEpisode = (episode: any) => (
    <TouchableOpacity
      key={`ep-${episode.number}`}
      style={[styles.episodeItem, episode.filler && styles.episodeItemFiller]}
      onPress={() => playEpisode(episode)}
      activeOpacity={0.75}>
      <View
        style={[
          styles.episodeNumber,
          episode.filler && {backgroundColor: `${COLORS.warning}18`},
        ]}>
        <Text
          style={[
            styles.episodeNumberText,
            episode.filler && {color: COLORS.warning},
          ]}>
          {episode.number}
        </Text>
      </View>
      <View style={styles.episodeInfo}>
        <Text style={styles.episodeTitle} numberOfLines={1}>
          {episode.title || `Bölüm ${episode.number}`}
        </Text>
        <View style={styles.episodeMeta}>
          {episode.aired && (
            <Text style={styles.episodeDate}>
              {new Date(episode.aired).toLocaleDateString('tr')}
            </Text>
          )}
          {episode.filler && (
            <View style={styles.fillerBadge}>
              <Text style={styles.fillerText}>FILLER</Text>
            </View>
          )}
          {episode.recap && (
            <View style={styles.recapBadge}>
              <Text style={styles.recapText}>RECAP</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.playButton}>
        <Text style={styles.playIcon}>▶</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Bölümler yükleniyor...</Text>
        <Text style={styles.loadingSubText}>{contentTitle}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>😔</Text>
        <Text style={styles.errorTitle}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadEpisodes}>
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backBtnAlt}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnAltText}>← Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Üst bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.topBarBack}>←</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {contentTitle}
          </Text>
          <Text style={styles.topBarSub}>
            {animeData?.totalEpisodes || animeData?.episodes?.length || 0} Bölüm
          </Text>
        </View>
        <View style={styles.topBarSpacer} />
      </View>

      <FlatList
        data={seasons}
        keyExtractor={item => `season-${item.number}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.seasonIntro}>
            <Text style={styles.seasonIntroTitle}>Sezonlar</Text>
            <Text style={styles.seasonIntroText}>
              Sezona dokun, bölümleri aç.
            </Text>
          </View>
        }
        renderItem={({item, index}) => (
          <View style={styles.seasonCard}>
            <TouchableOpacity
              style={[
                styles.seasonHeader,
                activeSeason === index && styles.seasonHeaderActive,
              ]}
              onPress={() => setActiveSeason(index)}
              activeOpacity={0.8}>
              <View style={styles.seasonHeaderText}>
                <Text style={styles.seasonTitle}>{item.title}</Text>
                <Text style={styles.seasonRange}>
                  Bölüm {item.range} • {item.episodes.length} bölüm
                </Text>
              </View>
              <Text
                style={[
                  styles.seasonChevron,
                  activeSeason === index && styles.seasonChevronActive,
                ]}>
                {activeSeason === index ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            {activeSeason === index && (
              <View style={styles.episodeGroup}>
                {item.episodes.map(renderEpisode)}
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.dark.background},
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.dark.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.dark.border,
  },
  topBarBack: {color: COLORS.white, fontSize: 22, fontWeight: '600', width: 30},
  topBarSpacer: {width: 30},
  topBarCenter: {flex: 1, alignItems: 'center'},
  topBarTitle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: '600',
  },
  topBarSub: {
    color: COLORS.dark.textMuted,
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 2,
  },

  seasonIntro: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  listContent: {paddingBottom: 100},
  seasonIntroTitle: {
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: '700',
  },
  seasonIntroText: {
    color: COLORS.dark.textMuted,
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 3,
  },
  seasonCard: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
    backgroundColor: COLORS.dark.surface,
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.dark.surfaceElevated,
  },
  seasonHeaderActive: {
    backgroundColor: `${COLORS.primary}20`,
  },
  seasonHeaderText: {flex: 1},
  seasonTitle: {
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
  },
  seasonRange: {
    color: COLORS.dark.textMuted,
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 4,
  },
  seasonChevron: {
    color: COLORS.dark.textMuted,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  seasonChevronActive: {
    color: COLORS.primaryLight,
  },
  episodeGroup: {
    backgroundColor: COLORS.dark.surface,
  },

  episodeCount: {
    color: COLORS.dark.textMuted,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '500',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },

  episodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.dark.border,
    gap: SPACING.md,
  },
  episodeItemFiller: {opacity: 0.6},
  episodeNumber: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeNumberText: {
    color: COLORS.primaryLight,
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: '700',
  },
  episodeInfo: {flex: 1},
  episodeTitle: {
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
  },
  episodeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 4,
  },
  episodeDate: {color: COLORS.dark.textMuted, fontSize: TYPOGRAPHY.size.xs},
  fillerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: `${COLORS.warning}20`,
    borderWidth: 0.5,
    borderColor: `${COLORS.warning}40`,
  },
  fillerText: {color: COLORS.warning, fontSize: 9, fontWeight: '700'},
  recapBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: `${COLORS.info}20`,
    borderWidth: 0.5,
    borderColor: `${COLORS.info}40`,
  },
  recapText: {color: COLORS.info, fontSize: 9, fontWeight: '700'},
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}25`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {color: COLORS.primary, fontSize: 16},

  loadingText: {
    color: COLORS.dark.textMuted,
    fontSize: TYPOGRAPHY.size.sm,
    marginTop: SPACING.md,
  },
  loadingSubText: {
    color: COLORS.dark.textMuted,
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: SPACING.xs,
  },
  errorIcon: {fontSize: 48},
  errorTitle: {
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: '600',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  retryText: {color: COLORS.white, fontWeight: '600'},
  backBtnAlt: {marginTop: SPACING.md, padding: SPACING.md},
  backBtnAltText: {color: COLORS.primaryLight, fontWeight: '500'},
});

export default EpisodeListScreen;
