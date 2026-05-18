import { FieldValue, Query, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';
import { COLLECTIONS, OrderStatus } from '../../config/constants';

const col = () => db.collection(COLLECTIONS.ORDERS);

export interface OrderItem {
  productId: string;
  titleSnapshot: string;
  priceSnapshot: number | null;
  quantity: number;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
}

export interface OrderDoc {
  code: string;
  customer: OrderCustomer;
  message: string | null;
  status: OrderStatus;
  internalNotes: string | null;
  items: OrderItem[];
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

  async list(filters: {
    status?: OrderStatus;
    pageSize: number;
    cursor?: string;
  }): Promise<{ items: Order[]; nextCursor: string | null }> {
    let query: Query = col();
    if (filters.status) query = query.where('status', '==', filters.status);
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

  async delete(id: string): Promise<void> {
    await col().doc(id).delete();
  },
};

/**
 * Genera un código de cotización tipo COT-2026-00001 usando un contador atómico
 * almacenado en /settings/order-counter. Garantiza unicidad sin colisiones.
 */
export const generateOrderCode = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const counterRef = db.collection(COLLECTIONS.SETTINGS).doc('order-counter');

  const next = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current = (snap.data()?.[year] as number | undefined) ?? 0;
    const newValue = current + 1;
    tx.set(counterRef, { [year]: newValue }, { merge: true });
    return newValue;
  });

  return `COT-${year}-${String(next).padStart(5, '0')}`;
};
