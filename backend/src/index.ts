import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import { app } from './app';

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
});

/**
 * Access Token de MercadoPago (secreto). Se registra con:
 *   firebase functions:secrets:set MERCADOPAGO_ACCESS_TOKEN
 * En el emulador se lee de backend/.secret.local o del entorno.
 */
const mercadopagoAccessToken = defineSecret('MERCADOPAGO_ACCESS_TOKEN');

export const api = onRequest(
  {
    cors: true,
    memory: '512MiB',
    timeoutSeconds: 60,
    secrets: [mercadopagoAccessToken],
  },
  app,
);
