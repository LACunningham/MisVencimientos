import { FILTROS_INICIALES, filtrarBills, normalizarTexto } from '@/lib/bill-filters';
import type { Bill } from '@/types';

function bill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 'b1',
    catalogId: null,
    nombre: 'Aguas Cordobesas',
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

const BILLS: Bill[] = [
  bill({
    id: 'agua',
    nombre: 'Aguas Cordobesas',
    categoria: 'Servicios',
    monto: 5_000,
    fecha: '2026-10-10',
    createdAt: 1,
  }),
  bill({
    id: 'luz',
    nombre: 'EPEC / Electricidad',
    categoria: 'Servicios',
    monto: 12_000,
    fecha: '2026-10-05',
    pagado: true,
    createdAt: 2,
  }),
  bill({
    id: 'netflix',
    nombre: 'Netflix',
    categoria: 'Entretenimiento',
    monto: 8_000,
    fecha: '2026-11-20',
    createdAt: 3,
  }),
  bill({
    id: 'alquiler',
    nombre: 'Alquiler',
    categoria: 'Vivienda',
    monto: 150_000,
    fecha: '2026-09-01',
    createdAt: 4,
  }),
  bill({
    id: 'telefono',
    nombre: 'Teléfono',
    categoria: 'Servicios',
    monto: 3_000,
    fecha: '2026-10-10',
    createdAt: 5,
  }),
];

const REFERENCIA = new Date(2026, 9, 15);

function filtrar(overrides: Partial<typeof FILTROS_INICIALES>): string[] {
  return filtrarBills(BILLS, { ...FILTROS_INICIALES, ...overrides }, REFERENCIA).map(
    (item) => item.id,
  );
}

describe('normalizarTexto', () => {
  it('ignora mayúsculas, acentos y espacios de los extremos', () => {
    expect(normalizarTexto('  Teléfono  ')).toBe('telefono');
    expect(normalizarTexto('ELECTRICIDAD')).toBe('electricidad');
  });
});

describe('filtrarBills', () => {
  it('busca por nombre sin importar acentos ni mayúsculas', () => {
    expect(filtrar({ texto: 'telefono' })).toEqual(['telefono']);
    expect(filtrar({ texto: 'ELECTRICIDAD' })).toEqual(['luz']);
  });

  it('filtra por estado', () => {
    expect(filtrar({ estado: 'Pendientes' })).not.toContain('luz');
    expect(filtrar({ estado: 'Pagadas' })).toEqual(['luz']);
  });

  it('filtra por categoría', () => {
    expect(filtrar({ categoria: 'Vivienda' })).toEqual(['alquiler']);
  });

  it('combina búsqueda, categoría y estado', () => {
    expect(filtrar({ texto: 'e', categoria: 'Servicios', estado: 'Pendientes' })).toEqual([
      'agua',
      'telefono',
    ]);
  });

  it('filtra sólo el mes de referencia', () => {
    expect(filtrar({ soloEsteMes: true })).toEqual(['luz', 'agua', 'telefono']);
  });

  it('ordena por fecha ascendente y descendente', () => {
    expect(filtrar({})).toEqual(['alquiler', 'luz', 'agua', 'telefono', 'netflix']);
    expect(filtrar({ direccion: 'desc' })).toEqual([
      'netflix',
      'agua',
      'telefono',
      'luz',
      'alquiler',
    ]);
  });

  it('ordena por monto y por nombre', () => {
    expect(filtrar({ orden: 'monto' })).toEqual([
      'telefono',
      'agua',
      'netflix',
      'luz',
      'alquiler',
    ]);
    expect(filtrar({ orden: 'nombre' })).toEqual([
      'agua',
      'alquiler',
      'luz',
      'netflix',
      'telefono',
    ]);
  });

  it('desempata por createdAt para que el orden sea estable', () => {
    expect(filtrar({ orden: 'fecha' })).toEqual([
      'alquiler',
      'luz',
      'agua',
      'telefono',
      'netflix',
    ]);
  });

  it('no muta la lista original', () => {
    const original = BILLS.map((item) => item.id);

    filtrarBills(BILLS, { ...FILTROS_INICIALES, direccion: 'desc' }, REFERENCIA);

    expect(BILLS.map((item) => item.id)).toEqual(original);
  });

  it('devuelve una lista vacía si nada coincide', () => {
    expect(filtrar({ texto: 'inexistente' })).toEqual([]);
  });
});
