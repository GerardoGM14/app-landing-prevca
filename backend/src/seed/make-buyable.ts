/**
 * Marca productos como comprables (con precio + allowsDirectPurchase) en el
 * emulador, para probar el checkout con pago real (MercadoPago).
 * Solo desarrollo local — no usar en producción.
 *
 *   npx tsx src/seed/make-buyable.ts
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080';
initializeApp({ projectId: 'app-prevca' });
const db = getFirestore();

/** slug → { price en soles, stock } — productos de venta directa (no a medida). */
const PRICED: Record<string, { price: number; stock: number }> = {
  // Viruta (subproducto, venta por saco)
  'viruta-5kg': { price: 25, stock: 100 },
  'viruta-10kg': { price: 45, stock: 80 },
  'viruta-30kg': { price: 110, stock: 40 },
  // Aserrín (subproducto, venta por saco)
  'aserrin-5kg': { price: 18, stock: 120 },
  'aserrin-10kg': { price: 32, stock: 90 },
  'aserrin-50kg': { price: 140, stock: 30 },
  // Maderas comerciales (precio por unidad/pieza de referencia)
  'pino-silvestre': { price: 89.9, stock: 60 },
  'abeto-rojo': { price: 95, stock: 50 },
  'pino-amarillo-del-sur': { price: 120, stock: 45 },
  'roble': { price: 210, stock: 25 },
  'cedro': { price: 260, stock: 20 },
  'pino-insigne': { price: 75.5, stock: 70 },
};

async function main() {
  let updated = 0;
  for (const [slug, { price, stock }] of Object.entries(PRICED)) {
    const snap = await db.collection('products').where('slug', '==', slug).limit(1).get();
    if (snap.empty) {
      console.warn(`  ⚠ ${slug} no encontrado, se omite`);
      continue;
    }
    await snap.docs[0].ref.set(
      { price, showPrice: true, allowsDirectPurchase: true, trackStock: true, stock },
      { merge: true },
    );
    console.log(`  ✓ ${slug.padEnd(24)} S/ ${price}  (stock ${stock})`);
    updated += 1;
  }
  console.log(`\n💲 ${updated} producto(s) ahora son comprables.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  });
