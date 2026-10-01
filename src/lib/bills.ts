import { avanzarUnMes } from '@/lib/dates';
import type { Bill } from '@/types';

export interface BillsState {
  bills: Bill[];
  hydrated: boolean;
}

export type BillsAction =
  | { type: 'hydrate'; bills: Bill[] }
  | { type: 'add'; bill: Bill }
  | { type: 'update'; bill: Bill }
  | { type: 'pay'; bill: Bill }
  | { type: 'delete'; billId: string };

/**
 * Registra el pago de una carga. Una suscripción renueva su ciclo (la próxima
 * fecha corre un mes); un servicio puntual queda marcado como pagado.
 */
export function aplicarPago(bill: Bill, now: number): Bill {
  return {
    ...bill,
    fecha: bill.esSuscripcion ? avanzarUnMes(bill.fecha) : bill.fecha,
    pagado: !bill.esSuscripcion,
    updatedAt: now,
  };
}

/** Reducer puro: sin efectos secundarios para poder testearlo aislado. */
export function billsReducer(state: BillsState, action: BillsAction): BillsState {
  switch (action.type) {
    case 'hydrate':
      return { bills: action.bills, hydrated: true };

    case 'add':
      // Se inserta en el mismo orden que devuelve `listBills` (fecha y luego
      // alta). Si se anteponía sin más, la carga nueva salía arriba y al
      // reiniciar la app se reordenaba sola.
      return {
        ...state,
        bills: [...state.bills, action.bill].sort(
          (a, b) => a.fecha.localeCompare(b.fecha) || a.createdAt - b.createdAt,
        ),
      };

    case 'update':
      return {
        ...state,
        bills: state.bills.map((bill) => (bill.id === action.bill.id ? action.bill : bill)),
      };

    case 'pay':
      return {
        ...state,
        bills: state.bills.map((bill) => (bill.id === action.bill.id ? action.bill : bill)),
      };

    case 'delete':
      return { ...state, bills: state.bills.filter((bill) => bill.id !== action.billId) };

    default:
      return state;
  }
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}