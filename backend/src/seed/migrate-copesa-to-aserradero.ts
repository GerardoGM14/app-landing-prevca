/**
 * Migración: saca de Corporación Maderera COPESA los productos que ahora van
 * en Aserradero PREVCA.
 *
 * 1) DESACTIVA en Copesa (isActive:false, no se borran): aserrín, viruta,
 *    materia prima, box cama/tarimas, roperos melamine, listones, tablas de
 *    pino, y el producto de prueba.
 * 2) CREA en Aserradero (con sus precios de Copesa) los 4 que no existían allí:
 *    materia prima, box cama/tarimas, listones, tablas de pino.
 *
 * Aserrín, Viruta y Roperos de Melamine YA existen en Aserradero como
 * cotización y se dejan así (no se migra su precio por ahora).
 *
 *   Emulador:   npx tsx src/seed/migrate-copesa-to-aserradero.ts
 *   Producción: npx tsx src/seed/migrate-copesa-to-aserradero.ts --prod
 *   Revertir:   ... --cleanup   (reactiva Copesa y desactiva los nuevos)
 *
 * Idempotente: correrlo varias veces no duplica.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const PROJECT_ID = 'app-prevca';
const STORAGE_BUCKET = 'app-prevca.firebasestorage.app';
const ASERRADERO_SLUG = 'aserradero-prevca';
const IS_PROD = process.argv.includes('--prod');
const CLEANUP = process.argv.includes('--cleanup');

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
  initializeApp({ projectId: PROJECT_ID, storageBucket: STORAGE_BUCKET });
  console.log('🧪 Modo EMULADOR local');
}

const db = getFirestore();
const bucket = getStorage().bucket();
const ASSETS = join(process.cwd(), 'seed-assets', 'madera', 'copesa');

/** Slugs a ocultar de Copesa */
const TO_HIDE = [
  'aserrin-copesa',
  'viruta-copesa',
  'madera-materia-prima',
  'box-cama-tarimas',
  'ropero-melamine',
  'repostero-melamine',
  'producto-prueba-copesa',
  'listones-madera-pino',
  'tablas-madera-pino',
];

interface SeedOption {
  value: string;
  label: string;
  price: number;
  imageFile?: string;
}

interface NewProduct {
  slug: string;
  ref: string;
  title: string;
  shortDesc: string;
  description: string;
  imageFile: string;
  optionLabel: string;
  options: SeedOption[];
}

