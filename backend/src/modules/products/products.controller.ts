import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';
import { productsService } from './products.service';
import {
  CreateProductInput,
  ProductQuery,
  UpdateProductInput,
  UpdateStockInput,
} from './products.schema';

type IdParams = { id: string };

export const productsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await productsService.list(req.query as unknown as ProductQuery);
    res.json(result);
  }),

  getById: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const product = await productsService.findById(req.params.id);
    res.json(product);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const product = await productsService.create(req.body as CreateProductInput);
    res.status(201).json(product);
  }),

  update: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const product = await productsService.update(req.params.id, req.body as UpdateProductInput);
    res.json(product);
  }),

  delete: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    await productsService.delete(req.params.id);
    res.status(204).send();
  }),

  updateStock: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const product = await productsService.updateStock(req.params.id, req.body as UpdateStockInput);
    res.json(product);
  }),
};
