/**
 * Reemplaza la imagen de productos de la categoría "Merma" en Aserradero PREVCA.
 * Sube la nueva imagen a Storage y reescribe el images[] del producto (una sola
 * imagen principal).
 *
 *   Emulador:   npx tsx src/seed/reemplazar-imagenes-merma.ts
 *   Producción: npx tsx src/seed/reemplazar-imagenes-merma.ts --prod
 *
 * Idempotente. Imágenes en seed-assets/merma/.
 */
import { existsSync, readFileSync } from 'node:fs';
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
const ASSETS = join(process.cwd(), 'seed-assets', 'merma');

/** slug → archivo en seed-assets/merma/ */
const MAP: Record<string, string> = {
  'aserrin-10kg': 'aserrin-10kg.jpg',
  'viruta-10kg': 'viruta-10kg.jpg',
};

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
  const missing: string[] = [];

  for (const [slug, imageFile] of Object.entries(MAP)) {
    const q = await db.collection('products').where('slug', '==', slug).limit(1).get();
    if (q.empty) {
      console.log(`   ⚠ ${slug} no encontrado`);
      continue;
    }
    const ref = q.docs[0].ref;
    const url = await upload(ref.id, imageFile);
    if (!url) {
      missing.push(imageFile);
      console.log(`   ⚠ falta imagen ${imageFile}`);
      continue;
    }
    const images = [
      {
        storagePath: `products/${ref.id}/${imageFile}`,
        url,
        alt: null,
        isPrimary: true,
        order: 0,
      },
    ];
    await ref.update({ images, updatedAt: FieldValue.serverTimestamp() });
    console.log(`   ✓ ${slug.padEnd(14)} imagen reemplazada`);
  }

  console.log('\n✨ Listo.');
  if (missing.length) {
    console.log(`\n⚠ imágenes faltantes en seed-assets/merma/:`);
    [...new Set(missing)].forEach((m) => console.log(`   - ${m}`));
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  });
