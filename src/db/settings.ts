import type { ThemeMode } from '@/constants/theme';
import Storage from 'expo-sqlite/kv-store';

const THEME_KEY = 'hg.themeMode';
const SEED_KEY = 'hg.seeded';

export function readThemeMode(): ThemeMode | null {
  try {
    const value = Storage.getItemSync(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function writeThemeMode(mode: ThemeMode): void {
  try {
    Storage.setItemSync(THEME_KEY, mode);
  } catch {
    // Sin persistencia: el tema igual funciona, sólo no se recuerda.
  }
}

export function hasSeeded(): boolean {
  try {
    return Storage.getItemSync(SEED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markSeeded(): void {
  try {
    Storage.setItemSync(SEED_KEY, '1');
  } catch {
    // Sólo evita repetir la demo; no es crítico.
  }
}