import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.middleware';
import { parseMultipart } from '../../shared/middleware/multipart.middleware';
import { PROOF_CONFIG } from '../../config/constants';
import { publicController } from './public.controller';
import { productQuerySchema } from '../products/products.schema';
import { categoryQuerySchema } from '../categories/categories.schema';
import { checkoutSchema, createOrderSchema } from '../orders/orders.schema';

export const publicRouter = Router();

publicRouter.get('/products', validate(productQuerySchema, 'query'), publicController.listProducts);
publicRouter.get('/products/by-slug/:slug', publicController.getProductBySlug);
publicRouter.get('/categories', validate(categoryQuerySchema, 'query'), publicController.listCategories);
publicRouter.get('/shipping-rates', publicController.getShippingRates);
publicRouter.get('/payment-methods', publicController.getPaymentMethods);

// Cotización tradicional (sin pago)
publicRouter.post('/orders', validate(createOrderSchema), publicController.createOrder);

// Checkout con pago
publicRouter.post('/checkout', validate(checkoutSchema), publicController.checkout);

// Cliente sube captura de pago (Yape/Transferencia)
const proofUpload = parseMultipart({
  maxFiles: 1,
  maxFileSizeMb: PROOF_CONFIG.MAX_FILE_SIZE_MB,
  fieldName: 'proof',
});
publicRouter.post('/orders/:code/proof', proofUpload, publicController.uploadProof);

// Webhook de MercadoPago (Checkout Pro) — confirma pagos vía IPN
publicRouter.post('/webhooks/mercadopago', publicController.mercadopagoWebhook);
