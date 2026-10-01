import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import {
  deleteBill as deleteBillFromDb,
  insertBill as insertBillInDb,
  insertPayment as insertPaymentInDb,
  listBills,
  listPayments,
  seedIfEmpty,
  updateBill as updateBillInDb,
} from '@/db/repository';
import {
  aplicarPago,
  billsReducer,
  createId,
  type BillsState,
} from '@/lib/bills';
import { hoyIso } from '@/lib/dates';
import type { Bill, Payment } from '@/types';

export { aplicarPago, createId } from '@/lib/bills';

interface BillsContextValue extends BillsState {
  addBill: (bill: Bill) => void;
  updateBill: (bill: Bill) => void;
  payBill: (billId: string) => void;
  deleteBill: (billId: string) => void;
  getPayments: (billId: string) => Payment[];
}

const BillsContext = createContext<BillsContextValue | undefined>(undefined);

function hydrateInitialState(): BillsState {
  seedIfEmpty();
  return { bills: listBills(), hydrated: true };
}

export function BillsProvider({ children }: { children: ReactNode }) {
  // Lectura sincrónica: la lista ya está disponible en el primer render, sin
  // parpadeo de pantalla vacía.
  const [state, dispatch] = useReducer(billsReducer, null, hydrateInitialState);

  const addBill = useCallback((bill: Bill) => {
    insertBillInDb(bill);
    dispatch({ type: 'add', bill });
  }, []);

  const updateBill = useCallback((bill: Bill) => {
    updateBillInDb(bill);
    dispatch({ type: 'update', bill });
  }, []);

  const payBill = useCallback((billId: string) => {
    // La base es la fuente de verdad: ya refleja las escrituras anteriores.
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
    updateBillInDb(updated);
    dispatch({ type: 'pay', bill: updated });
  }, []);

  const deleteBill = useCallback((billId: string) => {
    deleteBillFromDb(billId);
    dispatch({ type: 'delete', billId });
  }, []);

  const getPayments = useCallback((billId: string) => listPayments(billId), []);

  const value = useMemo<BillsContextValue>(
    () => ({ ...state, addBill, updateBill, payBill, deleteBill, getPayments }),
    [state, addBill, updateBill, payBill, deleteBill, getPayments],
  );

  return <BillsContext.Provider value={value}>{children}</BillsContext.Provider>;
}

export function useBills(): BillsContextValue {
  const context = useContext(BillsContext);

  if (!context) {
    throw new Error('useBills debe usarse dentro de un BillsProvider');
  }

  return context;
}