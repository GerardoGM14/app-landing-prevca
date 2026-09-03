/**
 * Crea en Aserradero PREVCA (categoría "Muebles de Melamine") 6 productos
 * individuales: 2 reposteros y 4 roperos, cada uno con precio único (cobro
 * con comisión) y su galería de imágenes.
 *
 *   Emulador:   npx tsx src/seed/seed-melamine-aserradero.ts
 *   Producción: npx tsx src/seed/seed-melamine-aserradero.ts --prod
 *
 * Idempotente (upsert por slug). Imágenes en seed-assets/melamine/.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const STORAGE_BUCKET = 'app-prevca.firebasestorage.app';
const ASERRADERO_SLUG = 'aserradero-prevca';
const SUBCATEGORY = 'Muebles de Melamine';
const IS_PROD = process.argv.includes('--prod');

if (IS_PROD) {
  const keyPath = join(process.cwd(), 'serviceAccountKey.json');
  if (!existsSync(keyPath)) {
    console.error(`❌ Falta ${keyPath}`);
    process.exit(1);
  }
  const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
  initializeApp({ credential: cert(sa), projectId: sa.project_id, storageBucket: STORAGE_BUCKET });
  console.log('🚀 Modo PRODUCCIÓN');
} else {
  process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080';
  process.env.STORAGE_EMULATOR_HOST ||= 'http://localhost:9199';
  initializeApp({ projectId: 'app-prevca', storageBucket: STORAGE_BUCKET });
  console.log('🧪 Modo EMULADOR local');
}

const db = getFirestore();
const bucket = getStorage().bucket();
const ASSETS = join(process.cwd(), 'seed-assets', 'melamine');

interface NewProduct {
  slug: string;
  ref: string;
  title: string;
  shortDesc: string;
  description: string;
  price: number;
  /** Una o varias imágenes (galería). La primera es la principal. */
  imageFiles: string[];
}

const PRODUCTS: NewProduct[] = [
  {
    slug: 'repostero-melamine-90',
    ref: 'PRV-MEL-R90',
    title: 'Repostero de Melamine 90 cm',
    shortDesc: 'Repostero de melamine para cocina — 90 x 174 x 30 cm.',
    description:
      'Repostero de melamine para cocina de 90 cm (90 x 174 cm x 30 cm de profundidad). Amplios compartimentos, cajones y puertas, con acabados de calidad y diseño funcional.',
    price: 313.5,
    imageFiles: ['repostero-90-1.jpg', 'repostero-90-2.jpg'],
  },
  {
    slug: 'repostero-melamine-110',
    ref: 'PRV-MEL-R110',
    title: 'Repostero de Melamine 110 cm',
    shortDesc: 'Repostero de melamine para cocina — 110 x 184 x 35 cm.',
    description:
      'Repostero de melamine para cocina de 110 cm (110 x 184 cm x 35 cm de profundidad). Mayor capacidad de almacenamiento, con compartimentos, cajones y puertas de acabado de calidad.',
    price: 386.65,
    imageFiles: ['repostero-110-1.jpg', 'repostero-110-2.jpg'],
  },
  {
    slug: 'ropero-melamine-100',
    ref: 'PRV-MEL-RP100',
    title: 'Ropero de Melamine 100 cm',
    shortDesc: 'Ropero de melamine con espejo — 100 x 184 x 40 cm.',
    description:
      'Ropero de melamine de 100 cm (100 x 184 cm x 40 cm de profundidad), con puertas, cajones y espejo. Amplio espacio de almacenamiento con acabados modernos.',
    price: 522.5,
    imageFiles: ['ropero-100.jpg'],
  },
  {
    slug: 'ropero-melamine-120',
    ref: 'PRV-MEL-RP120',
    title: 'Ropero de Melamine 120 cm',
    shortDesc: 'Ropero de melamine con espejo — 120 x 184 x 40 cm.',
    description:
      'Ropero de melamine de 120 cm (100 x 184 cm x 40 cm de profundidad), con puertas, cajones y espejo. Diseño espacioso y funcional para el dormitorio.',
    price: 647.9,
    imageFiles: ['ropero-120.jpg'],
  },
  {
    slug: 'ropero-melamine-120-m2',
    ref: 'PRV-MEL-RP120M2',
    title: 'Ropero de Melamine 120 cm - Modelo 2',
    shortDesc: 'Ropero de melamine con espejo — modelo 2, 120 x 184 x 40 cm.',
    description:
      'Ropero de melamine de 120 cm, modelo 2 (100 x 184 cm x 40 cm de profundidad), con un diseño alternativo de puertas, cajones y espejo. Acabados modernos y amplio almacenamiento.',
    price: 647.9,
    imageFiles: ['ropero-120-m2.jpg'],
  },
  {
    slug: 'ropero-melamine-150',
    ref: 'PRV-MEL-RP150',
    title: 'Ropero de Melamine 150 cm',
    shortDesc: 'Ropero de melamine con espejo — 150 x 184 x 40 cm.',
    description:
      'Ropero de melamine de 150 cm (150 x 184 cm x 40 cm de profundidad), con puertas, cajones y espejo. Máxima capacidad de almacenamiento para dormitorios amplios.',
    price: 919.6,
    imageFiles: ['ropero-150.jpg'],
  },
];

