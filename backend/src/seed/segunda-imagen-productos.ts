/**
 * Agrega una SEGUNDA imagen (galería) a productos que solo tenían una,
 * conservando la primera como principal.
 *
 *   Emulador:   npx tsx src/seed/segunda-imagen-productos.ts
 *   Producción: npx tsx src/seed/segunda-imagen-productos.ts --prod
 *
 * Idempotente: si la segunda imagen ya está asociada, no la duplica.
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

/** slug → { carpeta en seed-assets, archivo de la 2ª imagen } */
const MAP: Record<string, { dir: string; file: string }> = {
  'ropero-personal-kala': { dir: 'ropero', file: 'ropero-personal-kala-2.jpg' },
  'puerta-principal-solida': { dir: 'puertas', file: 'puerta-principal-leah-2.jpg' },
  'porton': { dir: 'puertas', file: 'porton-2.jpg' },
  'estante-rectangular': { dir: 'estantes', file: 'estante-tulip-2.jpg' },
};

const buildImageUrl = (storagePath: string): string => {
  const emulatorHost = process.env.STORAGE_EMULATOR_HOST;
  if (emulatorHost) {
    const host = emulatorHost.replace(/^https?:\/\//, '');
    return `http://${host}/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
};

async function upload(productId: string, dir: string, file: string): Promise<string | null> {
  const localPath = join(process.cwd(), 'seed-assets', dir, file);
  if (!existsSync(localPath)) return null;
  const ext = file.split('.').pop()?.toLowerCase();
  const contentType =
    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
  const storagePath = `products/${productId}/${file}`;
  const f = bucket.file(storagePath);
  await f.save(readFileSync(localPath), {
    contentType,
    metadata: { cacheControl: 'public, max-age=31536000' },
  });
  if (!process.env.STORAGE_EMULATOR_HOST) await f.makePublic().catch(() => undefined);
  return buildImageUrl(storagePath);
}

async function main() {
  const missing: string[] = [];

  for (const [slug, { dir, file }] of Object.entries(MAP)) {
    const q = await db.collection('products').where('slug', '==', slug).limit(1).get();
    if (q.empty) {
      console.log(`   ⚠ ${slug} no encontrado`);
      continue;
    }
    const ref = q.docs[0].ref;
    const current = (q.docs[0].data().images || []) as Array<{ storagePath: string }>;
    const storagePath = `products/${ref.id}/${file}`;

    // Idempotente: si ya está esta segunda imagen, no la duplica.
    if (current.some((im) => im.storagePath === storagePath)) {
      console.log(`   = ${slug.padEnd(26)} ya tenía la 2ª imagen`);
      continue;
    }

    const url = await upload(ref.id, dir, file);
    if (!url) {
      missing.push(`${dir}/${file}`);
      continue;
    }

    const images = [
      ...current,
      { storagePath, url, alt: null, isPrimary: false, order: current.length },
    ];
    await ref.update({ images, updatedAt: FieldValue.serverTimestamp() });
    console.log(`   ✓ ${slug.padEnd(26)} ahora ${images.length} img`);
  }

  console.log('\n✨ Listo.');
  if (missing.length) {
    console.log(`\n⚠ imágenes faltantes:`);
    [...new Set(missing)].forEach((m) => console.log(`   - ${m}`));
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  });
