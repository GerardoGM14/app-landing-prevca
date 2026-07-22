/**
 * Siembra la config de pago en el emulador para probar MercadoPago en local.
 * Habilita MercadoPago con la PUBLIC KEY de prueba.
 *
 * Uso (con el emulador de Firestore corriendo):
 *   npx tsx src/seed/seed-payment-config.ts
 *
 * NO usar en producción — la public key de prod se gestiona desde el admin.
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'app-prevca';

// Public Key de PRUEBA de MercadoPago (segura de exponer; NO es el Access Token)
const MERCADOPAGO_TEST_PUBLIC_KEY = 'APP_USR-f2666fe1-b79e-46df-b449-8c7ee80cb27c';

process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080';
initializeApp({ projectId: PROJECT_ID });

const db = getFirestore();

async function main() {
  await db
    .collection('settings')
    .doc('payment-config')
    .set(
      {
        mercadopagoEnabled: true,
        mercadopagoPublicKey: MERCADOPAGO_TEST_PUBLIC_KEY,
        updatedAt: new Date(),
      },
      { merge: true },
    );

  console.log('🧪 payment-config sembrado en el emulador:');
  console.log('   ✓ MercadoPago habilitado con public key de prueba');
  console.log('   (Yape/Transferencia/PayPal/Culqi quedan como estaban)');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error sembrando payment-config:', err);
    process.exit(1);
  });
