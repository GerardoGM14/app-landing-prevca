/**
 * Ajustes puntuales sobre producción (o emulador):
 *
 * 1) COPESA solo cotización: pone allowsDirectPurchase=false a todos los
 *    productos activos de la categoría corporacion-maderera-copesa (ya no se
 *    agregan al carrito, solo se cotizan).
 * 2) Intercambia las imágenes entre los productos "cedro" y "lupuna-lupuna".
 * 3) Crea los 4 servicios de la división TRANSPORTE (solo cotización):
 *    viruta, pies derechos, aserrín y listones de madera.
 *
 *   Emulador:   npx tsx src/seed/ajustes-copesa-transporte.ts
 *   Producción: npx tsx src/seed/ajustes-copesa-transporte.ts --prod
 *
 * Idempotente.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const PROJECT_ID = 'app-prevca';
const STORAGE_BUCKET = 'app-prevca.firebasestorage.app';
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
  initializeApp({ projectId: PROJECT_ID, storageBucket: STORAGE_BUCKET });
  console.log('🧪 Modo EMULADOR local');
}

const db = getFirestore();
const bucket = getStorage().bucket();
const TRANSPORTE_ASSETS = join(process.cwd(), 'seed-assets', 'transporte');

const buildImageUrl = (storagePath: string): string => {
  const emulatorHost = process.env.STORAGE_EMULATOR_HOST;
  if (emulatorHost) {
    const host = emulatorHost.replace(/^https?:\/\//, '');
    return `http://${host}/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
};

async function upload(productId: string, imageFile: string): Promise<string | null> {
  const localPath = join(TRANSPORTE_ASSETS, imageFile);
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

const getBySlug = async (slug: string) => {
  const q = await db.collection('products').where('slug', '==', slug).limit(1).get();
  return q.empty ? null : q.docs[0];
};

// ── 1) COPESA solo cotización ────────────────────────────────────────────────
async function copesaSoloCotizacion() {
  console.log('\n1) COPESA → solo cotización');
  const cat = await db
    .collection('categories')
    .where('slug', '==', 'corporacion-maderera-copesa')
    .limit(1)
    .get();
  if (cat.empty) {
    console.log('   ⚠ categoría no encontrada');
    return;
  }
  const catId = cat.docs[0].id;
  const prods = await db.collection('products').where('categoryId', '==', catId).get();
  let n = 0;
  for (const doc of prods.docs) {
    if (doc.data().allowsDirectPurchase !== false) {
      await doc.ref.update({ allowsDirectPurchase: false, updatedAt: FieldValue.serverTimestamp() });
      n++;
    }
  }
  console.log(`   ✓ ${n} producto(s) pasados a solo cotización`);
}

// ── 2) Intercambiar imágenes cedro ↔ lupuna ──────────────────────────────────
async function swapCedroLupuna() {
  console.log('\n2) Intercambiar imágenes cedro ↔ lupuna');
  const cedro = await getBySlug('cedro');
  const lupuna = await getBySlug('lupuna-lupuna');
  if (!cedro || !lupuna) {
    console.log('   ⚠ no se encontraron ambos productos (cedro / lupuna-lupuna)');
    return;
  }
  const imgCedro = cedro.data().images ?? [];
  const imgLupuna = lupuna.data().images ?? [];
  await cedro.ref.update({ images: imgLupuna, updatedAt: FieldValue.serverTimestamp() });
  await lupuna.ref.update({ images: imgCedro, updatedAt: FieldValue.serverTimestamp() });
  console.log('   ✓ imágenes intercambiadas');
}

// ── 3) Servicios de TRANSPORTE (cotización) ──────────────────────────────────
interface TransSvc {
  slug: string;
  ref: string;
  title: string;
  shortDesc: string;
  description: string;
  imageFile: string;
}

const TRANSPORTE_SERVICIOS: TransSvc[] = [
  {
    slug: 'transporte-viruta',
    ref: 'PRV-TRA-01',
    title: 'Transporte de Viruta',
    shortDesc: 'Traslado de viruta de madera a nivel nacional.',
    description:
      'Servicio de transporte de viruta de madera con unidades adecuadas para carga a granel. Cobertura nacional, coordinación de rutas y entrega segura según el volumen requerido.',
    imageFile: 'transporte-viruta.jpg',
  },
  {
    slug: 'transporte-pies-derechos',
    ref: 'PRV-TRA-02',
    title: 'Transporte de Pies Derechos',
    shortDesc: 'Traslado de pies derechos de madera.',
    description:
      'Servicio de transporte de pies derechos de madera, con manejo cuidadoso de la carga para evitar daños. Ideal para obras y proyectos de construcción.',
    imageFile: 'transporte-pies-derechos.jpg',
  },
  {
    slug: 'transporte-aserrin',
    ref: 'PRV-TRA-03',
    title: 'Transporte de Aserrín',
    shortDesc: 'Traslado de aserrín a nivel nacional.',
    description:
      'Servicio de transporte de aserrín en unidades preparadas para carga a granel. Coordinamos la logística según el volumen y destino requerido.',
    imageFile: 'transporte-aserrin.jpg',
  },
  {
    slug: 'transporte-listones',
    ref: 'PRV-TRA-04',
    title: 'Transporte de Listones de Madera',
    shortDesc: 'Traslado de listones de madera dimensionados.',
    description:
      'Servicio de transporte de listones de madera, con aseguramiento de la carga para mantener las piezas en óptimo estado durante el traslado.',
    imageFile: 'transporte-listones.jpg',
  },
];

async function crearServiciosTransporte() {
  console.log('\n3) Servicios de TRANSPORTE (cotización)');
  const missing: string[] = [];
  for (const svc of TRANSPORTE_SERVICIOS) {
    const existing = await getBySlug(svc.slug);
    const ref = existing ? existing.ref : db.collection('products').doc();
    const isNew = !existing;

    const url = await upload(ref.id, svc.imageFile);
    if (!url) missing.push(svc.imageFile);
    const image = url
      ? { storagePath: `products/${ref.id}/${svc.imageFile}`, url, alt: null, isPrimary: true, order: 0 }
      : null;

    const data: Record<string, unknown> = {
      slug: svc.slug,
      ref: svc.ref,
      title: svc.title,
      division: 'TRANSPORTE',
      categoryId: null,
      subcategory: null,
      shortDesc: svc.shortDesc,
      description: svc.description,
      specs: null,
      features: [],
      scientificName: null,
      origin: null,
      applications: null,
      datasheetUrl: null,
      price: null,
      woodVariants: [],
      options: [],
      optionLabel: null,
      showPrice: false,
      allowsDirectPurchase: false, // solo cotización
      stock: 0,
      showStock: false,
      trackStock: false,
      isActive: true,
      isFeatured: false,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (isNew) {
      data.order = 10 + TRANSPORTE_SERVICIOS.indexOf(svc);
      data.createdAt = FieldValue.serverTimestamp();
    }
    if (image) data.images = [image];

    await ref.set(data, { merge: true });
    console.log(`   ${isNew ? '+ creado   ' : '~ actualiza'} ${svc.slug.padEnd(28)} ${image ? '🖼' : '(sin img)'}`);
  }
  if (missing.length) {
    console.log(`   ⚠ imágenes faltantes: ${missing.join(', ')}`);
  }
}

async function main() {
  await copesaSoloCotizacion();
  await swapCedroLupuna();
  await crearServiciosTransporte();
  console.log('\n✨ Ajustes aplicados.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  });
