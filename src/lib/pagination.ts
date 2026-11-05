export interface PaginationResult<T> {
  /** Porción de la lista que corresponde a la página pedida. */
  items: T[];
  /** Página actual, empezando en 0. */
  page: number;
  totalPages: number;
  totalItems: number;
  hasPrev: boolean;
  hasNext: boolean;
}

/**
 * Pagina una lista en memoria. La página se clampea al rango válido para que
 * al cambiar un filtro no quede una página vacía.
 */
export function paginar<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginationResult<T> {
  const size = Math.max(1, Math.floor(pageSize));
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / size));
  const safePage = Math.min(Math.max(0, Math.floor(page)), totalPages - 1);
  const start = safePage * size;

  return {
    items: items.slice(start, start + size),
    page: safePage,
    totalPages,
    totalItems,
    hasPrev: safePage > 0,
    hasNext: safePage < totalPages - 1,
  };
}
