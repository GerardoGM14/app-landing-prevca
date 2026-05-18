import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.middleware';
import { categoriesController } from './categories.controller';
import {
  categoryQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from './categories.schema';

export const categoriesRouter = Router();

categoriesRouter.get('/', validate(categoryQuerySchema, 'query'), categoriesController.list);
categoriesRouter.get('/:id', categoriesController.getById);
categoriesRouter.post('/', validate(createCategorySchema), categoriesController.create);
categoriesRouter.patch('/:id', validate(updateCategorySchema), categoriesController.update);
categoriesRouter.delete('/:id', categoriesController.delete);
