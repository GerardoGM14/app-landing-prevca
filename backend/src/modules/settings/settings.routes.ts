import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.middleware';
import { parseMultipart } from '../../shared/middleware/multipart.middleware';
import { settingsController } from './settings.controller';
import {
  updatePaymentConfigSchema,
  updateShippingRatesSchema,
} from './settings.schema';

export const settingsRouter = Router();

settingsRouter.get('/shipping-rates', settingsController.getShippingRates);
settingsRouter.put(
  '/shipping-rates',
  validate(updateShippingRatesSchema),
  settingsController.updateShippingRates,
);

settingsRouter.get('/payment-config', settingsController.getPaymentConfig);
settingsRouter.put(
  '/payment-config',
  validate(updatePaymentConfigSchema),
  settingsController.updatePaymentConfig,
);

const qrUpload = parseMultipart({
  maxFiles: 1,
  maxFileSizeMb: 5,
  fieldName: 'qr',
});
settingsRouter.post('/yape-qr', qrUpload, settingsController.uploadYapeQr);
