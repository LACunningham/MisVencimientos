export type ThemeMode = 'light' | 'dark';

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radii = {
  chip: 999,
  control: 12,
  card: 16,
  pill: 14,
  circle: 999,
} as const;

export const Brand = {
  primary: '#3B5BDB',
  primaryMuted: '#B9C2E0',
  surfaceLight: '#FFFFFF',
  surfaceDark: '#161B2B',
  danger: '#EF4444',
  warning: '#F59E0B',
  muted: '#8A93A6',
  splash: '#3B5BDB',
} as const;

export const ToneColors = {
  urgente: Brand.danger,
  aviso: Brand.warning,
  secundario: Brand.muted,
  pagado: '#22C55E',
} as const;

export interface Palette {
  bg: string;
  surface: string;
  border: string;
  inputBg: string;
  text: string;
  textSecondary: string;
  /** Fondo de chips/filtros inactivos: se apoya sobre `bg`. */
  chipInactiva: string;
  /** Fondo del botón destructive, con tinte rojo. */
  dangerBg: string;
  shadow: string;
}

export const PaletteLight: Palette = {
  bg: '#F5F7FB',
  surface: '#FFFFFF',
  border: '#E4E8F2',
  inputBg: '#F1F5FE',
  text: '#0F172A',
  textSecondary: '#5B647A',
  chipInactiva: '#FFFFFF',
  dangerBg: '#FEE2E2',
  shadow: '#0B1220',
};

export const PaletteDark: Palette = {
  bg: '#0B0F1D',
  surface: '#161B2B',
  border: '#262D42',
  inputBg: '#0F1526',
  text: '#F1F5FF',
  textSecondary: '#9AA4C0',
  chipInactiva: '#161B2B',
  dangerBg: '#2A1B23',
  shadow: '#0B1220',
};

export const Typography = {
  title: { fontSize: 26, fontWeight: '800', lineHeight: 32 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  amount: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '600' },
  bodyRegular: { fontSize: 15 },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12 },
  overline: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8 },
} as const;

export function getPalette(isDark: boolean): Palette {
  return isDark ? PaletteDark : PaletteLight;
}