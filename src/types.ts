export type Categoria = 'Servicios' | 'Vivienda' | 'Entretenimiento';

export interface CatalogItem {
  id: string;
  nombre: string;
  categoria: Categoria;
  color: string;
  icono: string;
  esSuscripcion: boolean;
}

export interface Bill {
  id: string;
  catalogId: string | null;
  nombre: string;
  categoria: Categoria;
  /** Monto en pesos argentinos (ARS), sin signo ni separadores. */
  monto: number;
  /** Fecha de vencimiento o próximo pago en formato ISO `YYYY-MM-DD`. */
  fecha: string;
  color: string;
  icono: string;
  esSuscripcion: boolean;
  pagado: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Payment {
  id: string;
  billId: string;
  monto: number;
  /** Fecha del pago en formato ISO `YYYY-MM-DD`. */
  fecha: string;
  createdAt: number;
}