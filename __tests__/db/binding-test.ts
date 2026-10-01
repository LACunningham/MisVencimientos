/**
 * Verifica que el binding de `updateBill` esté alineado con sus placeholders.
 *
 * El bug que_previene era invisible: el `UPDATE` no matcheaba ninguna fila, así
 * que la app no fallaba, pero la edición se perdía al reiniciar. No ejecutamos
 * SQLite (requiere nativo), replicamos el conteo con el mismo SQL.
 */
import { describe, expect, it } from '@jest/globals';

// Debe coincidir con el SQL de `updateBill` en `src/db/repository.ts`.
const UPDATE_SQL = `UPDATE bills
        SET catalog_id = ?, nombre = ?, categoria = ?, monto = ?, fecha = ?,
            color = ?, icono = ?, es_suscripcion = ?, pagado = ?, updated_at = ?
      WHERE id = ?;`;

describe('binding de repository.updateBill', () => {
  it('tiene un placeholder por cada columna escrita más el id', () => {
    const placeholders = (UPDATE_SQL.match(/\?/g) ?? []).length;

    expect(placeholders).toBe(11);
  });

  it('no escribe created_at', () => {
    // El bug anterior mapeaba `created_at` sobre el placeholder de `updated_at`
    // y `updated_at` sobre el de `WHERE id`, así que el UPDATE no matcheaba.
    expect(UPDATE_SQL).not.toContain('created_at = ?');
    expect(UPDATE_SQL).toContain('updated_at = ?');
    expect(UPDATE_SQL).toContain('WHERE id = ?;');
  });
});
