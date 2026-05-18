import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';
import { ordersService } from './orders.service';
import { OrderQuery, UpdateOrderInput } from './orders.schema';

type IdParams = { id: string };

export const ordersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await ordersService.list(req.query as unknown as OrderQuery);
    res.json(result);
  }),

  getById: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const order = await ordersService.findById(req.params.id);
    res.json(order);
  }),

  update: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const order = await ordersService.update(req.params.id, req.body as UpdateOrderInput);
    res.json(order);
  }),

  delete: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    await ordersService.delete(req.params.id);
    res.status(204).send();
  }),
};
