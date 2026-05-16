// src/navigation/index.tsx
import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';
import {useColorScheme, Text} from 'react-native';
import {useSelector} from 'react-redux';
import type {RootState} from '../store';
import {COLORS} from '../theme';

// Ekranlar
import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ContentDetailScreen from '../screens/ContentDetailScreen';
import EpisodeListScreen from '../screens/EpisodeListScreen';
import EpisodePlayerScreen from '../screens/EpisodePlayerScreen';
import ChapterReaderScreen from '../screens/ChapterReaderScreen';
import NovelReaderScreen from '../screens/NovelReaderScreen';
import SearchScreen from '../screens/SearchScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreens';

// Navigatör tipleri
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ContentDetail: {contentId: string; contentTitle?: string};
  EpisodeList: {contentId: string; contentTitle: string};
  EpisodePlayer: {
    contentId: string;
    contentTitle: string;
    episodeNumber: number;
    totalEpisodes?: number | null;
  };
  ChapterReader: {
    chapterId: string;
    contentId: string;
    chapterNumber: number;
    contentTitle?: string;
  };
  NovelReader: {chapterId: string; contentId: string; chapterTitle: string};
  Search: {initialQuery?: string};
  Settings: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Library: undefined;
  Profile: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ── Auth Navigator ─────────────────────────────
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      ...TransitionPresets.SlideFromRightIOS,
    }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// ── Bottom Tab Navigator ───────────────────────
const MainTabs = () => {
  const theme = useSelector((s: RootState) => s.ui.theme);
  const isDark = theme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({focused}) => (
            <Text style={{fontSize: 20}}>{focused ? '🏠' : '🏡'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Keşfet',
          tabBarIcon: ({focused}) => (
            <Text style={{fontSize: 20}}>{focused ? '🔍' : '🔎'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarLabel: 'Kütüphane',
          tabBarIcon: ({focused}) => (
            <Text style={{fontSize: 20}}>{focused ? '📚' : '📖'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({focused}) => (
            <Text style={{fontSize: 20}}>{focused ? '👤' : '👻'}</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ── Root Navigator ─────────────────────────────
const AppNavigator = () => {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const theme = useSelector((s: RootState) => s.ui.theme);
  const systemTheme = useColorScheme();
  const isDark =
    theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: COLORS.dark.background,
          card: COLORS.dark.surface,
          text: COLORS.dark.text,
          border: COLORS.dark.border,
          primary: COLORS.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: COLORS.light.background,
          card: COLORS.light.surface,
          text: COLORS.light.text,
          border: COLORS.light.border,
          primary: COLORS.primary,
        },
      };

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <RootStack.Screen name="Main" component={MainTabs} />

            <RootStack.Screen
              name="ContentDetail"
              component={ContentDetailScreen}
              options={{...TransitionPresets.SlideFromRightIOS}}
            />

            <RootStack.Screen
              name="EpisodeList"
              component={EpisodeListScreen}
              options={{...TransitionPresets.SlideFromRightIOS}}
            />

            <RootStack.Screen
              name="EpisodePlayer"
              component={EpisodePlayerScreen}
              options={{
                ...TransitionPresets.ModalSlideFromBottomIOS,
                presentation: 'modal',
              }}
            />

            <RootStack.Screen
              name="ChapterReader"
              component={ChapterReaderScreen}
              options={{
                ...TransitionPresets.ModalSlideFromBottomIOS,
                presentation: 'modal',
              }}
            />

            <RootStack.Screen
              name="NovelReader"
              component={NovelReaderScreen}
              options={{...TransitionPresets.SlideFromRightIOS}}
            />

            <RootStack.Screen
              name="Search"
              component={SearchScreen}
              options={{...TransitionPresets.DefaultTransition}}
            />

            <RootStack.Screen name="Settings" component={SettingsScreen} />
            <RootStack.Screen
              name="Notifications"
              component={NotificationsScreen}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
