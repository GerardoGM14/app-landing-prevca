import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.middleware';
import { productsController } from './products.controller';
import {
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
  updateStockSchema,
} from './products.schema';

export const productsRouter = Router();

productsRouter.get('/', validate(productQuerySchema, 'query'), productsController.list);
productsRouter.get('/:id', productsController.getById);
productsRouter.post('/', validate(createProductSchema), productsController.create);
productsRouter.patch('/:id', validate(updateProductSchema), productsController.update);
productsRouter.delete('/:id', productsController.delete);
productsRouter.patch('/:id/stock', validate(updateStockSchema), productsController.updateStock);
