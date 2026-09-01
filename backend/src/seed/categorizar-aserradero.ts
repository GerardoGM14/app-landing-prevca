/**
 * Asigna categoría y subcategoría a los productos de Aserradero PREVCA.
 *
 * El campo `subcategory` guarda "Categoría|Subcategoría" (o solo "Categoría"
 * si no tiene subnivel). La landing lo parte por "|" para el filtro de dos
 * niveles.
 *
 *   Emulador:   npx tsx src/seed/categorizar-aserradero.ts
 *   Producción: npx tsx src/seed/categorizar-aserradero.ts --prod
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

/** slug → "Categoría|Subcategoría" (o "Categoría" sin subnivel) */
const MAP: Record<string, string> = {
  // ── MERMA ──
  'aserrin-5kg': 'Merma',
  'aserrin-10kg': 'Merma',
  'aserrin-50kg': 'Merma',
  'viruta-5kg': 'Merma',
  'viruta-10kg': 'Merma',
  'viruta-30kg': 'Merma',

  // ── MADERA ──
  'madera-materia-prima-aserradero': 'Madera',
  'madera-aserrada': 'Madera',
  'listones-madera-pino-aserradero': 'Madera',
  'tablas-madera-pino-aserradero': 'Madera',

  // ── MUEBLES DE MADERA › Puertas ──
  'puerta-horizon-contraplacada': 'Muebles de Madera|Puertas',
  'puerta-britania': 'Muebles de Madera|Puertas',
  'puerta-principal-solida': 'Muebles de Madera|Puertas',
  'puerta-pequena': 'Muebles de Madera|Puertas',
  'puerta-empotrada-bahia': 'Muebles de Madera|Puertas',
  'porton': 'Muebles de Madera|Puertas',
  'puertas-a-medida': 'Muebles de Madera|Puertas',

  // ── MUEBLES DE MADERA › Roperos ──
  'ropero-personal-kala': 'Muebles de Madera|Roperos',
  'ropero-moderno': 'Muebles de Madera|Roperos',
  'ropero-contraplacado': 'Muebles de Madera|Roperos',
  'roperos-a-medida': 'Muebles de Madera|Roperos',

  // ── MUEBLES DE MADERA › Camas ──
  'cama-2-plazas-prevca': 'Muebles de Madera|Camas',
  'cama-15-plazas-prevca': 'Muebles de Madera|Camas',
  'camas-a-medida': 'Muebles de Madera|Camas',
  'box-cama-tarimas-aserradero': 'Muebles de Madera|Camas',

  // ── MUEBLES DE MADERA › Sillas ──
  'silla-luna': 'Muebles de Madera|Sillas',
  'silla-triangular': 'Muebles de Madera|Sillas',
  'silla-modelo-2': 'Muebles de Madera|Sillas',

  // ── MUEBLES DE MADERA › Mesas ──
  'mesa-caracol': 'Muebles de Madera|Mesas',
  'mesa-x-vidrio': 'Muebles de Madera|Mesas',
  'mesa-vidrio': 'Muebles de Madera|Mesas',

  // ── MUEBLES DE MADERA › Estantes ──
  'estante-multiusos-danna': 'Muebles de Madera|Estantes',
  'estante-cuadrangular': 'Muebles de Madera|Estantes',
  'estante-rectangular': 'Muebles de Madera|Estantes',
  'estante-triangular': 'Muebles de Madera|Estantes',

  // ── MUEBLES DE MADERA › Sofás ──
  'sofa-desing-matero': 'Muebles de Madera|Sofás',
  'danna-gran-sofa': 'Muebles de Madera|Sofás',

  // ── MUEBLES DE MADERA › Otros ──
  'escalera-decor-3-escalones': 'Muebles de Madera|Otros',
  'escalera-tijera-pequena': 'Muebles de Madera|Otros',
  'mesedora': 'Muebles de Madera|Otros',
  'jaula-crianza-aves': 'Muebles de Madera|Otros',
  'base-refrigerador': 'Muebles de Madera|Otros',
  'repostero-elegante-atena': 'Muebles de Madera|Otros',

  // ── MUEBLES DE MELAMINE ──
  'roperos-melamine': 'Muebles de Melamine',
  'reposteros-melamine': 'Muebles de Melamine',
  'repostero-melamine-aserradero': 'Muebles de Melamine',
};

async function main() {
  let updated = 0;
  const notFound: string[] = [];

  for (const [slug, subcategory] of Object.entries(MAP)) {
    const q = await db.collection('products').where('slug', '==', slug).limit(1).get();
    if (q.empty) {
      notFound.push(slug);
      continue;
    }
    await q.docs[0].ref.update({ subcategory, updatedAt: FieldValue.serverTimestamp() });
    updated++;
    console.log(`   ✓ ${slug.padEnd(36)} → ${subcategory}`);
  }

  // Desactivar el producto de prueba de Aserradero (residuo de las pruebas de pago)
  const prueba = await db
    .collection('products')
    .where('slug', '==', 'producto-prueba-aserradero')
    .limit(1)
    .get();
  if (!prueba.empty && prueba.docs[0].data().isActive !== false) {
    await prueba.docs[0].ref.update({ isActive: false, updatedAt: FieldValue.serverTimestamp() });
    console.log('   ✓ [PRUEBA] Aserradero desactivado');
  }

  console.log(`\n✨ ${updated} producto(s) categorizado(s).`);
  if (notFound.length) {
    console.log(`\n⚠ ${notFound.length} slug(s) no encontrados (revisar nombre):`);
    notFound.forEach((s) => console.log(`   - ${s}`));
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  });
