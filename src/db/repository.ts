import { createSeedBills } from '@/data/seed';
import type { Bill, Categoria, Payment } from '@/types';

import { getDatabase, isPersistenceEnabled } from './sqlite';
import { hasSeeded, markSeeded } from './settings';

interface BillRow {
  id: string;
  catalog_id: string | null;
  nombre: string;
  categoria: string;
  monto: number;
  fecha: string;
  color: string;
  icono: string;
  es_suscripcion: number;
  pagado: number;
  created_at: number;
  updated_at: number;
}

interface PaymentRow {
  id: string;
  bill_id: string;
  monto: number;
  fecha: string;
  created_at: number;
}

const BILL_COLUMNS = `id, catalog_id, nombre, categoria, monto, fecha, color, icono,
  es_suscripcion, pagado, created_at, updated_at`;

/** Vuelca un bill como parámetros para `runSync`. */
function billParams(bill: Bill) {
  return [
    bill.id,
    bill.catalogId,
    bill.nombre,
    bill.categoria,
    bill.monto,
    bill.fecha,
    bill.color,
    bill.icono,
    bill.esSuscripcion ? 1 : 0,
    bill.pagado ? 1 : 0,
    bill.createdAt,
    bill.updatedAt,
  ];
}

function toBill(row: BillRow): Bill {
  return {
    id: row.id,
    catalogId: row.catalog_id,
    nombre: row.nombre,
    categoria: row.categoria as Categoria,
    monto: row.monto,
    fecha: row.fecha,
    color: row.color,
    icono: row.icono,
    esSuscripcion: row.es_suscripcion === 1,
    pagado: row.pagado === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    billId: row.bill_id,
    monto: row.monto,
    fecha: row.fecha,
    createdAt: row.created_at,
  };
}

/**
 * En memoria mantenemos una copia para cuando `expo-sqlite` no está disponible
 * (web). Se inicializa con los datos de ejemplo para no mostrar una app vacía.
 */
let memoryBills: Bill[] | null = null;
let memoryPayments: Payment[] = [];

function getMemoryBills(): Bill[] {
  if (memoryBills === null) {
    memoryBills = createSeedBills();
  }

  return memoryBills;
}

export function listBills(): Bill[] {
  const db = getDatabase();

  if (!db) {
    // Copia + orden explícito. Si devolviéramos `memoryBills` por referencia,
    // el provider guardaría ese mismo array en su estado y `insertBill`
    // mutándolo en el lugar duplicaría la carga en pantalla y en los totales.
    return getMemoryBills()
      .map((bill) => ({ ...bill }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.createdAt - b.createdAt);
  }

  const rows = db.getAllSync<BillRow>(
    `SELECT * FROM bills ORDER BY fecha ASC, created_at ASC;`,
  );

  return rows.map(toBill);
}

export function listPayments(billId: string): Payment[] {
  const db = getDatabase();

  if (!db) {
    return memoryPayments
      .filter((payment) => payment.billId === billId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  const rows = db.getAllSync<PaymentRow>(
    `SELECT * FROM payments WHERE bill_id = ? ORDER BY fecha DESC, created_at DESC;`,
    billId,
  );

  return rows.map(toPayment);
}

export function insertBill(bill: Bill): void {
  const db = getDatabase();

  if (!db) {
    memoryBills = [...getMemoryBills(), bill];
    return;
  }

  db.runSync(
    `INSERT INTO bills (${BILL_COLUMNS})
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ...billParams(bill),
  );
}

export function updateBill(bill: Bill): void {
  const db = getDatabase();

  if (!db) {
    memoryBills = getMemoryBills().map((item) => (item.id === bill.id ? bill : item));
    return;
  }

  // Los parámetros van explícitos y en el orden de los `?`. No podemos usar
  // `billParams(bill).slice(1)`: el `SET` saltea `created_at`, así que los
  // valores se corrían una posición y el `WHERE id` comparaba contra un número
  // en vez del id (UPDATE sin filas) con un parámetro de más.
  db.runSync(
    `UPDATE bills
        SET catalog_id = ?, nombre = ?, categoria = ?, monto = ?, fecha = ?,
            color = ?, icono = ?, es_suscripcion = ?, pagado = ?, updated_at = ?
      WHERE id = ?;`,
    bill.catalogId,
    bill.nombre,
    bill.categoria,
    bill.monto,
    bill.fecha,
    bill.color,
    bill.icono,
    bill.esSuscripcion ? 1 : 0,
    bill.pagado ? 1 : 0,
    bill.updatedAt,
    bill.id,
  );
}

export function deleteBill(id: string): void {
  const db = getDatabase();

  if (!db) {
    memoryBills = getMemoryBills().filter((bill) => bill.id !== id);
    memoryPayments = memoryPayments.filter((payment) => payment.billId !== id);
    return;
  }

  db.runSync('DELETE FROM payments WHERE bill_id = ?;', id);
  db.runSync('DELETE FROM bills WHERE id = ?;', id);
}

export function insertPayment(payment: Payment): void {
  const db = getDatabase();

  if (!db) {
    memoryPayments.push(payment);
    return;
  }

  db.runSync(
    `INSERT INTO payments (id, bill_id, monto, fecha, created_at)
     VALUES (?, ?, ?, ?, ?);`,
    payment.id,
    payment.billId,
    payment.monto,
    payment.fecha,
    payment.createdAt,
  );
}

/**
 * Carga los datos de ejemplo la primera vez. El flag se guarda aparte para que,
 * si el usuario borra todas las cargas, no vuelvan a aparecer al reiniciar.
 */
export function seedIfEmpty(): void {
  const db = getDatabase();

  if (!db || hasSeeded()) {
    return;
  }

  const row = db.getFirstSync<{ total: number }>('SELECT COUNT(*) AS total FROM bills;');

  if ((row?.total ?? 0) === 0) {
    for (const bill of createSeedBills()) {
      insertBill(bill);
    }
  }

  markSeeded();
}

/** Útil para tests: fuerza el backend en memoria. */
export function resetMemoryStore(): void {
  memoryBills = null;
  memoryPayments = [];
}

export { isPersistenceEnabled };