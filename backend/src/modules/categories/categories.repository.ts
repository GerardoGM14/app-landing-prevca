import { FieldValue, Query, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';
import { COLLECTIONS, Division } from '../../config/constants';

const col = () => db.collection(COLLECTIONS.CATEGORIES);

export interface CategoryDoc {
  slug: string;
  name: string;
  division: Division;
  order: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type Category = CategoryDoc & { id: string };

const mapDoc = (doc: FirebaseFirestore.DocumentSnapshot): Category | null => {
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as CategoryDoc) };
};

export const categoriesRepository = {
  async findById(id: string): Promise<Category | null> {
    return mapDoc(await col().doc(id).get());
  },

  async findBySlug(slug: string, division: Division): Promise<Category | null> {
    const snap = await col()
      .where('slug', '==', slug)
      .where('division', '==', division)
      .limit(1)
      .get();
    return snap.empty ? null : mapDoc(snap.docs[0]);
  },

  async list(filters: { division?: Division; isActive?: boolean }): Promise<Category[]> {
    let query: Query = col();
    if (filters.division) query = query.where('division', '==', filters.division);
    if (filters.isActive !== undefined) query = query.where('isActive', '==', filters.isActive);
    query = query.orderBy('order', 'asc');

    const snap = await query.get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as CategoryDoc) }));
  },

  async create(data: Omit<CategoryDoc, 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = FieldValue.serverTimestamp();
    const ref = col().doc();
    await ref.set({ ...data, createdAt: now, updatedAt: now });
    return ref.id;
  },

  async update(id: string, data: Partial<CategoryDoc>): Promise<void> {
    await col()
      .doc(id)
      .update({ ...data, updatedAt: FieldValue.serverTimestamp() });
  },

  async delete(id: string): Promise<void> {
    await col().doc(id).delete();
  },
};
