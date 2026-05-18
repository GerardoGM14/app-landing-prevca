/**
 * Script para asignar el custom claim `admin: true` a un usuario.
 * Si el usuario no existe, lo crea con una contraseña temporal.
 *
 * Uso:
 *   npm run seed:admin -- <email> [password]
 *
 * Si no se proporciona password al crear, usa "prevca-admin-2026" por defecto.
 * El usuario debe cerrar sesión y volver a entrar para que el claim aparezca en su ID token.
 *
 * Por defecto apunta al emulador local (localhost:9099). Para producción, eliminar la línea
 * de FIREBASE_AUTH_EMULATOR_HOST y autenticar con credenciales reales.
 */
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= 'localhost:9099';

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2];
const password = process.argv[3] ?? 'prevca-admin-2026';

if (!email) {
  console.error('❌ Uso: npm run seed:admin -- <email> [password]');
  process.exit(1);
}

initializeApp({ projectId: 'app-prevca' });

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
      console.log('   Cámbiela desde Firebase Auth Console cuando despliegue a producción.');
    } else {
      console.log('   (Si el usuario tenía sesión activa, debe cerrar sesión y volver a entrar.)');
    }
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
