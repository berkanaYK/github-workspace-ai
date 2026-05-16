/* eslint-env jest */

import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => {
    const store = new Map();

    return {
      getString: jest.fn(key => store.get(key)),
      set: jest.fn((key, value) => store.set(key, value)),
      delete: jest.fn(key => store.delete(key)),
      clearAll: jest.fn(() => store.clear()),
    };
  }),
}));

jest.mock('react-native-webview', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {WebView: props => React.createElement(View, props)};
});

jest.mock('react-native-video', () => {
  const React = require('react');
  const {View} = require('react-native');
  return props => React.createElement(View, props);
});

jest.mock('react-native-fast-image', () => {
  const React = require('react');
  const {Image} = require('react-native');
  const FastImage = props => React.createElement(Image, props);

  FastImage.priority = {low: 'low', normal: 'normal', high: 'high'};
  FastImage.resizeMode = {
    contain: 'contain',
    cover: 'cover',
    stretch: 'stretch',
  };

  return FastImage;
});

jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const {View} = require('react-native');
  return props => React.createElement(View, props);
});

jest.mock('redux-persist', () => ({
  persistReducer: jest.fn((_, reducer) => reducer),
  persistStore: jest.fn(() => ({
    flush: jest.fn(),
    pause: jest.fn(),
    persist: jest.fn(),
    purge: jest.fn(),
  })),
  FLUSH: 'persist/FLUSH',
  PAUSE: 'persist/PAUSE',
  PERSIST: 'persist/PERSIST',
  PURGE: 'persist/PURGE',
  REGISTER: 'persist/REGISTER',
  REHYDRATE: 'persist/REHYDRATE',
}));

jest.mock('redux-persist/integration/react', () => ({
  PersistGate: ({children}) => children,
}));
