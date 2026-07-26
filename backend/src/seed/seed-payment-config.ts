/**
 * Siembra la config de pago en el emulador para probar las pasarelas en local.
 * Habilita MercadoPago y Culqi con sus PUBLIC KEYS de prueba.
 *
 * Uso (con el emulador de Firestore corriendo):
 *   npx tsx src/seed/seed-payment-config.ts
 *
 * NO usar en producción — las public keys de prod se gestionan desde el admin.
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'app-prevca';

// Public Key de PRUEBA de MercadoPago (segura de exponer; NO es el Access Token)
const MERCADOPAGO_TEST_PUBLIC_KEY = 'APP_USR-f2666fe1-b79e-46df-b449-8c7ee80cb27c';

// Public Key de PRUEBA de Culqi (pk_test_...; segura de exponer, va al navegador)
const CULQI_TEST_PUBLIC_KEY = 'pk_test_FcGa1i6CbamaVTSX';

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
        culqiEnabled: true,
        culqiPublicKey: CULQI_TEST_PUBLIC_KEY,
        updatedAt: new Date(),
      },
      { merge: true },
    );

  console.log('🧪 payment-config sembrado en el emulador:');
  console.log('   ✓ MercadoPago habilitado con public key de prueba');
  console.log('   ✓ Culqi habilitado con public key de prueba');
  console.log('   (Yape/Transferencia/PayPal quedan como estaban)');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error sembrando payment-config:', err);
    process.exit(1);
  });