const buildImageUrl = (storagePath: string): string => {
  const emulatorHost = process.env.STORAGE_EMULATOR_HOST;
  if (emulatorHost) {
    const host = emulatorHost.replace(/^https?:\/\//, '');
    return `http://${host}/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
};

async function upload(productId: string, imageFile: string): Promise<string | null> {
  const localPath = join(ASSETS, imageFile);
  if (!existsSync(localPath)) return null;
  const ext = imageFile.split('.').pop()?.toLowerCase();
  const contentType =
    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
  const storagePath = `products/${productId}/${imageFile}`;
  const file = bucket.file(storagePath);
  await file.save(readFileSync(localPath), {
    contentType,
    metadata: { cacheControl: 'public, max-age=31536000' },
  });
  if (!process.env.STORAGE_EMULATOR_HOST) await file.makePublic().catch(() => undefined);
  return buildImageUrl(storagePath);
}

async function main() {
  const cat = await db
    .collection('categories')
    .where('slug', '==', ASERRADERO_SLUG)
    .limit(1)
    .get();
  if (cat.empty) {
    console.error(`❌ No existe la categoría "${ASERRADERO_SLUG}".`);
    process.exit(1);
  }
  const categoryId = cat.docs[0].id;
  const missing: string[] = [];

  for (const item of PRODUCTS) {
    const existing = await db.collection('products').where('slug', '==', item.slug).limit(1).get();
    const ref = existing.empty ? db.collection('products').doc() : existing.docs[0].ref;
    const isNew = existing.empty;

    // Galería de imágenes (la primera es la principal)
    const images = [];
    for (let i = 0; i < item.imageFiles.length; i++) {
      const file = item.imageFiles[i];
      const url = await upload(ref.id, file);
      if (!url) {
        missing.push(file);
        continue;
      }
      images.push({
        storagePath: `products/${ref.id}/${file}`,
        url,
        alt: null,
        isPrimary: i === 0,
        order: i,
      });
    }

    const data: Record<string, unknown> = {
      slug: item.slug,
      ref: item.ref,
      title: item.title,
      division: 'MADERA',
      categoryId,
      subcategory: SUBCATEGORY,
      shortDesc: item.shortDesc,
      description: item.description,
      specs: null,
      features: [],
      scientificName: null,
      origin: null,
      applications: null,
      datasheetUrl: null,
      price: item.price,
      woodVariants: [],
      options: [],
      optionLabel: null,
      showPrice: true,
      allowsDirectPurchase: true,
      stock: 0,
      showStock: false,
      trackStock: false,
      isActive: true,
      isFeatured: false,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (isNew) {
      data.order = 400 + PRODUCTS.indexOf(item);
      data.createdAt = FieldValue.serverTimestamp();
    }
    if (images.length > 0) data.images = images;

    await ref.set(data, { merge: true });
    console.log(`   ${isNew ? '+ creado   ' : '~ actualiza'} ${item.slug.padEnd(26)} S/ ${item.price}  ${images.length} img`);
  }

  console.log('\n✨ Listo.');
  if (missing.length) {
    console.log(`\n⚠ imágenes faltantes en seed-assets/melamine/:`);
    [...new Set(missing)].forEach((m) => console.log(`   - ${m}`));
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  });
