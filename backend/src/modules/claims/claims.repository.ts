import { FieldValue, Query, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';
import {
  COLLECTIONS,
  SETTINGS_DOCS,
  ClaimStatus,
  ClaimType,
  ClaimItemType,
  DocumentType,
} from '../../config/constants';

const col = () => db.collection(COLLECTIONS.CLAIMS);

export interface ClaimConsumer {
  fullName: string;
  documentType: DocumentType;
  documentNumber: string;
  address: string;
  phone: string;
  email: string;
  isMinor: boolean;
  guardianName: string | null;
}

export interface ClaimItem {
  type: ClaimItemType;
  amount: number | null;
  description: string;
}

export interface ClaimDetail {
  type: ClaimType;
  description: string;
  request: string;
}

export interface ClaimDoc {
  code: string;
  consumer: ClaimConsumer;
  item: ClaimItem;
  detail: ClaimDetail;
  status: ClaimStatus;
  /** Respuesta del proveedor al consumidor (máx. 15 días hábiles) */
  response: string | null;
  internalNotes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type Claim = ClaimDoc & { id: string };

const mapDoc = (doc: FirebaseFirestore.DocumentSnapshot): Claim | null => {
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as ClaimDoc) };
};

export const claimsRepository = {
  async findById(id: string): Promise<Claim | null> {
    return mapDoc(await col().doc(id).get());
  },

  async findByCode(code: string): Promise<Claim | null> {
    const snap = await col().where('code', '==', code).limit(1).get();
    return snap.empty ? null : mapDoc(snap.docs[0]);
  },

  async list(filters: {
    status?: ClaimStatus;
    type?: ClaimType;
    pageSize: number;
    cursor?: string;
  }): Promise<{ items: Claim[]; nextCursor: string | null }> {
    let query: Query = col();
    if (filters.status) query = query.where('status', '==', filters.status);
    if (filters.type) query = query.where('detail.type', '==', filters.type);
    query = query.orderBy('createdAt', 'desc');

    if (filters.cursor) {
      const cursorDoc = await col().doc(filters.cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snap = await query.limit(filters.pageSize + 1).get();
    const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as ClaimDoc) }));
    const hasMore = docs.length > filters.pageSize;
    const items = hasMore ? docs.slice(0, filters.pageSize) : docs;
    return { items, nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null };
  },

  async create(data: Omit<ClaimDoc, 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = FieldValue.serverTimestamp();
    const ref = col().doc();
    await ref.set({ ...data, createdAt: now, updatedAt: now });
    return ref.id;
  },

  async update(id: string, data: Partial<ClaimDoc>): Promise<void> {
    await col()
      .doc(id)
      .update({ ...data, updatedAt: FieldValue.serverTimestamp() });
  },
};

/**
 * Genera un código correlativo tipo LR-2026-00001 usando un contador atómico
 * en /settings/claim-counter, igual que las órdenes.
 */
export const generateClaimCode = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const counterRef = db.collection(COLLECTIONS.SETTINGS).doc(SETTINGS_DOCS.CLAIM_COUNTER);
  const field = `LR_${year}`;

  const next = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current = (snap.data()?.[field] as number | undefined) ?? 0;
    const newValue = current + 1;
    tx.set(counterRef, { [field]: newValue }, { merge: true });
    return newValue;
  });

  return `LR-${year}-${String(next).padStart(5, '0')}`;
};
