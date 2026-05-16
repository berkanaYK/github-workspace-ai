import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';

const mockNotifications = [
  { id: '1', type: 'new_episode', title: 'Attack on Titan', message: 'Final Sezon Bölüm 28 eklendi!', time: '2 saat önce', isRead: false },
  { id: '2', type: 'new_chapter', title: 'Solo Leveling', message: 'Bölüm 200 yayınlandı.', time: '5 saat önce', isRead: false },
  { id: '3', type: 'update', title: 'Jujutsu Kaisen', message: 'Sezon 3 duyurusu yapıldı.', time: 'Dün', isRead: true },
  { id: '4', type: 'new_episode', title: 'One Piece', message: 'Bölüm 1100 eklendi.', time: '2 gün önce', isRead: true },
];

const typeIcon: Record<string, string> = {
  new_episode: '📺',
  new_chapter: '📖',
  update: '🔔',
};

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useSelector((s: RootState) => s.ui.theme);
  const isDark = theme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 56 : 40 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: COLORS.primary, fontSize: TYPOGRAPHY.size.base, fontWeight: '600' }}>
            ← Geri
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Bildirimler</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {mockNotifications.map(notif => (
          <TouchableOpacity
            key={notif.id}
            style={[
              styles.item,
              { borderBottomColor: colors.border },
              !notif.isRead && { backgroundColor: `${COLORS.primary}08` },
            ]}
            activeOpacity={0.75}
          >
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 22 }}>{typeIcon[notif.type]}</Text>
            </View>
            <View style={styles.itemContent}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{notif.title}</Text>
                {!notif.isRead && <View style={styles.unreadDot} />}
              </View>
              <Text style={[styles.itemMsg, { color: colors.textSecondary }]}>{notif.message}</Text>
              <Text style={[styles.itemTime, { color: colors.textMuted }]}>{notif.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 0.5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: { flex: 1 },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 3,
  },
  itemTitle: { fontSize: TYPOGRAPHY.size.sm, fontWeight: '600', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  itemMsg: { fontSize: TYPOGRAPHY.size.sm, lineHeight: 18, marginBottom: 4 },
  itemTime: { fontSize: TYPOGRAPHY.size.xs },
});

export default NotificationsScreen;