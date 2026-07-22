import { FieldValue, Query, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';
import { COLLECTIONS, Division, WoodType } from '../../config/constants';

const col = () => db.collection(COLLECTIONS.PRODUCTS);

export interface ProductImage {
  storagePath: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  order: number;
}

/** Precio del producto para un tipo de madera concreto. */
export interface WoodVariant {
  woodType: WoodType;
  price: number;
}

export interface ProductDoc {
  slug: string;
  ref: string;
  title: string;
  division: Division;
  categoryId: string | null;
  shortDesc: string;
  description: string;
  specs: string | null;
  features: string[];
  scientificName: string | null;
  origin: string | null;
  applications: string | null;
  datasheetUrl: string | null;
  price: number | null;
  /**
   * Si tiene elementos, el producto se vende por tipo de madera: el cliente
   * elige uno y su precio manda sobre `price`.
   */
  woodVariants: WoodVariant[];
  showPrice: boolean;
  allowsDirectPurchase: boolean;
  stock: number;
  showStock: boolean;
  trackStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  images: ProductImage[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type Product = ProductDoc & { id: string };

const mapDoc = (doc: FirebaseFirestore.DocumentSnapshot): Product | null => {
  if (!doc.exists) return null;
  const data = doc.data() as ProductDoc;
  // Los productos creados antes de las variantes no traen el campo.
  return { id: doc.id, ...data, woodVariants: data.woodVariants ?? [] };
};

export interface ListFilters {
  search?: string;
  division?: Division;
  categoryId?: string;
  isActive?: boolean;
  pageSize: number;
  cursor?: string;
}

export const productsRepository = {
  async findById(id: string): Promise<Product | null> {
    return mapDoc(await col().doc(id).get());
  },

  async findBySlug(slug: string): Promise<Product | null> {
    const snap = await col().where('slug', '==', slug).limit(1).get();
    return snap.empty ? null : mapDoc(snap.docs[0]);
  },

  async findByRef(ref: string): Promise<Product | null> {
    const snap = await col().where('ref', '==', ref).limit(1).get();
    return snap.empty ? null : mapDoc(snap.docs[0]);
  },

  async list(filters: ListFilters): Promise<{ items: Product[]; nextCursor: string | null }> {
    let query: Query = col();

    if (filters.division) query = query.where('division', '==', filters.division);
    if (filters.categoryId) query = query.where('categoryId', '==', filters.categoryId);
    if (filters.isActive !== undefined) query = query.where('isActive', '==', filters.isActive);

    query = query.orderBy('order', 'asc');

    if (filters.cursor) {
      const cursorDoc = await col().doc(filters.cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snap = await query.limit(filters.pageSize + 1).get();
    const docs = snap.docs.map((d) => {
      const data = d.data() as ProductDoc;
      return { id: d.id, ...data, woodVariants: data.woodVariants ?? [] };
    });
    const hasMore = docs.length > filters.pageSize;
    let items = hasMore ? docs.slice(0, filters.pageSize) : docs;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.ref.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q),
      );
    }

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  },

  async create(data: Omit<ProductDoc, 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = FieldValue.serverTimestamp();
    const ref = col().doc();
    await ref.set({ ...data, createdAt: now, updatedAt: now });
    return ref.id;
  },

  async update(id: string, data: Partial<ProductDoc>): Promise<void> {
    await col()
      .doc(id)
      .update({ ...data, updatedAt: FieldValue.serverTimestamp() });
  },

  async incrementStock(id: string, delta: number): Promise<void> {
    await col().doc(id).update({
      stock: FieldValue.increment(delta),
      updatedAt: FieldValue.serverTimestamp(),
    });
  },

  async setStock(id: string, stock: number): Promise<void> {
    await col().doc(id).update({
      stock,
      updatedAt: FieldValue.serverTimestamp(),
    });
  },

  async delete(id: string): Promise<void> {
    await col().doc(id).delete();
  },
};
