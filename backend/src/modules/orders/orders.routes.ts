import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.middleware';
import { ordersController } from './orders.controller';
import { orderQuerySchema, updateOrderSchema } from './orders.schema';

export const ordersRouter = Router();

ordersRouter.get('/', validate(orderQuerySchema, 'query'), ordersController.list);
ordersRouter.get('/:id', ordersController.getById);
ordersRouter.patch('/:id', validate(updateOrderSchema), ordersController.update);
ordersRouter.delete('/:id', ordersController.delete);
