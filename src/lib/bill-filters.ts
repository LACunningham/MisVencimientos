import { esMismoMes } from '@/lib/dates';
import type { Bill, Categoria } from '@/types';

export type EstadoFiltro = 'Todas' | 'Pendientes' | 'Pagadas';
export type CampoOrden = 'fecha' | 'monto' | 'nombre';
export type DireccionOrden = 'asc' | 'desc';

export interface FiltrosBills {
  /** Texto libre para buscar por nombre. */
  texto: string;
  categoria: Categoria | 'Todas';
  estado: EstadoFiltro;
  soloEsteMes: boolean;
  orden: CampoOrden;
  direccion: DireccionOrden;
}

export const FILTROS_INICIALES: FiltrosBills = {
  texto: '',
  categoria: 'Todas',
  estado: 'Todas',
  soloEsteMes: false,
  orden: 'fecha',
  direccion: 'asc',
};

const DIACRITICOS = /[\u0300-\u036f]/g;

/**
 * Texto comparable: sin mayúsculas, sin acentos y sin espacios de más.
 * Buscar «telefono» tiene que encontrar «Teléfono».
 */
export function normalizarTexto(valor: string): string {
  const limpio = valor.trim().toLowerCase();

  // Hermes viejo no trae `normalize`; sin acentos el buscador igual funciona.
  return typeof limpio.normalize === 'function'
    ? limpio.normalize('NFD').replace(DIACRITICOS, '')
    : limpio;
}

function comparar(a: Bill, b: Bill, campo: CampoOrden): number {
  if (campo === 'monto') {
    return a.monto - b.monto;
  }

  if (campo === 'nombre') {
    return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
  }

  return a.fecha.localeCompare(b.fecha);
}

/**
 * Aplica búsqueda, filtros y orden sin tocar el array original.
 * El desempate por `createdAt` mantiene el resultado estable entre renders.
 */
export function filtrarBills(
  bills: Bill[],
  filtros: FiltrosBills,
  referencia: Date = new Date(),
): Bill[] {
  const texto = normalizarTexto(filtros.texto);

  const filtrados = bills.filter((bill) => {
    if (filtros.categoria !== 'Todas' && bill.categoria !== filtros.categoria) {
      return false;
    }

    if (filtros.estado === 'Pendientes' && bill.pagado) {
      return false;
    }

    if (filtros.estado === 'Pagadas' && !bill.pagado) {
      return false;
    }

    if (filtros.soloEsteMes && !esMismoMes(bill.fecha, referencia)) {
      return false;
    }

    return texto === '' || normalizarTexto(bill.nombre).includes(texto);
  });

  const signo = filtros.direccion === 'asc' ? 1 : -1;

  return [...filtrados].sort((a, b) => {
    const resultado = comparar(a, b, filtros.orden) * signo;
    return resultado !== 0 ? resultado : a.createdAt - b.createdAt;
  });
}
