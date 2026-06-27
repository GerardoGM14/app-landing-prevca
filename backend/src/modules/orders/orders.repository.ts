import { FieldValue, Query, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';
import {
  COLLECTIONS,
  DocumentType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PeruDepartment,
  ReceiptType,
  SETTINGS_DOCS,
} from '../../config/constants';

const col = () => db.collection(COLLECTIONS.ORDERS);

export interface OrderItem {
  productId: string;
  titleSnapshot: string;
  priceSnapshot: number | null;
  quantity: number;
  /** Subtotal de este item (priceSnapshot * quantity) — null si es cotización */
  lineTotal: number | null;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
}

export interface OrderShipping {
  department: PeruDepartment;
  province: string;
  district: string;
  address: string;
  reference: string | null;
  /** Costo de envío calculado en server al crear la orden */
  cost: number;
}

export interface OrderBilling {
  receiptType: ReceiptType;
  documentType: DocumentType;
  documentNumber: string;
  businessName: string | null;
}

export interface OrderPayment {
  /** Path en Storage de la captura de pago (Yape/Transferencia) */
  proofPath: string | null;
  /** URL pública de la captura (regenerable) */
  proofUrl: string | null;
  /** ID de transacción externa (PayPal, Culqi) */
  transactionId: string | null;
  /** Detalles adicionales del pago (JSON arbitrario del webhook) */
  rawPayload: Record<string, unknown> | null;
  /** Fecha en la que el cliente reportó/subió el pago */
  reportedAt: Timestamp | null;
  /** Fecha en la que el admin/pasarela aprobó el pago */
  paidAt: Timestamp | null;
}

export interface OrderDoc {
  code: string;
  customer: OrderCustomer;
  /** Solo para órdenes con pago directo. null en cotizaciones. */
  shipping: OrderShipping | null;
  billing: OrderBilling | null;
  message: string | null;
  status: OrderStatus;
  items: OrderItem[];
  /** QUOTE para cotización tradicional, otro valor para checkout con pago */
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  payment: OrderPayment;
  /** Subtotal de productos (sin envío) — null en cotizaciones */
  subtotal: number | null;
  /** Costo de envío — null en cotizaciones */
  shippingCost: number | null;
  /** Total final cliente paga — null en cotizaciones */
  total: number | null;
  internalNotes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type Order = OrderDoc & { id: string };

const mapDoc = (doc: FirebaseFirestore.DocumentSnapshot): Order | null => {
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as OrderDoc) };
};

export const ordersRepository = {
  async findById(id: string): Promise<Order | null> {
    return mapDoc(await col().doc(id).get());
  },

  async findByCode(code: string): Promise<Order | null> {
    const snap = await col().where('code', '==', code).limit(1).get();
    return snap.empty ? null : mapDoc(snap.docs[0]);
  },

  async list(filters: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    pageSize: number;
    cursor?: string;
  }): Promise<{ items: Order[]; nextCursor: string | null }> {
    let query: Query = col();
    if (filters.status) query = query.where('status', '==', filters.status);
    if (filters.paymentStatus) query = query.where('paymentStatus', '==', filters.paymentStatus);
    if (filters.paymentMethod) query = query.where('paymentMethod', '==', filters.paymentMethod);
    query = query.orderBy('createdAt', 'desc');

    if (filters.cursor) {
      const cursorDoc = await col().doc(filters.cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snap = await query.limit(filters.pageSize + 1).get();
    const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as OrderDoc) }));
    const hasMore = docs.length > filters.pageSize;
    const items = hasMore ? docs.slice(0, filters.pageSize) : docs;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  },

  async create(data: Omit<OrderDoc, 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = FieldValue.serverTimestamp();
    const ref = col().doc();
    await ref.set({ ...data, createdAt: now, updatedAt: now });
    return ref.id;
  },

  async update(id: string, data: Partial<OrderDoc>): Promise<void> {
    await col()
      .doc(id)
      .update({ ...data, updatedAt: FieldValue.serverTimestamp() });
  },

  async updatePayment(id: string, payment: Partial<OrderPayment>, paymentStatus?: PaymentStatus): Promise<void> {
    const data: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    Object.entries(payment).forEach(([k, v]) => {
      data[`payment.${k}`] = v;
    });
    if (paymentStatus) data.paymentStatus = paymentStatus;
    await col().doc(id).update(data);
  },

  async delete(id: string): Promise<void> {
    await col().doc(id).delete();
  },
};

/**
 * Genera un código tipo COT-2026-00001 (cotizaciones) o ORD-2026-00001 (compras).
 * Usa un contador atómico en /settings/order-counter para garantizar unicidad.
 */
export const generateOrderCode = async (prefix: 'COT' | 'ORD' = 'COT'): Promise<string> => {
  const year = new Date().getFullYear();
  const counterRef = db.collection(COLLECTIONS.SETTINGS).doc(SETTINGS_DOCS.ORDER_COUNTER);
  const field = `${prefix}_${year}`;

  const next = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current = (snap.data()?.[field] as number | undefined) ?? 0;
    const newValue = current + 1;
    tx.set(counterRef, { [field]: newValue }, { merge: true });
    return newValue;
  });

  return `${prefix}-${year}-${String(next).padStart(5, '0')}`;
};
