import { getPalette, type Palette, type ThemeMode } from '@/constants/theme';
import { readThemeMode, writeThemeMode } from '@/db/settings';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

export type { ThemeMode } from '@/constants/theme';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  palette: Palette;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveInitialMode(systemScheme: string | null | undefined): ThemeMode {
  return readThemeMode() ?? (systemScheme === 'dark' ? 'dark' : 'light');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(() => resolveInitialMode(systemScheme));

  const toggleTheme = useCallback(() => {
    // El efecto va afuera del updater: React puede volver a invocar un updater
    // (StrictMode, rebase), y escribir en el storage desde ahí es un efecto
    // secundario en el lugar equivocado.
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    writeThemeMode(next);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === 'dark',
      palette: getPalette(mode === 'dark'),
      toggleTheme,
    }),
    [mode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme debe usarse dentro de un ThemeProvider');
  }

  return context;
}