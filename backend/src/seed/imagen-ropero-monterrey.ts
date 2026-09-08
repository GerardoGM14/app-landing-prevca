/**
 * Sube y asocia la imagen del Ropero Monterrey - Contraplacado.
 *
 *   Emulador:   npx tsx src/seed/imagen-ropero-monterrey.ts
 *   Producción: npx tsx src/seed/imagen-ropero-monterrey.ts --prod
 *
 * Idempotente. Imagen en seed-assets/ropero/ropero-monterrey.jpg.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const STORAGE_BUCKET = 'app-prevca.firebasestorage.app';
const SLUG = 'ropero-monterrey-contraplacado';
const IMAGE_FILE = 'ropero-monterrey.jpg';
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
const ASSETS = join(process.cwd(), 'seed-assets', 'ropero');

const buildImageUrl = (storagePath: string): string => {
  const emulatorHost = process.env.STORAGE_EMULATOR_HOST;
  if (emulatorHost) {
    const host = emulatorHost.replace(/^https?:\/\//, '');
    return `http://${host}/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
};

async function upload(productId: string): Promise<string | null> {
  const localPath = join(ASSETS, IMAGE_FILE);
  if (!existsSync(localPath)) return null;
  const storagePath = `products/${productId}/${IMAGE_FILE}`;
  const file = bucket.file(storagePath);
  await file.save(readFileSync(localPath), {
    contentType: 'image/jpeg',
    metadata: { cacheControl: 'public, max-age=31536000' },
  });
  if (!process.env.STORAGE_EMULATOR_HOST) await file.makePublic().catch(() => undefined);
  return buildImageUrl(storagePath);
}

async function main() {
  const q = await db.collection('products').where('slug', '==', SLUG).limit(1).get();
  if (q.empty) {
    console.error(`❌ No existe el producto "${SLUG}".`);
    process.exit(1);
  }
  const ref = q.docs[0].ref;
  const url = await upload(ref.id);
  if (!url) {
    console.error(`❌ Falta la imagen ${IMAGE_FILE} en seed-assets/ropero/`);
    process.exit(1);
  }
  const images = [
    {
      storagePath: `products/${ref.id}/${IMAGE_FILE}`,
      url,
      alt: null,
      isPrimary: true,
      order: 0,
    },
  ];
  await ref.update({ images, updatedAt: FieldValue.serverTimestamp() });
  console.log(`   ✓ ${SLUG} imagen asociada`);
  console.log('\n✨ Listo.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  });
