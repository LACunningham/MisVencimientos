import { paginar } from '@/lib/pagination';

const ITEMS = [1, 2, 3, 4, 5, 6];

describe('paginar', () => {
  it('devuelve la primera página', () => {
    expect(paginar(ITEMS, 0, 4)).toMatchObject({
      items: [1, 2, 3, 4],
      page: 0,
      totalPages: 2,
      totalItems: 6,
      hasPrev: false,
      hasNext: true,
    });
  });

  it('devuelve la última página, aunque quede incompleta', () => {
    expect(paginar(ITEMS, 1, 4)).toMatchObject({
      items: [5, 6],
      page: 1,
      hasPrev: true,
      hasNext: false,
    });
  });

  it('clampea una página fuera de rango', () => {
    expect(paginar(ITEMS, 9, 4).page).toBe(1);
    expect(paginar(ITEMS, -3, 4).page).toBe(0);
  });

  it('maneja una lista vacía', () => {
    expect(paginar([], 0, 4)).toMatchObject({
      items: [],
      page: 0,
      totalPages: 1,
      totalItems: 0,
      hasPrev: false,
      hasNext: false,
    });
  });

  it('no muta la lista original', () => {
    const original = [...ITEMS];
    paginar(ITEMS, 0, 2);

    expect(ITEMS).toEqual(original);
  });
});
