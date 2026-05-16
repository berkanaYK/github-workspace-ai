// src/theme/index.ts
// ─────────────────────────────────────────────
// Merkezi tema sistemi.
// Karanlık/aydınlık mod renkleri, tipografi ve
// boşluk değerleri burada tanımlanır.
// ─────────────────────────────────────────────

export const COLORS = {
  // Birincil marka rengi
  primary: '#7C3AED',         // mor
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',

  // Vurgu rengi
  accent: '#EC4899',          // pembe
  accentLight: '#F9A8D4',

  // Durum renkleri
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Karanlık mod paleti
  dark: {
    background: '#0F0F13',
    surface: '#1A1A24',
    surfaceElevated: '#242433',
    border: '#2D2D42',
    text: '#F5F5F7',
    textSecondary: '#9898B0',
    textMuted: '#5C5C78',
    skeleton: '#2D2D42',
    skeletonHighlight: '#3D3D5A',
    tabBar: '#12121A',
    card: '#1E1E2E',
    overlay: 'rgba(0,0,0,0.75)',
  },

  // Aydınlık mod paleti
  light: {
    background: '#F8F8FC',
    surface: '#FFFFFF',
    surfaceElevated: '#F0F0F8',
    border: '#E4E4EF',
    text: '#1A1A2E',
    textSecondary: '#6B6B85',
    textMuted: '#A8A8C0',
    skeleton: '#E8E8F0',
    skeletonHighlight: '#F4F4FC',
    tabBar: '#FFFFFF',
    card: '#FFFFFF',
    overlay: 'rgba(255,255,255,0.85)',
  },

  // Sabit renkler (tema bağımsız)
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // İçerik türü renkleri (badge vb. için)
  typeColors: {
    anime: '#7C3AED',
    manga: '#0EA5E9',
    manhwa: '#10B981',
    manhua: '#F59E0B',
    novel: '#EC4899',
  },
};

export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    xxxl: 36,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  dark: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 6,
    },
  },
  light: {
    sm: {
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};

// Animasyon süreleri (ms)
export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
};

// İçerik kartı boyutları
export const CARD_SIZES = {
  poster: { width: 120, height: 175 },
  featured: { width: 280, height: 160 },
  horizontal: { height: 100 },
};
