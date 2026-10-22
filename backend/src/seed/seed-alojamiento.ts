/**
 * Crea el catálogo de Alojamiento (división HOSPITALIDAD). Productos
 * informativos: sin precio, sin carrito y sin descripción.
 *
 *   Emulador:   npx tsx src/seed/seed-alojamiento.ts
 *   Producción: npx tsx src/seed/seed-alojamiento.ts --prod
 *
 * Idempotente (upsert por slug). Las imágenes se toman de
 * seed-assets/alojamiento/ con el prefijo de cada producto (<prefijo>-N.jpg),
 * ordenadas por N; la -1 es la principal.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

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
  initializeApp({ projectId: 'app-prevca', storageBucket: STORAGE_BUCKET });
  console.log('🧪 Modo EMULADOR local');
}

const db = getFirestore();
const bucket = getStorage().bucket();
const ASSETS = join(process.cwd(), 'seed-assets', 'alojamiento');

interface NewItem {
  slug: string;
  ref: string;
  title: string;
  /** Prefijo de los archivos: <prefijo>-1.jpg, <prefijo>-2.jpg, ... */
  imagePrefix: string;
}

const ITEMS: NewItem[] = [
  {
    slug: 'departamento-senior',
    ref: 'PRV-AL-SENIOR',
    title: 'Departamento Senior – 4to piso',
    imagePrefix: 'departamento-senior',
  },
  {
    slug: 'departamento-premium-black',
    ref: 'PRV-AL-PBLACK',
    title: 'Departamento Premium Black – 3er piso',
    imagePrefix: 'departamento-premium-black',
  },
  { slug: 'lavanderia', ref: 'PRV-AL-LAV', title: 'Lavandería', imagePrefix: 'lavanderia' },
];

/** Archivos <prefijo>-N.ext ordenados por N numérico (10 va después de 9). */
function filesFor(prefix: string): string[] {
  const re = new RegExp(`^${prefix}-(\\d+)\\.(jpe?g|png|webp)$`, 'i');
  return readdirSync(ASSETS)
    .map((f) => ({ f, m: f.match(re) }))
    .filter((x): x is { f: string; m: RegExpMatchArray } => x.m !== null)
    .sort((a, b) => Number(a.m[1]) - Number(b.m[1]))
    .map((x) => x.f);
}

const buildImageUrl = (storagePath: string): string => {
  const emulatorHost = process.env.STORAGE_EMULATOR_HOST;
  if (emulatorHost) {
    const host = emulatorHost.replace(/^https?:\/\//, '');
    return `http://${host}/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
};

/**
 * Sube una foto bajo una carpeta de versión (products/<id>/<version>/<archivo>).
 * Así una foto reemplazada con el mismo nombre tiene URL nueva y nadie ve la
 * vieja guardada en caché (las fotos se cachean hasta un año).
 */
async function upload(productId: string, version: string, imageFile: string): Promise<string> {
  const ext = imageFile.split('.').pop()?.toLowerCase();
  const contentType =
    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
  const storagePath = `products/${productId}/${version}/${imageFile}`;
  const file = bucket.file(storagePath);
  await file.save(readFileSync(join(ASSETS, imageFile)), {
    contentType,
    metadata: { cacheControl: 'public, max-age=31536000' },
  });
  if (!process.env.STORAGE_EMULATOR_HOST) await file.makePublic().catch(() => undefined);
  return buildImageUrl(storagePath);
}

async function main() {
  for (const [i, item] of ITEMS.entries()) {
    const existing = await db.collection('products').where('slug', '==', item.slug).limit(1).get();
    const ref = existing.empty ? db.collection('products').doc() : existing.docs[0].ref;
    const isNew = existing.empty;

    const files = filesFor(item.imagePrefix);
    const version = `v${Date.now()}`;
    const images = [];
    for (let n = 0; n < files.length; n++) {
      const url = await upload(ref.id, version, files[n]);
      images.push({
        storagePath: `products/${ref.id}/${version}/${files[n]}`,
        url,
        alt: null,
        isPrimary: n === 0,
        order: n,
      });
    }

    const data: Record<string, unknown> = {
      slug: item.slug,
      ref: item.ref,
      title: item.title,
      division: 'HOSPITALIDAD',
      categoryId: null,
      subcategory: null,
      shortDesc: null,
      description: null,
      specs: null,
      features: [],
      scientificName: null,
      origin: null,
      applications: null,
      datasheetUrl: null,
      price: null,
      options: [],
      optionLabel: null,
      woodVariants: [],
      showPrice: false,
      allowsDirectPurchase: false,
      stock: 0,
      showStock: false,
      trackStock: false,
      isActive: true,
      isFeatured: false,
      images,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (isNew) {
      data.order = 10 + i;
      data.createdAt = FieldValue.serverTimestamp();
    }

    await ref.set(data, { merge: true });

    // Borra de Storage las fotos de versiones anteriores (ya no las usa nadie).
    const keep = new Set(images.map((im) => im.storagePath));
    const [stored] = await bucket.getFiles({ prefix: `products/${ref.id}/` });
    const stale = stored.filter((f) => !keep.has(f.name));
    await Promise.all(stale.map((f) => f.delete().catch(() => undefined)));

    console.log(
      `   ${isNew ? '+ creado   ' : '~ actualiza'} ${item.slug.padEnd(26)} ${images.length} img` +
        (stale.length ? ` (${stale.length} foto(s) anteriores borradas)` : ''),
    );
  }

  console.log('\n✨ Listo.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  });
