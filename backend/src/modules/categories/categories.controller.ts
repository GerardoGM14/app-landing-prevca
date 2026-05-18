import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';
import { categoriesService } from './categories.service';
import {
  CategoryQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './categories.schema';

type IdParams = { id: string };

export const categoriesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await categoriesService.list(req.query as unknown as CategoryQuery);
    res.json({ items });
  }),

  getById: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const category = await categoriesService.findById(req.params.id);
    res.json(category);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoriesService.create(req.body as CreateCategoryInput);
    res.status(201).json(category);
  }),

  update: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const category = await categoriesService.update(req.params.id, req.body as UpdateCategoryInput);
    res.json(category);
  }),

  delete: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    await categoriesService.delete(req.params.id);
    res.status(204).send();
  }),
};
