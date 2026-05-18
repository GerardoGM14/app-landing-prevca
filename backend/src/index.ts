import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { app } from './app';

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
});

export const api = onRequest({ cors: true, memory: '512MiB', timeoutSeconds: 60 }, app);
