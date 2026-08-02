import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ToastProvider } from '@/context/toast-context';
import { WardrobeProvider } from '@/context/wardrobe-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  // Stack.Protected is Expo Router's own guard mechanism — unlike returning
  // an entirely different <Stack> tree per branch (the previous approach),
  // this lets the router itself track which group is reachable, which is
  // what unstable_settings.anchor expects to coordinate with. The hand-rolled
  // if/else version left the router's internal state out of sync with our
  // JS condition, showing tabs even when session was null.
  const content = (
    <Stack>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );

  // WardrobeProvider only mounts once a session exists, so its initial fetch
  // never fires without a token — and it naturally resets on logout since
  // unmounting drops its in-memory items/loading/error state.
  return session ? <WardrobeProvider>{content}</WardrobeProvider> : content;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <ToastProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
