import { formatARS, parseMonto, sumarMontos } from '@/lib/money';

describe('formatARS', () => {
  it('agrega separador de miles', () => {
    expect(formatARS(25000)).toBe('$25.000');
    expect(formatARS(180000)).toBe('$180.000');
    expect(formatARS(5500)).toBe('$5.500');
  });

  it('deja los valores chicos sin separador', () => {
    expect(formatARS(0)).toBe('$0');
    expect(formatARS(999)).toBe('$999');
  });

  it('redondea y soporta negativos', () => {
    expect(formatARS(1500.4)).toBe('$1.500');
    expect(formatARS(1500.6)).toBe('$1.501');
    expect(formatARS(-25000)).toBe('-$25.000');
  });
});

describe('parseMonto', () => {
  it('acepta números planos', () => {
    expect(parseMonto('25000')).toBe(25000);
  });

  it('acepta el formato con puntos de miles', () => {
    expect(parseMonto('25.000')).toBe(25000);
    expect(parseMonto('180.000')).toBe(180000);
  });

  it('acepta el símbolo de pesos', () => {
    expect(parseMonto('$25.000')).toBe(25000);
    expect(parseMonto(' $180.000 ')).toBe(180000);
  });

  it('acepta decimales con coma', () => {
    expect(parseMonto('1.500,50')).toBe(1500.5);
  });

  it('devuelve null para basura', () => {
    expect(parseMonto('')).toBeNull();
    expect(parseMonto('   ')).toBeNull();
    expect(parseMonto('abc')).toBeNull();
    expect(parseMonto('25,000,00')).toBeNull();
  });
});

describe('sumarMontos', () => {
  it('suma una lista vacía', () => {
    expect(sumarMontos([])).toBe(0);
  });

  it('suma montos', () => {
    expect(sumarMontos([25000, 12500, 8000])).toBe(45500);
  });
});