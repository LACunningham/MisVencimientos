const MS_PER_DAY = 86_400_000;

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type ToneVencimiento = 'secundario' | 'aviso' | 'urgente' | 'pagado';

export interface EtiquetaVencimiento {
  texto: string;
  tone: ToneVencimiento;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Normaliza un `Date` a medianoche local en formato ISO `YYYY-MM-DD`. */
export function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Devuelve `hoy` a medianoche local. Aislado para poder fijarlo en tests. */
export function hoyAMedianoche(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function hoyIso(): string {
  return toIso(hoyAMedianoche());
}

export function isValidIso(fecha: string): boolean {
  if (!ISO_DATE_PATTERN.test(fecha)) {
    return false;
  }

  const [anio, mes, dia] = fecha.split('-').map(Number);
  const date = new Date(anio, mes - 1, dia);

  return (
    date.getFullYear() === anio && date.getMonth() === mes - 1 && date.getDate() === dia
  );
}

export function fromIso(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

/**
 * `YYYY-MM-DD` → `DD/MM/AAAA`.
 * Devuelve el input tal cual si la fecha no existe en el calendario
 * (`2026-02-31` no se muestra como `31/02/2026`).
 */
export function formatFecha(fecha: string): string {
  if (!ISO_DATE_PATTERN.test(fecha)) {
    return fecha;
  }

  const [anioTexto, mesTexto, diaTexto] = fecha.split('-');
  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);
  const date = new Date(anio, mes - 1, dia);

  const existeEnCalendario =
    date.getFullYear() === anio && date.getMonth() === mes - 1 && date.getDate() === dia;

  if (!existeEnCalendario) {
    return fecha;
  }

  // `padStart` porque `Number('09')` es `9` y devolvía `13/9/2026`.
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;
}

/** `DD/MM/AAAA` → `YYYY-MM-DD`. Devuelve `null` si la fecha no existe. */
export function parseFechaLegacy(fecha: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha.trim());
  if (!match) {
    return null;
  }

  const [, dia, mes, anio] = match;
  const iso = `${anio}-${mes}-${dia}`;

  return isValidIso(iso) ? iso : null;
}

/** Devuelve `fecha` desplazada `dias` (puede ser negativo). */
export function addDays(fecha: Date, dias: number): Date {
  const result = new Date(fecha);
  result.setDate(result.getDate() + dias);
  return result;
}

/** Días entre hoy y `fecha`. Negativo si ya venció, `0` si vence hoy. */
export function diasHasta(fecha: string, referencia: Date = hoyAMedianoche()): number {
  return Math.round((fromIso(fecha).getTime() - referencia.getTime()) / MS_PER_DAY);
}

export function etiquetaVencimiento(
  fecha: string,
  referencia: Date = hoyAMedianoche(),
  pagado = false,
): EtiquetaVencimiento {
  if (pagado) {
    return { texto: 'Pagado', tone: 'pagado' };
  }

  const dias = diasHasta(fecha, referencia);

  if (dias < 0) {
    return { texto: 'Vencida', tone: 'urgente' };
  }
  if (dias === 0) {
    return { texto: 'Vence hoy', tone: 'urgente' };
  }
  if (dias === 1) {
    return { texto: 'Vence mañana', tone: 'aviso' };
  }
  if (dias <= 3) {
    return { texto: `Vence en ${dias} días`, tone: 'aviso' };
  }

  return { texto: `Vence en ${dias} días`, tone: 'secundario' };
}

export function esMismoMes(fecha: string, referencia: Date = hoyAMedianoche()): boolean {
  const target = fromIso(fecha);
  return (
    target.getFullYear() === referencia.getFullYear() &&
    target.getMonth() === referencia.getMonth()
  );
}

export function diasEnMes(anio: number, mes: number): number {
  return new Date(anio, mes + 1, 0).getDate();
}

/**
 * Avanza la fecha un mes conservando el día. Si el mes destino es más corto
 * (31 de enero → febrero), ajusta al último día de ese mes.
 */
export function avanzarUnMes(fecha: string): string {
  const source = fromIso(fecha);
  const anio = source.getFullYear();
  const mes = source.getMonth();
  const dia = source.getDate();

  const totalMeses = anio * 12 + mes + 1;
  const nuevoAnio = Math.floor(totalMeses / 12);
  const nuevoMes = totalMeses % 12;

  const ultimoDia = diasEnMes(nuevoAnio, nuevoMes);

  return toIso(new Date(nuevoAnio, nuevoMes, Math.min(dia, ultimoDia)));
}