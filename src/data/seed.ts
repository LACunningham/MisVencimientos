import { findCatalogItem } from '@/data/catalog';
import { addDays, toIso } from '@/lib/dates';
import type { Bill } from '@/types';

interface SeedSpec {
  catalogId: string;
  monto: number;
  /** Días respecto de hoy: negativo = ya venció. */
  offsetDias: number;
}

// Nombre, categoría, color, ícono y tipo de suscripción salen del catálogo, así
// que no pueden quedar desincronizados con él.
const SEED_SPECS: SeedSpec[] = [
  {
    catalogId: 'epec',
    monto: 25_000,
    offsetDias: -2,
  },
  {
    catalogId: 'fibertel',
    monto: 12_500,
    offsetDias: 2,
  },
  {
    catalogId: 'alquiler',
    monto: 180_000,
    offsetDias: 9,
  },
  {
    catalogId: 'expensas',
    monto: 45_000,
    offsetDias: 1,
  },
  {
    catalogId: 'netflix',
    monto: 8_000,
    offsetDias: 6,
  },
  {
    catalogId: 'spotify',
    monto: 5_500,
    offsetDias: 0,
  },
];

/**
 * Datos de ejemplo. Las fechas son relativas a hoy para que la demo siempre
 * muestre un panorama realista (vencida, hoy, próxima y lejana).
 */
export function createSeedBills(referencia: Date = new Date()): Bill[] {
  const createdAt = referencia.getTime();

  return SEED_SPECS.flatMap((spec) => {
    const item = findCatalogItem(spec.catalogId);

    // Si el catálogo dejara de tener el id, se omite en vez de crear una carga
    // sin nombre ni categoría.
    if (!item) {
      return [];
    }

    return [
      {
        id: `seed-${spec.catalogId}`,
        catalogId: spec.catalogId,
        nombre: item.nombre,
        categoria: item.categoria,
        monto: spec.monto,
        fecha: toIso(addDays(referencia, spec.offsetDias)),
        color: item.color,
        icono: item.icono,
        esSuscripcion: item.esSuscripcion,
        pagado: false,
        createdAt,
        updatedAt: createdAt,
      },
    ];
  });
}