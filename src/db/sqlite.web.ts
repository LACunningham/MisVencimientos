/**
 * `expo-sqlite` en web es alpha y necesita wasm + cabeceras COOP/COEP. Para no
 * arrastrar ese worker al bundle web, acá directamente no hay base: la app corre
 * con los datos en memoria.
 */
export const isPersistenceEnabled = false;

export function getDatabase(): null {
  return null;
}

export function closeDatabase(): void {
  // Nada que cerrar.
}