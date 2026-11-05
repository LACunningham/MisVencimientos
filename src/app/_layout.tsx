import { DarkTheme, DefaultTheme, Stack, ThemeProvider as RouterThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemeProvider, useAppTheme } from '@/context/theme';
import { useBillsStore } from '@/store/bills';

SplashScreen.preventAutoHideAsync();

function BillsBootstrap() {
  const load = useBillsStore((state) => state.load);

  useEffect(() => {
    void load();
  }, [load]);

  return null;
}

function RootNavigator() {
  const { isDark } = useAppTheme();

  return (
    <RouterThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <BillsBootstrap />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="bill/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </RouterThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
