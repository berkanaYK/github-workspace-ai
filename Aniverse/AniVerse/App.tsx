import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation';

const queryClient = new QueryClient();

const App = () => (
  <GestureHandlerRootView style={styles.root}>
    <Provider store={store}>
      <PersistGate
        loading={
          <View style={styles.loading}>
            <ActivityIndicator color="#7C3AED" size="large" />
          </View>
        }
        persistor={persistor}
      >
        <QueryClientProvider client={queryClient}>
          <AppNavigator />
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </GestureHandlerRootView>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F0F13' },
});

export default App;