import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
import { updateUser } from '../store/slices';
import { apiClient } from '../services/api';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const theme = useSelector((s: RootState) => s.ui.theme);
  const isDark = theme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Hata', 'Kullanıcı adı boş olamaz.');
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await apiClient.patch(`/users/${user?.id}`, { username, bio });
      dispatch(updateUser({ username: data.username, bio: data.bio }));
      Alert.alert('Başarılı', 'Profil güncellendi.');
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Önbelleği Temizle',
      'Tüm indirilen önbellek verisi silinecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Temizle', style: 'destructive', onPress: () => Alert.alert('Tamamlandı', 'Önbellek temizlendi.') },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 56 : 40 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: COLORS.primary }]}>← Geri</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ayarlar</Text>
        <TouchableOpacity onPress={handleSaveProfile} disabled={isSaving} style={styles.saveBtn}>
          {isSaving ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Kaydet</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profil */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PROFİL</Text>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Kullanıcı Adı</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
              value={username}
              onChangeText={setUsername}
              placeholder="Kullanıcı adı"
              placeholderTextColor={colors.textMuted}
              maxLength={50}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Hakkımda</Text>
            <TextInput
              style={[styles.fieldInput, styles.bioInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Kendinizden bahsedin..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.textMuted }]}>{bio.length}/200</Text>
          </View>
        </View>

        {/* Hesap */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>HESAP</Text>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>E-posta</Text>
            <Text style={[styles.fieldValue, { color: colors.textMuted }]}>{user?.email}</Text>
          </View>
          <TouchableOpacity
            style={[styles.actionRow, { borderTopColor: colors.border }]}
            onPress={() => Alert.alert('Şifre Değiştir', 'Sıfırlama bağlantısı e-postanıza gönderilecek.', [
              { text: 'İptal', style: 'cancel' },
              { text: 'Gönder', onPress: () => {} },
            ])}
          >
            <Text style={[styles.actionLabel, { color: colors.text }]}>Şifremi Değiştir</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Depolama */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DEPOLAMA</Text>
          <TouchableOpacity
            style={[styles.actionRow, { borderTopWidth: 0 }]}
            onPress={handleClearCache}
          >
            <Text style={[styles.actionLabel, { color: COLORS.error }]}>Önbelleği Temizle</Text>
            <Text style={{ color: COLORS.error }}>🗑</Text>
          </TouchableOpacity>
        </View>

        {/* Uygulama */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>UYGULAMA</Text>
          <View style={[styles.actionRow, { borderTopWidth: 0 }]}>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Sürüm</Text>
            <Text style={{ color: colors.textMuted, fontSize: TYPOGRAPHY.size.sm }}>1.0.0</Text>
          </View>
          <TouchableOpacity style={[styles.actionRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Gizlilik Politikası</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Kullanım Koşulları</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.md,
  },
  backBtn: { width: 70 },
  backText: { fontSize: TYPOGRAPHY.size.base, fontWeight: '600' },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    textAlign: 'center',
  },
  saveBtn: { width: 70, alignItems: 'flex-end' },
  content: { paddingBottom: 100, gap: SPACING.md, paddingHorizontal: SPACING.base },
  section: {
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
  field: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.md },
  fieldLabel: { fontSize: TYPOGRAPHY.size.xs, fontWeight: '500', marginBottom: 6 },
  fieldInput: {
    borderWidth: 0.5,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: TYPOGRAPHY.size.base,
  },
  bioInput: { height: 88, paddingTop: SPACING.sm + 2 },
  charCount: { fontSize: TYPOGRAPHY.size.xs, textAlign: 'right', marginTop: 4 },
  fieldValue: { fontSize: TYPOGRAPHY.size.base },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderTopWidth: 0.5,
  },
  actionLabel: { fontSize: TYPOGRAPHY.size.base },
  actionChevron: { color: COLORS.dark.textMuted, fontSize: 22 },
});

export default SettingsScreen;