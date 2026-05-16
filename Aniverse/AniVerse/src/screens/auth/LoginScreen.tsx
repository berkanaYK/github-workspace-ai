// src/screens/auth/LoginScreen.tsx
// ─────────────────────────────────────────────
// Giriş ekranı: email/şifre + sosyal giriş
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { loginWithEmail, loginWithGoogle, clearError } from '../../store/slices';
import type { RootState, AppDispatch } from '../../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((s: RootState) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Hata', 'E-posta ve şifre gereklidir.');
      return;
    }
    dispatch(loginWithEmail({ email: email.trim(), password }));
  };

  const handleGoogleLogin = () => {
    dispatch(loginWithGoogle());
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo alanı */}
        <View style={styles.logoArea}>
          <Text style={styles.logo}>
            <Text style={{ color: COLORS.primary }}>Ani</Text>Verse
          </Text>
          <Text style={styles.tagline}>Anime · Manga · Novel</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Giriş Yap</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => dispatch(clearError())}>
                <Text style={{ color: COLORS.error, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

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
                placeholder="••••••••"
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

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotText}>Şifremi Unuttum?</Text>
          </TouchableOpacity>

          {/* Giriş butonu */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.loginButtonWrapper}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.loginButton}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.loginButtonText}>Giriş Yap</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Ayırıcı */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sosyal giriş butonları */}
          <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
            <Text style={styles.socialButtonText}>🔵  Google ile Devam Et</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity style={[styles.socialButton, { marginTop: SPACING.sm }]}>
              <Text style={styles.socialButtonText}>🍎  Apple ile Devam Et</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Kayıt yönlendirmesi */}
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>
            Hesabın yok mu?{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Kayıt Ol</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.background },
  scroll: { flexGrow: 1, padding: SPACING.base },

  logoArea: { alignItems: 'center', marginTop: 80, marginBottom: SPACING.xxxl },
  logo: { fontSize: 42, fontWeight: '800', color: COLORS.dark.text },
  tagline: { color: COLORS.dark.textMuted, marginTop: SPACING.xs, fontSize: TYPOGRAPHY.size.sm },

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
    marginBottom: 0,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  eyeButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.dark.surfaceElevated,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
    height: 48,
    justifyContent: 'center',
  },

  forgotPassword: { alignSelf: 'flex-end', marginBottom: SPACING.md },
  forgotText: { color: COLORS.primaryLight, fontSize: TYPOGRAPHY.size.sm },

  loginButtonWrapper: { borderRadius: BORDER_RADIUS.md, overflow: 'hidden' },
  loginButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
    gap: SPACING.sm,
  },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: COLORS.dark.border },
  dividerText: { color: COLORS.dark.textMuted, fontSize: TYPOGRAPHY.size.sm },

  socialButton: {
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.dark.border,
    backgroundColor: COLORS.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    color: COLORS.dark.text,
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.medium,
  },

  registerLink: { alignItems: 'center', marginTop: SPACING.xl },
  registerText: { color: COLORS.dark.textSecondary, fontSize: TYPOGRAPHY.size.sm },
});

export default LoginScreen;
