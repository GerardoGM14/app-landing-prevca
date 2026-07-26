/**
 * Productos y envío de PRUEBA a S/1, para validar el cobro real con
 * MercadoPago sin gastar dinero.
 *
 * Crea:
 *   - 1 producto de prueba en Aserradero PREVCA  (S/1)
 *   - 1 producto de prueba en Maderera COPESA    (S/1)
 *   - baja el envío de MADRE_DE_DIOS a S/1 (departamento poco usado)
 *
 * Así una compra de prueba cuesta S/2 en vez de S/32.
 *
 *   Crear:    npx tsx src/seed/seed-test-products.ts --prod
 *   Revertir: npx tsx src/seed/seed-test-products.ts --prod --cleanup
 *
 * IMPORTANTE: correr con --cleanup cuando termine de probar. Desactiva los
 * productos de prueba y devuelve el envío de MADRE_DE_DIOS a su tarifa real.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PROJECT_ID = 'app-prevca';
const IS_PROD = process.argv.includes('--prod');
const CLEANUP = process.argv.includes('--cleanup');

/**
 * Precio del producto de prueba (+ S/1 de envío).
 * Nota: si el botón "Pagar" de MercadoPago aparece deshabilitado, lo más
 * probable NO es el monto sino estar logueado con la misma cuenta que vende
 * (MercadoPago no deja comprarte a ti mismo): pagar en incógnito, como
 * invitado. Si aun así no habilita, probar subiendo este monto.
 */
const TEST_PRICE = 1;

/** Departamento poco usado que bajamos temporalmente a S/1 */
const TEST_DEPARTMENT = 'MADRE_DE_DIOS';
const TEST_SHIPPING = 1;
const REAL_SHIPPING = 60; // tarifa original de MADRE_DE_DIOS

if (IS_PROD) {
  const keyPath = join(process.cwd(), 'serviceAccountKey.json');
  if (!existsSync(keyPath)) {
    console.error(`❌ No se encontró ${keyPath}`);
    process.exit(1);
  }
  const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
  initializeApp({ credential: cert(sa), projectId: sa.project_id });
  console.log('🚀 Modo PRODUCCIÓN');
} else {
  process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080';
  initializeApp({ projectId: PROJECT_ID });
  console.log('🧪 Modo EMULADOR local');
}

const db = getFirestore();

const TEST_PRODUCTS = [
  {
    slug: 'producto-prueba-aserradero',
    ref: 'TEST-ASE-01',
    title: '[PRUEBA] Producto de prueba — Aserradero',
    categorySlug: 'aserradero-prevca',
  },
  {
    slug: 'producto-prueba-copesa',
    ref: 'TEST-CPS-01',
    title: '[PRUEBA] Producto de prueba — COPESA',
    categorySlug: 'corporacion-maderera-copesa',
  },
];

async function main() {
  if (CLEANUP) {
    console.log('🧹 Revirtiendo cambios de prueba...\n');

    for (const t of TEST_PRODUCTS) {
      const q = await db.collection('products').where('slug', '==', t.slug).limit(1).get();
      if (q.empty) {
        console.log(`   - ${t.slug}: no existe, nada que hacer`);
        continue;
      }
      // Se desactiva en vez de borrar, por si hay órdenes que lo referencian
      await q.docs[0].ref.update({ isActive: false, updatedAt: FieldValue.serverTimestamp() });
      console.log(`   ✓ ${t.slug}: desactivado (ya no se ve en la tienda)`);
    }

    const ref = db.collection('settings').doc('shipping-rates');
    const snap = await ref.get();
    const rates = (snap.data()?.rates ?? {}) as Record<string, number>;
    rates[TEST_DEPARTMENT] = REAL_SHIPPING;
    await ref.set({ rates, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    console.log(`   ✓ envío ${TEST_DEPARTMENT}: devuelto a S/ ${REAL_SHIPPING}`);

    console.log('\n✨ Todo revertido.');
    return;
  }

  console.log('🧪 Creando productos y envío de prueba (S/1)...\n');

  for (const t of TEST_PRODUCTS) {
    const cat = await db
      .collection('categories')
      .where('slug', '==', t.categorySlug)
      .limit(1)
      .get();
    if (cat.empty) {
      console.error(`   ✗ categoría ${t.categorySlug} no existe, se omite`);
      continue;
    }

    const q = await db.collection('products').where('slug', '==', t.slug).limit(1).get();
    const ref = q.empty ? db.collection('products').doc() : q.docs[0].ref;
    const isNew = q.empty;

    const data: Record<string, unknown> = {
      slug: t.slug,
      ref: t.ref,
      title: t.title,
      division: 'MADERA',
      categoryId: cat.docs[0].id,
      subcategory: null,
      shortDesc: 'Producto temporal para validar el cobro con MercadoPago. No es un producto real.',
      description:
        'Este producto existe únicamente para probar el flujo de pago en producción con un monto mínimo. No corresponde a un artículo real del catálogo y será desactivado tras la prueba.',
      specs: null,
      features: [],
      scientificName: null,
      origin: null,
      applications: null,
      datasheetUrl: null,
      price: TEST_PRICE,
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
      images: [],
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (isNew) {
      data.order = 999;
      data.createdAt = FieldValue.serverTimestamp();
    }

    await ref.set(data, { merge: true });
    console.log(`   ${isNew ? '+ creado   ' : '~ activado '} ${t.slug.padEnd(30)} S/ ${TEST_PRICE}.00`);
  }

  // Envío de prueba
  const sref = db.collection('settings').doc('shipping-rates');
  const snap = await sref.get();
  const rates = (snap.data()?.rates ?? {}) as Record<string, number>;
  const before = rates[TEST_DEPARTMENT];
  rates[TEST_DEPARTMENT] = TEST_SHIPPING;
  await sref.set({ rates, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  console.log(`   ✓ envío ${TEST_DEPARTMENT}: S/ ${before} → S/ ${TEST_SHIPPING}`);

  console.log('\n✨ Listo. Para la compra de prueba:');
  console.log('   1. Agregue un producto [PRUEBA] al carrito');
  console.log(`   2. En el envío elija el departamento: Madre de Dios`);
  console.log(`   3. Total: S/ ${TEST_PRICE + TEST_SHIPPING}.00 (producto S/${TEST_PRICE} + envío S/${TEST_SHIPPING})`);
  console.log('\n⚠  Al terminar, revierta con: npx tsx src/seed/seed-test-products.ts --prod --cleanup');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
