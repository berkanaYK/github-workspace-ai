// src/screens/ContentDetailScreen.tsx
import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Share,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS} from '../theme';
import {contentService} from '../services/api';
import {toggleFavorite, addToHistory} from '../store/slices';
import type {RootState} from '../store';

const TypeBadge: React.FC<{type: string}> = ({type}) => {
  const color =
    COLORS.typeColors[type?.toLowerCase() as keyof typeof COLORS.typeColors] ??
    COLORS.primary;
  return (
    <View
      style={[
        styles.badge,
        {backgroundColor: `${color}25`, borderColor: `${color}60`},
      ]}>
      <Text style={[styles.badgeText, {color}]}>{type}</Text>
    </View>
  );
};

const CharacterCard: React.FC<{
  name: string;
  image?: string;
  role: string;
  voiceActor?: string;
}> = ({name, image, role, voiceActor}) => (
  <View style={styles.characterCard}>
    {image ? (
      <Image source={{uri: image}} style={styles.characterImage} />
    ) : (
      <View style={[styles.characterImage, styles.characterPlaceholder]}>
        <Text style={{fontSize: 20}}>👤</Text>
      </View>
    )}
    <Text style={styles.characterName} numberOfLines={1}>
      {name}
    </Text>
    <Text style={styles.characterRole}>
      {role === 'main' ? 'Ana' : 'Yardımcı'}
    </Text>
    {voiceActor && (
      <Text style={styles.characterVA} numberOfLines={1}>
        {voiceActor}
      </Text>
    )}
  </View>
);

const RelatedCard: React.FC<{item: any; onPress: () => void}> = ({
  item,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.relatedCard}
    onPress={onPress}
    activeOpacity={0.85}>
    {item.coverImage ? (
      <Image source={{uri: item.coverImage}} style={styles.relatedImage} />
    ) : (
      <View
        style={[
          styles.relatedImage,
          {backgroundColor: COLORS.dark.surfaceElevated},
        ]}
      />
    )}
    <Text style={styles.relatedTitle} numberOfLines={2}>
      {item.title}
    </Text>
    <TypeBadge type={item.type} />
  </TouchableOpacity>
);

const ContentDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const {contentId} = route.params;

  const theme = useSelector((s: RootState) => s.ui.theme);
  const isDark = theme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;
  const favorites = useSelector((s: RootState) => s.user.favorites);
  const isFavorite = favorites.includes(contentId);

  const [activeTab, setActiveTab] = useState('info');

  const {
    data: content,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['content', contentId],
    queryFn: () => contentService.getContentDetail(contentId),
  });

  useEffect(() => {
    if (content) {
      dispatch(addToHistory(contentId));
    }
  }, [content, contentId, dispatch]);

  const handleFavorite = useCallback(() => {
    dispatch(toggleFavorite(contentId));
  }, [contentId, dispatch]);

  const handleShare = useCallback(async () => {
    if (!content) {
      return;
    }
    try {
      await Share.share({message: `${content.title} — AniVerse'de keşfet!`});
    } catch {}
  }, [content]);

  const handleWatch = useCallback(() => {
    if (!content) {
      return;
    }
    navigation.navigate('EpisodeList', {
      contentId: content.id,
      contentTitle: content.title,
    });
  }, [content, navigation]);

  const handleRead = useCallback(() => {
    if (!content) {
      return;
    }
    navigation.navigate('ChapterReader', {
      chapterId: '',
      contentId: content.id,
      chapterNumber: 1,
      contentTitle: content.title,
    });
  }, [content, navigation]);

  const genres =
    content?.genres
      ?.map((g: any) => g.genre?.name || g.name || g)
      .filter(Boolean) || [];
  const characters =
    content?.characters?.map((c: any) => ({
      name: c.character?.name || c.name,
      image: c.character?.image || c.image,
      role: c.role,
      voiceActor: c.voiceActor,
    })) || [];
  const relatedWorks = content?.relatedWorks || [];

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={{color: colors.textMuted, marginTop: SPACING.md}}>
          Yükleniyor...
        </Text>
      </View>
    );
  }

  if (error || !content) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}>
        <Text style={{fontSize: 48}}>😔</Text>
        <Text
          style={{
            color: colors.text,
            fontSize: TYPOGRAPHY.size.lg,
            fontWeight: '600',
            marginTop: SPACING.md,
          }}>
          İçerik bulunamadı
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtnAlt}>
          <Text style={{color: COLORS.primary, fontWeight: '600'}}>
            ← Geri Dön
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusText =
    content.status === 'ongoing'
      ? 'Devam Ediyor'
      : content.status === 'completed'
      ? 'Tamamlandı'
      : content.status === 'upcoming'
      ? 'Yakında'
      : content.status === 'hiatus'
      ? 'Ara Verildi'
      : content.status;

  const statusColor =
    content.status === 'ongoing'
      ? COLORS.success
      : content.status === 'completed'
      ? COLORS.info
      : content.status === 'upcoming'
      ? COLORS.warning
      : COLORS.dark.textMuted;

  const isAnime = content.type === 'anime';
  const isReadable = ['manga', 'manhwa', 'manhua', 'novel'].includes(
    content.type,
  );

  const tabs = ['info'];
  if (characters.length > 0) {
    tabs.push('characters');
  }
  if (relatedWorks.length > 0) {
    tabs.push('related');
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          {content.bannerImage || content.coverImage ? (
            <Image
              source={{uri: content.bannerImage || content.coverImage}}
              style={styles.banner}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.banner,
                {backgroundColor: COLORS.dark.surfaceElevated},
              ]}
            />
          )}
          <View style={styles.bannerOverlay} />
          <TouchableOpacity
            style={[styles.backButton, {top: Platform.OS === 'ios' ? 56 : 36}]}
            onPress={() => navigation.goBack()}>
            <Text
              style={{color: COLORS.white, fontSize: 20, fontWeight: '600'}}>
              ←
            </Text>
          </TouchableOpacity>
        </View>

        {/* Üst bilgi */}
        <View
          style={[styles.infoSection, {backgroundColor: colors.background}]}>
          <View style={styles.posterRow}>
            {content.coverImage ? (
              <Image source={{uri: content.coverImage}} style={styles.poster} />
            ) : (
              <View
                style={[
                  styles.poster,
                  {backgroundColor: colors.surfaceElevated},
                ]}>
                <Text style={{fontSize: 32}}>🎬</Text>
              </View>
            )}
            <View style={styles.titleArea}>
              <Text style={[styles.title, {color: colors.text}]}>
                {content.title}
              </Text>
              {content.titleAlt && (
                <Text style={[styles.titleAlt, {color: colors.textMuted}]}>
                  {content.titleAlt}
                </Text>
              )}
              <View style={styles.metaRow}>
                <TypeBadge type={content.type} />
                {content.year && (
                  <Text
                    style={[styles.metaText, {color: colors.textSecondary}]}>
                    {content.year}
                  </Text>
                )}
                <Text style={[styles.metaText, {color: colors.textSecondary}]}>
                  ⭐ {content.rating?.toFixed(1) || '—'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: `${statusColor}20`},
                ]}>
                <Text style={[styles.statusText, {color: statusColor}]}>
                  {statusText}
                </Text>
              </View>
            </View>
          </View>

          {/* Aksiyon butonları */}
          <View style={styles.actionRow}>
            {/* İzle / Oku butonu */}
            {isAnime && (
              <TouchableOpacity style={styles.watchBtn} onPress={handleWatch}>
                <Text style={styles.watchBtnText}>▶ İzle</Text>
              </TouchableOpacity>
            )}
            {isReadable && (
              <TouchableOpacity style={styles.watchBtn} onPress={handleRead}>
                <Text style={styles.watchBtnText}>📖 Oku</Text>
              </TouchableOpacity>
            )}

            {/* Favori */}
            <TouchableOpacity
              style={[
                styles.favoriteBtn,
                isFavorite && {
                  backgroundColor: `${COLORS.error}20`,
                  borderColor: `${COLORS.error}40`,
                },
              ]}
              onPress={handleFavorite}>
              <Text style={{fontSize: 18}}>{isFavorite ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>

            {/* Paylaş */}
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={{fontSize: 18}}>↗</Text>
            </TouchableOpacity>
          </View>

          {/* Türler */}
          {genres.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.genreScroll}>
              <View style={styles.genreRow}>
                {genres.map((g: string, i: number) => (
                  <View key={`${g}-${i}`} style={styles.genreChip}>
                    <Text style={styles.genreText}>{g}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* İstatistikler */}
          <View style={styles.statsRow}>
            {content.popularity > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, {color: colors.text}]}>
                  {content.popularity > 1000
                    ? `${(content.popularity / 1000).toFixed(1)}K`
                    : content.popularity}
                </Text>
                <Text style={[styles.statLabel, {color: colors.textMuted}]}>
                  Popülerlik
                </Text>
              </View>
            )}
            {content.ratingCount > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, {color: colors.text}]}>
                  {content.ratingCount}
                </Text>
                <Text style={[styles.statLabel, {color: colors.textMuted}]}>
                  Oy
                </Text>
              </View>
            )}
            {content.studio && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, {color: colors.text}]}>
                  {content.studio}
                </Text>
                <Text style={[styles.statLabel, {color: colors.textMuted}]}>
                  Stüdyo
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Sekmeler */}
        <View style={[styles.tabBar, {borderBottomColor: colors.border}]}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && {
                  borderBottomColor: COLORS.primary,
                  borderBottomWidth: 2,
                },
              ]}
              onPress={() => setActiveTab(tab)}>
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === tab ? COLORS.primary : colors.textSecondary,
                  },
                ]}>
                {tab === 'info'
                  ? 'ℹ️ Bilgi'
                  : tab === 'characters'
                  ? '👥 Karakterler'
                  : '🔗 İlişkili'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sekme İçeriği */}
        <View style={styles.tabContent}>
          {activeTab === 'info' && (
            <View>
              <Text style={[styles.sectionTitle, {color: colors.text}]}>
                Özet
              </Text>
              <Text style={[styles.synopsis, {color: colors.textSecondary}]}>
                {content.synopsis || 'Henüz özet eklenmemiş.'}
              </Text>
              {content.author && (
                <View
                  style={[
                    styles.infoRowStyle,
                    {borderBottomColor: colors.border},
                  ]}>
                  <Text style={[styles.infoLabel, {color: colors.textMuted}]}>
                    Yazar
                  </Text>
                  <Text style={[styles.infoValue, {color: colors.text}]}>
                    {content.author}
                  </Text>
                </View>
              )}
              {content.studio && (
                <View
                  style={[
                    styles.infoRowStyle,
                    {borderBottomColor: colors.border},
                  ]}>
                  <Text style={[styles.infoLabel, {color: colors.textMuted}]}>
                    Stüdyo
                  </Text>
                  <Text style={[styles.infoValue, {color: colors.text}]}>
                    {content.studio}
                  </Text>
                </View>
              )}
              {content.year && (
                <View
                  style={[
                    styles.infoRowStyle,
                    {borderBottomColor: colors.border},
                  ]}>
                  <Text style={[styles.infoLabel, {color: colors.textMuted}]}>
                    Yıl
                  </Text>
                  <Text style={[styles.infoValue, {color: colors.text}]}>
                    {content.year}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.infoRowStyle,
                  {borderBottomColor: colors.border},
                ]}>
                <Text style={[styles.infoLabel, {color: colors.textMuted}]}>
                  Durum
                </Text>
                <Text style={[styles.infoValue, {color: statusColor}]}>
                  {statusText}
                </Text>
              </View>
              <View
                style={[
                  styles.infoRowStyle,
                  {borderBottomColor: colors.border},
                ]}>
                <Text style={[styles.infoLabel, {color: colors.textMuted}]}>
                  Puan
                </Text>
                <Text style={[styles.infoValue, {color: colors.text}]}>
                  ⭐ {content.rating?.toFixed(1) || '—'} / 10
                </Text>
              </View>
              {content.trailerUrl && (
                <View
                  style={[
                    styles.infoRowStyle,
                    {borderBottomColor: colors.border},
                  ]}>
                  <Text style={[styles.infoLabel, {color: colors.textMuted}]}>
                    Fragman
                  </Text>
                  <Text style={[styles.infoValue, {color: COLORS.primary}]}>
                    🎬 YouTube'da İzle
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'characters' && (
            <View>
              <Text style={[styles.sectionTitle, {color: colors.text}]}>
                Karakterler
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.characterRow}>
                  {characters.map((char: any, i: number) => (
                    <CharacterCard
                      key={`${char.name}-${i}`}
                      name={char.name}
                      image={char.image}
                      role={char.role}
                      voiceActor={char.voiceActor}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {activeTab === 'related' && (
            <View>
              <Text style={[styles.sectionTitle, {color: colors.text}]}>
                İlişkili Yapıtlar
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.relatedRow}>
                  {relatedWorks.map((work: any, i: number) => (
                    <RelatedCard
                      key={`${work.id}-${i}`}
                      item={work}
                      onPress={() => {
                        if (work.id) {
                          navigation.push('ContentDetail', {
                            contentId: work.id,
                          });
                        }
                      }}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  bannerContainer: {height: 280, position: 'relative'},
  banner: {width: '100%', height: '100%'},
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnAlt: {marginTop: SPACING.lg, padding: SPACING.md},
  infoSection: {padding: SPACING.base, marginTop: -50},
  posterRow: {flexDirection: 'row', gap: SPACING.md},
  poster: {
    width: 110,
    height: 160,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  titleArea: {flex: 1, paddingTop: 50},
  title: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    lineHeight: 26,
  },
  titleAlt: {fontSize: TYPOGRAPHY.size.sm, marginTop: 2},
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
  },
  metaText: {fontSize: TYPOGRAPHY.size.sm},
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },
  statusText: {fontSize: 11, fontWeight: '600'},

  actionRow: {flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md},
  watchBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  watchBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
  },
  favoriteBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
    backgroundColor: COLORS.dark.surfaceElevated,
  },
  shareBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
    backgroundColor: COLORS.dark.surfaceElevated,
  },

  genreScroll: {marginTop: SPACING.md},
  genreRow: {flexDirection: 'row', gap: SPACING.sm},
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}18`,
    borderWidth: 0.5,
    borderColor: `${COLORS.primary}40`,
  },
  genreText: {
    color: COLORS.primaryLight,
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '500',
  },

  statsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    backgroundColor: COLORS.dark.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statItem: {flex: 1, alignItems: 'center'},
  statValue: {fontSize: TYPOGRAPHY.size.sm, fontWeight: '600'},
  statLabel: {fontSize: TYPOGRAPHY.size.xs, marginTop: 2},

  tabBar: {flexDirection: 'row', borderBottomWidth: 0.5, marginTop: SPACING.sm},
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {fontSize: TYPOGRAPHY.size.sm, fontWeight: '600'},

  tabContent: {padding: SPACING.base},
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    marginBottom: SPACING.md,
  },
  synopsis: {
    fontSize: TYPOGRAPHY.size.sm,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },

  infoRowStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
  },
  infoLabel: {fontSize: TYPOGRAPHY.size.sm},
  infoValue: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },

  characterRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingBottom: SPACING.md,
  },
  characterCard: {
    width: 100,
    alignItems: 'center',
    backgroundColor: COLORS.dark.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  characterImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterPlaceholder: {backgroundColor: COLORS.dark.surfaceElevated},
  characterName: {
    color: COLORS.dark.text,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  characterRole: {color: COLORS.primaryLight, fontSize: 10, marginTop: 2},
  characterVA: {
    color: COLORS.dark.textMuted,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },

  relatedRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingBottom: SPACING.md,
  },
  relatedCard: {
    width: 120,
    backgroundColor: COLORS.dark.card,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  relatedImage: {width: '100%', height: 160},
  relatedTitle: {
    color: COLORS.dark.text,
    fontSize: 11,
    fontWeight: '500',
    padding: SPACING.sm,
    lineHeight: 15,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  badgeText: {fontSize: 10, fontWeight: '700'},
});

export default ContentDetailScreen;
