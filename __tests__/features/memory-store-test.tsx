/**
 * La app guarda las cargas en memoria en web (`src/db/repository.ts`). Ese
 * backend se compartía por referencia con el estado del provider, así que
 * `insertBill` mutaba el array que React tenía en estado y la carga nueva
 * aparecía duplicada, con el total inflado.
 */
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { BillForm } from '@/components/BillForm';
import { ThemeProvider } from '@/context/theme';
import { createSeedBills } from '@/data/seed';
import { insertBill, listBills, resetMemoryStore, updateBill } from '@/db/repository';
import type { Bill } from '@/types';

// El backend nativo no existe en el runner: forzamos el de memoria.
jest.mock('@/db/sqlite', () => ({
  getDatabase: jest.fn(() => null),
  isPersistenceEnabled: jest.fn(() => false),
  closeDatabase: jest.fn(),
}));

jest.mock('@/db/settings', () => ({
  hasSeeded: jest.fn(() => false),
  markSeeded: jest.fn(),
  readThemeMode: jest.fn(() => null),
  writeThemeMode: jest.fn(),
}));

// En RNTL 14 `render` es asíncrono y devuelve un objeto diferido que no expone
// las queries directamente: hay que esperarlo con `await`.
async function renderForm(onSubmit: jest.Mock) {
  return render(
    <ThemeProvider>
      <BillForm mode="crear" onSubmit={onSubmit} onCancel={jest.fn()} />
    </ThemeProvider>,
  );
}

function bill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 'b1',
    catalogId: null,
    nombre: 'Agua',
    categoria: 'Servicios',
    monto: 5_000,
    fecha: '2026-10-10',
    color: '#64748B',
    icono: '📄',
    esSuscripcion: false,
    pagado: false,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

beforeEach(() => {
  resetMemoryStore();
});

describe('backend en memoria', () => {
  it('listBills no devuelve el array interno por referencia', () => {
    const primera = listBills();
    const segunda = listBills();

    expect(primera).not.toBe(segunda);

    // Mutar el resultado no puede filtrarse al store.
    primera.push(bill({ id: 'intruso' }));
    expect(listBills().some((item) => item.id === 'intruso')).toBe(false);
  });

  it('insertBill no duplica la carga en el listado', () => {
    const antes = listBills().length;

    insertBill(bill({ id: 'nueva' }));

    const despues = listBills();

    expect(despues).toHaveLength(antes + 1);
    expect(despues.filter((item) => item.id === 'nueva')).toHaveLength(1);
  });

  it('updateBill no muta el array anterior en el lugar', () => {
    const referenciaPrevia = listBills();
    const objetivo = referenciaPrevia[0];

    updateBill({ ...objetivo, monto: 99_999, updatedAt: 2 });

    // El array que tenía el provider sigue intacto.
    expect(referenciaPrevia.find((item) => item.id === objetivo.id)?.monto).toBe(objetivo.monto);
    expect(listBills().find((item) => item.id === objetivo.id)?.monto).toBe(99_999);
  });

  it('los seeds no se duplican entre llamadas', () => {
    const ids = createSeedBills().map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('BillForm: suscripción y montos', () => {
  it('mantiene esSuscripcion aunque se deseleccione el catálogo', async () => {
    const onSubmit = jest.fn();
    const { getByPlaceholderText, findByText, getByText, queryByText } =
      await renderForm(onSubmit);

    fireEvent.changeText(getByPlaceholderText('Buscar (Luz, Netflix, Alquiler…)'), 'Netflix');

    // El ítem del catálogo es un `Pressable` sin texto propio: hay que
    // pulsarlo por el `Text` que contiene, y esperar al re-render del filtro.
    const item = await findByText('Netflix');
    fireEvent.press(item);

    await findByText('Cambiar del catálogo');
    // La etiqueta del campo de fecha delata si la carga quedó como suscripción.
    expect(getByText('Próxima fecha de pago')).toBeTruthy();

    // Mismo problema que el ítem del catálogo: el `Text` no dispara el
    // `onPress` del `Pressable` que lo envuelve.
    fireEvent.press(await findByText('Cambiar del catálogo'));
    await waitFor(() => expect(queryByText('Cambiar del catálogo')).toBeNull());

    // Sin monto, `Guardar` queda deshabilitado: hay que completarlo y esperar
    // al re-render antes de pulsarlo.
    fireEvent.changeText(getByPlaceholderText('$25.000'), '15000');

    // El ítem seleccionado era una suscripción: aunque se deseleccione, tiene
    // que seguir guardándose como suscripción.
    fireEvent.press(await findByText('Guardar'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].esSuscripcion).toBe(true);
    expect(onSubmit.mock.calls[0][0].catalogId).toBeNull();
  });

  it('guarda el monto redondeado a entero', async () => {
    const onSubmit = jest.fn();
    const { getByPlaceholderText, findByText } = await renderForm(onSubmit);

    fireEvent.changeText(getByPlaceholderText('EPEC, Netflix, alquiler…'), 'Alquiler');
    fireEvent.changeText(getByPlaceholderText('$25.000'), '1,5');

    fireEvent.press(await findByText('Guardar'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    // Sin el redondeo, el valor 1.5 no lo aceptaba `parseMonto` al reeditar.
    expect(onSubmit.mock.calls[0][0].monto).toBe(2);
  });
});
