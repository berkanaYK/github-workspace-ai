// src/screens/ProfileScreen.tsx
// ─────────────────────────────────────────────
// Profil: kullanıcı istatistikleri, ayarlar,
// tema ve dil seçimi, bildirim tercihleri, çıkış.
// ─────────────────────────────────────────────

import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Platform, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
import { logout, setTheme, clearUserData } from '../store/slices';
import { authService } from '../services/api';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

// ── Stat kartı ────────────────────────────────
const StatCard: React.FC<{ label: string; value: string | number; icon: string }> = ({
  label, value, icon,
}) => (
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ── Ayar satırı ───────────────────────────────
const SettingRow: React.FC<{
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
}> = ({ icon, label, value, onPress, right, destructive }) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress && !right}
  >
    <Text style={styles.settingIcon}>{icon}</Text>
    <Text style={[
      styles.settingLabel,
      destructive && { color: COLORS.error },
    ]}>
      {label}
    </Text>
    <View style={styles.settingRight}>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {right}
      {onPress && !right && <Text style={styles.chevron}>›</Text>}
    </View>
  </TouchableOpacity>
);

// ── Bölüm başlığı ─────────────────────────────
const SectionTitle: React.FC<{ title: string; colors: any }> = ({ title, colors }) => (
  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
);

// ── Ana Bileşen ───────────────────────────────
const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();

  const user = useSelector((s: RootState) => s.auth.user);
  const theme = useSelector((s: RootState) => s.ui.theme);
  const progressMap = useSelector((s: RootState) => s.user.progressMap);
  const favorites = useSelector((s: RootState) => s.user.favorites);

  const isDark = theme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  // İstatistikler
  const watchingCount = Object.values(progressMap).filter(p => p.watchStatus === 'watching').length;
  const completedCount = Object.values(progressMap).filter(p => p.watchStatus === 'completed').length;
  const totalItems = Object.keys(progressMap).length;

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
            } catch {}
            dispatch(logout());
            dispatch(clearUserData());
          },
        },
      ]
    );
  }, [dispatch]);

  const handleThemeToggle = useCallback(() => {
    dispatch(setTheme(isDark ? 'light' : 'dark'));
  }, [isDark, dispatch]);

  const handleLanguageChange = useCallback(() => {
    Alert.alert('Dil Seçin', '', [
      { text: 'Türkçe', onPress: () => i18n.changeLanguage('tr') },
      { text: 'English', onPress: () => i18n.changeLanguage('en') },
      { text: 'İptal', style: 'cancel' },
    ]);
  }, []);

  // Giriş yapılmamış
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 56 }}>👤</Text>
        <Text style={[styles.screenTitle, { color: colors.text, marginTop: SPACING.lg }]}>Profil</Text>
        <Text style={{ color: colors.textSecondary, marginTop: SPACING.sm, textAlign: 'center', paddingHorizontal: SPACING.xl }}>
          Profilinizi ve ayarlarınızı görmek için giriş yapın.
        </Text>
        <TouchableOpacity
          style={[styles.loginBtn, { marginTop: SPACING.xl }]}
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={styles.loginBtnText}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = user.username
    .split(' ')
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Profil üst alan ───────────────── */}
        <View style={[styles.profileHeader, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Text style={{ fontSize: 14 }}>✏️</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.username, { color: colors.text }]}>{user.username}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
          {user.bio && (
            <Text style={[styles.bio, { color: colors.textMuted }]}>{user.bio}</Text>
          )}

          <TouchableOpacity
            style={[styles.editProfileBtn, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={{ color: COLORS.primary, fontSize: TYPOGRAPHY.size.sm, fontWeight: '600' }}>
              Profili Düzenle
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── İstatistikler ────────────────── */}
        <View style={styles.statsRow}>
          <StatCard icon="📺" label="İzliyorum" value={watchingCount} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatCard icon="✅" label="Tamamladım" value={completedCount} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatCard icon="❤️" label="Favoriler" value={favorites.length} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatCard icon="📚" label="Toplam" value={totalItems} />
        </View>

        {/* ── Ayarlar bölümleri ────────────── */}
        <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SectionTitle title="Görünüm" colors={colors} />

          <SettingRow
            icon="🌙"
            label="Karanlık Mod"
            right={
              <Switch
                value={isDark}
                onValueChange={handleThemeToggle}
                trackColor={{ false: colors.border, true: `${COLORS.primary}60` }}
                thumbColor={isDark ? COLORS.primary : colors.textMuted}
              />
            }
          />

          <SettingRow
            icon="🌐"
            label="Dil"
            value={i18n.language === 'tr' ? 'Türkçe' : 'English'}
            onPress={handleLanguageChange}
          />
        </View>

        <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SectionTitle title="Bildirimler" colors={colors} />

          <SettingRow
            icon="🔔"
            label="Yeni Bölüm Bildirimleri"
            right={
              <Switch
                value={user.preferences?.notifications?.newEpisode ?? true}
                onValueChange={() => {}}
                trackColor={{ false: colors.border, true: `${COLORS.primary}60` }}
                thumbColor={COLORS.primary}
              />
            }
          />
          <SettingRow
            icon="📖"
            label="Yeni Chapter Bildirimleri"
            right={
              <Switch
                value={user.preferences?.notifications?.newChapter ?? true}
                onValueChange={() => {}}
                trackColor={{ false: colors.border, true: `${COLORS.primary}60` }}
                thumbColor={COLORS.primary}
              />
            }
          />
          <SettingRow
            icon="⭐"
            label="Favori Güncellemeleri"
            right={
              <Switch
                value={user.preferences?.notifications?.favorites ?? true}
                onValueChange={() => {}}
                trackColor={{ false: colors.border, true: `${COLORS.primary}60` }}
                thumbColor={COLORS.primary}
              />
            }
          />
        </View>

        <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SectionTitle title="Hesap" colors={colors} />

          <SettingRow
            icon="🔔"
            label="Bildirimler"
            onPress={() => navigation.navigate('Notifications')}
          />
          <SettingRow
            icon="⚙️"
            label="Ayarlar"
            onPress={() => navigation.navigate('Settings')}
          />
          <SettingRow
            icon="🔒"
            label="Gizlilik Politikası"
            onPress={() => {}}
          />
          <SettingRow
            icon="📄"
            label="Kullanım Koşulları"
            onPress={() => {}}
          />
        </View>

        <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="🚪"
            label="Çıkış Yap"
            onPress={handleLogout}
            destructive
          />
        </View>

        {/* Uygulama sürümü */}
        <Text style={[styles.version, { color: colors.textMuted }]}>
          AniVerse v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: TYPOGRAPHY.size.xl, fontWeight: TYPOGRAPHY.weight.bold },

  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.lg,
  },
  avatarWrapper: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    backgroundColor: `${COLORS.primary}30`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarInitials: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  editAvatarBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
  },
  username: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    marginBottom: 4,
  },
  email: { fontSize: TYPOGRAPHY.size.sm, marginBottom: SPACING.sm },
  bio: { fontSize: TYPOGRAPHY.size.sm, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.md },
  editProfileBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 0.5,
  },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.dark.card,
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: {
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  statLabel: {
    color: COLORS.dark.textMuted,
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 2,
  },
  statDivider: { width: 0.5 },

  settingsSection: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 0.5,
    overflow: 'hidden',
  },

  sectionTitle: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.dark.border,
  },
  settingIcon: { fontSize: 18, marginRight: SPACING.md, width: 28, textAlign: 'center' },
  settingLabel: {
    flex: 1,
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.base,
  },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  settingValue: { color: COLORS.dark.textSecondary, fontSize: TYPOGRAPHY.size.sm },
  chevron: { color: COLORS.dark.textMuted, fontSize: 22 },

  version: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.size.xs,
    paddingVertical: SPACING.lg,
  },

  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  loginBtnText: { color: COLORS.white, fontWeight: '600', fontSize: TYPOGRAPHY.size.base },
});

export default ProfileScreen;
