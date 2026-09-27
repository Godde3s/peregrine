import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { endpointReady, useSettings } from '@/lib/store';
import { dark, light } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? dark : light;
  const baseUrl = useSettings((s) => s.baseUrl);
  const setHydrated = useSettings((s) => s.setHydrated);

  const configured = endpointReady({ baseUrl });

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 60_000 },
        },
      }),
    [],
  );

  useEffect(() => {
    setHydrated();
    void SystemUI.setBackgroundColorAsync(colors.bg);
    void SplashScreen.hideAsync();
  }, [colors.bg, setHydrated]);

  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.bg,
        card: colors.card,
        text: colors.label,
        border: colors.separator,
      },
    };
  }, [scheme, colors]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <ThemeProvider value={navTheme}>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            {/*
             * Navigation law 3 — one-way doors leave the stack. Until an
             * endpoint is configured the ONLY reachable screen is onboarding;
             * once configured, onboarding is unreachable (replace lands on
             * the tabs, Android back from there exits the app).
             */}
            <Stack screenOptions={{ headerTitleStyle: { fontWeight: '600' } }}>
              <Stack.Protected guard={configured}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="chat/[id]" />
                <Stack.Screen name="model/[id]" />
                <Stack.Screen name="apikey" options={{ presentation: 'modal' }} />
              </Stack.Protected>
              <Stack.Protected guard={!configured}>
                <Stack.Screen
                  name="onboarding"
                  options={{ headerShown: false, gestureEnabled: false }}
                />
              </Stack.Protected>
            </Stack>
          </ThemeProvider>
        </KeyboardProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
