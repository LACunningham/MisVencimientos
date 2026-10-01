import type { ThemeMode } from '@/constants/theme';

/** Sustituye al kv-store de `expo-sqlite` en web, donde no está disponible. */
const store = new Map<string, string>();

export function readThemeMode(): ThemeMode | null {
  const value = store.get('hg.themeMode');
  return value === 'light' || value === 'dark' ? value : null;
}

export function writeThemeMode(mode: ThemeMode): void {
  store.set('hg.themeMode', mode);
}

export function hasSeeded(): boolean {
  return store.get('hg.seeded') === '1';
}

export function markSeeded(): void {
  store.set('hg.seeded', '1');
}