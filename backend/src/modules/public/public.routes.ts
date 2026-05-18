import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.middleware';
import { publicController } from './public.controller';
import { productQuerySchema } from '../products/products.schema';
import { categoryQuerySchema } from '../categories/categories.schema';
import { createOrderSchema } from '../orders/orders.schema';

export const publicRouter = Router();

publicRouter.get('/products', validate(productQuerySchema, 'query'), publicController.listProducts);
publicRouter.get('/products/by-slug/:slug', publicController.getProductBySlug);
publicRouter.get('/categories', validate(categoryQuerySchema, 'query'), publicController.listCategories);
publicRouter.post('/orders', validate(createOrderSchema), publicController.createOrder);
