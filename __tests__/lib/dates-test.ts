import {
  avanzarUnMes,
  diasHasta,
  esMismoMes,
  etiquetaVencimiento,
  formatFecha,
  hoyAMedianoche,
  isValidIso,
  parseFechaLegacy,
  toIso,
} from '@/lib/dates';

const HOY = new Date(2026, 8, 30); // 30/09/2026

describe('formatFecha', () => {
  it('convierte ISO a DD/MM/AAAA', () => {
    expect(formatFecha('2026-09-13')).toBe('13/09/2026');
  });

  it('devuelve el input si no es ISO', () => {
    expect(formatFecha('no-es-fecha')).toBe('no-es-fecha');
  });
});

describe('parseFechaLegacy', () => {
  it('convierte DD/MM/AAAA a ISO', () => {
    expect(parseFechaLegacy('13/09/2026')).toBe('2026-09-13');
  });

  it('rechaza fechas que no existen', () => {
    expect(parseFechaLegacy('31/02/2026')).toBeNull();
    expect(parseFechaLegacy('13/13/2026')).toBeNull();
    expect(parseFechaLegacy('2026-09-13')).toBeNull();
  });
});

describe('isValidIso', () => {
  it('acepta fechas reales', () => {
    expect(isValidIso('2024-02-29')).toBe(true);
  });

  it('rechaza 29/02 en años no bisiestos', () => {
    expect(isValidIso('2026-02-29')).toBe(false);
  });
});

describe('diasHasta', () => {
  it('devuelve 0 para hoy', () => {
    expect(diasHasta('2026-09-30', HOY)).toBe(0);
  });

  it('devuelve negativos para fechas pasadas', () => {
    expect(diasHasta('2026-09-27', HOY)).toBe(-3);
  });

  it('cruza el cambio de mes', () => {
    expect(diasHasta('2026-10-01', HOY)).toBe(1);
  });

  it('cruza el cambio de año', () => {
    expect(diasHasta('2027-01-01', HOY)).toBe(93);
  });
});

describe('etiquetaVencimiento', () => {
  it('marca como vencida si ya pasó', () => {
    expect(etiquetaVencimiento('2026-09-20', HOY)).toEqual({
      texto: 'Vencida',
      tone: 'urgente',
    });
  });

  it('avisa el mismo día', () => {
    expect(etiquetaVencimiento('2026-09-30', HOY)).toEqual({
      texto: 'Vence hoy',
      tone: 'urgente',
    });
  });

  it('avisa el día anterior', () => {
    expect(etiquetaVencimiento('2026-10-01', HOY)).toEqual({
      texto: 'Vence mañana',
      tone: 'aviso',
    });
  });

  it('usa tono de aviso hasta 3 días', () => {
    expect(etiquetaVencimiento('2026-10-03', HOY).tone).toBe('aviso');
    expect(etiquetaVencimiento('2026-10-03', HOY).texto).toBe('Vence en 3 días');
  });

  it('usa tono secundario a más de 3 días', () => {
    expect(etiquetaVencimiento('2026-10-04', HOY)).toEqual({
      texto: 'Vence en 4 días',
      tone: 'secundario',
    });
  });

  it('tiene en cuenta el pago registrado', () => {
    expect(etiquetaVencimiento('2026-09-20', HOY, true)).toEqual({
      texto: 'Pagado',
      tone: 'pagado',
    });
  });
});

describe('avanzarUnMes', () => {
  it('suma un mes dentro del mismo año', () => {
    expect(avanzarUnMes('2026-01-15')).toBe('2026-02-15');
  });

  it('ajusta al último día cuando el mes destino es más corto', () => {
    expect(avanzarUnMes('2026-01-31')).toBe('2026-02-28');
  });

  it('respeta años bisiestos', () => {
    expect(avanzarUnMes('2024-01-31')).toBe('2024-02-29');
  });

  it('cruza el cambio de año', () => {
    expect(avanzarUnMes('2026-12-10')).toBe('2027-01-10');
  });

  it('maneja meses de 30 días', () => {
    expect(avanzarUnMes('2026-03-31')).toBe('2026-04-30');
  });
});

describe('esMismoMes', () => {
  it('detecta el mes en curso', () => {
    expect(esMismoMes('2026-09-01', HOY)).toBe(true);
    expect(esMismoMes('2026-09-30', HOY)).toBe(true);
  });

  it('descarta otros meses y años', () => {
    expect(esMismoMes('2026-10-01', HOY)).toBe(false);
    expect(esMismoMes('2025-09-01', HOY)).toBe(false);
  });
});

describe('hoyAMedianoche', () => {
  it('pone la hora en 0', () => {
    const hoy = hoyAMedianoche();
    expect(hoy.getHours()).toBe(0);
    expect(hoy.getMinutes()).toBe(0);
  });
});

describe('toIso', () => {
  it('rellena con ceros los meses y días de un dígito', () => {
    expect(toIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});