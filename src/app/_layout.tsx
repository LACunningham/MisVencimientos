import { DarkTheme, DefaultTheme, Stack, ThemeProvider as RouterThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { BillsProvider } from '@/context/bills';
import { ThemeProvider, useAppTheme } from '@/context/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isDark } = useAppTheme();

  return (
    <RouterThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="bill/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </RouterThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <BillsProvider>
        <RootNavigator />
      </BillsProvider>
    </ThemeProvider>
  );
}