/** Los 4 productos nuevos en Aserradero, con los precios que tenían en Copesa. */
const NEW_IN_ASERRADERO: NewProduct[] = [
  {
    slug: 'madera-materia-prima-aserradero',
    ref: 'PRV-MP-01',
    title: 'Madera Materia Prima',
    shortDesc: 'Madera en bruto por tipo: tornillo, copaiba, pino, cedro y lupuna.',
    description:
      'Madera materia prima seleccionada, disponible en distintas especies según la exigencia del proyecto. Cada tipo ofrece un balance particular de resistencia, flexión, compresión y dureza. Precio por pie tablar.',
    imageFile: 'materia-tornillo.png',
    optionLabel: 'Tipo de madera',
    options: [
      { value: 'tornillo', label: 'Tornillo', price: 11.56, imageFile: 'materia-tornillo.png' },
      { value: 'copaiba', label: 'Copaiba', price: 7.67, imageFile: 'materia-copaiba.png' },
      { value: 'pino', label: 'Pino', price: 5.07, imageFile: 'materia-pino.png' },
      { value: 'cedro', label: 'Cedro', price: 5.43, imageFile: 'materia-cedro.png' },
      { value: 'lupuna', label: 'Lupuna', price: 12.74, imageFile: 'materia-lupuna.png' },
    ],
  },
  {
    slug: 'box-cama-tarimas-aserradero',
    ref: 'PRV-BOX-01',
    title: 'Box Cama o Tarimas',
    shortDesc: 'Tarima de madera para cama, en 1.5 y 2 plazas.',
    description:
      'El Box Cama o Tarima de Madera es una solución práctica, resistente y estética para cualquier dormitorio, ofreciendo una base sólida para el descanso y un acabado moderno y funcional.',
    imageFile: 'box-cama-tarimas.png',
    optionLabel: 'Medida',
    options: [
      { value: 'tarima-15', label: 'Tarima 1.5 Plazas', price: 380 },
      { value: 'tarima-2', label: 'Tarima 2 Plazas', price: 450 },
    ],
  },
  {
    slug: 'listones-madera-pino-aserradero',
    ref: 'PRV-LIS-01',
    title: 'Listones de Madera',
    shortDesc: 'Listones de pino dimensionados, en varias medidas.',
    description:
      'Listones de madera de pino, piezas dimensionadas usadas en carpintería, construcción, fabricación de muebles y proyectos decorativos. Destacan por su ligereza, facilidad de trabajo y excelente relación calidad-precio.',
    imageFile: 'listones-madera.png',
    optionLabel: 'Medida',
    options: [
      { value: 'pino-2x2-3m', label: 'Pino 2" x 2" — 3 m', price: 16.52 },
      { value: 'pino-2x3-3m', label: 'Pino 2" x 3" — 3 m', price: 24.78 },
      { value: 'pino-2x4-3m', label: 'Pino 2" x 4" — 3 m', price: 32.8 },
      { value: 'pino-2x2-4m', label: 'Pino 2" x 2" — 4 m', price: 24.31 },
      { value: 'pino-2x3-4m', label: 'Pino 2" x 3" — 4 m', price: 36.34 },
      { value: 'pino-2x4-4m', label: 'Pino 2" x 4" — 4 m', price: 48.62 },
    ],
  },
  {
    slug: 'tablas-madera-pino-aserradero',
    ref: 'PRV-TAB-01',
    title: 'Tablas de Madera Pino',
    shortDesc: 'Tablas aserradas de pino en 20, 25 y 30 cm.',
    description:
      'Piezas aserradas de gran versatilidad, usadas en fabricación de muebles, carpintería, construcción ligera y proyectos decorativos. Ligeras, de fácil mecanizado y excelente relación costo-beneficio.',
    imageFile: 'tablas-pino.png',
    optionLabel: 'Ancho',
    options: [
      { value: 'tabla-20cm', label: 'Tabla de Pino 20 cm', price: 33.04 },
      { value: 'tabla-25cm', label: 'Tabla de Pino 25 cm', price: 35.4 },
      { value: 'tabla-30cm', label: 'Tabla de Pino 30 cm', price: 37.76 },
    ],
  },
  {
    slug: 'repostero-melamine-aserradero',
    ref: 'PRV-REP-02',
    title: 'Reposteros de Melamine',
    shortDesc: 'Reposteros de melamine para cocina, en tres medidas.',
    description:
      'Reposteros de melamine diseñados para combinar estética, funcionalidad y durabilidad. Ofrecen soluciones prácticas de almacenamiento, optimizando cada espacio de la cocina con diseños modernos y acabados de excelente calidad.',
    imageFile: 'repostero-melamine.png',
    optionLabel: 'Medida',
    options: [
      { value: 'repostero-60', label: 'Repostero de 60 cm x 1.74 m', price: 260 },
      { value: 'repostero-90', label: 'Repostero de 90 cm x 1.74 m', price: 260 },
      { value: 'repostero-110', label: 'Repostero de 1.10 m x 1.84 m', price: 370 },
    ],
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

async function setActiveBySlug(slug: string, active: boolean): Promise<boolean> {
  const q = await db.collection('products').where('slug', '==', slug).limit(1).get();
  if (q.empty) return false;
  await q.docs[0].ref.update({ isActive: active, updatedAt: FieldValue.serverTimestamp() });
  return true;
}

async function main() {
  if (CLEANUP) {
    console.log('🧹 Revirtiendo migración...\n');
    for (const slug of TO_HIDE) {
      const ok = await setActiveBySlug(slug, true);
      console.log(`   ${ok ? '✓' : '-'} reactivado en Copesa: ${slug}`);
    }
    for (const p of NEW_IN_ASERRADERO) {
      const ok = await setActiveBySlug(p.slug, false);
      console.log(`   ${ok ? '✓' : '-'} desactivado en Aserradero: ${p.slug}`);
    }
    console.log('\n✨ Revertido.');
    return;
  }

  // Categoría Aserradero
  const catSnap = await db
    .collection('categories')
    .where('slug', '==', ASERRADERO_SLUG)
    .limit(1)
    .get();
  if (catSnap.empty) {
    console.error(`❌ No existe la categoría "${ASERRADERO_SLUG}".`);
    process.exit(1);
  }
  const aserraderoCatId = catSnap.docs[0].id;

  // 1) Ocultar en Copesa
  console.log('🔻 Ocultando productos de Copesa...');
  for (const slug of TO_HIDE) {
    const ok = await setActiveBySlug(slug, false);
    console.log(`   ${ok ? '✓ oculto  ' : '- no existe'} ${slug}`);
  }

  // 2) Crear en Aserradero
  console.log('\n➕ Creando productos en Aserradero...');
  for (const item of NEW_IN_ASERRADERO) {
    const existing = await db.collection('products').where('slug', '==', item.slug).limit(1).get();
    const ref = existing.empty ? db.collection('products').doc() : existing.docs[0].ref;
    const isNew = existing.empty;

    const mainUrl = await upload(ref.id, item.imageFile);
    const mainImage = mainUrl
      ? { storagePath: `products/${ref.id}/${item.imageFile}`, url: mainUrl, alt: null, isPrimary: true, order: 0 }
      : null;

    const options = [];
    for (const opt of item.options) {
      let imageUrl: string | null = null;
      if (opt.imageFile) imageUrl = await upload(ref.id, opt.imageFile);
      options.push({ value: opt.value, label: opt.label, price: opt.price, imageUrl });
    }

    const data: Record<string, unknown> = {
      slug: item.slug,
      ref: item.ref,
      title: item.title,
      division: 'MADERA',
      categoryId: aserraderoCatId,
      subcategory: null,
      shortDesc: item.shortDesc,
      description: item.description,
      specs: null,
      features: [],
      scientificName: null,
      origin: null,
      applications: null,
      datasheetUrl: null,
      price: null,
      woodVariants: [],
      options,
      optionLabel: item.optionLabel,
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
      data.order = 300 + NEW_IN_ASERRADERO.indexOf(item);
      data.createdAt = FieldValue.serverTimestamp();
    }
    if (mainImage) data.images = [mainImage];

    await ref.set(data, { merge: true });
    console.log(`   ${isNew ? '+ creado   ' : '~ actualiza'} ${item.slug.padEnd(34)} ${options.length} opciones`);
  }

  console.log('\n✨ Migración lista.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  });
