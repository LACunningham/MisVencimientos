/** Formatea un monto en pesos argentinos: `25000` → `$25.000`. */
export function formatARS(monto: number): string {
  const redondeado = Math.round(monto);
  const signo = redondeado < 0 ? '-' : '';
  const absoluto = Math.abs(redondeado);
  const miles = String(absoluto).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${signo}$${miles}`;
}

function normalizar(valor: string): string {
  return valor.trim().replace(/^\$/, '').replace(/\s/g, '');
}

/**
 * Convierte lo que el usuario escribe en un número.
 * Acepta `25000`, `25.000`, `$25.000` y `25000,50`.
 * Devuelve `null` si no hay un número válido.
 */
export function parseMonto(valor: string): number | null {
  const limpio = normalizar(valor);
  if (limpio === '') {
    return null;
  }

  if (!/^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+(,\d+)?$/.test(limpio)) {
    return null;
  }

  const normalizado = limpio.replace(/\./g, '').replace(',', '.');
  const resultado = Number(normalizado);

  return Number.isFinite(resultado) ? resultado : null;
}

export function sumarMontos(montos: number[]): number {
  return montos.reduce((total, monto) => total + monto, 0);
}