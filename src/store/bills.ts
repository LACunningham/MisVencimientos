import { create } from 'zustand';

import { fetchSeedSpecs } from '@/api/bills';
import { createSeedBills } from '@/data/seed';
import {
  deleteBill as deleteBillFromDb,
  insertBill as insertBillInDb,
  insertPayment as insertPaymentInDb,
  listAllPayments,
  listBills,
  listPayments,
  seedIfEmpty,
  updateBill as updateBillFromDb,
} from '@/db/repository';
import { hasSeeded, markSeeded } from '@/db/settings';
import {
  aplicarPago,
  billsReducer,
  createId,
  type BillsState,
} from '@/lib/bills';
import { hoyIso } from '@/lib/dates';
import type { Bill, Payment } from '@/types';

export interface BillsStore extends BillsState {
  /** `true` mientras se espera el primer fetch de datos de ejemplo. */
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  addBill: (bill: Bill) => void;
  updateBill: (bill: Bill) => void;
  payBill: (billId: string) => void;
  deleteBill: (billId: string) => void;
  getPayments: (billId: string) => Payment[];
  /** Historial global, para la pantalla de Resumen. */
  getAllPayments: () => Payment[];
}

/**
 * Igual que el provider anterior, arranca con una lectura sincrónica de SQLite
 * para que quien ya tiene datos vea la lista sin parpadeo. El fetch sólo corre
 * la primera vez, cuando todavía no hay cargas.
 */
const initialBills = listBills();

export const useBillsStore = create<BillsStore>()((set, get) => ({
  bills: initialBills,
  hydrated: initialBills.length > 0,
  loading: false,
  error: null,

  load: async () => {
    // En desarrollo React puede montar dos veces el efecto de arranque. Sin
    // este guardia, los seeds se insertarían dos veces (y en SQLite el id
    // repetido rompería el INSERT).
    if (get().loading) {
      return;
    }

    const local = listBills();

    if (local.length > 0 || hasSeeded()) {
      set({ bills: local, hydrated: true, loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });

    try {
      const specs = await fetchSeedSpecs();

      for (const bill of createSeedBills(new Date(), specs)) {
        insertBillInDb(bill);
      }

      markSeeded();
      set({ bills: listBills(), hydrated: true, loading: false, error: null });
    } catch {
      // Sin red o sin dev server: la app tiene que seguir siendo usable.
      seedIfEmpty();
      set({
        bills: listBills(),
        hydrated: true,
        loading: false,
        error: 'No se pudieron cargar los datos de ejemplo. Se usaron los datos locales.',
      });
    }
  },

  addBill: (bill) => {
    insertBillInDb(bill);
    set((state) => billsReducer(state, { type: 'add', bill }));
  },

  updateBill: (bill) => {
    updateBillFromDb(bill);
    set((state) => billsReducer(state, { type: 'update', bill }));
  },

  payBill: (billId) => {
    // La base es la fuente de verdad: puede tener escrituras que el store
    // todavía no refleja (por ejemplo, una edición desde otra pantalla).
    const bill = listBills().find((item) => item.id === billId);

    if (!bill) {
      return;
    }

    const now = Date.now();
    const updated = aplicarPago(bill, now);

    insertPaymentInDb({
      id: createId('pay'),
      billId,
      monto: bill.monto,
      fecha: hoyIso(),
      createdAt: now,
    });
    updateBillFromDb(updated);
    set((state) => billsReducer(state, { type: 'pay', bill: updated }));
  },

  deleteBill: (billId) => {
    deleteBillFromDb(billId);
    set((state) => billsReducer(state, { type: 'delete', billId }));
  },

  getPayments: (billId) => listPayments(billId),

  getAllPayments: () => listAllPayments(),
}));

/** Sólo para tests: vuelve el store a un estado conocido. */
export function resetBillsStore(): void {
  useBillsStore.setState({
    bills: [],
    hydrated: false,
    loading: false,
    error: null,
  });
}
