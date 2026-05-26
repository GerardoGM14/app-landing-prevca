/**
 * Script para asignar el custom claim `admin: true` a un usuario.
 * Si el usuario no existe, lo crea con una contraseña temporal.
 *
 * Uso (emulador local — por defecto):
 *   npm run seed:admin -- <email> [password]
 *
 * Uso (producción real):
 *   npm run seed:admin:prod -- <email> [password]
 *   Requiere: backend/serviceAccountKey.json descargado de Firebase Console
 *
 * Si no se proporciona password al crear, usa "prevca-admin-2026" por defecto.
 * El usuario debe cerrar sesión y volver a entrar para que el claim aparezca en su ID token.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const args = process.argv.slice(2);
const isProd = args.includes('--prod');
const positional = args.filter((a) => !a.startsWith('--'));
const email = positional[0];
const password = positional[1] ?? 'prevca-admin-2026';

if (!email) {
  console.error('❌ Uso: npm run seed:admin -- <email> [password]');
  console.error('   Producción: npm run seed:admin:prod -- <email> [password]');
  process.exit(1);
}

if (isProd) {
  const keyPath = join(process.cwd(), 'serviceAccountKey.json');
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'));
  } catch {
    console.error(`❌ No se encontró ${keyPath}`);
    console.error('   Descárguelo desde Firebase Console > Service accounts.');
    process.exit(1);
  }
  initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
  console.log(`🚀 Modo PRODUCCIÓN — proyecto: ${serviceAccount.project_id}`);
} else {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= 'localhost:9099';
  initializeApp({ projectId: 'app-prevca' });
  console.log('🧪 Modo EMULADOR local (localhost:9099)');
}

(async () => {
  const auth = getAuth();
  try {
    let user;
    let created = false;

    try {
      user = await auth.getUserByEmail(email);
      console.log(`ℹ  Usuario encontrado: ${email} (uid: ${user.uid})`);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/user-not-found') {
        user = await auth.createUser({
          email,
          password,
          emailVerified: true,
          displayName: email.split('@')[0],
        });
        created = true;
        console.log(`✨ Usuario creado: ${email} (uid: ${user.uid})`);
      } else {
        throw err;
      }
    }

    await auth.setCustomUserClaims(user.uid, { admin: true });
    console.log(`✓ Claim "admin: true" asignado a ${email}`);

    if (created) {
      console.log('\n🔑 Contraseña temporal:');
      console.log(`   ${password}\n`);
      if (isProd) {
        console.log('   ⚠  Cambie esta contraseña al iniciar sesión por primera vez.');
        console.log('   ⚠  BORRE serviceAccountKey.json o muévalo a un gestor de contraseñas.');
      } else {
        console.log('   Cámbiela desde Firebase Auth Console cuando despliegue a producción.');
      }
    } else {
      console.log('   (Si el usuario tenía sesión activa, debe cerrar sesión y volver a entrar.)');
    }
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
