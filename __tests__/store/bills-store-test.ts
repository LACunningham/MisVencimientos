/**
 * El store de Zustand es la capa que reemplazó al `BillsProvider`. Acá se
 * verifica que hable con el repositorio, que el fetch sólo corra cuando no hay
 * datos y que el fallback local mantenga la app usable sin red.
 */
jest.mock('@/db/repository', () => ({
  listBills: jest.fn(() => []),
  listPayments: jest.fn(() => []),
  listAllPayments: jest.fn(() => []),
  insertBill: jest.fn(),
  updateBill: jest.fn(),
  deleteBill: jest.fn(),
  insertPayment: jest.fn(),
  seedIfEmpty: jest.fn(),
}));

jest.mock('@/db/settings', () => ({
  hasSeeded: jest.fn(() => false),
  markSeeded: jest.fn(),
  readThemeMode: jest.fn(() => null),
  writeThemeMode: jest.fn(),
}));

jest.mock('@/api/bills', () => ({
  fetchSeedSpecs: jest.fn(),
}));

import { fetchSeedSpecs } from '@/api/bills';
import { DEFAULT_SEED_SPECS, createSeedBills } from '@/data/seed';
import {
  deleteBill,
  insertBill,
  insertPayment,
  listAllPayments,
  listBills,
  listPayments,
  seedIfEmpty,
  updateBill,
} from '@/db/repository';
import { hasSeeded, markSeeded } from '@/db/settings';
import { useBillsStore } from '@/store/bills';
import type { Bill } from '@/types';

const mockedFetchSeedSpecs = fetchSeedSpecs as jest.MockedFunction<typeof fetchSeedSpecs>;

let storedBills: Bill[] = [];

function makeBill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 'bill-1',
    catalogId: 'netflix',
    nombre: 'Netflix',
    categoria: 'Entretenimiento',
    monto: 8_000,
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

beforeEach(() => {
  jest.clearAllMocks();
  storedBills = [];

  (listBills as jest.Mock).mockImplementation(() =>
    storedBills.map((bill) => ({ ...bill })),
  );
  (listPayments as jest.Mock).mockReturnValue([]);
  (insertBill as jest.Mock).mockImplementation((bill: Bill) => {
    storedBills.push(bill);
  });
  (updateBill as jest.Mock).mockImplementation((bill: Bill) => {
    storedBills = storedBills.map((item) => (item.id === bill.id ? bill : item));
  });
  (deleteBill as jest.Mock).mockImplementation((id: string) => {
    storedBills = storedBills.filter((item) => item.id !== id);
  });
  (seedIfEmpty as jest.Mock).mockImplementation(() => {
    storedBills = createSeedBills();
  });
  (hasSeeded as jest.Mock).mockReturnValue(false);
  mockedFetchSeedSpecs.mockReset();

  useBillsStore.setState({ bills: [], hydrated: false, loading: false, error: null });
});

describe('useBillsStore.load', () => {
  it('trae los seeds por fetch la primera vez y los persiste', async () => {
    mockedFetchSeedSpecs.mockResolvedValue(DEFAULT_SEED_SPECS);

    await useBillsStore.getState().load();

    expect(mockedFetchSeedSpecs).toHaveBeenCalledTimes(1);
    expect(insertBill).toHaveBeenCalledTimes(DEFAULT_SEED_SPECS.length);
    expect(markSeeded).toHaveBeenCalledTimes(1);
    expect(useBillsStore.getState()).toMatchObject({
      hydrated: true,
      loading: false,
      error: null,
    });
    expect(useBillsStore.getState().bills).toHaveLength(DEFAULT_SEED_SPECS.length);
  });

  it('cae a los seeds locales si el fetch falla', async () => {
    mockedFetchSeedSpecs.mockRejectedValue(new Error('sin red'));

    await useBillsStore.getState().load();

    expect(seedIfEmpty).toHaveBeenCalledTimes(1);
    expect(useBillsStore.getState().bills.length).toBeGreaterThan(0);
    expect(useBillsStore.getState().error).toContain('No se pudieron');
  });

  it('no hace fetch si ya hay cargas locales', async () => {
    storedBills = [makeBill()];

    await useBillsStore.getState().load();

    expect(mockedFetchSeedSpecs).not.toHaveBeenCalled();
    expect(useBillsStore.getState().bills).toHaveLength(1);
  });

  it('no vuelve a sembrar si el usuario borró todo después del seed', async () => {
    (hasSeeded as jest.Mock).mockReturnValue(true);

    await useBillsStore.getState().load();

    expect(mockedFetchSeedSpecs).not.toHaveBeenCalled();
    expect(seedIfEmpty).not.toHaveBeenCalled();
    expect(useBillsStore.getState().bills).toHaveLength(0);
  });
});

describe('useBillsStore acciones', () => {
  it('agrega, actualiza y elimina una carga', () => {
    const bill = makeBill({ id: 'nueva' });

    useBillsStore.getState().addBill(bill);
    expect(insertBill).toHaveBeenCalledWith(bill);
    expect(useBillsStore.getState().bills).toHaveLength(1);

    const editada = { ...bill, monto: 1_234 };
    useBillsStore.getState().updateBill(editada);
    expect(updateBill).toHaveBeenCalledWith(editada);
    expect(useBillsStore.getState().bills[0].monto).toBe(1_234);

    useBillsStore.getState().deleteBill('nueva');
    expect(deleteBill).toHaveBeenCalledWith('nueva');
    expect(useBillsStore.getState().bills).toHaveLength(0);
  });

  it('registra el pago y actualiza la carga', () => {
    const bill = makeBill({ id: 'netflix', esSuscripcion: true, fecha: '2026-09-30' });
    storedBills = [bill];
    useBillsStore.setState({ bills: [bill], hydrated: true });

    useBillsStore.getState().payBill('netflix');

    expect(insertPayment).toHaveBeenCalledWith(
      expect.objectContaining({ billId: 'netflix', monto: bill.monto }),
    );
    expect(updateBill).toHaveBeenCalledWith(expect.objectContaining({ fecha: '2026-10-30' }));
    expect(useBillsStore.getState().bills[0].fecha).toBe('2026-10-30');
  });

  it('lee el historial de pagos del repositorio', () => {
    const pagos = [
      { id: 'p1', billId: 'b1', monto: 100, fecha: '2026-01-01', createdAt: 1 },
    ];
    (listPayments as jest.Mock).mockReturnValue(pagos);

    expect(useBillsStore.getState().getPayments('b1')).toEqual(pagos);
    expect(listPayments).toHaveBeenCalledWith('b1');
  });

  it('lee el historial global para la pantalla de Resumen', () => {
    const pagos = [
      { id: 'p1', billId: 'b1', monto: 100, fecha: '2026-01-01', createdAt: 1 },
      { id: 'p2', billId: 'b2', monto: 200, fecha: '2026-02-01', createdAt: 2 },
    ];
    (listAllPayments as jest.Mock).mockReturnValue(pagos);

    expect(useBillsStore.getState().getAllPayments()).toEqual(pagos);
    expect(listAllPayments).toHaveBeenCalledTimes(1);
  });
});
