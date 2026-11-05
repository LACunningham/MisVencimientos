import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { SeedSpec } from '@/data/seed';

const SEED_PATH = '/data/seed-bills.json';

/**
 * En web el archivo se sirve desde la raíz. En nativo hay que apuntar al dev
 * server de Expo usando el host que reporta `expo-constants` (la IP de la
 * máquina en la red local), porque `localhost` sería el teléfono.
 */
function resolveSeedUrl(): string {
  const override = process.env.EXPO_PUBLIC_SEED_URL;
  if (override) {
    return override;
  }

  if (Platform.OS === 'web') {
    return SEED_PATH;
  }

  const hostUri = (Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost)?.replace(
    /^https?:\/\//,
    '',
  );
  const host = hostUri?.split(':')[0];

  return host ? `http://${host}:8081${SEED_PATH}` : '';
}

function isSeedSpec(value: unknown): value is SeedSpec {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.catalogId === 'string' &&
    typeof candidate.monto === 'number' &&
    Number.isFinite(candidate.monto) &&
    candidate.monto > 0 &&
    typeof candidate.offsetDias === 'number' &&
    Number.isInteger(candidate.offsetDias)
  );
}

/**
 * Trae los datos de ejemplo desde `public/data/seed-bills.json`.
 * Las fechas no viajan como texto: el JSON manda un offset en días y acá se
 * convierten con `createSeedBills`, así la demo nunca queda vieja.
 */
export async function fetchSeedSpecs(signal?: AbortSignal): Promise<SeedSpec[]> {
  const url = resolveSeedUrl();

  if (!url) {
    throw new Error('No se pudo resolver el servidor de desarrollo.');
  }

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`El servidor respondió ${response.status}.`);
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data) || data.length === 0 || !data.every(isSeedSpec)) {
    throw new Error('El JSON de datos de ejemplo tiene un formato inesperado.');
  }

  return data;
}
