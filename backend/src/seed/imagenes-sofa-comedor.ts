/**
 * Sube y asocia las imágenes del Sofá Mónaco y el Comedor de 6 Sillas.
 *
 *   Emulador:   npx tsx src/seed/imagenes-sofa-comedor.ts
 *   Producción: npx tsx src/seed/imagenes-sofa-comedor.ts --prod
 *
 * Idempotente. Imágenes en seed-assets/ropero/.
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
const ASSETS = join(process.cwd(), 'seed-assets', 'ropero');

/** slug → archivo en seed-assets/ropero/ */
const MAP: Record<string, string> = {
  'sofa-monaco': 'sofa-monaco.jpg',
  'comedor-6-sillas': 'comedor-6-sillas.jpg',
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
  const storagePath = `products/${productId}/${imageFile}`;
  const file = bucket.file(storagePath);
  await file.save(readFileSync(localPath), {
    contentType: 'image/jpeg',
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
      continue;
    }
    const images = [
      { storagePath: `products/${ref.id}/${imageFile}`, url, alt: null, isPrimary: true, order: 0 },
    ];
    await ref.update({ images, updatedAt: FieldValue.serverTimestamp() });
    console.log(`   ✓ ${slug.padEnd(18)} imagen asociada`);
  }

  console.log('\n✨ Listo.');
  if (missing.length) {
    console.log(`\n⚠ imágenes faltantes en seed-assets/ropero/:`);
    [...new Set(missing)].forEach((m) => console.log(`   - ${m}`));
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  });
