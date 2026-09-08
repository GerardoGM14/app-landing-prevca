/**
 * Ajustes en la categoría "Madera" de Aserradero PREVCA:
 *   1. Desactiva el producto "Madera Aserradero" (slug madera-aserrada).
 *   2. Renombra "Madera Materia Prima" → "Maderas Nativas del País".
 *
 *   Emulador:   npx tsx src/seed/ajustes-madera-aserradero.ts
 *   Producción: npx tsx src/seed/ajustes-madera-aserradero.ts --prod
 *
 * Idempotente.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const IS_PROD = process.argv.includes('--prod');

if (IS_PROD) {
  const keyPath = join(process.cwd(), 'serviceAccountKey.json');
  if (!existsSync(keyPath)) {
    console.error(`❌ Falta ${keyPath}`);
    process.exit(1);
  }
  const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
  initializeApp({ credential: cert(sa), projectId: sa.project_id });
  console.log('🚀 Modo PRODUCCIÓN');
} else {
  process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080';
  initializeApp({ projectId: 'app-prevca' });
  console.log('🧪 Modo EMULADOR local');
}

const db = getFirestore();

async function findBySlug(slug: string) {
  const q = await db.collection('products').where('slug', '==', slug).limit(1).get();
  return q.empty ? null : q.docs[0].ref;
}

async function main() {
  // 1. Desactivar "Madera Aserradero"
  const aserrada = await findBySlug('madera-aserrada');
  if (aserrada) {
    await aserrada.update({ isActive: false, updatedAt: FieldValue.serverTimestamp() });
    console.log('   ✓ "Madera Aserradero" (madera-aserrada) desactivado');
  } else {
    console.log('   ⚠ madera-aserrada no encontrado');
  }

  // 2. Renombrar "Madera Materia Prima" → "Maderas Nativas del País"
  const nativas = await findBySlug('madera-materia-prima-aserradero');
  if (nativas) {
    await nativas.update({
      title: 'Maderas Nativas del País',
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log('   ✓ "Madera Materia Prima" → "Maderas Nativas del País"');
  } else {
    console.log('   ⚠ madera-materia-prima-aserradero no encontrado');
  }

  console.log('\n✨ Listo.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  });
