import { ThemeProvider } from '@/context/theme';
import { BillCard } from '@/components/BillCard';
import { fireEvent, render } from '@testing-library/react-native';
import type { Bill } from '@/types';

jest.mock('expo-sqlite/kv-store', () => ({
  getItemSync: jest.fn(() => null),
  setItemSync: jest.fn(),
}));

async function renderCard(bill: Bill, onPress = jest.fn()) {
  const result = await render(
    <ThemeProvider>
      <BillCard bill={bill} onPress={onPress} />
    </ThemeProvider>,
  );
  return { ...result, onPress };
}

function mananaIso(): string {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  return `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(manana.getDate()).padStart(2, '0')}`;
}

function makeBill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 'bill-1',
    catalogId: 'netflix',
    nombre: 'Netflix',
    categoria: 'Entretenimiento',
    monto: 8000,
    fecha: mananaIso(),
    color: '#8B5CF6',
    icono: '🎬',
    esSuscripcion: true,
    pagado: false,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('<BillCard />', () => {
  it('muestra el nombre, el monto formateado y la fecha', async () => {
    const { getByText } = await renderCard(makeBill());

    expect(getByText('Netflix')).toBeTruthy();
    expect(getByText('$8.000')).toBeTruthy();
    expect(getByText(/Próximo pago/)).toBeTruthy();
  });

  it('muestra la etiqueta de vencimiento correcto', async () => {
    const { getByText } = await renderCard(makeBill());

    expect(getByText('Vence mañana')).toBeTruthy();
  });

  it('muestra "Pagado" cuando la carga está saldada', async () => {
    const { getByText } = await renderCard(makeBill({ esSuscripcion: false, pagado: true }));

    expect(getByText('Pagado')).toBeTruthy();
  });

  it('llama a onPress al tocar la tarjeta', async () => {
    const { getByRole, onPress } = await renderCard(makeBill());

    fireEvent.press(getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});