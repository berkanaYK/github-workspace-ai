import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const tr = {
  common: { loading: 'Yükleniyor...', error: 'Bir hata oluştu', retry: 'Tekrar Dene', search: 'Ara...', cancel: 'İptal', save: 'Kaydet', seeAll: 'Tümünü Gör' },
  home: { trending: 'Trend', newEpisodes: 'Yeni Bölümler', topRated: 'En İyi' },
  content: { watch: 'İzle', read: 'Oku', episodes: 'Bölümler', synopsis: 'Özet' },
  profile: { title: 'Profil', settings: 'Ayarlar', logout: 'Çıkış Yap' },
  auth: { login: 'Giriş Yap', register: 'Kayıt Ol', email: 'E-posta', password: 'Şifre' },
};

const en = {
  common: { loading: 'Loading...', error: 'An error occurred', retry: 'Try Again', search: 'Search...', cancel: 'Cancel', save: 'Save', seeAll: 'See All' },
  home: { trending: 'Trending', newEpisodes: 'New Episodes', topRated: 'Top Rated' },
  content: { watch: 'Watch', read: 'Read', episodes: 'Episodes', synopsis: 'Synopsis' },
  profile: { title: 'Profile', settings: 'Settings', logout: 'Logout' },
  auth: { login: 'Login', register: 'Register', email: 'Email', password: 'Password' },
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: 'tr',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;