import { aplicarPago, billsReducer, type BillsState } from '@/lib/bills';
import type { Bill } from '@/types';

function makeBill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 'bill-1',
    catalogId: 'netflix',
    nombre: 'Netflix',
    categoria: 'Entretenimiento',
    monto: 8000,
    fecha: '2026-09-30',
    color: '#8B5CF6',
    icono: '🎬',
    esSuscripcion: true,
    pagado: false,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

const estadoInicial: BillsState = { bills: [makeBill()], hydrated: true };

describe('billsReducer', () => {
  it('hidrata la lista', () => {
    const bills = [makeBill({ id: 'a' }), makeBill({ id: 'b' })];
    expect(billsReducer({ bills: [], hydrated: false }, { type: 'hydrate', bills })).toEqual({
      bills,
      hydrated: true,
    });
  });

  it('agrega una carga ordenándola por fecha', () => {
    const nueva = makeBill({ id: 'nueva', fecha: '2026-01-05' });
    const state = billsReducer(estadoInicial, { type: 'add', bill: nueva });

    // Orden ascendente, igual que `listBills` en SQL.
    expect(state.bills.map((bill) => bill.id)).toEqual(['nueva', 'bill-1']);
    expect(state.bills).toHaveLength(2);
  });

  it('no reordena cuando la fecha es igual (desempata por alta)', () => {
    const nueva = makeBill({ id: 'nueva', fecha: '2026-09-30', createdAt: 5 });
    const state = billsReducer(estadoInicial, { type: 'add', bill: nueva });

    expect(state.bills.map((bill) => bill.id)).toEqual(['bill-1', 'nueva']);
  });

  it('actualiza sólo la carga indicada', () => {
    const editada = makeBill({ monto: 9999, updatedAt: 2 });
    const state = billsReducer(estadoInicial, { type: 'update', bill: editada });

    expect(state.bills[0].monto).toBe(9999);
    expect(state.bills[0].updatedAt).toBe(2);
  });

  it('elimina la carga indicada', () => {
    const state = billsReducer(estadoInicial, { type: 'delete', billId: 'bill-1' });

    expect(state.bills).toHaveLength(0);
  });

  it('reemplaza la carga al registrar un pago', () => {
    const pagada = aplicarPago(estadoInicial.bills[0], 100);
    const state = billsReducer(estadoInicial, { type: 'pay', bill: pagada });

    expect(state.bills[0].fecha).toBe(pagada.fecha);
  });
});

describe('aplicarPago', () => {
  it('avanza un mes la fecha de una suscripción', () => {
    const resultado = aplicarPago(makeBill({ fecha: '2026-09-30' }), 100);

    expect(resultado.fecha).toBe('2026-10-30');
    expect(resultado.pagado).toBe(false);
    expect(resultado.updatedAt).toBe(100);
  });

  it('marca como pagado un servicio puntual y no mueve la fecha', () => {
    const resultado = aplicarPago(
      makeBill({ esSuscripcion: false, fecha: '2026-09-30' }),
      100,
    );

    expect(resultado.pagado).toBe(true);
    expect(resultado.fecha).toBe('2026-09-30');
  });

  it('no muta la carga original', () => {
    const original = makeBill({ fecha: '2026-01-31' });
    aplicarPago(original, 100);

    expect(original.fecha).toBe('2026-01-31');
  });
});