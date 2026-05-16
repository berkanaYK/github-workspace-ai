import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../store/slices';
import type { RootState, AppDispatch } from '../../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((s: RootState) => s.auth);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validate = () => {
    if (!username.trim() || username.length < 3) {
      Alert.alert('Hata', 'Kullanıcı adı en az 3 karakter olmalı.');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('Hata', 'Geçerli bir e-posta girin.');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalı.');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return false;
    }
    if (!agreedToTerms) {
      Alert.alert('Hata', 'Kullanım koşullarını kabul edin.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    // Mevcut kullanıcıları kontrol et
    const usersJson = await AsyncStorage.getItem('users');
    const users = usersJson ? JSON.parse(usersJson) : [];
    console.log('Mevcut kullanıcılar:', users.map((u: any) => u.email));
    console.log('Yeni email:', email.trim().toLowerCase());

    // Email zaten var mı?
    const emailExists = users.find(
      (u: any) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (emailExists) {
      Alert.alert('Hata', 'Bu e-posta zaten kayıtlı. Lütfen farklı bir e-posta kullanın.');
      return;
    }

    const result = await dispatch(register({
      email: email.trim(),
      password,
      username: username.trim(),
    }));

    if (register.fulfilled.match(result)) {
      Alert.alert(
        'Kayıt Başarılı! 🎉',
        'Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.',
        [{ text: 'Giriş Yap', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      Alert.alert('Hata', result.payload as string ?? 'Kayıt sırasında bir hata oluştu.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ color: COLORS.primaryLight, fontSize: 22 }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>
            <Text style={{ color: COLORS.primary }}>Ani</Text>Verse
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Hesap Oluştur</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => dispatch(clearError())}>
                <Text style={{ color: COLORS.error, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kullanıcı Adı</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="kullanici_adi"
              placeholderTextColor={COLORS.dark.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@email.com"
              placeholderTextColor={COLORS.dark.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="En az 6 karakter"
                placeholderTextColor={COLORS.dark.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(s => !s)}
              >
                <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre Tekrar</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Şifreyi tekrar girin"
              placeholderTextColor={COLORS.dark.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms(s => !s)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && (
                <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '700' }}>✓</Text>
              )}
            </View>
            <Text style={styles.termsText}>
              <Text style={{ color: COLORS.dark.textSecondary }}>
                Kullanım koşullarını ve gizlilik politikasını{' '}
              </Text>
              <Text style={{ color: COLORS.primaryLight }}>okudum ve kabul ediyorum</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            style={styles.registerButtonWrapper}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.registerButton}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.registerButtonText}>Kayıt Ol</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>
            Zaten hesabın var mı?{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Giriş Yap</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.background },
  scroll: { flexGrow: 1, padding: SPACING.base },

  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 56 : 40,
    marginBottom: SPACING.xl,
  },
  backBtn: { marginRight: SPACING.md },
  logo: { fontSize: 28, fontWeight: '800', color: COLORS.dark.text },

  form: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
  },
  formTitle: {
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    marginBottom: SPACING.lg,
  },

  errorBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}15`,
    borderWidth: 0.5,
    borderColor: `${COLORS.error}40`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: { color: COLORS.error, fontSize: TYPOGRAPHY.size.sm, flex: 1 },

  inputGroup: { marginBottom: SPACING.md },
  label: {
    color: COLORS.dark.textSecondary,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.dark.surfaceElevated,
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.base,
  },
  passwordRow: { flexDirection: 'row', gap: SPACING.sm },
  eyeButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.dark.surfaceElevated,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
    height: 48,
    justifyContent: 'center',
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  termsText: { flex: 1, fontSize: TYPOGRAPHY.size.sm, lineHeight: 20 },

  registerButtonWrapper: { borderRadius: BORDER_RADIUS.md, overflow: 'hidden' },
  registerButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
  },

  loginLink: { alignItems: 'center', marginTop: SPACING.xl },
  loginText: { color: COLORS.dark.textSecondary, fontSize: TYPOGRAPHY.size.sm },
});

export default RegisterScreen;